"""
Demo script for Blockchain Certificate Management System
This script demonstrates the key features without the UI
"""

from certificate_system import CertificateSystem, Wallet
from datetime import datetime

def print_section(title):
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def demo():
    # Initialize system
    system = CertificateSystem()
    
    print_section("BLOCKCHAIN CERTIFICATE MANAGEMENT SYSTEM DEMO")
    
    # 1. Show initial wallets
    print_section("1. WALLET INITIALIZATION")
    for username, wallet in system.wallets.items():
        print(f"\n{username}:")
        print(f"  Role: {system.users[username]['role']}")
        print(f"  Name: {system.users[username]['name']}")
        print(f"  Address: {wallet.get_address()}")
    
    # 2. Issue certificates
    print_section("2. ISSUING CERTIFICATES")
    
    certificates = [
        ("John Doe", "Computer Science", "A+"),
        ("John Doe", "Data Structures", "A"),
        ("Jane Smith", "Mathematics", "A+"),
    ]
    
    for student, course, grade in certificates:
        success, cert_id, cert_data = system.issue_certificate(
            "issuer324", student, course, grade
        )
        cert = system.get_certificate(cert_id)
        print(f"\nIssued {cert_id}:")
        print(f"  Student: {student}")
        print(f"  Course: {course}")
        print(f"  Grade: {grade}")
        print(f"  Blockchain Hash: {cert.blockchain_hash[:32]}...")
        print(f"  Signature: {cert.signatures[0]['signature']}")
    
    # 3. Show blockchain
    print_section("3. BLOCKCHAIN STATE")
    print(f"Total Blocks: {len(system.blockchain.chain)}")
    print(f"Difficulty: {system.blockchain.difficulty}")
    print(f"Chain Valid: {system.blockchain.is_chain_valid()}")
    print("\nRecent Blocks:")
    for block in system.blockchain.chain[-3:]:
        print(f"\n  Block #{block.index}")
        print(f"    Hash: {block.hash[:32]}...")
        print(f"    Previous: {block.previous_hash[:32]}...")
        print(f"    Nonce: {block.nonce}")
        print(f"    Timestamp: {datetime.fromtimestamp(block.timestamp)}")
    
    # 4. Show student certificates
    print_section("4. STUDENT CERTIFICATES (John Doe)")
    certs = system.get_student_certificates("John Doe")
    print(f"Total Certificates: {len(certs)}")
    for cert in certs:
        print(f"\n  {cert.cert_id}")
        print(f"    Course: {cert.course}")
        print(f"    Grade: {cert.grade}")
        print(f"    Blockchain Hash: {cert.blockchain_hash[:32]}...")
    
    # 5. Verify certificate
    print_section("5. CERTIFICATE VERIFICATION")
    cert_id = "CERT-0001"
    valid, message = system.verify_certificate(cert_id)
    print(f"Certificate: {cert_id}")
    print(f"Status: {'VALID' if valid else 'INVALID'}")
    print(f"Message: {message}")
    
    # 6. Grant consent
    print_section("6. CONSENT MANAGEMENT")
    cert_id = "CERT-0001"
    consent_id = system.consent_manager.grant_consent("student02", "HR023", cert_id)
    print(f"Consent Granted:")
    print(f"  Consent ID: {consent_id}")
    print(f"  Student: student02")
    print(f"  HR: HR023")
    print(f"  Certificate: {cert_id}")
    
    # 7. Check HR access
    print_section("7. HR ACCESS CHECK")
    has_consent = system.consent_manager.check_consent("student02", "HR023", cert_id)
    print(f"HR (HR023) Access to {cert_id}: {'GRANTED' if has_consent else 'DENIED'}")
    
    if has_consent:
        cert = system.get_certificate(cert_id)
        print(f"\nAccessible Certificate Details:")
        print(f"  Student: {cert.student_name}")
        print(f"  Course: {cert.course}")
        print(f"  Grade: {cert.grade}")
        print(f"  Blockchain Hash: {cert.blockchain_hash[:32]}...")
    
    # 8. Revoke consent
    print_section("8. REVOKE CONSENT")
    success = system.consent_manager.revoke_consent("student02", consent_id)
    print(f"Consent {consent_id} Revoked: {success}")
    
    has_consent = system.consent_manager.check_consent("student02", "HR023", cert_id)
    print(f"HR (HR023) Access after revocation: {'GRANTED' if has_consent else 'DENIED'}")
    
    # 9. Issuer statistics
    print_section("9. ISSUER STATISTICS")
    stats = system.issuer_stats.get("issuer324", {})
    print(f"Total Certificates Issued: {stats['total_issued']}")
    print(f"\nCertificates by Student:")
    for student, count in stats['by_student'].items():
        print(f"  {student}: {count}")
    
    print_section("DEMO COMPLETE")
    print("\nTo run the full Gradio UI:")
    print("  python certificate_system.py")
    print("\nTest Credentials:")
    print("  Issuer: issuer324 / isse324")
    print("  Student: student02 / stud02")
    print("  HR: HR023 / hr023")
    print()

if __name__ == "__main__":
    demo()
