# Blockchain Certificate Management System - Usage Guide

A comprehensive blockchain-based certificate management system with role-based access control, cryptographic signatures, and consent management built with Gradio.

## Features

### Blockchain Infrastructure
- Proof-of-Work consensus mechanism with configurable difficulty
- Immutable certificate records
- Full blockchain verification and exploration
- SHA-256 cryptographic hashing

### Wallet System
- RSA 2048-bit key pairs for all users
- Digital signature generation and verification
- Unique wallet addresses for each user

### Role-Based Access Control

#### Issuer (Institute)
- Issue digital certificates to students
- View wallet information and statistics
- Track all issued certificates
- View blockchain explorer
- Credentials: issuer324 / isse324

#### Student
- View owned certificates
- Verify certificate authenticity
- Grant/revoke consent to HR
- Track consent status
- View personal wallet
- Credentials: student02 / stud02

#### HR (Company)
- Verify certificate validity
- View certificates with student consent
- Check blockchain signatures
- View accessible certificates
- Credentials: HR023 / hr023

### Consent Management
- Students can grant HR access to specific certificates
- Consent can be revoked at any time
- Consent tracking with unique IDs
- Access control enforcement

## Installation

```bash
pip install -r requirements.txt
```

## Usage

Run the application:

```bash
python certificate_system.py
```

The application will launch at http://localhost:7860

## Test Credentials

- **Issuer:** issuer324 / isse324
- **Student:** student02 / stud02
- **HR:** HR023 / hr023

## Workflow Example

1. Login as Issuer (issuer324)
2. Issue a certificate to "John Doe"
3. View blockchain hash and signature
4. Logout and login as Student (student02)
5. View your certificates
6. Grant consent to HR (HR023) for specific certificate
7. Logout and login as HR (HR023)
8. View accessible certificates with consent
9. Verify certificate on blockchain

## Technical Details

- **Blockchain Difficulty:** 2 (configurable)
- **Hash Algorithm:** SHA-256
- **Signature Algorithm:** RSA-PSS with SHA-256
- **Key Size:** 2048 bits
- **Interface:** Gradio web UI

## Security Features

- Cryptographic signatures for all certificates
- Public/private key cryptography
- Blockchain immutability
- Consent-based access control
- Password authentication

## Key Components

### Blockchain
Each certificate is recorded in a block with:
- Block index
- Timestamp
- Certificate data
- Previous block hash
- Current block hash
- Nonce (proof of work)

### Wallets
Each user has a wallet containing:
- Public/Private key pair
- Wallet address
- Signing capabilities

### Certificates
Certificates include:
- Certificate ID
- Student name
- Course name
- Grade
- Issue date
- Issuer
- Blockchain hash
- Digital signature

### Consent System
- Students control access to their certificates
- HR must have explicit consent to view details
- Consent can be granted and revoked
- Each consent has unique ID and status tracking
