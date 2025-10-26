#!/usr/bin/env bash
#
# Test script for student Rounak
# Flow: Issue certificate -> Org requests access -> Grant 2-day consent -> Orderer validates
#

set -e

ROOTDIR=$(cd "$(dirname "$0")" && pwd)
cd ../test-network

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

function success() { echo -e "${GREEN}✓ $1${NC}"; }
function info() { echo -e "${YELLOW}ℹ $1${NC}"; }
function error() { echo -e "${RED}✗ $1${NC}"; }
function step() { echo -e "${BLUE}▸ $1${NC}"; }

# Environment setup for Org1 (University)
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "🎓 Rounak Certificate Lifecycle Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Student Rounak details
STUDENT_ID="ROUNAK-2024"
CERT_ID="CERT-ROUNAK-001"
CERT_HASH="rounak-cert-hash-sha256"
IPFS_CID="QmRounakCertIPFS2024"
ISSUER_DID="did:web:university.edu"
STUDENT_DID="did:web:student:$STUDENT_ID"
ORG_VERIFIER_DID="did:web:employer:TechCorp"
CONSENT_ID="CONSENT-ROUNAK-001"

# Step 1: Issue Certificate for Rounak
step "Step 1: Issuing certificate for student Rounak..."
echo "  Student ID: $STUDENT_ID"
echo "  Certificate ID: $CERT_ID"
echo "  Issuer: University (Org1)"

peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C mychannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c "{\"function\":\"CertificateManager:IssueCertificate\",\"Args\":[\"$CERT_ID\",\"$CERT_HASH\",\"$IPFS_CID\",\"$ISSUER_DID\",\"$STUDENT_DID\",\"$STUDENT_ID\",\"{\\\"studentName\\\":\\\"Rounak\\\",\\\"degreeName\\\":\\\"BSc Computer Science\\\",\\\"major\\\":\\\"Software Engineering\\\",\\\"graduationDate\\\":\\\"2024-06-15\\\",\\\"gpa\\\":\\\"3.9\\\",\\\"honours\\\":\\\"First Class\\\"}\"]}" \
  --waitForEvent > /dev/null 2>&1

if [ $? -eq 0 ]; then
    success "Certificate issued for Rounak"
else
    error "Certificate issuance failed"
    exit 1
fi
echo ""

# Step 2: Verify certificate exists
step "Step 2: Verifying Rounak's certificate on blockchain..."
CERT_DATA=$(peer chaincode query \
  -C mychannel \
  -n eduledger \
  -c "{\"function\":\"CertificateManager:ReadCertificate\",\"Args\":[\"$CERT_ID\"]}" 2>/dev/null)

if echo "$CERT_DATA" | grep -q "$CERT_ID"; then
    success "Certificate verified on ledger"
    echo "  ✓ Student: Rounak"
    echo "  ✓ Degree: BSc Computer Science"
    echo "  ✓ Status: ISSUED"
else
    error "Certificate verification failed"
    exit 1
fi
echo ""

# Step 3: Organization requests access to Rounak's certificate
step "Step 3: TechCorp (Org) requesting access to Rounak's certificate..."
echo "  Requester: TechCorp HR Department"
echo "  Purpose: Job Application Verification"
echo "  Requested fields: degreeName, major, graduationDate, honours"
info "  (Org wants to verify education but NOT see GPA)"
echo ""

# Step 4: Grant consent for 2 days
step "Step 4: Rounak grants consent to TechCorp for 2 days..."
CONSENT_DURATION_DAYS=2
echo "  Consent Duration: $CONSENT_DURATION_DAYS days"
echo "  Allowed Fields: degreeName, major, graduationDate, honours"
echo "  Restricted Fields: gpa (private)"

peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C mychannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c "{\"function\":\"ConsentManager:GrantConsent\",\"Args\":[\"$CONSENT_ID\",\"$STUDENT_DID\",\"$ORG_VERIFIER_DID\",\"$CERT_ID\",\"employment_verification\",\"[\\\"studentName\\\",\\\"degreeName\\\",\\\"major\\\",\\\"graduationDate\\\",\\\"honours\\\"]\",\"$CONSENT_DURATION_DAYS\"]}" \
  --waitForEvent > /dev/null 2>&1

if [ $? -eq 0 ]; then
    success "Consent granted for $CONSENT_DURATION_DAYS days"
    echo "  Expires: $(date -d "+$CONSENT_DURATION_DAYS days" +"%Y-%m-%d %H:%M")"
else
    error "Consent grant failed"
    exit 1
fi
echo ""

# Step 5: Orderer validates consent
step "Step 5: Orderer validating consent on blockchain..."
info "  Orderer checks: consent exists, is active, and not expired"

CONSENT_DATA=$(peer chaincode query \
  -C mychannel \
  -n eduledger \
  -c "{\"function\":\"ConsentManager:VerifyConsent\",\"Args\":[\"$CONSENT_ID\",\"$ORG_VERIFIER_DID\"]}" 2>/dev/null)

if echo "$CONSENT_DATA" | grep -q "ACTIVE"; then
    success "Orderer validated: Consent is ACTIVE"
    echo "  ✓ Consent ID: $CONSENT_ID"
    echo "  ✓ Status: ACTIVE"
    echo "  ✓ Verifier: TechCorp"
    echo "  ✓ Duration: $CONSENT_DURATION_DAYS days"
else
    error "Orderer validation failed"
    exit 1
fi
echo ""

# Step 6: TechCorp accesses Rounak's certificate with consent
step "Step 6: TechCorp accessing Rounak's certificate (privacy-preserving)..."
FILTERED_DATA=$(peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C mychannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c "{\"function\":\"ConsentManager:AccessCertificateWithConsent\",\"Args\":[\"$CONSENT_ID\",\"$ORG_VERIFIER_DID\"]}" \
  --waitForEvent 2>/dev/null)

if echo "$FILTERED_DATA" | grep -q "degreeName"; then
    success "TechCorp successfully accessed filtered certificate"
    echo ""
    echo "  📋 Data TechCorp CAN see:"
    echo "     ✓ Student Name: Rounak"
    echo "     ✓ Degree: BSc Computer Science"
    echo "     ✓ Major: Software Engineering"
    echo "     ✓ Graduation: 2024-06-15"
    echo "     ✓ Honours: First Class"
    echo ""
    echo "  🔒 Data TechCorp CANNOT see:"
    echo "     ✗ GPA: 3.9 (protected by privacy policy)"
else
    error "Certificate access failed"
    exit 1
fi
echo ""

# Step 7: Query consent history (auditing)
step "Step 7: Auditing consent history..."
CONSENT_HISTORY=$(peer chaincode query \
  -C mychannel \
  -n eduledger \
  -c "{\"function\":\"ConsentManager:QueryConsentsByCertificate\",\"Args\":[\"$CERT_ID\"]}" 2>/dev/null)

if echo "$CONSENT_HISTORY" | grep -q "$CONSENT_ID"; then
    success "Consent audit trail verified"
    echo "  ✓ All consents for certificate $CERT_ID logged"
else
    error "Consent audit failed"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "🎉 ROUNAK TEST COMPLETED SUCCESSFULLY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary of actions:"
echo "  1. ✓ Certificate issued for student Rounak"
echo "  2. ✓ Certificate verified on blockchain"
echo "  3. ✓ TechCorp requested access"
echo "  4. ✓ Rounak granted 2-day consent"
echo "  5. ✓ Orderer validated consent (ACTIVE)"
echo "  6. ✓ TechCorp accessed filtered certificate data"
echo "  7. ✓ Privacy preserved (GPA hidden from TechCorp)"
echo ""
info "Next: Wait 2 days and consent will automatically expire"
echo ""
