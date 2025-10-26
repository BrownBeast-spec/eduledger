# Blockchain Certificate Management System

## Overview
A complete blockchain-based certificate management system with role-based access control, digital signatures, and consent management built with Gradio.

## Key Features

### 1. Blockchain Infrastructure
- Proof-of-Work mining with difficulty 2
- SHA-256 cryptographic hashing
- Immutable certificate records
- Full chain verification
- Genesis block initialization

### 2. Cryptographic Wallets
- RSA 2048-bit key pairs for all users
- Public/Private key cryptography
- Digital signature generation (RSA-PSS with SHA-256)
- Unique wallet addresses (20-character hash)

### 3. Three Role-Based Dashboards

#### Issuer Dashboard (issuer324 / isse324)
- Issue Certificate: Create certificates for students with course and grade
- Wallet: View issuer wallet address and statistics
  - Total certificates issued
  - Certificates breakdown by student
- Issued Certificates: Browse all certificates with blockchain hashes
- Blockchain Explorer: View complete blockchain with all blocks

#### Student Dashboard (student02 / stud02)
- My Certificates: View all owned certificates
  - Certificate ID, course, grade
  - Blockchain hash and signatures
- Verify Certificate: Validate certificate authenticity
  - Check blockchain integrity
  - View signature details
- Manage Consents:
  - Grant Consent: Give HR access to specific certificates
  - Revoke Consent: Remove previously granted access
  - View All Consents: Track consent status (ACTIVE/REVOKED)
- Wallet: View student wallet and certificate inventory
- Blockchain Explorer: View complete blockchain

#### HR Dashboard (HR023 / hr023)
- Verify Certificate: Check certificate validity
  - Blockchain verification
  - Signature validation
- View Certificate: Access certificate details with consent
  - Shows consent status (GRANTED/NOT GRANTED)
  - Displays full details only if consent granted
- Accessible Certificates: List all certificates with active consent
- Wallet: View HR wallet information
- Blockchain Explorer: View complete blockchain

### 4. Consent Management System
- Student-controlled access to certificates
- Unique consent IDs for tracking
- Grant consent to specific HR for specific certificates
- Revoke consent at any time
- Real-time consent status checking
- Consent history tracking

## Files Structure

```
/home/beast/Documents/edu-ledger/
├── certificate_system.py    # Main application (754 lines)
├── requirements.txt          # Python dependencies
├── demo.py                   # Command-line demo
├── start.sh                  # Quick start script
├── GRADIO_USAGE.md          # Usage guide
└── SYSTEM_OVERVIEW.md       # This file
```

## Quick Start

### Installation
```bash
cd /home/beast/Documents/edu-ledger
pip install -r requirements.txt
```

### Run Demo (Command Line)
```bash
python demo.py
```

### Run Full Application (Web UI)
```bash
./start.sh
# or
python certificate_system.py
```

Access at: http://localhost:7860

## Test Credentials

| Role    | Username   | Password | Full Name      |
|---------|-----------|----------|----------------|
| Issuer  | issuer324 | isse324  | Institute XYZ  |
| Student | student02 | stud02   | John Doe       |
| HR      | HR023     | hr023    | TechCorp HR    |

## Complete Workflow Example

### Step 1: Issue Certificates (as Issuer)
1. Login: issuer324 / isse324
2. Go to "Issue Certificate" tab
3. Enter:
   - Student Name: John Doe
   - Course: Computer Science
   - Grade: A+
4. Click "Issue Certificate"
5. View the output showing:
   - Certificate ID (e.g., CERT-0001)
   - Blockchain Hash (with proof-of-work)
   - Digital Signature

### Step 2: View Wallet Statistics
1. Go to "Wallet" tab
2. Click "Refresh Wallet Info"
3. View:
   - Issuer wallet address
   - Total certificates issued
   - Breakdown by student

### Step 3: Student Views Certificates
1. Logout and login as: student02 / stud02
2. Go to "My Certificates" tab
3. Click "View My Certificates"
4. See all owned certificates with:
   - Certificate ID
   - Course and grade
   - Blockchain hash
   - Digital signature

### Step 4: Verify Certificate
1. Go to "Verify Certificate" tab
2. Enter Certificate ID: CERT-0001
3. Click "Verify Certificate"
4. View verification result:
   - Status: VALID/INVALID
   - Blockchain verification
   - Signature details

### Step 5: Grant Consent to HR
1. Go to "Manage Consents" tab
2. Under "Grant Consent":
   - HR Username: HR023
   - Certificate ID: CERT-0001
3. Click "Grant Consent"
4. Receive consent ID (e.g., 26083d50e0d47ff6)

