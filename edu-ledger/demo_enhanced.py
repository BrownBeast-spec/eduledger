"""
Enhanced Demo for Blockchain Certificate Management System
Demonstrates new student management and PDF upload features
"""

from certificate_system import CertificateSystem
from datetime import datetime
import os

def print_section(title):
    print("\n" + "="*70)
    print(f" {title}")
    print("="*70)

def demo():
    system = CertificateSystem()
    
    print_section("ENHANCED BLOCKCHAIN CERTIFICATE SYSTEM DEMO")
    
    # 1. Show initial system
    print_section("1. INITIAL SYSTEM STATE")
    print(f"Initial Users: {list(system.users.keys())}")
    print(f"Initial Wallets: {list(system.wallets.keys())}")
    print(f"Student count: {len(system.get_all_students())}")
    
    # 2. Add students
    print_section("2. ADDING NEW STUDENTS")
    
    students_to_add = [
        ("alice_s01", "alice123", "Alice Johnson"),
        ("bob_s02", "bob456", "Bob Smith"),
        ("carol_s03", "carol789", "Carol Williams")
    ]
    
    for username, password, full_name in students_to_add:
        success, message = system.add_student(username, password, full_name)
        print(f"\nAdding {full_name}:")
        print(f"  Username: {username}")
        print(f"  Password: {password}")
        print(f"  Status: {'SUCCESS' if success else 'FAILED'}")
        print(f"  Wallet: {system.wallets[username].get_address()}")
    
    # 3. View all students
    print_section("3. ALL REGISTERED STUDENTS")
    students = system.get_all_students()
    for student in students:
        print(f"\nUsername: {student['username']}")
        print(f"  Name: {student['name']}")
        print(f"  Wallet: {student['wallet_address']}")
    
    # 4. Issue certificates with PDF (simulated)
    print_section("4. ISSUING CERTIFICATES WITH PDF")
    
    # Create a dummy PDF content
    dummy_pdf = b"PDF-1.4 Dummy Certificate Content for Alice Johnson"
    
    cert_data = [
        ("Alice Johnson", "alice_s01", "Computer Science", "A+", dummy_pdf),
        ("Bob Smith", "bob_s02", "Mathematics", "A", b"PDF-1.4 Dummy Certificate for Bob"),
        ("Carol Williams", "carol_s03", "Physics", "A+", None)  # No PDF
    ]
    
    for student_name, student_username, course, grade, pdf_content in cert_data:
        success, cert_id, cert_dict = system.issue_certificate(
            "issuer324", student_name, student_username, course, grade, pdf_content
        )
        cert = system.get_certificate(cert_id)
        print(f"\nIssued {cert_id}:")
        print(f"  Student: {student_name} ({student_username})")
        print(f"  Course: {course}")
        print(f"  Grade: {grade}")
        print(f"  Blockchain Hash: {cert.blockchain_hash[:32]}...")
        print(f"  Signature: {cert.signatures[0]['signature'][:32]}...")
        if cert.ipfs_hash:
            print(f"  IPFS Hash: {cert.ipfs_hash}")
            print(f"  PDF Signature: {cert.pdf_signature[:32]}...")
            print(f"  PDF Stored: Yes")
        else:
            print(f"  PDF Stored: No")
    
    # 5. Student login and view certificates
    print_section("5. STUDENT ALICE VIEWS CERTIFICATES")
    system.authenticate("alice_s01", "alice123")
    alice_certs = system.get_student_certificates("alice_s01")
    print(f"Total Certificates: {len(alice_certs)}")
    for cert in alice_certs:
        print(f"\n  {cert.cert_id}:")
        print(f"    Course: {cert.course}")
        print(f"    Grade: {cert.grade}")
        print(f"    Has PDF: {'Yes' if cert.ipfs_hash else 'No'}")
        print(f"    Blockchain: {cert.blockchain_hash[:32]}...")
    
    # 6. Grant consent
    print_section("6. ALICE GRANTS CONSENT TO HR")
    cert_id = "CERT-0001"
    consent_id = system.consent_manager.grant_consent("alice_s01", "HR023", cert_id)
    print(f"Consent Granted:")
    print(f"  Consent ID: {consent_id}")
    print(f"  Student: alice_s01")
    print(f"  HR: HR023")
    print(f"  Certificate: {cert_id}")
    
    # 7. HR views certificate with consent
    print_section("7. HR VIEWS CERTIFICATE WITH CONSENT")
    cert = system.get_certificate(cert_id)
    has_consent = system.consent_manager.check_consent("alice_s01", "HR023", cert_id)
    print(f"Certificate: {cert_id}")
    print(f"Consent Status: {'GRANTED' if has_consent else 'DENIED'}")
    if has_consent:
        print(f"\nAccessible Details:")
        print(f"  Student: {cert.student_name}")
        print(f"  Username: {cert.student_username}")
        print(f"  Course: {cert.course}")
        print(f"  Grade: {cert.grade}")
        print(f"  IPFS Hash: {cert.ipfs_hash}")
        print(f"  PDF Available: Yes")
        pdf_path = system.get_certificate_pdf_path(cert_id)
        print(f"  PDF Path: {pdf_path}")
        print(f"  PDF Exists: {os.path.exists(pdf_path) if pdf_path else False}")
    
    # 8. Try accessing without consent
    print_section("8. HR TRIES TO ACCESS ANOTHER CERTIFICATE")
    cert_id_2 = "CERT-0002"
    has_consent_2 = system.consent_manager.check_consent("bob_s02", "HR023", cert_id_2)
    print(f"Certificate: {cert_id_2}")
    print(f"Consent Status: {'GRANTED' if has_consent_2 else 'DENIED'}")
    if not has_consent_2:
        print("Access DENIED - Student consent required")
    
    # 9. Blockchain state
    print_section("9. BLOCKCHAIN STATE")
    print(f"Total Blocks: {len(system.blockchain.chain)}")
    print(f"Total Certificates: {len(system.certificates)}")
    print(f"Total Students: {len(system.get_all_students())}")
    print(f"Chain Valid: {system.blockchain.is_chain_valid()}")
    
    # 10. Issuer statistics
    print_section("10. ISSUER STATISTICS")
    stats = system.issuer_stats.get("issuer324", {})
    print(f"Total Certificates Issued: {stats['total_issued']}")
    print("\nCertificates by Student:")
    for student, count in stats['by_student'].items():
        print(f"  {student}: {count}")
    
    # 11. Student wallet summary
    print_section("11. STUDENT WALLET SUMMARY")
    for username in ["alice_s01", "bob_s02", "carol_s03"]:
        wallet = system.wallets[username]
        certs = system.get_student_certificates(username)
        user_name = system.users[username]["name"]
        print(f"\n{user_name} ({username}):")
        print(f"  Wallet Address: {wallet.get_address()}")
        print(f"  Certificates: {len(certs)}")
        for cert in certs:
            print(f"    - {cert.cert_id}: {cert.course} ({cert.grade})")
    
    print_section("DEMO COMPLETE")
    print("\nNew Features Demonstrated:")
    print("  1. Dynamic student account creation by issuer")
    print("  2. Student login with custom credentials")
    print("  3. PDF certificate upload and IPFS hash generation")
    print("  4. PDF digital signatures")
    print("  5. Consent-based PDF access for HR")
    print("  6. Student-specific certificate management")
    print("  7. Enhanced blockchain tracking with PDF metadata")
    print("\nTo run the full Gradio UI:")
    print("  python certificate_system.py")
    print()

if __name__ == "__main__":
    demo()
