# Edu-Ledger: Blockchain-Based Educational Certificate Management

A Hyperledger Fabric application for managing educational certificates with consent-based verification on blockchain.

## Overview

Edu-Ledger is a decentralized application (DApp) built on Hyperledger Fabric that provides:

- **Certificate Issuance**: Educational institutions can issue tamper-proof certificates on blockchain
- **Student Control**: Students have full ownership and control of their credentials
- **Consent Management**: Privacy-preserving verification through explicit consent
- **Verifiable Credentials**: Third parties can verify certificates with student permission

## Architecture

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

## Features

### Certificate Manager Chaincode

- Issue educational certificates
- Read certificate details
- Update certificate status
- Revoke certificates
- Query certificates by student or institution
- View certificate history (audit trail)

### Consent Manager Chaincode

- Grant consent for data sharing
- Read consent records
- Revoke consent
- Verify consent validity
- Query consents by student or verifier
- View consent history

### Applications

1. **Institution Portal** (`institution-portal.ts`)
   - Issue new certificates
   - View certificate details
   - Revoke certificates
   - List all certificates issued by institution

2. **Student Wallet** (`student-wallet.ts`)
   - View personal certificates
   - Grant consent to verifiers
   - View and manage consents
   - Revoke consent

3. **Verifier Portal** (`verifier-portal.ts`)
   - Verify certificates with consent
   - View granted consents
   - Check certificate history
   - Quick public verification

## Prerequisites

- Docker and Docker Compose
- Go 1.21 or higher
- Node.js 18.x or higher
- Hyperledger Fabric binaries (v2.5+)
- Hyperledger Fabric samples repository

## Installation

### 1. Clone Fabric Samples (if not already done)

```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5
cd fabric-samples/test-network
```

### 2. Set Up Edu-Ledger

The project should be placed in the `test-network` directory:

```bash
cd fabric-samples/test-network/edu-ledger
```

### 3. Start the Network

```bash
./network.sh up
```

This command will:
- Start the Hyperledger Fabric test network
- Create a channel (`mychannel`)
- Deploy the edu-ledger chaincode
- Initialize the ledger with sample data

## Usage

### Starting the Network

```bash
# Start network, deploy chaincode, and initialize
./network.sh up

# Or step by step:
cd ..
./network.sh up createChannel -ca -s couchdb
cd edu-ledger
./network.sh deployCC
./network.sh init
```

### Running Applications

#### Institution Portal

```bash
cd application-typescript
npm install

# Set institution credentials (optional)
export INSTITUTION_ID="INST001"
export INSTITUTION_NAME="MIT"

npm run start:institution
```

**Features:**
- Issue certificates to students
- View certificate details
- Revoke certificates
- List all certificates

#### Student Wallet

```bash
# Set student credentials (optional)
export STUDENT_ID="STU001"
export STUDENT_NAME="Alice Johnson"

npm run start:student
```

**Features:**
- View personal certificates
- Grant consent to verifiers
- Manage and revoke consents
- View certificate details

#### Verifier Portal

```bash
# Set verifier credentials (optional)
export VERIFIER_ID="VER001"
export VERIFIER_NAME="ABC Company"

npm run start:verifier
```

**Features:**
- Verify certificates with consent
- View granted consents
- Check certificate history
- Quick public verification

### Network Management

```bash
# Stop the network
./network.sh down

# Restart the network
./network.sh restart

# Upgrade chaincode (after making changes)
./network.sh upgradeCC

# Reinitialize ledger
./network.sh init
```

## Example Workflow

### 1. Institution Issues Certificate

```typescript
// Institution Portal
Certificate ID: CERT002
Student ID: STU002
Student Name: Bob Smith
Degree: Master of Science
Major: Data Science
GPA: 3.9
Graduation Date: 2024-05-15
Certificate Hash: abc123def456
```

### 2. Student Grants Consent

```typescript
// Student Wallet
Consent ID: CONS002
Verifier ID: VER001
Verifier Name: Tech Corp
Certificate ID: CERT002
Purpose: Job Application
Data Fields: degree, major, gpa
Validity: 90 days
```

### 3. Verifier Checks Certificate

```typescript
// Verifier Portal
Certificate ID: CERT002
Consent ID: CONS002

Result:
✓ Certificate is valid
✓ Consent verified
Degree: Master of Science
Major: Data Science
GPA: 3.9
Status: Active
```

