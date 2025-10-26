# Edu-Ledger: University Certificate Management System

A comprehensive blockchain-based digital certificate management system for universities, built on Hyperledger Fabric with consent-based sharing and privacy-preserving verification.

## 🎯 Overview

Edu-Ledger enables universities to:
- **Issue** tamper-proof digital certificates on the blockchain
- **Manage** certificate lifecycle (issuance, verification, revocation)
- **Enable** student-controlled consent for certificate sharing
- **Verify** certificates with privacy-preserving selective disclosure
- **Track** immutable audit trails of all certificate operations

## 🏗️ Architecture

### Components

1. **Certificate Manager**: Issues, stores, and manages academic certificates
2. **Consent Manager**: Handles consent-based access control for certificate sharing
3. **Student Wallet**: Allows students to manage their certificates and consents
4. **Verifier Portal**: Enables employers to verify certificates with student consent
5. **Institution Portal**: University interface for issuing and revoking certificates

### Actors

- **University (UniversityMSP)**: Issues and revokes certificates
- **Students (Org1MSP)**: Own certificates, grant/revoke consent
- **Verifiers/Employers (Org2MSP)**: Request and verify certificates with consent

## 📋 Prerequisites

- Docker and Docker Compose
- Go 1.21+
- Node.js 18+ and npm
- Hyperledger Fabric binaries (v2.5+)
- Hyperledger Fabric samples repository

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Navigate to edu-ledger directory
cd fabric-samples/edu-ledger

# Install Go dependencies
cd chaincode-go
go mod download
go mod vendor
cd ..
```

### 2. Start the Network

```bash
# Start the Fabric network and create the channel
./network.sh up

# This will:
# - Start orderer and peer containers
# - Create Certificate Authorities
# - Create 'certchannel' channel
```

### 3. Deploy Chaincode

```bash
# Deploy the edu-ledger smart contracts
./network.sh deployCC

# This will:
# - Package the chaincode
# - Install on all peers
# - Approve and commit the chaincode
```

### 4. Test the System

```bash
# Run the test application
cd application-typescript
npm install
npm test
```

## 📖 Detailed Usage

See [TESTING.md](./TESTING.md) for comprehensive testing guide including:
- Creating students and certificates
- Granting and revoking consents
- Verifying certificates
- Privacy-preserving data sharing

## 🔐 Key Features

### 1. Certificate Issuance
- Universities issue certificates with cryptographic signatures
- Certificates stored on blockchain with IPFS hash
- Immutable record of issuance

### 2. Consent Management
- Students control who can access their certificates
- Fine-grained data scope (e.g., only degree name, not GPA)
- Time-limited consents with expiration
- Revocable at any time

### 3. Privacy-Preserving Verification
- Verifiers only see data within consent scope
- No direct access to full certificate without consent
- Audit trail of all access attempts

### 4. Revocation Support
- Universities can revoke certificates (e.g., fraud)
- Immediate propagation across network
- Historical records preserved

## 📊 Data Models

### Certificate
```json
{
  "certificateID": "CERT-123-abc",
  "certificateHash": "sha512-hash",
  "ipfsCertificateHash": "Qm...",
  "issuerDID": "did:web:university.edu",
  "studentDID": "did:web:student.university.edu:students:STU123",
  "studentID": "STU123",
  "issuanceDate": "2024-06-15T10:00:00Z",
  "revocationStatus": "VALID",
  "metadata": {
    "degreeName": "Bachelor of Science",
    "major": "Computer Science",
    "graduationDate": "2024-05-20",
    "gpa": "3.8"
  }
}
```

### Consent Record
```json
{
  "consentID": "consent-456-def",
  "holderDID": "did:web:student.university.edu:students:STU123",
  "verifierDID": "did:web:employer.com:verifier",
  "certificateID": "CERT-123-abc",
  "purpose": "employment",
  "dataScope": ["degreeName", "major", "graduationDate"],
  "grantedAt": "2024-10-25T12:00:00Z",
  "expiresAt": "2024-11-25T12:00:00Z",
  "status": "ACTIVE"
}
```

## 🔧 Chaincode Functions

### CertificateManager

| Function | Description | Parameters |
|----------|-------------|------------|
| `IssueCertificate` | Issue a new certificate | certificateID, hash, IPFS hash, issuer DID, student DID, metadata |
| `ReadCertificate` | Retrieve certificate details | certificateID |
| `VerifyCertificate` | Verify certificate authenticity | certificateID, hash |
| `RevokeCertificate` | Revoke a certificate | certificateID, reason |
| `QueryCertificatesByStudent` | Get all student certificates | studentDID |

### ConsentManager

| Function | Description | Parameters |
|----------|-------------|------------|
| `GrantConsent` | Student grants access | consentID, holder DID, verifier DID, certificate ID, scope, duration |
| `VerifyConsent` | Check consent validity | consentID, verifier DID |
| `RevokeConsent` | Student revokes access | consentID, reason |
| `QueryConsentsByStudent` | Get student's consents | holder DID |
| `AccessCertificateWithConsent` | Get filtered certificate data | consentID, verifier DID |

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Start network and deploy chaincode
./network.sh up
./network.sh deployCC

# Test certificate issuance
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${PWD}/../test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C certchannel -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/../test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"CertificateManager:IssueCertificate","Args":["CERT-001","hash123","QmIPFS123","did:web:university.edu","did:web:student:STU001","STU001","{\"degreeName\":\"BSc Computer Science\",\"major\":\"CS\",\"graduationDate\":\"2024-05-20\",\"gpa\":\"3.8\"}"]}'
```

## 🛠️ Network Management

```bash
# Start network
./network.sh up

# Deploy chaincode
./network.sh deployCC

# Restart network
./network.sh restart

# Stop network
./network.sh down
```

## 📁 Directory Structure

```
edu-ledger/
├── chaincode-go/              # Go smart contracts
│   ├── chaincode/
│   │   ├── certificate_manager.go
│   │   └── consent_manager.go
│   ├── go.mod
│   └── main.go
├── application-typescript/     # TypeScript applications
│   ├── src/
│   │   ├── institution-portal.ts
│   │   ├── student-wallet.ts
│   │   └── verifier-portal.ts
│   └── package.json
├── network.sh                 # Network management script
├── README.md                  # This file
└── TESTING.md                 # Comprehensive testing guide
```

## 🔒 Security Features

- **TLS-enabled** communication between all components
- **MSP-based** identity management
- **Attribute-based** access control
- **Cryptographic** certificate hashing (SHA-512)
- **Consent-based** data sharing
- **Audit trails** for all operations

## 🚧 Future Enhancements

- [ ] Post-Quantum Cryptography (Kyber + Dilithium)
- [ ] IPFS integration for certificate PDFs
- [ ] DID registry on-chain
- [ ] Mobile wallet application
- [ ] Batch certificate issuance
- [ ] Advanced analytics dashboard
- [ ] Multi-university federation

## 📄 License

SPDX-License-Identifier: Apache-2.0

## 🤝 Contributing

Contributions welcome! Please see contribution guidelines.

## 📞 Support

For issues and questions, please open an issue in the repository.

## 🙏 Acknowledgments

Built with:
- Hyperledger Fabric
- fabric-contract-api-go
- Inspired by asset-transfer-private-data sample

---

**Note**: This is a educational/demonstration system. For production use, additional security hardening, key management, and compliance features should be implemented.
