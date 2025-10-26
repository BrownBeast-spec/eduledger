# Edu-Ledger Testing Guide

Complete step-by-step guide to test all features of the University Certificate Management System.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Network Initialization](#network-initialization)
3. [Creating Students](#creating-students)
4. [Issuing Certificates](#issuing-certificates)
5. [Granting Consent](#granting-consent)
6. [Verifying Certificates](#verifying-certificates)
7. [Revoking Consent](#revoking-consent)
8. [Revoking Certificates](#revoking-certificates)
9. [Querying Data](#querying-data)
10. [Complete Workflow Example](#complete-workflow-example)

---

## Environment Setup

### Prerequisites

Ensure you have:
- Hyperledger Fabric binaries installed
- Docker and Docker Compose running
- Go 1.21+ installed
- Node.js 18+ and npm installed

### Set Environment Variables

```bash
# Navigate to fabric-samples directory
cd /path/to/fabric-samples

# Set up environment
export PATH=${PWD}/bin:$PATH
export FABRIC_CFG_PATH=${PWD}/config
```

---

## Network Initialization

### Step 1: Start the Network

```bash
cd edu-ledger

# Start Fabric network with Certificate Authorities
./network.sh up

# Expected output:
# ✅ Starting edu-ledger network
# ✅ Edu-ledger network started successfully
# ℹ  Channel 'certchannel' created
```

### Step 2: Deploy Chaincode

```bash
# Deploy the edu-ledger smart contracts
./network.sh deployCC

# Expected output:
# ✅ Packaging chaincode...
# ✅ Installing chaincode on Org1...
# ✅ Installing chaincode on Org2...
# ✅ Approving chaincode for Org1...
# ✅ Approving chaincode for Org2...
# ✅ Committing chaincode...
# ✅ Chaincode deployed successfully!
```

### Step 3: Set Peer Environment (Org1 - University)

```bash
cd ../test-network

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

---

## Creating Students

Students don't need explicit creation in the blockchain. Their identity is managed through:
- **Student ID**: University-assigned identifier (e.g., STU001)
- **Student DID**: Decentralized Identifier (e.g., did:web:student.university.edu:students:STU001)

### Example Student Records

| Student ID | Student Name | Student DID | Email |
|------------|--------------|-------------|-------|
| STU001 | Alice Johnson | did:web:student.university.edu:students:STU001 | alice@university.edu |
| STU002 | Bob Smith | did:web:student.university.edu:students:STU002 | bob@university.edu |
| STU003 | Carol Williams | did:web:student.university.edu:students:STU003 | carol@university.edu |

---

## Issuing Certificates

### Scenario 1: Issue Bachelor's Degree Certificate

**Student**: Alice Johnson (STU001)  
**Degree**: Bachelor of Science in Computer Science  
**GPA**: 3.8  
**Graduation Date**: 2024-05-20

```bash
# Certificate metadata
CERT_ID="CERT-001"
CERT_HASH="abc123def456789"  # In production, this would be SHA-512 hash of PDF
IPFS_HASH="QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
ISSUER_DID="did:web:university.edu"
STUDENT_DID="did:web:student.university.edu:students:STU001"
STUDENT_ID="STU001"
METADATA='{"degreeName":"Bachelor of Science","major":"Computer Science","minor":"Mathematics","graduationDate":"2024-05-20","gpa":"3.8","honors":"Cum Laude"}'

# Invoke chaincode to issue certificate
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c "{\"function\":\"CertificateManager:IssueCertificate\",\"Args\":[\"${CERT_ID}\",\"${CERT_HASH}\",\"${IPFS_HASH}\",\"${ISSUER_DID}\",\"${STUDENT_DID}\",\"${STUDENT_ID}\",\"${METADATA}\"]}"

# Expected output:
# ✅ Chaincode invoke successful. result: status:200
```

### Scenario 2: Issue Master's Degree Certificate

**Student**: Bob Smith (STU002)  
**Degree**: Master of Science in Data Science  
**GPA**: 3.9

```bash
CERT_ID="CERT-002"
CERT_HASH="def456ghi789abc"
IPFS_HASH="QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn"
ISSUER_DID="did:web:university.edu"
STUDENT_DID="did:web:student.university.edu:students:STU002"
STUDENT_ID="STU002"
METADATA='{"degreeName":"Master of Science","major":"Data Science","graduationDate":"2024-05-20","gpa":"3.9","thesis":"Deep Learning for Healthcare"}'

peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c "{\"function\":\"CertificateManager:IssueCertificate\",\"Args\":[\"${CERT_ID}\",\"${CERT_HASH}\",\"${IPFS_HASH}\",\"${ISSUER_DID}\",\"${STUDENT_DID}\",\"${STUDENT_ID}\",\"${METADATA}\"]}"
```

### Verify Certificate Was Created

```bash
# Read the certificate
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:ReadCertificate","Args":["CERT-001"]}'

# Expected output: JSON with certificate details
```

---

## Granting Consent

Students grant consent to verifiers (employers) to access their certificates.

### Scenario 1: Alice Grants Consent to Tech Corp for Employment Verification

**Holder**: Alice (STU001)  
**Verifier**: Tech Corp (did:web:techcorp.com:verifier:HR001)  
**Purpose**: Employment verification  
**Data Scope**: Degree name, major, graduation date (NOT GPA or honors)  
**Duration**: 30 days

```bash
CONSENT_ID="consent-001"
HOLDER_DID="did:web:student.university.edu:students:STU001"
VERIFIER_DID="did:web:techcorp.com:verifier:HR001"
CERT_ID="CERT-001"
PURPOSE="employment"
DATA_SCOPE='["degreeName","major","graduationDate"]'
DURATION=30

peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c "{\"function\":\"ConsentManager:GrantConsent\",\"Args\":[\"${CONSENT_ID}\",\"${HOLDER_DID}\",\"${VERIFIER_DID}\",\"${CERT_ID}\",\"${PURPOSE}\",\"${DATA_SCOPE}\",\"${DURATION}\"]}"

# Expected output:
# ✅ Chaincode invoke successful
# ℹ  Consent granted: consent-001 by did:web:student.university.edu:students:STU001
```

### Scenario 2: Bob Grants Full Access to University Transfer Office

**Purpose**: University transfer  
**Data Scope**: All fields including GPA and thesis

```bash
CONSENT_ID="consent-002"
HOLDER_DID="did:web:student.university.edu:students:STU002"
VERIFIER_DID="did:web:gradschool.edu:verifier:admissions"
CERT_ID="CERT-002"
PURPOSE="university_transfer"
DATA_SCOPE='["degreeName","major","graduationDate","gpa","thesis"]'
DURATION=60

peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c "{\"function\":\"ConsentManager:GrantConsent\",\"Args\":[\"${CONSENT_ID}\",\"${HOLDER_DID}\",\"${VERIFIER_DID}\",\"${CERT_ID}\",\"${PURPOSE}\",\"${DATA_SCOPE}\",\"${DURATION}\"]}"
```

---

## Verifying Certificates

### Step 1: Verifier Checks Consent

```bash
# Tech Corp verifier checks if they have valid consent
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c "{\"function\":\"ConsentManager:VerifyConsent\",\"Args\":[\"consent-001\",\"did:web:techcorp.com:verifier:HR001\"]}"

# Expected output: Consent details with status "ACTIVE"
```

### Step 2: Verifier Accesses Filtered Certificate Data

```bash
# Tech Corp accesses certificate with consent
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c "{\"function\":\"ConsentManager:AccessCertificateWithConsent\",\"Args\":[\"consent-001\",\"did:web:techcorp.com:verifier:HR001\"]}"

# Expected output: Filtered certificate data
# {
#   "certificateID": "CERT-001",
#   "revocationStatus": "VALID",
#   "issuerDID": "did:web:university.edu",
#   "degreeName": "Bachelor of Science",
#   "major": "Computer Science",
#   "graduationDate": "2024-05-20"
#   // NOTE: GPA and honors are NOT included (not in consent scope)
# }
```

### Step 3: Verify Certificate Authenticity

```bash
# Verify certificate hash
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:VerifyCertificate","Args":["CERT-001","abc123def456789"]}'

# Expected output: true (certificate is valid)
```

---

## Revoking Consent

Students can revoke consent at any time.

### Scenario: Alice Revokes Tech Corp's Access

```bash
CONSENT_ID="consent-001"
REASON="Job offer accepted at different company"

peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c "{\"function\":\"ConsentManager:RevokeConsent\",\"Args\":[\"${CONSENT_ID}\",\"${REASON}\"]}"

# Expected output:
# ✅ Consent revoked: consent-001
```

### Verify Revocation

```bash
# Try to verify consent again
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c "{\"function\":\"ConsentManager:VerifyConsent\",\"Args\":[\"consent-001\",\"did:web:techcorp.com:verifier:HR001\"]}"

# Expected output: Error - consent status is REVOKED
```

---

## Revoking Certificates

Universities can revoke certificates (e.g., discovered fraud).

### Scenario: Revoke Certificate Due to Academic Dishonesty

```bash
CERT_ID="CERT-001"
REASON="Academic dishonesty discovered"

peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c "{\"function\":\"CertificateManager:RevokeCertificate\",\"Args\":[\"${CERT_ID}\",\"${REASON}\"]}"

# Expected output:
# ✅ Certificate revoked: CERT-001
```

### Verify Revocation

```bash
# Read certificate to check revocation status
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:ReadCertificate","Args":["CERT-001"]}'

# Expected output: revocationStatus = "REVOKED"
```

---

## Querying Data

### Query All Certificates for a Student

```bash
STUDENT_DID="did:web:student.university.edu:students:STU001"

peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c "{\"function\":\"CertificateManager:QueryCertificatesByStudent\",\"Args\":[\"${STUDENT_DID}\"]}"

# Expected output: Array of all certificates for STU001
```

### Query All Consents Granted by a Student

```bash
HOLDER_DID="did:web:student.university.edu:students:STU001"

peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c "{\"function\":\"ConsentManager:QueryConsentsByStudent\",\"Args\":[\"${HOLDER_DID}\"]}"

# Expected output: Array of all consents granted by STU001
```

### Query Certificate History (Audit Trail)

```bash
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:GetCertificateHistory","Args":["CERT-001"]}'

# Expected output: Complete transaction history showing:
# - Certificate issuance
# - Any modifications
# - Revocation (if applicable)
```

---

## Complete Workflow Example

### End-to-End Scenario: Student Graduation to Employment

#### Step 1: University Issues Certificate

```bash
# Alice graduates with BSc Computer Science
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"CertificateManager:IssueCertificate","Args":["CERT-ALICE-2024","hash-alice-2024","QmAlice2024","did:web:university.edu","did:web:student:STU-ALICE","STU-ALICE","{\"degreeName\":\"BSc Computer Science\",\"major\":\"CS\",\"graduationDate\":\"2024-05-20\",\"gpa\":\"3.9\"}"]}'
```

#### Step 2: Alice Applies for Job at Tech Corp

Alice grants limited consent to Tech Corp for employment verification (excludes GPA).

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"ConsentManager:GrantConsent","Args":["consent-alice-techcorp","did:web:student:STU-ALICE","did:web:techcorp.com:hr","CERT-ALICE-2024","employment","[\"degreeName\",\"major\",\"graduationDate\"]","30"]}'
```

#### Step 3: Tech Corp Verifies Certificate

```bash
# Tech Corp accesses filtered certificate data
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"ConsentManager:AccessCertificateWithConsent","Args":["consent-alice-techcorp","did:web:techcorp.com:hr"]}'

# Tech Corp sees: degreeName, major, graduationDate
# Tech Corp does NOT see: GPA
```

#### Step 4: Alice Gets Hired and Revokes Consent

After being hired, Alice revokes Tech Corp's access.

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"ConsentManager:RevokeConsent","Args":["consent-alice-techcorp","Employment process completed"]}'
```

#### Step 5: Alice Applies to Grad School

Alice grants full access to grad school (includes GPA this time).

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"ConsentManager:GrantConsent","Args":["consent-alice-gradschool","did:web:student:STU-ALICE","did:web:gradschool.edu:admissions","CERT-ALICE-2024","graduate_admission","[\"degreeName\",\"major\",\"graduationDate\",\"gpa\"]","60"]}'
```

---

## Testing Summary

### Key Test Scenarios Covered

✅ **Certificate Issuance**
- Bachelor's degree
- Master's degree
- Multiple certificates per student

✅ **Consent Management**
- Granting consent with limited data scope
- Granting consent with full data scope
- Time-limited consents
- Revocation by student

✅ **Privacy-Preserving Verification**
- Verifiers only see consented fields
- Access tracking (access count)
- Consent expiration

✅ **Certificate Revocation**
- University revokes certificate
- Revocation propagates immediately
- Historical audit trail preserved

✅ **Queries**
- Query by student
- Query by verifier
- Certificate history
- Consent history

---

## Troubleshooting

### Issue: "Chaincode invoke failed"

**Solution**: Ensure network is running and chaincode is deployed.
```bash
./network.sh down
./network.sh up
./network.sh deployCC
```

### Issue: "Certificate already exists"

**Solution**: Use a unique certificate ID for each certificate.

### Issue: "Consent verification failed"

**Solution**: Check:
- Consent ID is correct
- Verifier DID matches
- Consent is not expired or revoked

---

## Next Steps

1. **Build Application Layer**: Create TypeScript/Node.js applications for institution portal, student wallet, and verifier portal
2. **Add IPFS Integration**: Store actual certificate PDFs on IPFS
3. **Implement DID Registry**: Store DID documents on-chain
4. **Add Post-Quantum Crypto**: Integrate Kyber and Dilithium for quantum resistance
5. **Deploy to Production**: Set up multi-organization network with proper governance

---

**Congratulations!** You've completed the full testing workflow for the Edu-Ledger University Certificate Management System. 🎓