## API Reference

### Certificate Manager Functions

- `InitLedger()` - Initialize ledger with sample data
- `IssueCertificate(id, studentId, studentName, institutionId, institutionName, degree, major, gpa, graduationDate, certificateHash, metadata)` - Issue new certificate
- `ReadCertificate(id)` - Get certificate details
- `UpdateCertificateStatus(id, status)` - Update certificate status
- `RevokeCertificate(id)` - Revoke a certificate
- `CertificateExists(id)` - Check if certificate exists
- `GetAllCertificates()` - Get all certificates
- `QueryCertificatesByStudent(studentId)` - Get student's certificates
- `QueryCertificatesByInstitution(institutionId)` - Get institution's certificates
- `GetCertificateHistory(id)` - Get certificate audit trail

### Consent Manager Functions

- `InitLedger()` - Initialize ledger with sample data
- `GrantConsent(id, studentId, verifierId, verifierName, certificateId, expiryDate, purpose, dataShared, consentHash)` - Grant consent
- `ReadConsent(id)` - Get consent details
- `RevokeConsent(id)` - Revoke consent
- `ConsentExists(id)` - Check if consent exists
- `GetAllConsents()` - Get all consents
- `QueryConsentsByStudent(studentId)` - Get student's consents
- `QueryConsentsByVerifier(verifierId)` - Get verifier's consents
- `QueryActiveConsents()` - Get all active consents
- `VerifyConsent(consentId, verifierId)` - Verify consent validity
- `GetConsentHistory(id)` - Get consent audit trail

## Data Models

### Certificate

```json
{
  "id": "CERT001",
  "studentId": "STU001",
  "studentName": "Alice Johnson",
  "institutionId": "INST001",
  "institutionName": "MIT",
  "degree": "Bachelor of Science",
  "major": "Computer Science",
  "gpa": 3.8,
  "issueDate": "2023-06-15T10:00:00Z",
  "graduationDate": "2023-05-20T00:00:00Z",
  "certificateHash": "hash123abc",
  "status": "Active",
  "metadata": "{}"
}
```

### Consent

```json
{
  "id": "CONS001",
  "studentId": "STU001",
  "verifierId": "VER001",
  "verifierName": "ABC Company",
  "certificateId": "CERT001",
  "grantedDate": "2024-01-10T12:00:00Z",
  "expiryDate": "2024-07-10T12:00:00Z",
  "status": "Active",
  "purpose": "Employment Verification",
  "dataShared": ["degree", "major", "gpa", "graduationDate"],
  "consentHash": "consenthash123"
}
```

## Security Features

- **Immutability**: All records are stored on blockchain and cannot be altered
- **Transparency**: Complete audit trail for all certificates and consents
- **Privacy**: Consent-based data sharing model
- **Authentication**: Identity management through Fabric CA
- **Encryption**: TLS encryption for all network communication
- **Access Control**: Role-based access through MSP

## Testing

See [TESTING.md](TESTING.md) for comprehensive testing guide including:
- Unit testing
- Integration testing
- End-to-end scenarios
- Performance testing
- Security testing

## Troubleshooting

### Network Issues

```bash
# Clean up and restart
./network.sh down
docker system prune -a
./network.sh up
```

### Chaincode Issues

```bash
# Check peer logs
docker logs peer0.org1.example.com

# Redeploy chaincode
./network.sh down
./network.sh up
```

### Application Issues

```bash
# Clear node modules and reinstall
cd application-typescript
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Apache License 2.0

## Support

For issues and questions:
- Open an issue on GitHub
- Check Hyperledger Fabric documentation
- Join the Hyperledger community

## Roadmap

- [ ] Multi-organization support
- [ ] Mobile applications
- [ ] Integration with existing student information systems
- [ ] NFT certificate representations
- [ ] Advanced analytics dashboard
- [ ] International standards compliance (W3C Verifiable Credentials)

## Acknowledgments

Built with:
- [Hyperledger Fabric](https://www.hyperledger.org/use/fabric)
- [Fabric Contract API (Go)](https://github.com/hyperledger/fabric-contract-api-go)
- [Fabric SDK Node](https://github.com/hyperledger/fabric-sdk-node)

---

**Note**: This is a demonstration project for educational purposes. For production deployment, additional security hardening, scalability considerations, and compliance requirements should be addressed.
