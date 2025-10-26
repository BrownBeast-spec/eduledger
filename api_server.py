"""
API Server for EduLedger Certificate Management System
Provides REST API endpoints for the Next.js frontend
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import sys

# Import the certificate system
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from certificate_system import system

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Global variable to track logged-in users
logged_in_users = {}

# ==================== API ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "EduLedger API is running"})

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login endpoint"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"success": False, "message": "Username and password required"}), 400
        
        success, role, name = system.authenticate(username, password)
        
        if success:
            logged_in_users[username] = {
                "role": role,
                "name": name,
                "username": username
            }
            return jsonify({
                "success": True,
                "user": {
                    "username": username,
                    "role": role,
                    "name": name
                }
            })
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    try:
        data = request.json
        username = data.get('username')
        
        if username in logged_in_users:
            del logged_in_users[username]
        
        return jsonify({"success": True, "message": "Logged out successfully"})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ==================== ISSUER ENDPOINTS ====================

@app.route('/api/issuer/students', methods=['POST'])
def add_student():
    """Add a new student"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        full_name = data.get('full_name')
        
        if not username or not password or not full_name:
            return jsonify({"success": False, "message": "All fields are required"}), 400
        
        success, message = system.add_student(username, password, full_name)
        
        if success:
            wallet_address = system.wallets[username].get_address()
            return jsonify({
                "success": True,
                "message": message,
                "student": {
                    "username": username,
                    "name": full_name,
                    "wallet_address": wallet_address
                }
            })
        else:
            return jsonify({"success": False, "message": message}), 400
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/issuer/students', methods=['GET'])
def get_all_students():
    """Get all students"""
    try:
        students = system.get_all_students()
        return jsonify({"success": True, "students": students})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/issuer/certificates', methods=['POST'])
