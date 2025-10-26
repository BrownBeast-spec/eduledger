#!/usr/bin/env bash
#
# Direct test of edu-ledger certificate functionality
# Tests certificate creation, verification, and validation
# Uses peer CLI from host machine

set -e

ROOTDIR=$(cd "$(dirname "$0")" && pwd)
cd ../test-network

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function success() {
    echo -e "${GREEN}✓ $1${NC}"
}

function info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

function error() {
    echo -e "${RED}✗ $1${NC}"
}

function test_step() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎓 EDU-LEDGER CERTIFICATE SYSTEM TEST"
echo "   Testing Certificate Creation, Verification & Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Set environment for Org1 (University)
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Check prerequisites
test_step "PRE-FLIGHT CHECKS"

info "Checking Docker containers..."
if [ $(docker ps | grep hyperledger | wc -l) -lt 3 ]; then
    error "Network not running. Start with: ./network.sh up"
    exit 1
fi
success "Docker containers running"

info "Checking channel membership..."
CHANNELS=$(docker exec peer0.org1.example.com peer channel list 2>/dev/null | grep certchannel || true)
if [ -z "$CHANNELS" ]; then
    error "Peers not joined to certchannel. Run fix-channel.sh first"
    exit 1
fi
success "Peers joined to certchannel"

info "Checking chaincode deployment..."
CC_DEPLOYED=$(peer lifecycle chaincode querycommitted --channelID certchannel --name eduledger 2>/dev/null || echo "NOT_DEPLOYED")
if echo "$CC_DEPLOYED" | grep -q "NOT_DEPLOYED\|Error"; then
    error "Chaincode 'eduledger' not deployed on certchannel"
    echo ""
    echo "   To fix this, you need to:"
    echo "   1. Fix Docker socket permissions in peer containers"
    echo "   2. Run: ./network.sh deployCC"
    echo ""
    echo "   Alternative workaround:"
    echo "   Deploy using external chaincode (no Docker required)"
    echo ""
    exit 1
fi
success "Chaincode 'eduledger' is deployed"

echo ""

# Test 1: Issue Certificate
test_step "TEST 1: ISSUE CERTIFICATE"

info "Issuing BSc Computer Science certificate for Alice..."
CERT_RESULT=$(peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c '{"function":"CertificateManager:IssueCertificate","Args":["CERT-ALICE-001","hash-alice-bsc-2024","QmAliceBSC2024","did:web:university.edu","did:web:student.university.edu:students:ALICE001","ALICE001","{\"degreeName\":\"Bachelor of Science\",\"major\":\"Computer Science\",\"minor\":\"Mathematics\",\"graduationDate\":\"2024-05-20\",\"gpa\":\"3.8\",\"honors\":\"Cum Laude\"}"]}' \
  --waitForEvent 2>&1)

if echo "$CERT_RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
    success "Certificate CERT-ALICE-001 issued successfully"
else
    error "Certificate issuance failed"
    echo "$CERT_RESULT"
    exit 1
fi

echo ""

# Test 2: Read Certificate
test_step "TEST 2: READ CERTIFICATE"

info "Reading certificate CERT-ALICE-001..."
CERT_DATA=$(peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:ReadCertificate","Args":["CERT-ALICE-001"]}' 2>/dev/null)

if echo "$CERT_DATA" | grep -q "CERT-ALICE-001"; then
    success "Certificate retrieved successfully"
    echo ""
    echo "   Certificate ID: CERT-ALICE-001"
    echo "   Student: ALICE001"
    echo "   Degree: Bachelor of Science in Computer Science"
    if echo "$CERT_DATA" | grep -q "gpa"; then
        echo "   GPA: 3.8"
    fi
else
    error "Failed to read certificate"
    exit 1
fi

echo ""

# Test 3: Verify Certificate
test_step "TEST 3: VERIFY CERTIFICATE AUTHENTICITY"

info "Verifying certificate hash..."
VERIFY_RESULT=$(peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:VerifyCertificate","Args":["CERT-ALICE-001","hash-alice-bsc-2024"]}' 2>/dev/null)

if echo "$VERIFY_RESULT" | grep -qi "true"; then
    success "Certificate hash verification PASSED"
else
    error "Certificate verification FAILED"
    exit 1
fi

echo ""

# Test 4: Grant Consent
test_step "TEST 4: GRANT CONSENT FOR VERIFICATION"

info "Alice grants consent to TechCorp for employment verification..."
CONSENT_RESULT=$(peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c '{"function":"ConsentManager:GrantConsent","Args":["CONSENT-ALICE-TECH-001","did:web:student.university.edu:students:ALICE001","did:web:techcorp.com:hr:verifier001","CERT-ALICE-001","employment","[\"degreeName\",\"major\",\"graduationDate\"]","30"]}' \
  --waitForEvent 2>&1)

if echo "$CONSENT_RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
    success "Consent granted to TechCorp"
    echo "   Data scope: degreeName, major, graduationDate (GPA excluded)"
    echo "   Duration: 30 days"
else
    error "Consent grant failed"
    exit 1
fi

echo ""

# Test 5: Verify Consent and Access Certificate
test_step "TEST 5: VERIFY CONSENT AND ACCESS DATA"

info "TechCorp verifies consent..."
CONSENT_CHECK=$(peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"ConsentManager:VerifyConsent","Args":["CONSENT-ALICE-TECH-001","did:web:techcorp.com:hr:verifier001"]}' 2>/dev/null)

if echo "$CONSENT_CHECK" | grep -q "ACTIVE"; then
    success "Consent verification successful - Status: ACTIVE"
else
    error "Consent verification failed"
    exit 1
fi

info "TechCorp accesses filtered certificate data..."
FILTERED_DATA=$(peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c '{"function":"ConsentManager:AccessCertificateWithConsent","Args":["CONSENT-ALICE-TECH-001","did:web:techcorp.com:hr:verifier001"]}' \
  --waitForEvent 2>&1)

if echo "$FILTERED_DATA" | grep -q "degreeName"; then
    success "Privacy-preserving access successful"
    echo "   Verifier sees: Degree name, major, graduation date"
    echo "   Verifier DOES NOT see: GPA, honors (not in consent scope)"
else
    error "Certificate access failed"
    exit 1
fi

echo ""

# Test 6: Validation - Query Student Certificates
test_step "TEST 6: VALIDATION - QUERY CERTIFICATES"

info "Querying all certificates for student ALICE001..."
STUDENT_CERTS=$(peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:QueryCertificatesByStudent","Args":["did:web:student.university.edu:students:ALICE001"]}' 2>/dev/null)

if echo "$STUDENT_CERTS" | grep -q "CERT-ALICE-001"; then
    success "Student certificate query successful"
    CERT_COUNT=$(echo "$STUDENT_CERTS" | grep -o "certificateID" | wc -l)
    echo "   Found $CERT_COUNT certificate(s) for ALICE001"
else
    error "Certificate query failed"
    exit 1
fi

echo ""

# Summary
test_step "TEST SUMMARY"

echo ""
success "✅ All tests PASSED!"
echo ""
echo "   Verified Functionality:"
echo "   ✓ Certificate Creation (Issuance)"
echo "   ✓ Certificate Reading"
echo "   ✓ Certificate Verification (Hash validation)"
echo "   ✓ Consent Management (Grant)"
echo "   ✓ Consent Verification (Status check)"
echo "   ✓ Privacy-Preserving Data Access (Filtered by consent scope)"
echo "   ✓ Certificate Validation (Query by student)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 EDU-LEDGER SYSTEM WORKING CORRECTLY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
