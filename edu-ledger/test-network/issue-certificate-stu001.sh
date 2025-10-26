#!/usr/bin/env bash
#
# Issue a certificate to student STU001
#

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

function success() {
    echo -e "${GREEN}✓ $1${NC}"
}

function info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Set environment
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

info "Issuing certificate to student STU001..."
echo ""

# Generate unique certificate ID
CERT_ID="CERT-STU001-$(date +%s)"
CERT_HASH="hash-$(date +%s)"
IPFS_HASH="QmIPFS-$(date +%s)"

info "Certificate Details:"
echo "  Certificate ID: $CERT_ID"
echo "  Student ID: STU001"
echo "  Student DID: did:web:student:STU001"
echo "  Degree: BSc Computer Science"
echo "  Major: Computer Science"
echo "  GPA: 3.8"
echo "  Graduation Date: 2024-05-20"
echo ""

# Issue certificate
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c "{\"function\":\"CertificateManager:IssueCertificate\",\"Args\":[\"${CERT_ID}\",\"${CERT_HASH}\",\"${IPFS_HASH}\",\"did:web:university.edu\",\"did:web:student:STU001\",\"STU001\",\"{\\\"degreeName\\\":\\\"BSc Computer Science\\\",\\\"major\\\":\\\"Computer Science\\\",\\\"graduationDate\\\":\\\"2024-05-20\\\",\\\"gpa\\\":\\\"3.8\\\"}\"]}" \
  --waitForEvent

if [ $? -eq 0 ]; then
    success "Certificate issued successfully!"
    echo ""
    
    # Verify by reading it back
    info "Verifying certificate..."
    peer chaincode query \
      -C certchannel \
      -n eduledger \
      -c "{\"function\":\"CertificateManager:ReadCertificate\",\"Args\":[\"${CERT_ID}\"]}"
    
    echo ""
    success "Certificate saved with ID: $CERT_ID"
    echo ""
    echo "You can now:"
    echo "  1. View this certificate in student wallet (option 1)"
    echo "  2. View details with ID: $CERT_ID (option 2)"
else
    echo "Failed to issue certificate"
    exit 1
fi
