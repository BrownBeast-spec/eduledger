import hashlib
import json
import time
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import gradio as gr
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import base64

# ==================== BLOCKCHAIN INFRASTRUCTURE ====================

class Block:
    def __init__(self, index: int, timestamp: float, data: dict, previous_hash: str):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = 0
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def mine_block(self, difficulty: int):
        target = "0" * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()

class Blockchain:
    def __init__(self):
        self.chain = [self.create_genesis_block()]
        self.difficulty = 2
        self.pending_transactions = []
    
    def create_genesis_block(self) -> Block:
        return Block(0, time.time(), {"type": "genesis"}, "0")
    
    def get_latest_block(self) -> Block:
        return self.chain[-1]
    
    def add_block(self, data: dict) -> Block:
        new_block = Block(
            len(self.chain),
            time.time(),
            data,
            self.get_latest_block().hash
        )
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        return new_block
    
    def is_chain_valid(self) -> bool:
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            if current_block.hash != current_block.calculate_hash():
                return False
            if current_block.previous_hash != previous_block.hash:
                return False
        return True

# ==================== WALLET SYSTEM ====================

class Wallet:
    def __init__(self, owner: str):
        self.owner = owner
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()
    
    def sign_data(self, data: str) -> str:
        signature = self.private_key.sign(
            data.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode()
    
    def get_public_key_string(self) -> str:
        public_pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return public_pem.decode()
    
    def get_address(self) -> str:
        public_key_string = self.get_public_key_string()
        return hashlib.sha256(public_key_string.encode()).hexdigest()[:20]

# ==================== CERTIFICATE MANAGEMENT ====================

class Certificate:
    def __init__(self, cert_id: str, student_name: str, student_username: str, course: str, 
                 grade: str, issue_date: str, issuer: str):
        self.cert_id = cert_id
        self.student_name = student_name
        self.student_username = student_username
        self.course = course
        self.grade = grade
        self.issue_date = issue_date
        self.issuer = issuer
        self.signatures = []
        self.blockchain_hash = None
        self.pdf_file_path = None
        self.ipfs_hash = None
        self.pdf_signature = None
    
    def to_dict(self) -> dict:
        return {
            "cert_id": self.cert_id,
            "student_name": self.student_name,
            "student_username": self.student_username,
            "course": self.course,
            "grade": self.grade,
            "issue_date": self.issue_date,
            "issuer": self.issuer,
            "signatures": self.signatures,
            "blockchain_hash": self.blockchain_hash,
            "ipfs_hash": self.ipfs_hash,
            "pdf_signature": self.pdf_signature
        }
    
    def add_signature(self, signer: str, signature: str):
        self.signatures.append({
            "signer": signer,
            "signature": signature[:64],
            "timestamp": datetime.now().isoformat()
        })

# ==================== CONSENT MANAGEMENT ====================

class ConsentManager:
    def __init__(self):
        self.consents = {}
    
    def grant_consent(self, student: str, hr: str, cert_id: str) -> str:
        consent_id = hashlib.sha256(f"{student}{hr}{cert_id}{time.time()}".encode()).hexdigest()[:16]
        if student not in self.consents:
            self.consents[student] = {}
        self.consents[student][consent_id] = {
            "hr": hr,
            "cert_id": cert_id,
            "granted_at": datetime.now().isoformat(),
            "status": "active"
        }
        return consent_id
    
    def revoke_consent(self, student: str, consent_id: str) -> bool:
        if student in self.consents and consent_id in self.consents[student]:
            self.consents[student][consent_id]["status"] = "revoked"
            return True
        return False
    
    def check_consent(self, student: str, hr: str, cert_id: str) -> bool:
        if student not in self.consents:
            return False
        for consent in self.consents[student].values():
            if consent["hr"] == hr and consent["cert_id"] == cert_id and consent["status"] == "active":
                return True
        return False
    
    def get_student_consents(self, student: str) -> List[dict]:
        if student not in self.consents:
            return []
        return [{"consent_id": k, **v} for k, v in self.consents[student].items()]

# ==================== SYSTEM STATE ====================

class CertificateSystem:
    def __init__(self):
        self.blockchain = Blockchain()
        self.wallets = {}
        self.certificates = {}
        self.users = {
            "issuer324": {"password": "isse324", "role": "issuer", "name": "Institute XYZ"},
            "HR023": {"password": "hr023", "role": "hr", "name": "TechCorp HR"}
        }
        self.consent_manager = ConsentManager()
        self.student_certificates = {}
        self.issuer_stats = {}
        self.pdf_storage_dir = "/tmp/certificates"
        self.current_logged_user = None
        
        # Create PDF storage directory
        os.makedirs(self.pdf_storage_dir, exist_ok=True)
        
        # Initialize wallets
        for username in self.users.keys():
            self.wallets[username] = Wallet(username)
    
    def authenticate(self, username: str, password: str) -> Tuple[bool, str, str]:
        if username in self.users and self.users[username]["password"] == password:
            self.current_logged_user = username
            return True, self.users[username]["role"], self.users[username]["name"]
        return False, "", ""
    
    def add_student(self, username: str, password: str, full_name: str) -> Tuple[bool, str]:
        if username in self.users:
            return False, "Username already exists"
        
        self.users[username] = {
            "password": password,
            "role": "student",
            "name": full_name
        }
        self.wallets[username] = Wallet(username)
        return True, f"Student {username} added successfully"
    
    def get_student_by_name(self, full_name: str) -> Optional[str]:
        for username, user_data in self.users.items():
            if user_data["role"] == "student" and user_data["name"] == full_name:
                return username
        return None
    
    def get_all_students(self) -> List[dict]:
        students = []
        for username, user_data in self.users.items():
            if user_data["role"] == "student":
                students.append({
                    "username": username,
                    "name": user_data["name"],
                    "wallet_address": self.wallets[username].get_address()
                })
        return students
    
    def generate_ipfs_hash(self, file_content: bytes) -> str:
        # Simulate IPFS hash generation using SHA-256
        hash_obj = hashlib.sha256(file_content)
        return "Qm" + base64.b32encode(hash_obj.digest()).decode()[:44]
    
    def issue_certificate(self, issuer: str, student_name: str, student_username: str, 
                         course: str, grade: str, pdf_file = None) -> Tuple[bool, str, dict]:
        cert_id = f"CERT-{len(self.certificates) + 1:04d}"
        issue_date = datetime.now().strftime("%Y-%m-%d")
        
        cert = Certificate(cert_id, student_name, student_username, course, grade, issue_date, issuer)
        
        # Handle PDF upload and IPFS storage
        if pdf_file is not None:
            try:
                # Read PDF file
                pdf_content = pdf_file if isinstance(pdf_file, bytes) else open(pdf_file.name, 'rb').read()
                
                # Generate IPFS hash
                cert.ipfs_hash = self.generate_ipfs_hash(pdf_content)
                
                # Store PDF locally
                pdf_filename = f"{cert_id}.pdf"
                pdf_path = os.path.join(self.pdf_storage_dir, pdf_filename)
                with open(pdf_path, 'wb') as f:
                    f.write(pdf_content)
                cert.pdf_file_path = pdf_path
                
                # Sign PDF
                pdf_hash = hashlib.sha256(pdf_content).hexdigest()
                cert.pdf_signature = self.wallets[issuer].sign_data(pdf_hash)
            except Exception as e:
                print(f"Error processing PDF: {e}")
        
        # Sign certificate
        cert_data = json.dumps(cert.to_dict(), sort_keys=True)
        signature = self.wallets[issuer].sign_data(cert_data)
        cert.add_signature(issuer, signature)
        
        # Add to blockchain
        block_data = {
            "type": "certificate_issued",
            "certificate": cert.to_dict(),
            "issuer_address": self.wallets[issuer].get_address()
        }
        block = self.blockchain.add_block(block_data)
        cert.blockchain_hash = block.hash
        
        # Store certificate
        self.certificates[cert_id] = cert
        
        # Update student certificates by username
        if student_username not in self.student_certificates:
            self.student_certificates[student_username] = []
        self.student_certificates[student_username].append(cert_id)
        
        # Update issuer stats
        if issuer not in self.issuer_stats:
            self.issuer_stats[issuer] = {"total_issued": 0, "by_student": {}}
        self.issuer_stats[issuer]["total_issued"] += 1
        if student_name not in self.issuer_stats[issuer]["by_student"]:
            self.issuer_stats[issuer]["by_student"][student_name] = 0
        self.issuer_stats[issuer]["by_student"][student_name] += 1
        
        return True, cert_id, cert.to_dict()
    
    def get_certificate(self, cert_id: str) -> Optional[Certificate]:
        return self.certificates.get(cert_id)
    
    def get_student_certificates(self, student_username: str) -> List[Certificate]:
        cert_ids = self.student_certificates.get(student_username, [])
        return [self.certificates[cid] for cid in cert_ids if cid in self.certificates]
    
    def get_certificate_pdf_path(self, cert_id: str) -> Optional[str]:
        cert = self.certificates.get(cert_id)
        if cert and cert.pdf_file_path and os.path.exists(cert.pdf_file_path):
            return cert.pdf_file_path
        return None
    
    def verify_certificate(self, cert_id: str) -> Tuple[bool, str]:
        if cert_id not in self.certificates:
            return False, "Certificate not found"
        
        cert = self.certificates[cert_id]
        
        # Verify blockchain
        if not self.blockchain.is_chain_valid():
            return False, "Blockchain integrity compromised"
        
        # Find block with certificate
        for block in self.blockchain.chain:
            if block.data.get("type") == "certificate_issued" and \
               block.data.get("certificate", {}).get("cert_id") == cert_id:
                if block.hash == cert.blockchain_hash:
                    return True, "Certificate verified successfully"
        
        return False, "Certificate not found in blockchain"

# ==================== GLOBAL SYSTEM INSTANCE ====================
system = CertificateSystem()

# ==================== GRADIO UI FUNCTIONS ====================

def login_user(username: str, password: str):
    success, role, name = system.authenticate(username, password)
    if success:
        if role == "issuer":
            return (
                gr.update(visible=False),
                gr.update(visible=True),
                gr.update(visible=False),
                gr.update(visible=False),
                f"Welcome, {name}"
            )
        elif role == "student":
            return (
                gr.update(visible=False),
                gr.update(visible=False),
                gr.update(visible=True),
                gr.update(visible=False),
                f"Welcome, {name}"
            )
        elif role == "hr":
            return (
                gr.update(visible=False),
                gr.update(visible=False),
                gr.update(visible=False),
                gr.update(visible=True),
                f"Welcome, {name}"
            )
    return (
        gr.update(visible=True),
        gr.update(visible=False),
        gr.update(visible=False),
        gr.update(visible=False),
        "Invalid credentials"
    )

def logout():
    return (
        gr.update(visible=True),
        gr.update(visible=False),
        gr.update(visible=False),
        gr.update(visible=False),
        ""
    )

# ==================== ISSUER FUNCTIONS ====================

def add_new_student(username: str, password: str, full_name: str):
    if not username or not password or not full_name:
        return "Error: All fields are required"
    
    success, message = system.add_student(username, password, full_name)
    if success:
        result = f"Student Added Successfully\n\n"
        result += f"Username: {username}\n"
        result += f"Full Name: {full_name}\n"
        result += f"Wallet Address: {system.wallets[username].get_address()}\n"
        result += f"\nStudent can now login with:\n"
        result += f"Username: {username}\n"
        result += f"Password: {password}\n"
        return result
    return f"Error: {message}"

def view_all_students():
    students = system.get_all_students()
    
    result = "All Registered Students\n"
    result += f"{'='*50}\n\n"
    
    for student in students:
        result += f"Username: {student['username']}\n"
        result += f"Name: {student['name']}\n"
        result += f"Wallet: {student['wallet_address']}\n"
        result += f"{'-'*50}\n\n"
    
    if not students:
        result += "No students registered yet.\n"
    
    return result

def issue_new_certificate(student_name: str, existing_username: str, new_username: str, 
                         new_password: str, course: str, grade: str, pdf_file):
    if not student_name or not course or not grade:
        return "Error: Student name, course, and grade are required", ""
    
    # Check if using existing student
    if existing_username:
        student_username = existing_username
    elif new_username and new_password:
        # Create new student
        success, message = system.add_student(new_username, new_password, student_name)
        if not success:
            return f"Error: {message}", ""
        student_username = new_username
    else:
        # Check if student exists by name
        student_username = system.get_student_by_name(student_name)
        if not student_username:
            return "Error: Student not found. Please provide username and password for new student.", ""
    
    success, cert_id, cert_data = system.issue_certificate("issuer324", student_name, 
                                                           student_username, course, grade, pdf_file)
    if success:
        cert = system.get_certificate(cert_id)
        result = f"Certificate Issued Successfully\n\n"
        result += f"Certificate ID: {cert_id}\n"
        result += f"Student: {student_name}\n"
        result += f"Student Username: {student_username}\n"
        result += f"Course: {course}\n"
        result += f"Grade: {grade}\n"
        result += f"Blockchain Hash: {cert.blockchain_hash}\n"
        result += f"Signature: {cert.signatures[0]['signature']}\n"
        if cert.ipfs_hash:
            result += f"IPFS Hash: {cert.ipfs_hash}\n"
            result += f"PDF Signature: {cert.pdf_signature[:64]}...\n"
        return result, get_issuer_wallet_info()
    return "Error issuing certificate", ""

def get_issuer_wallet_info():
    wallet = system.wallets["issuer324"]
    stats = system.issuer_stats.get("issuer324", {"total_issued": 0, "by_student": {}})
    
    info = f"Issuer Wallet Information\n"
    info += f"{'='*50}\n"
    info += f"Owner: Institute XYZ\n"
    info += f"Address: {wallet.get_address()}\n"
    info += f"Total Certificates Issued: {stats['total_issued']}\n\n"
    info += f"Certificates by Student:\n"
    for student, count in stats['by_student'].items():
        info += f"  - {student}: {count} certificate(s)\n"
    
    return info

def get_all_issued_certificates():
    result = "All Issued Certificates\n"
    result += f"{'='*50}\n\n"
    
    for cert_id, cert in system.certificates.items():
        result += f"Certificate ID: {cert_id}\n"
        result += f"Student: {cert.student_name}\n"
        result += f"Course: {cert.course}\n"
        result += f"Grade: {cert.grade}\n"
        result += f"Issue Date: {cert.issue_date}\n"
        result += f"Blockchain Hash: {cert.blockchain_hash}\n"
        result += f"Signature: {cert.signatures[0]['signature']}\n"
        result += f"{'-'*50}\n\n"
    
    if not system.certificates:
        result += "No certificates issued yet.\n"
    
    return result

def view_blockchain_issuer():
    result = "Blockchain Explorer\n"
    result += f"{'='*50}\n"
    result += f"Total Blocks: {len(system.blockchain.chain)}\n"
    result += f"Difficulty: {system.blockchain.difficulty}\n"
    result += f"Chain Valid: {system.blockchain.is_chain_valid()}\n\n"
    
    for block in system.blockchain.chain:
        result += f"Block #{block.index}\n"
        result += f"Timestamp: {datetime.fromtimestamp(block.timestamp).strftime('%Y-%m-%d %H:%M:%S')}\n"
        result += f"Hash: {block.hash}\n"
        result += f"Previous Hash: {block.previous_hash}\n"
        result += f"Nonce: {block.nonce}\n"
        result += f"Data Type: {block.data.get('type', 'unknown')}\n"
        if block.data.get('type') == 'certificate_issued':
            cert_data = block.data.get('certificate', {})
            result += f"  Certificate ID: {cert_data.get('cert_id', 'N/A')}\n"
            result += f"  Student: {cert_data.get('student_name', 'N/A')}\n"
        result += f"{'-'*50}\n\n"
    
    return result

# ==================== STUDENT FUNCTIONS ====================

def get_student_certificates_view():
    if not system.current_logged_user:
        return "Error: Not logged in"
    
    certs = system.get_student_certificates(system.current_logged_user)
    
    result = "My Certificates\n"
    result += f"{'='*50}\n\n"
    
    for cert in certs:
        result += f"Certificate ID: {cert.cert_id}\n"
        result += f"Course: {cert.course}\n"
        result += f"Grade: {cert.grade}\n"
        result += f"Issue Date: {cert.issue_date}\n"
        result += f"Issuer: {cert.issuer}\n"
        result += f"Blockchain Hash: {cert.blockchain_hash}\n"
        result += f"Signature: {cert.signatures[0]['signature']}\n"
        if cert.ipfs_hash:
            result += f"IPFS Hash: {cert.ipfs_hash}\n"
            result += f"PDF Available: Yes\n"
        result += f"{'-'*50}\n\n"
    
    if not certs:
        result += "No certificates found.\n"
    
    return result

def download_certificate_pdf(cert_id: str):
    if not cert_id:
        return None
    
    pdf_path = system.get_certificate_pdf_path(cert_id)
    if pdf_path:
        return pdf_path
    return None

def verify_student_certificate(cert_id: str):
    if not cert_id:
        return "Error: Please enter a certificate ID"
    
    valid, message = system.verify_certificate(cert_id)
    
    result = f"Certificate Verification\n"
    result += f"{'='*50}\n"
    result += f"Certificate ID: {cert_id}\n"
    result += f"Status: {'VALID' if valid else 'INVALID'}\n"
    result += f"Message: {message}\n\n"
    
    if valid:
        cert = system.get_certificate(cert_id)
        result += f"Certificate Details:\n"
        result += f"Student: {cert.student_name}\n"
        result += f"Course: {cert.course}\n"
        result += f"Grade: {cert.grade}\n"
        result += f"Blockchain Hash: {cert.blockchain_hash}\n"
        result += f"Signatures:\n"
        for sig in cert.signatures:
            result += f"  Signer: {sig['signer']}\n"
            result += f"  Signature: {sig['signature']}\n"
            result += f"  Timestamp: {sig['timestamp']}\n"
    
    return result

def grant_consent_to_hr(hr_username: str, cert_id: str):
    if not system.current_logged_user:
        return "Error: Not logged in"
    
    if not hr_username or not cert_id:
        return "Error: Please provide both HR username and certificate ID"
    
    if hr_username not in system.users or system.users[hr_username]["role"] != "hr":
        return "Error: Invalid HR username"
    
    if cert_id not in system.certificates:
        return "Error: Certificate not found"
    
    consent_id = system.consent_manager.grant_consent(system.current_logged_user, hr_username, cert_id)
    
    result = f"Consent Granted Successfully\n"
    result += f"{'='*50}\n"
    result += f"Consent ID: {consent_id}\n"
    result += f"HR: {hr_username}\n"
    result += f"Certificate: {cert_id}\n"
    result += f"Granted At: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    
    return result

def revoke_student_consent(consent_id: str):
    if not system.current_logged_user:
        return "Error: Not logged in"
    
    if not consent_id:
        return "Error: Please enter a consent ID"
    
    success = system.consent_manager.revoke_consent(system.current_logged_user, consent_id)
    
    if success:
        result = f"Consent Revoked Successfully\n"
        result += f"{'='*50}\n"
        result += f"Consent ID: {consent_id}\n"
        result += f"Status: REVOKED\n"
        return result
    
    return "Error: Consent not found"

def view_student_consents():
    if not system.current_logged_user:
        return "Error: Not logged in"
    
    consents = system.consent_manager.get_student_consents(system.current_logged_user)
    
    result = "My Consents\n"
    result += f"{'='*50}\n\n"
    
    for consent in consents:
        result += f"Consent ID: {consent['consent_id']}\n"
        result += f"HR: {consent['hr']}\n"
        result += f"Certificate: {consent['cert_id']}\n"
        result += f"Status: {consent['status'].upper()}\n"
        result += f"Granted At: {consent['granted_at']}\n"
        result += f"{'-'*50}\n\n"
    
    if not consents:
        result += "No consents granted.\n"
    
    return result

def get_student_wallet_info():
    if not system.current_logged_user:
        return "Error: Not logged in"
    
    wallet = system.wallets[system.current_logged_user]
    certs = system.get_student_certificates(system.current_logged_user)
    user_name = system.users[system.current_logged_user]["name"]
    
    info = f"Student Wallet Information\n"
    info += f"{'='*50}\n"
    info += f"Owner: {user_name}\n"
    info += f"Username: {system.current_logged_user}\n"
    info += f"Address: {wallet.get_address()}\n"
    info += f"Total Certificates Owned: {len(certs)}\n\n"
    info += f"Certificates:\n"
    for cert in certs:
        info += f"  - {cert.cert_id}: {cert.course}\n"
    
    return info

def view_blockchain_student():
    return view_blockchain_issuer()

# ==================== HR FUNCTIONS ====================

def view_certificate_with_consent(cert_id: str):
    if not cert_id:
        return "Error: Please enter a certificate ID", None
    
    cert = system.get_certificate(cert_id)
    if not cert:
        return "Error: Certificate not found", None
    
    student_username = cert.student_username
    
    has_consent = system.consent_manager.check_consent(student_username, "HR023", cert_id)
    
    result = f"Certificate Verification\n"
    result += f"{'='*50}\n"
    result += f"Certificate ID: {cert_id}\n"
    result += f"Consent Status: {'GRANTED' if has_consent else 'NOT GRANTED'}\n\n"
    
    pdf_file = None
    if has_consent:
        result += f"Certificate Details:\n"
        result += f"Student: {cert.student_name}\n"
        result += f"Student Username: {cert.student_username}\n"
        result += f"Course: {cert.course}\n"
        result += f"Grade: {cert.grade}\n"
        result += f"Issue Date: {cert.issue_date}\n"
        result += f"Issuer: {cert.issuer}\n"
        result += f"Blockchain Hash: {cert.blockchain_hash}\n"
        result += f"Signature: {cert.signatures[0]['signature']}\n"
        if cert.ipfs_hash:
            result += f"IPFS Hash: {cert.ipfs_hash}\n"
            result += f"PDF Signature: {cert.pdf_signature[:64]}...\n"
            pdf_file = system.get_certificate_pdf_path(cert_id)
    else:
        result += "Access Denied: Student consent required to view certificate details.\n"
    
    return result, pdf_file

def verify_hr_certificate(cert_id: str):
    return verify_student_certificate(cert_id)

def get_hr_wallet_info():
    wallet = system.wallets["HR023"]
    
    info = f"HR Wallet Information\n"
    info += f"{'='*50}\n"
    info += f"Owner: TechCorp HR\n"
    info += f"Address: {wallet.get_address()}\n"
    info += f"Role: Certificate Verifier\n"
    
    return info

def view_blockchain_hr():
    return view_blockchain_issuer()

def get_accessible_certificates():
    result = "Accessible Certificates\n"
    result += f"{'='*50}\n\n"
    
    accessible = []
    for cert_id, cert in system.certificates.items():
        student_username = cert.student_username
        if system.consent_manager.check_consent(student_username, "HR023", cert_id):
            accessible.append(cert)
    
    for cert in accessible:
        result += f"Certificate ID: {cert.cert_id}\n"
        result += f"Student: {cert.student_name}\n"
        result += f"Username: {cert.student_username}\n"
        result += f"Course: {cert.course}\n"
        result += f"Grade: {cert.grade}\n"
        result += f"Blockchain Hash: {cert.blockchain_hash}\n"
        if cert.ipfs_hash:
            result += f"IPFS Hash: {cert.ipfs_hash}\n"
        result += f"{'-'*50}\n\n"
    
    if not accessible:
        result += "No certificates accessible. Student consent required.\n"
    
    return result

# ==================== GRADIO INTERFACE ====================

def create_interface():
    with gr.Blocks(title="Certificate Management System") as app:
        gr.Markdown("# Blockchain Certificate Management System")
        
        welcome_msg = gr.Textbox(label="Status", interactive=False, visible=True)
        
        # LOGIN SCREEN
        with gr.Group(visible=True) as login_screen:
            gr.Markdown("## Login")
            username = gr.Textbox(label="Username", placeholder="Enter username")
            password = gr.Textbox(label="Password", type="password", placeholder="Enter password")
            login_btn = gr.Button("Login", variant="primary")
            gr.Markdown("---")
            gr.Markdown("### Test Credentials:")
            gr.Markdown("**Issuer:** issuer324 / isse324")
            gr.Markdown("**Student:** student02 / stud02")
            gr.Markdown("**HR:** HR023 / hr023")
        
        # ISSUER DASHBOARD
        with gr.Group(visible=False) as issuer_screen:
            gr.Markdown("## Issuer Dashboard")
            logout_issuer = gr.Button("Logout")
            
            with gr.Tab("Add Student"):
                gr.Markdown("### Register New Student")
                new_stud_username = gr.Textbox(label="Username", placeholder="Enter username for student")
                new_stud_password = gr.Textbox(label="Password", type="password", placeholder="Set password")
                new_stud_fullname = gr.Textbox(label="Full Name", placeholder="Enter student full name")
                add_student_btn = gr.Button("Add Student", variant="primary")
                add_student_output = gr.Textbox(label="Result", lines=8, interactive=False)
            
            with gr.Tab("View Students"):
                view_students_btn = gr.Button("Refresh Student List")
                students_output = gr.Textbox(label="Registered Students", lines=15, interactive=False)
            
            with gr.Tab("Issue Certificate"):
                gr.Markdown("### Issue Certificate with PDF")
                gr.Markdown("**For Existing Student:** Provide student name and select from dropdown")
                gr.Markdown("**For New Student:** Provide all student details below")
                cert_student_name = gr.Textbox(label="Student Full Name", placeholder="Enter student full name")
                existing_student_dropdown = gr.Textbox(label="Existing Student Username (if applicable)", placeholder="Leave blank for new student")
                new_cert_username = gr.Textbox(label="New Student Username (if new)", placeholder="Enter new username")
                new_cert_password = gr.Textbox(label="New Student Password (if new)", type="password", placeholder="Enter new password")
                course_input = gr.Textbox(label="Course", placeholder="Enter course name")
                grade_input = gr.Textbox(label="Grade", placeholder="Enter grade")
                pdf_upload = gr.File(label="Upload Certificate PDF (Optional)", file_types=[".pdf"])
                issue_btn = gr.Button("Issue Certificate", variant="primary")
                issue_output = gr.Textbox(label="Result", lines=12, interactive=False)
            
            with gr.Tab("Wallet"):
                wallet_btn = gr.Button("Refresh Wallet Info")
                wallet_output = gr.Textbox(label="Wallet Information", lines=10, interactive=False)
            
            with gr.Tab("Issued Certificates"):
                view_certs_btn = gr.Button("View All Certificates")
                certs_output = gr.Textbox(label="Certificates", lines=15, interactive=False)
            
            with gr.Tab("Blockchain"):
                blockchain_btn = gr.Button("View Blockchain")
                blockchain_output = gr.Textbox(label="Blockchain", lines=15, interactive=False)
        
        # STUDENT DASHBOARD
        with gr.Group(visible=False) as student_screen:
            gr.Markdown("## Student Dashboard")
            logout_student = gr.Button("Logout")
            
            with gr.Tab("My Certificates"):
                view_my_certs_btn = gr.Button("View My Certificates")
                my_certs_output = gr.Textbox(label="My Certificates", lines=10, interactive=False)
                gr.Markdown("### Download Certificate PDF")
                download_cert_id = gr.Textbox(label="Certificate ID", placeholder="Enter certificate ID")
                download_pdf_btn = gr.Button("Download PDF")
                download_pdf_output = gr.File(label="Downloaded PDF")
            
            with gr.Tab("Verify Certificate"):
                verify_cert_input = gr.Textbox(label="Certificate ID", placeholder="Enter certificate ID")
                verify_btn = gr.Button("Verify Certificate", variant="primary")
                verify_output = gr.Textbox(label="Verification Result", lines=10, interactive=False)
            
            with gr.Tab("Manage Consents"):
                with gr.Row():
                    with gr.Column():
                        gr.Markdown("### Grant Consent")
                        hr_username_input = gr.Textbox(label="HR Username", placeholder="Enter HR username")
                        consent_cert_input = gr.Textbox(label="Certificate ID", placeholder="Enter certificate ID")
                        grant_consent_btn = gr.Button("Grant Consent", variant="primary")
                        grant_output = gr.Textbox(label="Result", lines=5, interactive=False)
                    
                    with gr.Column():
                        gr.Markdown("### Revoke Consent")
                        revoke_consent_input = gr.Textbox(label="Consent ID", placeholder="Enter consent ID")
                        revoke_consent_btn = gr.Button("Revoke Consent", variant="secondary")
                        revoke_output = gr.Textbox(label="Result", lines=5, interactive=False)
                
                view_consents_btn = gr.Button("View All Consents")
                consents_output = gr.Textbox(label="My Consents", lines=10, interactive=False)
            
            with gr.Tab("Wallet"):
                student_wallet_btn = gr.Button("Refresh Wallet Info")
                student_wallet_output = gr.Textbox(label="Wallet Information", lines=8, interactive=False)
            
            with gr.Tab("Blockchain"):
                student_blockchain_btn = gr.Button("View Blockchain")
                student_blockchain_output = gr.Textbox(label="Blockchain", lines=15, interactive=False)
        
        # HR DASHBOARD
        with gr.Group(visible=False) as hr_screen:
            gr.Markdown("## HR Dashboard")
            logout_hr = gr.Button("Logout")
            
            with gr.Tab("Verify Certificate"):
                hr_cert_input = gr.Textbox(label="Certificate ID", placeholder="Enter certificate ID")
                hr_verify_btn = gr.Button("Verify Certificate", variant="primary")
                hr_verify_output = gr.Textbox(label="Verification Result", lines=10, interactive=False)
            
            with gr.Tab("View Certificate"):
                view_cert_input = gr.Textbox(label="Certificate ID", placeholder="Enter certificate ID")
                view_cert_btn = gr.Button("View Certificate Details", variant="primary")
                view_cert_output = gr.Textbox(label="Certificate Details", lines=10, interactive=False)
                view_cert_pdf = gr.File(label="Certificate PDF (if available)")
            
            with gr.Tab("Accessible Certificates"):
                accessible_certs_btn = gr.Button("View Accessible Certificates")
                accessible_output = gr.Textbox(label="Accessible Certificates", lines=15, interactive=False)
            
            with gr.Tab("Wallet"):
                hr_wallet_btn = gr.Button("Refresh Wallet Info")
                hr_wallet_output = gr.Textbox(label="Wallet Information", lines=8, interactive=False)
            
            with gr.Tab("Blockchain"):
                hr_blockchain_btn = gr.Button("View Blockchain")
                hr_blockchain_output = gr.Textbox(label="Blockchain", lines=15, interactive=False)
        
        # Event Handlers
        login_btn.click(
            login_user,
            inputs=[username, password],
            outputs=[login_screen, issuer_screen, student_screen, hr_screen, welcome_msg]
        )
        
        logout_issuer.click(
            logout,
            outputs=[login_screen, issuer_screen, student_screen, hr_screen, welcome_msg]
        )
        
        logout_student.click(
            logout,
            outputs=[login_screen, issuer_screen, student_screen, hr_screen, welcome_msg]
        )
        
        logout_hr.click(
            logout,
            outputs=[login_screen, issuer_screen, student_screen, hr_screen, welcome_msg]
        )
        
        # Issuer Events
        add_student_btn.click(
            add_new_student,
            inputs=[new_stud_username, new_stud_password, new_stud_fullname],
            outputs=add_student_output
        )
        
        view_students_btn.click(view_all_students, outputs=students_output)
        
        issue_btn.click(
            issue_new_certificate,
            inputs=[cert_student_name, existing_student_dropdown, new_cert_username, 
                   new_cert_password, course_input, grade_input, pdf_upload],
            outputs=[issue_output, wallet_output]
        )
        
        wallet_btn.click(get_issuer_wallet_info, outputs=wallet_output)
        view_certs_btn.click(get_all_issued_certificates, outputs=certs_output)
        blockchain_btn.click(view_blockchain_issuer, outputs=blockchain_output)
        
        # Student Events
        view_my_certs_btn.click(get_student_certificates_view, outputs=my_certs_output)
        download_pdf_btn.click(download_certificate_pdf, inputs=download_cert_id, outputs=download_pdf_output)
        verify_btn.click(verify_student_certificate, inputs=verify_cert_input, outputs=verify_output)
        grant_consent_btn.click(grant_consent_to_hr, inputs=[hr_username_input, consent_cert_input], outputs=grant_output)
        revoke_consent_btn.click(revoke_student_consent, inputs=revoke_consent_input, outputs=revoke_output)
        view_consents_btn.click(view_student_consents, outputs=consents_output)
        student_wallet_btn.click(get_student_wallet_info, outputs=student_wallet_output)
        student_blockchain_btn.click(view_blockchain_student, outputs=student_blockchain_output)
        
        # HR Events
        hr_verify_btn.click(verify_hr_certificate, inputs=hr_cert_input, outputs=hr_verify_output)
        view_cert_btn.click(view_certificate_with_consent, inputs=view_cert_input, outputs=[view_cert_output, view_cert_pdf])
        accessible_certs_btn.click(get_accessible_certificates, outputs=accessible_output)
        hr_wallet_btn.click(get_hr_wallet_info, outputs=hr_wallet_output)
        hr_blockchain_btn.click(view_blockchain_hr, outputs=hr_blockchain_output)
    
    return app

if __name__ == "__main__":
    app = create_interface()
    app.launch(server_name="0.0.0.0", server_port=7860, share=True)
