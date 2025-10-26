# Certificate Setup and Viewing Guide

## Overview
This guide walks you through issuing a certificate to student STU001 and viewing it through the TypeScript student wallet application.

## Prerequisites
- Hyperledger Fabric test network is running
- eduledger chaincode is deployed on channel `certchannel`
- Student user is enrolled in the wallet

## Issue Analysis - Your Original Command

Your original command had the correct format:
```bash
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C certchannel -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"CertificateManager:IssueCertificate","Args":["CERT-001","hash123","QmIPFS123","did:web:university.edu","did:web:student:STU001","STU001","{\"degreeName\":\"BSc Computer Science\",\"major\":\"CS\",\"graduationDate\":\"2024-05-20\",\"gpa\":\"3.8\"}"]}'
```

**Key Points:**
- The command structure is correct
- Uses `studentDID` format: `did:web:student:STU001`
- Uses `studentID`: `STU001`
- Metadata is properly JSON-escaped

**Potential Issues:**
1. Must be run from the `test-network` directory
2. Must use Org1MSP (UniversityMSP) identity
3. Ensure `CORE_PEER_MSPCONFIGPATH` points to Admin user

## Step 1: Issue Certificate

Run from the `test-network` directory:

```bash
./issue-certificate-stu001.sh
```

This script will:
1. Set up the correct environment variables
2. Generate a unique certificate ID
3. Issue the certificate to STU001
4. Verify the certificate was created

## Step 2: View Certificate via CLI

After issuing, you can query the certificate directly:

```bash
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:ReadCertificate","Args":["<CERT-ID>"]}'
```

Or query all certificates for student STU001:

```bash
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:QueryCertificatesByStudent","Args":["did:web:student:STU001"]}'
```

## Step 3: View Certificate via TypeScript Student Wallet

### Build and Run the Application

1. Navigate to the application directory:
```bash
cd edu-ledger/application-typescript
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Build the TypeScript application:
```bash
npm run build
```

4. Run the student wallet:
```bash
STUDENT_ID=STU001 STUDENT_NAME="Alice Johnson" node dist/student-wallet.js
```

### Using the Student Wallet

The application provides a menu:

```
=== Student Wallet ===
1. View My Certificates
2. View Certificate Details
3. Grant Consent
4. View My Consents
5. Revoke Consent
6. Exit
```

**Option 1: View My Certificates**
- Shows all certificates for student STU001
- Displays certificate details including:
  - Certificate ID
  - Issuer DID
  - Certificate Hash
  - IPFS Hash
  - Issuance Date
  - Status (VALID/REVOKED)
  - Metadata (degree, major, GPA, graduation date)

**Option 2: View Certificate Details**
- Enter a specific certificate ID to see full details

**Option 3: Grant Consent**
- Grant a verifier access to specific certificate fields
- Required inputs:
  - Consent ID (e.g., CONSENT-001)
  - Verifier DID (e.g., did:web:employer:HR001)
  - Certificate ID
  - Purpose (e.g., "employment verification")
  - Fields to share (comma-separated: degreeName, major, gpa, graduationDate)
  - Validity in days

## Certificate Structure

The certificate object contains:
- `certificateID`: Unique identifier
- `certificateHash`: Hash of the certificate content
- `ipfsCertificateHash`: IPFS storage hash
- `issuerDID`: Issuer's decentralized identifier
- `studentDID`: Student's decentralized identifier (format: did:web:student:STUDENT_ID)
- `studentID`: Traditional student identifier
- `issuanceDate`: When the certificate was issued
- `revocationStatus`: VALID or REVOKED
- `metadata`: JSON object with:
  - `degreeName`: Full degree name
  - `major`: Field of study
  - `graduationDate`: Graduation date
  - `gpa`: Grade point average

## Key Fixes Made

1. **Student Wallet Application** (`student-wallet.ts`):
   - Changed channel from `mychannel` to `certchannel`
   - Changed contract name from `edu-ledger` to `eduledger`
   - Fixed `QueryCertificatesByStudent` to use `studentDID` format
   - Updated certificate display to show actual certificate fields
   - Fixed consent functionality to use `studentDID`

2. **Certificate Issuance Script**:
   - Sets correct environment variables
   - Uses proper DID format for student
   - Generates unique certificate IDs
   - Includes verification step

## Troubleshooting

### Issue: "Certificate not found"
- Verify certificate was issued successfully
- Check the certificate ID is correct
- Ensure you're querying with the correct studentDID

### Issue: "Identity does not exist in wallet"
- Run enrollment script: `node dist/enrollUsers.js`
- Verify `studentUser` exists in wallet directory

### Issue: "Failed to connect to network"
- Verify Fabric network is running
- Check channel name is `certchannel`
- Verify chaincode `eduledger` is deployed

### Issue: "Unauthorized: only university can issue certificates"
- Must use UniversityMSP (Org1MSP) identity
- Check CORE_PEER_MSPCONFIGPATH points to Admin user

## Examples

### Issue Multiple Certificates
```bash
# Run the script multiple times
./issue-certificate-stu001.sh
```

### View All Certificates for a Student (CLI)
```bash
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:QueryCertificatesByStudent","Args":["did:web:student:STU001"]}'
```

### Grant Consent to Employer
In student wallet (option 3):
- Consent ID: CONSENT-EMP-001
- Verifier DID: did:web:employer:HR001
- Certificate ID: [Your Certificate ID]
- Purpose: employment verification
- Fields: degreeName, major, graduationDate
- Validity: 30 days
