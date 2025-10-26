# Getting Started with Blockchain Certificate Management System

## Quick Start

### 1. Install Dependencies
```bash
cd /home/beast/Documents/edu-ledger
pip install -r requirements.txt
```

### 2. Run the Demo (Optional)
Test the system from command line:
```bash
python demo.py
```

### 3. Launch the Application
```bash
./start.sh
```
Or directly:
```bash
python certificate_system.py
```

### 4. Access the Application
Open your browser and navigate to:
```
http://localhost:7860
```

## Test Credentials

```
Issuer:  issuer324 / isse324
Student: student02 / stud02
HR:      HR023 / hr023
```

## Complete Tutorial

### Tutorial 1: Issue Your First Certificate

1. Open http://localhost:7860
2. Login with: issuer324 / isse324
3. You'll see the Issuer Dashboard
4. Click on "Issue Certificate" tab
5. Fill in the form:
   ```
   Student Name: John Doe
   Course: Computer Science
   Grade: A+
   ```
6. Click "Issue Certificate"
7. You will see:
   ```
   Certificate Issued Successfully
   
   Certificate ID: CERT-0001
   Student: John Doe
   Course: Computer Science
   Grade: A+
   Blockchain Hash: 003f89ec354148e46f2d...
   Signature: NCDYBlcRKcbuDilshDXLe...
   ```
8. Note the Certificate ID for later use

### Tutorial 2: View Issuer Wallet

1. Still logged in as issuer324
2. Click on "Wallet" tab
3. Click "Refresh Wallet Info"
4. You will see:
   ```
   Issuer Wallet Information
   ==================================================
   Owner: Institute XYZ
   Address: d32cfa82e2d76d5464a9
   Total Certificates Issued: 1
   
   Certificates by Student:
     - John Doe: 1 certificate(s)
   ```

### Tutorial 3: View Blockchain

1. Click on "Blockchain" tab
2. Click "View Blockchain"
3. You will see complete blockchain with:
   - Total blocks
   - Difficulty level
   - Chain validation status
   - Each block's hash, previous hash, nonce
   - Certificate data in each block

### Tutorial 4: Student Views Certificates

1. Click "Logout"
2. Login with: student02 / stud02
3. You'll see the Student Dashboard
4. Click "My Certificates" tab
5. Click "View My Certificates"
6. You will see all certificates owned by John Doe:
   ```
   My Certificates
   ==================================================
   
   Certificate ID: CERT-0001
   Course: Computer Science
   Grade: A+
   Issue Date: 2025-10-26
   Issuer: issuer324
   Blockchain Hash: 003f89ec354148e46f2d...
   Signature: NCDYBlcRKcbuDilshDXLe...
   ```

### Tutorial 5: Verify Certificate

1. Still logged in as student02
2. Click "Verify Certificate" tab
3. Enter Certificate ID: CERT-0001
4. Click "Verify Certificate"
5. You will see:
   ```
   Certificate Verification
   ==================================================
   Certificate ID: CERT-0001
   Status: VALID
   Message: Certificate verified successfully
   
   Certificate Details:
   Student: John Doe
   Course: Computer Science
   Grade: A+
   Blockchain Hash: 003f89ec354148e46f2d...
   Signatures:
     Signer: issuer324
     Signature: NCDYBlcRKcbuDilshDXLe...
     Timestamp: 2025-10-26T23:33:45.083534
   ```

### Tutorial 6: Grant Consent to HR

1. Still logged in as student02
2. Click "Manage Consents" tab
3. Under "Grant Consent" section:
   ```
   HR Username: HR023
   Certificate ID: CERT-0001
   ```
4. Click "Grant Consent"
5. You will receive a consent ID:
   ```
   Consent Granted Successfully
   ==================================================
   Consent ID: 26083d50e0d47ff6
   HR: HR023
   Certificate: CERT-0001
   Granted At: 2025-10-26 23:33:45
   ```
6. Save this Consent ID

### Tutorial 7: View All Consents

1. Still in "Manage Consents" tab
2. Scroll down and click "View All Consents"
3. You will see:
   ```
   My Consents
   ==================================================
   
   Consent ID: 26083d50e0d47ff6
   HR: HR023
   Certificate: CERT-0001
   Status: ACTIVE
   Granted At: 2025-10-26T23:33:45.093587
   ```

### Tutorial 8: HR Verifies Certificate