### Step 6: Track Consents
1. Click "View All Consents"
2. See all consents with:
   - Consent ID
   - HR username
   - Certificate ID
   - Status (ACTIVE/REVOKED)
   - Granted timestamp

### Step 7: HR Views Certificate
1. Logout and login as: HR023 / hr023
2. Go to "View Certificate" tab
3. Enter Certificate ID: CERT-0001
4. Click "View Certificate Details"
5. View:
   - Consent Status: GRANTED
   - Full certificate details
   - Blockchain hash and signature

### Step 8: View Accessible Certificates
1. Go to "Accessible Certificates" tab
2. Click "View Accessible Certificates"
3. See all certificates with active consent

### Step 9: Revoke Consent
1. Logout and login as: student02 / stud02
2. Go to "Manage Consents" tab
3. Under "Revoke Consent":
   - Enter Consent ID
4. Click "Revoke Consent"
5. Verify status changed to REVOKED

### Step 10: Verify HR Access Denied
1. Logout and login as: HR023 / hr023
2. Try to view CERT-0001 again
3. See: "Consent Status: NOT GRANTED"
4. Access denied message displayed

## Technical Details

### Blockchain
- **Algorithm**: SHA-256
- **Difficulty**: 2 (leading zeros)
- **Mining**: Proof-of-Work with nonce increment
- **Validation**: Full chain verification

### Cryptography
- **Key Generation**: RSA 2048-bit
- **Signature**: RSA-PSS with MGF1-SHA256
- **Encoding**: Base64 for signatures
- **Hashing**: SHA-256 for wallet addresses

### Certificate Data Model
```python
{
    "cert_id": "CERT-0001",
    "student_name": "John Doe",
    "course": "Computer Science",
    "grade": "A+",
    "issue_date": "2025-10-26",
    "issuer": "issuer324",
    "signatures": [{
        "signer": "issuer324",
        "signature": "NCDYBlcRKcbuDil...",
        "timestamp": "2025-10-26T23:33:45.083534"
    }],
    "blockchain_hash": "003f89ec354148e46f2d..."
}
```

### Consent Record Model
```python
{
    "consent_id": "26083d50e0d47ff6",
    "hr": "HR023",
    "cert_id": "CERT-0001",
    "granted_at": "2025-10-26T23:33:45.093587",
    "status": "active"  # or "revoked"
}
```

## Features by Role

### Issuer Features
- Create and issue certificates
- Sign certificates with private key
- Add certificates to blockchain
- Track issuance statistics
- View all issued certificates
- Monitor blockchain state
- View wallet address

### Student Features
- View owned certificates
- Verify certificate authenticity
- Grant consent to HR
- Revoke consent from HR
- Track consent status
- View wallet and certificate inventory
- Monitor blockchain state

### HR Features
- Verify certificate validity
- Request certificate access (requires consent)
- View certificates with consent
- Check blockchain signatures
- View accessible certificates only
- Monitor blockchain state
- View wallet address

## Security Features

1. **Authentication**: Password-based login
2. **Authorization**: Role-based access control
3. **Cryptography**: RSA 2048-bit encryption
4. **Signatures**: Digital signatures on all certificates
5. **Blockchain**: Immutable record keeping
6. **Consent**: Student-controlled data sharing
7. **Privacy**: HR cannot access without consent

## Blockchain Explorer Features

All roles can view:
- Total blocks in chain
- Mining difficulty
- Chain validity status
- Complete block history with:
  - Block index
  - Timestamp
  - Hash
  - Previous hash
  - Nonce
  - Data type
  - Certificate details (if applicable)

## System Statistics

The issuer dashboard shows:
- Total certificates issued
- Certificates per student
- Wallet address
- Real-time statistics

The student dashboard shows:
- Total certificates owned
- Certificate details
- Wallet address
- Active consents count

The HR dashboard shows:
- Accessible certificates count
- Wallet address
- Verification capabilities

## No Emoji Policy

This system strictly adheres to a minimal, professional design with:
- No emojis in UI or output
- Clean text-based formatting
- Professional terminology
- Aligned components
- Clear hierarchical structure

## System Design Principles

1. **Role Separation**: Clear distinction between issuer, student, and HR roles
2. **Consent-Based Access**: Students control data sharing
3. **Blockchain Integrity**: All certificates recorded immutably
4. **Cryptographic Security**: Digital signatures on all certificates
5. **Transparency**: Full blockchain explorer for all users
6. **Auditability**: Complete history of all operations
7. **Privacy**: Consent required for HR access
8. **Minimal UI**: Clean, professional Gradio interface