def issue_certificate():
    """Issue a new certificate"""
    try:
        data = request.json
        student_name = data.get('student_name')
        student_username = data.get('student_username')
        course = data.get('course')
        grade = data.get('grade')
        
        if not student_name or not course or not grade:
            return jsonify({"success": False, "message": "Student name, course, and grade are required"}), 400
        
        if not student_username:
            return jsonify({"success": False, "message": "Student username is required"}), 400
        
        # Check if student exists
        if student_username not in system.users:
            return jsonify({"success": False, "message": "Student not found"}), 404
        
        # Handle PDF file upload
        pdf_file = None
        pdf_data = data.get('pdf_file')
        if pdf_data:
            # Decode base64 PDF data
            try:
                import base64
                # Remove data:application/pdf;base64, prefix if present
                if pdf_data.startswith('data:'):
                    pdf_data = pdf_data.split(',')[1]
                pdf_bytes = base64.b64decode(pdf_data)
                # Create a temporary file object
                import tempfile
                pdf_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
                pdf_file.write(pdf_bytes)
                pdf_file.close()
                pdf_file = pdf_file.name
            except Exception as e:
                print(f"Error processing PDF: {e}")
        
        # Issue certificate (this will create blockchain hash)
        success, cert_id, cert_data = system.issue_certificate(
            "issuer324", student_name, student_username, course, grade, pdf_file
        )
        
        if success:
            # Get the certificate object to verify blockchain hash
            cert = system.get_certificate(cert_id)
            
            response_data = {
                "success": True,
                "certificate_id": cert_id,
                "certificate": cert_data
            }
            
            # Add blockchain hash if available
            if cert and cert.blockchain_hash:
                response_data["blockchain_hash"] = cert.blockchain_hash
                response_data["certificate"]["blockchain_hash"] = cert.blockchain_hash
            
            return jsonify(response_data)
        else:
            return jsonify({"success": False, "message": "Error issuing certificate"}), 500
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error issuing certificate: {error_details}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/issuer/wallet', methods=['GET'])
def get_issuer_wallet():
    """Get issuer wallet information"""
    try:
        wallet = system.wallets["issuer324"]
        stats = system.issuer_stats.get("issuer324", {"total_issued": 0, "by_student": {}})
        
        return jsonify({
            "success": True,
            "wallet": {
                "owner": "Institute XYZ",
                "address": wallet.get_address(),
                "total_issued": stats["total_issued"],
                "by_student": stats["by_student"]
            }
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/issuer/blockchain', methods=['GET'])
def get_blockchain():
    """Get blockchain information"""
    try:
        from datetime import datetime
        
        blockchain_data = []
        for block in system.blockchain.chain:
            blockchain_data.append({
                "index": block.index,
                "timestamp": datetime.fromtimestamp(block.timestamp).strftime('%Y-%m-%d %H:%M:%S'),
                "hash": block.hash,
                "previous_hash": block.previous_hash,
                "nonce": block.nonce,
                "data_type": block.data.get('type', 'unknown'),
                "data": block.data
            })
        
        return jsonify({
            "success": True,
            "blockchain": {
                "total_blocks": len(system.blockchain.chain),
                "difficulty": system.blockchain.difficulty,
                "valid": system.blockchain.is_chain_valid(),
                "blocks": blockchain_data
            }
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ==================== STUDENT ENDPOINTS ====================

@app.route('/api/student/certificates', methods=['GET'])
def get_student_certificates():
    """Get student certificates"""
    try:
        username = request.args.get('username')
        
        if not username:
            return jsonify({"success": False, "message": "Username required"}), 400
        
        certs = system.get_student_certificates(username)
        certificates = []
        
        for cert in certs:
            certificates.append(cert.to_dict())
        
        return jsonify({"success": True, "certificates": certificates})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/student/verify', methods=['POST'])
def verify_certificate():
    """Verify a certificate"""
    try:
        data = request.json
        cert_id = data.get('certificate_id')
        
        if not cert_id:
            return jsonify({"success": False, "message": "Certificate ID required"}), 400
        
        valid, message = system.verify_certificate(cert_id)
        
        cert_details = {}
        if valid:
            cert = system.get_certificate(cert_id)
            if cert:
                cert_details = cert.to_dict()
        
        return jsonify({
            "success": True,
            "valid": valid,
            "message": message,
            "certificate": cert_details if valid else None
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/student/consents/grant', methods=['POST'])
def grant_consent():
    """Grant consent to HR"""
    try:
        data = request.json
        student_username = data.get('student_username')
        hr_username = data.get('hr_username')
        cert_id = data.get('certificate_id')
        
        if not student_username or not hr_username or not cert_id:
            return jsonify({"success": False, "message": "All fields required"}), 400
        
        if hr_username not in system.users or system.users[hr_username]["role"] != "hr":
            return jsonify({"success": False, "message": "Invalid HR username"}), 400
        
        if cert_id not in system.certificates:
            return jsonify({"success": False, "message": "Certificate not found"}), 404
        
        consent_id = system.consent_manager.grant_consent(student_username, hr_username, cert_id)
        
        return jsonify({
            "success": True,
            "consent_id": consent_id,
            "message": "Consent granted successfully"
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/student/consents/revoke', methods=['POST'])
def revoke_consent():
    """Revoke consent"""
    try:
        data = request.json
        student_username = data.get('student_username')
        consent_id = data.get('consent_id')
        
        if not student_username or not consent_id:
            return jsonify({"success": False, "message": "Username and consent ID required"}), 400
        
        success = system.consent_manager.revoke_consent(student_username, consent_id)
        
        if success:
            return jsonify({"success": True, "message": "Consent revoked successfully"})
        else:
            return jsonify({"success": False, "message": "Consent not found"}), 404
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/student/consents', methods=['GET'])
def get_consents():
    """Get student consents"""
    try:
        username = request.args.get('username')
        
        if not username:
            return jsonify({"success": False, "message": "Username required"}), 400
        
        consents = system.consent_manager.get_student_consents(username)
        
        return jsonify({"success": True, "consents": consents})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/student/download-certificate', methods=['GET'])
def download_certificate_pdf():
    """Download certificate PDF"""
    try:
        cert_id = request.args.get('certificate_id')
        
        if not cert_id:
            return jsonify({"success": False, "message": "Certificate ID required"}), 400
        
        # Get PDF path from system
        pdf_path = system.get_certificate_pdf_path(cert_id)
        
        if not pdf_path:
            return jsonify({"success": False, "message": "PDF not found for this certificate"}), 404
        
        # Check if file exists
        if not os.path.exists(pdf_path):
            return jsonify({"success": False, "message": "PDF file does not exist"}), 404
        
        # Send file
        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{cert_id}.pdf'
        )
    
    except Exception as e:
        import traceback
        print(f"Error downloading PDF: {traceback.format_exc()}")
        return jsonify({"success": False, "message": str(e)}), 500

# ==================== HR ENDPOINTS ====================

@app.route('/api/hr/view-certificate', methods=['POST'])
def view_certificate_hr():
    """View certificate with consent check"""
    try:
        data = request.json
        cert_id = data.get('certificate_id')
        
        if not cert_id:
            return jsonify({"success": False, "message": "Certificate ID required"}), 400
        
        cert = system.get_certificate(cert_id)
        if not cert:
            return jsonify({"success": False, "message": "Certificate not found"}), 404
        
        student_username = cert.student_username
        has_consent = system.consent_manager.check_consent(student_username, "HR023", cert_id)
        
        cert_details = None
        if has_consent:
            cert_details = cert.to_dict()
        
        return jsonify({
            "success": True,
            "has_consent": has_consent,
            "certificate": cert_details
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/hr/accessible-certificates', methods=['GET'])
def get_accessible_certificates():
    """Get accessible certificates"""
    try:
        accessible = []
        for cert_id, cert in system.certificates.items():
            student_username = cert.student_username
            if system.consent_manager.check_consent(student_username, "HR023", cert_id):
                accessible.append(cert.to_dict())
        
        return jsonify({"success": True, "certificates": accessible})
    
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ==================== RUN SERVER ====================

if __name__ == '__main__':
    print("Starting EduLedger API Server on http://localhost:5000")
    print("API endpoints available at http://localhost:5000/api")
    app.run(host='0.0.0.0', port=5000, debug=True)