1. Click "Logout"
2. Login with: HR023 / hr023
3. You'll see the HR Dashboard
4. Click "Verify Certificate" tab
5. Enter Certificate ID: CERT-0001
6. Click "Verify Certificate"
7. You will see blockchain verification:
   ```
   Certificate Verification
   ==================================================
   Certificate ID: CERT-0001
   Status: VALID
   Message: Certificate verified successfully
   ```

### Tutorial 9: HR Views Certificate Details (With Consent)

1. Still logged in as HR023
2. Click "View Certificate" tab
3. Enter Certificate ID: CERT-0001
4. Click "View Certificate Details"
5. You will see:
   ```
   Certificate Verification
   ==================================================
   Certificate ID: CERT-0001
   Consent Status: GRANTED
   
   Certificate Details:
   Student: John Doe
   Course: Computer Science
   Grade: A+
   Issue Date: 2025-10-26
   Issuer: issuer324
   Blockchain Hash: 003f89ec354148e46f2d...
   Signature: NCDYBlcRKcbuDilshDXLe...
   ```

### Tutorial 10: View Accessible Certificates

1. Still logged in as HR023
2. Click "Accessible Certificates" tab
3. Click "View Accessible Certificates"
4. You will see all certificates you have consent to access

### Tutorial 11: Revoke Consent

1. Click "Logout"
2. Login with: student02 / stud02
3. Click "Manage Consents" tab
4. Under "Revoke Consent" section:
   ```
   Consent ID: 26083d50e0d47ff6
   ```
5. Click "Revoke Consent"
6. You will see:
   ```
   Consent Revoked Successfully
   ==================================================
   Consent ID: 26083d50e0d47ff6
   Status: REVOKED
   ```

### Tutorial 12: Verify HR Access Denied

1. Click "Logout"
2. Login with: HR023 / hr023
3. Click "View Certificate" tab
4. Enter Certificate ID: CERT-0001
5. Click "View Certificate Details"
6. You will see:
   ```
   Certificate Verification
   ==================================================
   Certificate ID: CERT-0001
   Consent Status: NOT GRANTED
   
   Access Denied: Student consent required to view certificate details.
   ```

## Key Features Demonstrated

### For Issuer (issuer324)
- Issue certificates with blockchain recording
- View wallet statistics
- Track all issued certificates
- Monitor blockchain state

### For Student (student02)
- View owned certificates
- Verify certificate authenticity
- Grant consent to HR
- Revoke consent
- Track consent status
- View wallet information

### For HR (HR023)
- Verify certificates
- View certificates with consent
- Check accessible certificates
- Monitor blockchain

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Gradio Web Interface                     │
├─────────────┬─────────────────┬─────────────────────────────┤
│   Issuer    │     Student     │            HR               │
│  Dashboard  │    Dashboard    │        Dashboard            │
├─────────────┴─────────────────┴─────────────────────────────┤
│              Role-Based Access Control                       │
├──────────────────────────────────────────────────────────────┤
│           Certificate Management System                      │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   Blockchain   │  │  Wallet System │  │   Consent    │  │
│  │   (POW Mining) │  │  (RSA 2048)    │  │  Manager     │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Security Flow

```
1. Issuer signs certificate with private key
2. Certificate added to blockchain with proof-of-work
3. Student owns certificate
4. Student can grant/revoke consent
5. HR can only access with active consent
6. All actions recorded in blockchain
```

## File Structure

```
edu-ledger/
├── certificate_system.py    # Main application (754 lines)
├── requirements.txt          # Dependencies (gradio, cryptography)
├── demo.py                   # CLI demo script
├── start.sh                  # Quick start script
├── GETTING_STARTED.md       # This file
├── GRADIO_USAGE.md          # Usage documentation
└── SYSTEM_OVERVIEW.md       # Complete system documentation
```

## Troubleshooting

### Port Already in Use
If port 7860 is busy:
```bash
python certificate_system.py --server_port 7861
```

### Dependencies Not Installed
```bash
pip install --upgrade gradio cryptography
```

### Permission Denied on start.sh
```bash
chmod +x start.sh
./start.sh
```

## Next Steps

1. Issue multiple certificates for different students
2. Try verifying certificates
3. Experiment with consent management
4. Explore the blockchain explorer
5. Check wallet statistics for each role

## Support

For issues or questions, check:
- SYSTEM_OVERVIEW.md for complete documentation
- GRADIO_USAGE.md for detailed usage guide
- Run demo.py to test core functionality

## Demo Output Example

Run the demo to see the system in action:
```bash
python demo.py
```

This will demonstrate:
- Wallet initialization
- Certificate issuance
- Blockchain mining
- Certificate verification
- Consent management
- Access control

Enjoy using the Blockchain Certificate Management System!
