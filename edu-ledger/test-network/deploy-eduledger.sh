#!/bin/bash

set -e

echo "deploying edu-ledger chaincode..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
CHANNEL_NAME="certchannel"
CC_NAME="eduledger"
CC_VERSION="1.1"
CC_SEQUENCE="2"
CC_PATH="../chaincode-go"

# Setup environment
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true

# Check if network is running
if ! docker ps | grep -q "peer0.org1.example.com"; then
    echo -e "$Network not running${NC}"
    echo -e "$Starting network...${NC}"
    ./network.sh up createChannel -c $CHANNEL_NAME -ca
    if [ $? -ne 0 ]; then
        echo -e "$Failed to start network${NC}"
        exit 1
    fi
fi

# Check if channel exists
echo "Checking if channel exists..."
if ! docker exec peer0.org1.example.com peer channel list 2>/dev/null | grep -q "$CHANNEL_NAME"; then
    echo -e "${YELLOW}Creating channel $CHANNEL_NAME...${NC}"
    ./network.sh createChannel -c $CHANNEL_NAME
fi

# Verify chaincode path
if [ ! -d "$CC_PATH" ]; then
    echo -e "$Chaincode path not found: $CC_PATH${NC}"
    exit 1
fi

echo -e "$Chaincode found at: $CC_PATH${NC}"

# Package chaincode
echo "📦 Packaging chaincode..."
rm -f ${CC_NAME}.tar.gz
peer lifecycle chaincode package ${CC_NAME}.tar.gz \
    --path $CC_PATH \
    --lang golang \
    --label ${CC_NAME}_${CC_VERSION}

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Packaging failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Chaincode packaged ($(ls -lh ${CC_NAME}.tar.gz | awk '{print $5}'))${NC}"

# Function to set peer environment
setOrg1() {
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}

setOrg2() {
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
}

# Orderer CA
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Install on Org1
echo "Installing chaincode on Org1..."
setOrg1
peer lifecycle chaincode install ${CC_NAME}.tar.gz

if [ $? -ne 0 ]; then
    echo -e "$Installation failed on Org1${NC}"
    echo "Checking Docker permissions..."
    ls -l /var/run/docker.sock
    echo -e "$If permission denied, run: sudo chmod 666 /var/run/docker.sock${NC}"
    exit 1
fi

echo -e "$Installed on Org1${NC}"

# Install on Org2
echo "Installing chaincode on Org2..."
setOrg2
peer lifecycle chaincode install ${CC_NAME}.tar.gz

if [ $? -ne 0 ]; then
    echo -e "$Installation failed on Org2${NC}"
    exit 1
fi

echo -e "$Installed on Org2${NC}"

# Get package ID
echo "Querying package ID..."
setOrg1
CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled 2>&1 | grep ${CC_NAME}_${CC_VERSION} | awk '{print $3}' | sed 's/,$//')

if [ -z "$CC_PACKAGE_ID" ]; then
    echo -e "${RED}Package ID not found${NC}"
    peer lifecycle chaincode queryinstalled
    exit 1
fi

echo -e "${GREEN}Package ID: $CC_PACKAGE_ID${NC}"

# Approve for Org1
echo "Approving chaincode for Org1..."
setOrg1
peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    --channelID $CHANNEL_NAME \
    --name $CC_NAME \
    --version $CC_VERSION \
    --package-id $CC_PACKAGE_ID \
    --sequence $CC_SEQUENCE

if [ $? -ne 0 ]; then
    echo -e "${RED}Approval failed for Org1${NC}"
    exit 1
fi

echo -e "${GREEN}Approved for Org1${NC}"

# Approve for Org2
echo "Approving chaincode for Org2..."
setOrg2
peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    --channelID $CHANNEL_NAME \
    --name $CC_NAME \
    --version $CC_VERSION \
    --package-id $CC_PACKAGE_ID \
    --sequence $CC_SEQUENCE

if [ $? -ne 0 ]; then
    echo -e "${RED}Approval failed for Org2${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Approved for Org2${NC}"

# Check commit readiness
echo "Checking commit readiness..."
peer lifecycle chaincode checkcommitreadiness \
    --channelID $CHANNEL_NAME \
    --name $CC_NAME \
    --version $CC_VERSION \
    --sequence $CC_SEQUENCE \
    --output json

# Commit
echo "Committing chaincode..."
peer lifecycle chaincode commit \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    --channelID $CHANNEL_NAME \
    --name $CC_NAME \
    --version $CC_VERSION \
    --sequence $CC_SEQUENCE \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

if [ $? -ne 0 ]; then
    echo -e "${RED}Commit failed${NC}"
    exit 1
fi

echo -e "${GREEN}Chaincode committed${NC}"

# Query committed
echo "Querying committed chaincode..."
peer lifecycle chaincode querycommitted \
    --channelID $CHANNEL_NAME \
    --name $CC_NAME

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN} Deployed.${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Test certificate issuance"
echo "  2. Test certificate verification"
echo "  3. Test consent management"
echo ""
