# Quick Start Guide - Enhanced Certificate System

## Installation

```bash
cd /home/beast/Documents/edu-ledger
pip install -r requirements.txt
```

## Quick Test

```bash
# Test the enhanced features
python demo_enhanced.py
```

## Launch Application

```bash
python certificate_system.py
```

Access at: **http://localhost:7860**

## Default Login Credentials

### Issuer (Institute)
```
Username: issuer324
Password: isse324
```

### HR (Company)
```
Username: HR023
Password: hr023
```

### Students (Created by Issuer)
Students are created dynamically by the issuer.
Example after running demo:
```
Username: alice_s01
Password: alice123
```

## New Feature Walkthrough

### Step 1: Issuer Creates a Student
1. Login as **issuer324**
2. Go to **Add Student** tab
3. Fill in:
   - Username: `john_s01`
   - Password: `john123`
   - Full Name: `John Doe`
4. Click **Add Student**
5. Student account created with wallet

### Step 2: Issuer Issues Certificate with PDF
1. Go to **Issue Certificate** tab
2. Fill in:
   - Student Full Name: `John Doe`
   - Existing Student Username: `john_s01`
   - Course: `Blockchain Technology`
   - Grade: `A+`
   - Upload PDF: Select certificate PDF file
3. Click **Issue Certificate**
4. System will:
   - Generate IPFS hash for PDF
   - Sign PDF with issuer's key
   - Store PDF locally
   - Record in blockchain
   - Display certificate ID, blockchain hash, IPFS hash, signatures

### Step 3: Student Logs In
1. **Logout** from issuer account
2. Login as **john_s01** / **john123**
3. Go to **My Certificates** tab
4. Click **View My Certificates**
5. See all certificates with:
   - Certificate ID
   - Course and grade
   - Blockchain hash
   - IPFS hash (if PDF uploaded)
   - PDF availability status

### Step 4: Student Downloads PDF
1. Still in **My Certificates** tab
2. Scroll to **Download Certificate PDF** section
3. Enter Certificate ID: `CERT-0001`
4. Click **Download PDF**
5. PDF file available for download

### Step 5: Student Grants Consent
1. Go to **Manage Consents** tab
2. In **Grant Consent** section:
   - HR Username: `HR023`
   - Certificate ID: `CERT-0001`
3. Click **Grant Consent**
4. Receive consent ID
5. Click **View All Consents** to verify

### Step 6: HR Views Certificate
1. **Logout** from student account
2. Login as **HR023** / **hr023**
3. Go to **View Certificate** tab
4. Enter Certificate ID: `CERT-0001`
5. Click **View Certificate Details**
6. If consent granted:
   - See full certificate details
   - View IPFS hash
   - Download PDF
7. If consent not granted:
   - See "Access Denied" message

## Key Features

### 1. Dynamic Student Management
- Issuers create student accounts
- Each student gets unique wallet
- Students login with custom credentials

### 2. PDF Certificate Upload
- Optional PDF upload during issuance
- IPFS hash generation (Qm...)
- Digital PDF signature by issuer
- Local storage at /tmp/certificates/

### 3. Smart Certificate Issuance
- **Existing Student**: Select from username
- **New Student**: Provide credentials
- **Auto-detect**: System searches by name

### 4. Consent-Based Access
- Students control who sees their data
- HR needs explicit consent per certificate
- Consent includes PDF access
- Can be revoked anytime

### 5. Blockchain Integration
- All certificates in blockchain
- Proof-of-work mining
- Immutable records
- IPFS hashes included

## Interface Overview

### Issuer Dashboard Tabs
1. **Add Student** - Register new students
2. **View Students** - See all registered students
3. **Issue Certificate** - Create certificates with PDF
4. **Wallet** - View issuer wallet stats
5. **Issued Certificates** - Browse all certificates
6. **Blockchain** - Explore blockchain

### Student Dashboard Tabs
1. **My Certificates** - View and download certificates
2. **Verify Certificate** - Check certificate validity
3. **Manage Consents** - Grant/revoke HR access
4. **Wallet** - View student wallet
5. **Blockchain** - Explore blockchain

### HR Dashboard Tabs
1. **Verify Certificate** - Validate certificates
2. **View Certificate** - Access with consent
3. **Accessible Certificates** - List all consented certificates
4. **Wallet** - View HR wallet
5. **Blockchain** - Explore blockchain

## Example Workflow

```
1. Issuer creates 3 students
2. Issuer issues certificates (2 with PDFs, 1 without)
3. Students login and view their certificates
4. Student Alice downloads her PDF
5. Student Alice grants consent to HR for CERT-0001
6. HR logs in and views CERT-0001 (with PDF)
7. HR tries to view CERT-0002 (access denied - no consent)
8. Student Bob grants consent for CERT-0002
9. HR can now access CERT-0002
10. Student Alice revokes consent
11. HR can no longer access CERT-0001
```

## Technical Details

### PDF Storage
- Location: `/tmp/certificates/`
- Format: `{CERT_ID}.pdf`
- Signed with RSA-PSS + SHA256

### IPFS Hash
- Simulated using SHA-256
- Format: `Qm[44-char base32]`
- Example: `QmBGGEM7ZNYW7HFLRKAU2DQ5QX2YW3KVU6C3IPJVUED3S2`

### Blockchain
- Difficulty: 2 (proof-of-work)
- Algorithm: SHA-256
- Includes certificate metadata + IPFS hash

### Wallets
- RSA 2048-bit key pairs
- Unique address per user
- Auto-generated on user creation

## Files

### Core System
- `certificate_system.py` - Main application (900+ lines)
- `requirements.txt` - Dependencies

### Documentation
- `ENHANCED_FEATURES.md` - Complete feature documentation
- `QUICKSTART_ENHANCED.md` - This file
- `GETTING_STARTED.md` - Original getting started guide

### Demos
- `demo_enhanced.py` - Enhanced feature demo
- `demo.py` - Original demo

## Troubleshooting

### Issue: Student can't login
**Solution**: Verify username/password created by issuer

### Issue: PDF not showing
**Solution**: Check if PDF was uploaded during certificate issuance

### Issue: HR can't access certificate
**Solution**: Student must grant consent first

### Issue: IPFS hash not appearing
**Solution**: PDF must be uploaded for IPFS hash generation

## Next Steps

1. Run enhanced demo to see all features
2. Launch Gradio application
3. Create your own students
4. Issue certificates with PDFs
5. Test consent management
6. Explore blockchain

## Support

For complete documentation, see:
- `ENHANCED_FEATURES.md` - Detailed feature guide
- `SYSTEM_OVERVIEW.md` - System architecture
- `GRADIO_USAGE.md` - UI usage guide

## Summary

The enhanced system provides:
- Dynamic student account management
- PDF certificate uploads with IPFS
- Digital signatures for PDFs
- Consent-based access control
- Complete blockchain integration
- Role-based dashboards
- Minimal, professional UI

Ready to use for certificate management with advanced features!
