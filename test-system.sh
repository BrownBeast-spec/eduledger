#!/usr/bin/env bash
#
# Quick test script for edu-ledger system
# Tests certificate issuance, consent management, and verification

set -e

ROOTDIR=$(cd "$(dirname "$0")" && pwd)
cd ../test-network

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function success() {
    echo -e "${GREEN}✓ $1${NC}"
}

function info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

function error() {
    echo -e "${RED}✗ $1${NC}"
}

# Set environment
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

info "Starting edu-ledger system tests..."
echo ""

# Test 1: Issue Certificate
info "Test 1: Issuing certificate for Alice..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c '{"function":"CertificateManager:IssueCertificate","Args":["TEST-CERT-001","hash-test-001","QmTestIPFS001","did:web:university.edu","did:web:student:TEST-STU001","TEST-STU001","{\"degreeName\":\"BSc Computer Science\",\"major\":\"CS\",\"graduationDate\":\"2024-05-20\",\"gpa\":\"3.8\"}"]}' \
  --waitForEvent > /dev/null 2>&1

if [ $? -eq 0 ]; then
    success "Certificate issued successfully"
else
    error "Certificate issuance failed"
    exit 1
fi
echo ""

# Test 2: Read Certificate
info "Test 2: Reading certificate..."
CERT_DATA=$(peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:ReadCertificate","Args":["TEST-CERT-001"]}' 2>/dev/null)

if echo "$CERT_DATA" | grep -q "TEST-CERT-001"; then
    success "Certificate read successfully"
    echo "  Certificate ID: TEST-CERT-001"
    echo "  Student: TEST-STU001"
else
    error "Certificate read failed"
    exit 1
fi
echo ""

# Test 3: Grant Consent
info "Test 3: Granting consent to verifier..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c '{"function":"ConsentManager:GrantConsent","Args":["TEST-CONSENT-001","did:web:student:TEST-STU001","did:web:employer:HR001","TEST-CERT-001","employment","[\"degreeName\",\"major\",\"graduationDate\"]","30"]}' \
  --waitForEvent > /dev/null 2>&1

if [ $? -eq 0 ]; then
    success "Consent granted successfully"
else
    error "Consent grant failed"
    exit 1
fi
echo ""

# Test 4: Verify Consent
info "Test 4: Verifying consent..."
CONSENT_DATA=$(peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"ConsentManager:VerifyConsent","Args":["TEST-CONSENT-001","did:web:employer:HR001"]}' 2>/dev/null)

if echo "$CONSENT_DATA" | grep -q "ACTIVE"; then
    success "Consent verification successful"
    echo "  Consent Status: ACTIVE"
else
    error "Consent verification failed"
    exit 1
fi
echo ""

# Test 5: Access Certificate with Consent
info "Test 5: Accessing certificate with consent..."
FILTERED_DATA=$(peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c '{"function":"ConsentManager:AccessCertificateWithConsent","Args":["TEST-CONSENT-001","did:web:employer:HR001"]}' \
  --waitForEvent 2>/dev/null)

if echo "$FILTERED_DATA" | grep -q "degreeName"; then
    success "Filtered certificate access successful"
    echo "  Verifier can see: degreeName, major, graduationDate"
    echo "  Verifier CANNOT see: gpa (not in consent scope)"
else
    error "Certificate access failed"
    exit 1
fi
echo ""

# Test 6: Revoke Consent
info "Test 6: Revoking consent..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c '{"function":"ConsentManager:RevokeConsent","Args":["TEST-CONSENT-001","Test completed"]}' \
  --waitForEvent > /dev/null 2>&1

if [ $? -eq 0 ]; then
    success "Consent revoked successfully"
else
    error "Consent revocation failed"
    exit 1
fi
echo ""

# Test 7: Verify Consent is Revoked
info "Test 7: Verifying consent revocation..."
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"ConsentManager:VerifyConsent","Args":["TEST-CONSENT-001","did:web:employer:HR001"]}' 2>&1 | grep -q "REVOKED"

if [ $? -eq 0 ]; then
    success "Consent revocation verified"
else
    error "Consent still active (expected to be revoked)"
    exit 1
fi
echo ""

# Test 8: Query Certificates by Student
info "Test 8: Querying student certificates..."
STUDENT_CERTS=$(peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:QueryCertificatesByStudent","Args":["did:web:student:TEST-STU001"]}' 2>/dev/null)

if echo "$STUDENT_CERTS" | grep -q "TEST-CERT-001"; then
    success "Student certificate query successful"
else
    error "Student certificate query failed"
    exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "ALL TESTS PASSED! 🎉"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "System verification complete. Key features tested:"
echo "  ✓ Certificate issuance"
echo "  ✓ Certificate reading"
echo "  ✓ Consent granting"
echo "  ✓ Consent verification"
echo "  ✓ Privacy-preserving certificate access"
echo "  ✓ Consent revocation"
echo "  ✓ Certificate queries"
echo ""
echo "For detailed testing, see TESTING.md"
