# Edu-Ledger Testing Guide

Comprehensive testing guide for the Edu-Ledger blockchain application.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Environment Setup](#environment-setup)
3. [Chaincode Testing](#chaincode-testing)
4. [Application Testing](#application-testing)
5. [Integration Testing](#integration-testing)
6. [End-to-End Scenarios](#end-to-end-scenarios)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)

## Testing Overview

### Test Types

- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test system under load
- **Security Tests**: Test access control and data protection

### Prerequisites

- Running Hyperledger Fabric network
- Deployed edu-ledger chaincode
- Node.js and npm installed
- Go testing tools (for chaincode tests)

## Environment Setup

### 1. Start Test Network

```bash
cd edu-ledger
./network.sh up
```

### 2. Install Dependencies

```bash
cd application-typescript
npm install
npm install --save-dev mocha chai @types/mocha @types/chai
```

### 3. Set Environment Variables

```bash
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
```

## Chaincode Testing

### Certificate Manager Tests

#### Test 1: Issue Certificate

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${PWD}/../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C mychannel \
  -n edu-ledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/../organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${PWD}/../organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
  -c '{"function":"CertificateManager:IssueCertificate","Args":["CERT_TEST_001","STU_TEST_001","Test Student","INST_TEST_001","Test University","Bachelor of Science","Computer Science","3.7","2024-05-15T00:00:00Z","testhash123","{}"]}'
```

**Expected**: Success message with transaction ID

#### Test 2: Read Certificate

```bash
peer chaincode query \
  -C mychannel \
  -n edu-ledger \
  -c '{"function":"CertificateManager:ReadCertificate","Args":["CERT_TEST_001"]}'
```

**Expected**: JSON object with certificate details

#### Test 3: Query Certificates by Student

```bash
peer chaincode query \
  -C mychannel \
  -n edu-ledger \
  -c '{"function":"CertificateManager:QueryCertificatesByStudent","Args":["STU_TEST_001"]}'
```

**Expected**: Array of certificates for the student

#### Test 4: Revoke Certificate

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${PWD}/../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C mychannel \
  -n edu-ledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/../organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  -c '{"function":"CertificateManager:RevokeCertificate","Args":["CERT_TEST_001"]}'
```

**Expected**: Certificate status should be "Revoked"

#### Test 5: Get Certificate History

```bash
peer chaincode query \
  -C mychannel \
  -n edu-ledger \
  -c '{"function":"CertificateManager:GetCertificateHistory","Args":["CERT_TEST_001"]}'
```

**Expected**: Array showing certificate modification history

### Consent Manager Tests

#### Test 6: Grant Consent

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${PWD}/../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C mychannel \
  -n edu-ledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/../organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  -c '{"function":"ConsentManager:GrantConsent","Args":["CONS_TEST_001","STU_TEST_001","VER_TEST_001","Test Verifier","CERT_TEST_001","2024-12-31T23:59:59Z","Employment Verification","[\"degree\",\"major\",\"gpa\"]","consenthash123"]}'
```

**Expected**: Success message

#### Test 7: Read Consent

```bash
peer chaincode query \
  -C mychannel \
  -n edu-ledger \
  -c '{"function":"ConsentManager:ReadConsent","Args":["CONS_TEST_001"]}'
```

**Expected**: JSON object with consent details

#### Test 8: Verify Consent

```bash
peer chaincode query \
  -C mychannel \
  -n edu-ledger \
  -c '{"function":"ConsentManager:VerifyConsent","Args":["CONS_TEST_001","VER_TEST_001"]}'
```

**Expected**: "true" if consent is valid

#### Test 9: Revoke Consent

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${PWD}/../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C mychannel \
  -n edu-ledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/../organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  -c '{"function":"ConsentManager:RevokeConsent","Args":["CONS_TEST_001"]}'
```

**Expected**: Consent status should be "Revoked"

#### Test 10: Query Active Consents

```bash
peer chaincode query \
  -C mychannel \
  -n edu-ledger \
  -c '{"function":"ConsentManager:QueryActiveConsents","Args":[]}'
```

**Expected**: Array of active consents

## Application Testing

### Manual Testing with Applications

#### Test Institution Portal

1. Start the application:
```bash
cd application-typescript
npm run start:institution
```

2. Test scenarios:
   - Issue a new certificate
   - View certificate details
   - List all certificates
   - Revoke a certificate

#### Test Student Wallet

1. Start the application:
```bash
npm run start:student
```

2. Test scenarios:
   - View all student certificates
   - View specific certificate details
   - Grant consent to a verifier
   - View all consents
   - Revoke a consent

#### Test Verifier Portal

1. Start the application:
```bash
npm run start:verifier
```

2. Test scenarios:
   - Verify certificate with consent
   - View granted consents
   - Check certificate history
   - Quick verification (public data)

## Integration Testing

### Test Scenario 1: Complete Certificate Lifecycle

```bash
# 1. Institution issues certificate
peer chaincode invoke ... IssueCertificate ...

# 2. Student queries their certificate
peer chaincode query ... QueryCertificatesByStudent ...

# 3. Student grants consent
peer chaincode invoke ... GrantConsent ...

# 4. Verifier verifies consent
peer chaincode query ... VerifyConsent ...

# 5. Verifier reads certificate with consent
peer chaincode query ... ReadCertificate ...

# 6. Student revokes consent
peer chaincode invoke ... RevokeConsent ...

# 7. Verifier tries to verify (should fail)
peer chaincode query ... VerifyConsent ...
```

### Test Scenario 2: Multi-Student Workflow

```bash
# Issue certificates for multiple students
for i in {1..5}; do
  peer chaincode invoke ... IssueCertificate "CERT$i" "STU$i" ...
done

# Query all certificates
peer chaincode query ... GetAllCertificates ...

# Query by institution
peer chaincode query ... QueryCertificatesByInstitution "INST001" ...
```

## End-to-End Scenarios

### Scenario 1: Job Application

**Actors**: Student (Alice), Institution (MIT), Verifier (Tech Corp)

1. **Institution**: Issue degree certificate
   ```bash
   Certificate ID: CERT_ALICE_CS_2024
   Student: Alice Johnson
   Degree: BS Computer Science
   GPA: 3.8
   ```

2. **Student**: Grant consent to employer
   ```bash
   Consent ID: CONS_ALICE_TECHCORP
   Verifier: Tech Corp
   Purpose: Job Application
   Data: degree, major, gpa, graduationDate
   Validity: 90 days
   ```

3. **Verifier**: Verify credentials
   ```bash
   Verify certificate with consent
   Access granted data
   Confirm authenticity
   ```

### Scenario 2: Further Education Application

**Actors**: Student (Bob), Institution A (Undergrad), Institution B (Grad School)

1. **Institution A**: Issue bachelor's certificate
2. **Student**: Apply to graduate school, grant consent
3. **Institution B**: Verify undergraduate credentials
4. **Institution B**: Issue admission decision

### Scenario 3: Credential Revocation

**Actors**: Institution, Student, Verifier

1. **Institution**: Issue certificate
2. **Student**: Grant consent
3. **Verifier**: Successfully verify
4. **Institution**: Revoke certificate (policy violation)
5. **Verifier**: Verification shows "Revoked" status

## Performance Testing

### Test 1: Throughput - Certificate Issuance

```bash
# Issue 100 certificates and measure time
START_TIME=$(date +%s)
for i in {1..100}; do
  peer chaincode invoke ... IssueCertificate "CERT_PERF_$i" ...
done
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "Issued 100 certificates in $DURATION seconds"
echo "Throughput: $((100 / DURATION)) TPS"
```

### Test 2: Query Performance

```bash
# Query all certificates and measure time
time peer chaincode query ... GetAllCertificates ...

# Query with filter
time peer chaincode query ... QueryCertificatesByStudent "STU001" ...
```

### Test 3: Concurrent Operations

```bash
# Run multiple operations in parallel
for i in {1..10}; do
  (peer chaincode invoke ... IssueCertificate "CERT_CONC_$i" ...) &
done
wait
```

### Performance Benchmarks (Expected)

| Operation | Target | Acceptable |
|-----------|--------|------------|
| Issue Certificate | < 2s | < 5s |
| Read Certificate | < 0.5s | < 1s |
| Query (100 records) | < 2s | < 5s |
| Grant Consent | < 2s | < 5s |
| Verify Consent | < 0.5s | < 1s |

## Security Testing

### Test 1: Access Control

```bash
# Try to issue certificate without proper identity
# Should fail with authorization error

# Try to access certificate without consent
# Should fail or return limited data
```

### Test 2: Data Integrity

```bash
# Issue certificate
# Try to modify certificate directly (should fail)
# Verify certificate hash matches original
```

### Test 3: Consent Validation

```bash
# Grant consent with expiry
# Wait for expiry
# Try to verify - should fail with "expired" error

# Try to verify with wrong verifier ID - should fail
```

### Test 4: Privacy Protection

```bash
# Grant consent with limited data fields
# Verify that only consented fields are accessible
# Ensure other fields are not visible
```

## Automated Test Suite

### Create Test Script

```bash
#!/bin/bash
# test_suite.sh

echo "Starting Edu-Ledger Test Suite..."

# Test 1: Certificate Issuance
echo "Test 1: Issue Certificate"
peer chaincode invoke ... IssueCertificate ...
if [ $? -eq 0 ]; then
  echo "✓ PASSED"
else
  echo "✗ FAILED"
fi

# Test 2: Read Certificate
echo "Test 2: Read Certificate"
peer chaincode query ... ReadCertificate ...
if [ $? -eq 0 ]; then
  echo "✓ PASSED"
else
  echo "✗ FAILED"
fi

# Add more tests...

echo "Test Suite Complete"
```

### Run All Tests

```bash
chmod +x test_suite.sh
./test_suite.sh
```

## Test Data Cleanup

```bash
# After testing, clean up test data
./network.sh down
./network.sh up
```

## Continuous Integration

### Sample CI Pipeline (.github/workflows/test.yml)

```yaml
name: Edu-Ledger Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Start Fabric Network
      run: |
        cd edu-ledger
        ./network.sh up
    
    - name: Run Chaincode Tests
      run: |
        cd edu-ledger
        ./test_suite.sh
    
    - name: Run Application Tests
      run: |
        cd application-typescript
        npm install
        npm test
    
    - name: Cleanup
      run: |
        cd edu-ledger
        ./network.sh down
```

## Troubleshooting Tests

### Common Issues

1. **Network not running**
   ```bash
   ./network.sh down
   ./network.sh up
   ```

2. **Chaincode not deployed**
   ```bash
   ./network.sh deployCC
   ```

3. **Transaction timeout**
   - Check peer logs: `docker logs peer0.org1.example.com`
   - Verify network connectivity
   - Increase timeout in application

4. **Identity not enrolled**
   - Re-run enrollment scripts
   - Check wallet directory

## Test Reporting

### Generate Test Report

```bash
# Run tests with output logging
./test_suite.sh 2>&1 | tee test_results.log

# Count passes and failures
grep "✓ PASSED" test_results.log | wc -l
grep "✗ FAILED" test_results.log | wc -l
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after each run
3. **Assertions**: Verify expected outcomes explicitly
4. **Documentation**: Document test scenarios and expected results
5. **Coverage**: Aim for >80% code coverage
6. **Automation**: Automate tests in CI/CD pipeline

## Resources

- [Hyperledger Fabric Testing](https://hyperledger-fabric.readthedocs.io/en/latest/test_network.html)
- [Chaincode Testing Best Practices](https://hyperledger-fabric.readthedocs.io/en/latest/chaincode4ade.html)
- [Performance Tuning](https://hyperledger-fabric.readthedocs.io/en/latest/perf_tuning.html)

---

For questions or issues with testing, please open an issue on GitHub or consult the main README.md.
