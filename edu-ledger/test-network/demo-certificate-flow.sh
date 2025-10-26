#!/usr/bin/env bash
#
# Complete certificate demonstration flow
# 1. Issue certificate to STU001
# 2. Run student wallet to view it
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

function success() {
    echo -e "${GREEN}✓ $1${NC}"
}

function info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

function header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check we're in test-network
if [[ ! -d "organizations" ]]; then
    echo "Error: Must be run from test-network directory"
    exit 1
fi

header "STEP 1: Issue Certificate to Student STU001"
echo ""

# Set environment
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Generate unique certificate ID
CERT_ID="CERT-STU001-$(date +%s)"
CERT_HASH="hash-$(date +%s)"
IPFS_HASH="QmIPFS-$(date +%s)"

info "Certificate Details:"
echo "  Certificate ID: $CERT_ID"
echo "  Student: Suraj Sanjay Harlekar (2023BCD0038)"
echo "  Student DID: did:web:student:2023BCD0038"
echo "  Degree: Btech Computer Science Spec. AI & DS"
echo "  Major: Computer Science"
echo "  GPA: 7.2"
echo "  Graduation: 2025-05-20"
echo ""

info "Issuing certificate..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c "{\"function\":\"CertificateManager:IssueCertificate\",\"Args\":[\"${CERT_ID}\",\"${CERT_HASH}\",\"${IPFS_HASH}\",\"did:web:university.edu\",\"did:web:student:2023BCD0038\",\"2023BCD0038\",\"{\\\"degreeName\\\":\\\"Btech Computer Science Spec. AI & DS\\\",\\\"major\\\":\\\"Computer Science\\\",\\\"graduationDate\\\":\\\"2025-05-20\\\",\\\"gpa\\\":\\\"7.2\\\"}\"]}" \
  --waitForEvent > /dev/null 2>&1

if [ $? -eq 0 ]; then
    success "Certificate issued successfully!"
    echo ""
else
    echo "Failed to issue certificate"
    exit 1
fi

header "STEP 2: Query Certificate via Blockchain"
echo ""

info "Querying certificates for 2023BCD0038..."
CERTS=$(peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:QueryCertificatesByStudent","Args":["did:web:student:2023BCD0038"]}' 2>/dev/null)

echo "$CERTS" | jq '.' 2>/dev/null || echo "$CERTS"
echo ""

# header "STEP 3: View Certificate in Student Wallet Application"
# echo ""
# 
# info "Launching Student Wallet Application..."
# echo ""
# echo "The application will now start. Select option 1 to view your certificates."
# echo ""
# sleep 2
# 
# cd ../../application-typescript
# STUDENT_ID=2023BCD0038 STUDENT_NAME="Suraj Sanjay Harlekar" node dist/student-wallet.js

echo ""
success "Demo complete!"
