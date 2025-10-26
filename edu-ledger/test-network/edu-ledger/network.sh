#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Edu-Ledger Network Management Script
# This script helps manage the Hyperledger Fabric network for edu-ledger

# Exit on first error, print all commands
set -e

# Set environment variables
export FABRIC_CFG_PATH=${PWD}/../../config/
export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/../organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export PEER0_ORG2_CA=${PWD}/../organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print the usage message
function printHelp() {
  echo "Usage: "
  echo "  network.sh <Mode> [Flags]"
  echo "    <Mode>"
  echo "      - 'up' - bring up the network and deploy chaincode"
  echo "      - 'down' - clear the network"
  echo "      - 'restart' - restart the network"
  echo "      - 'deployCC' - deploy the chaincode"
  echo "      - 'upgradeCC' - upgrade the chaincode"
  echo "      - 'init' - initialize the ledger with sample data"
  echo
  echo "    Flags:"
  echo "    -h - print this message"
  echo
  echo " Typical usage:"
  echo "   network.sh up          - Launch network and deploy chaincode"
  echo "   network.sh deployCC    - Deploy chaincode to existing network"
  echo "   network.sh down        - Shutdown the network"
}

# Set Org1 environment variables
function setOrg1() {
  export CORE_PEER_LOCALMSPID="Org1MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/../organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
  export CORE_PEER_MSPCONFIGPATH=${PWD}/../organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
  export CORE_PEER_ADDRESS=localhost:7051
}

# Set Org2 environment variables
function setOrg2() {
  export CORE_PEER_LOCALMSPID="Org2MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/../organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
  export CORE_PEER_MSPCONFIGPATH=${PWD}/../organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
  export CORE_PEER_ADDRESS=localhost:9051
}

# Package the chaincode
function packageChaincode() {
  echo -e "${GREEN}Packaging edu-ledger chaincode...${NC}"
  cd chaincode-go
  GO111MODULE=on go mod vendor
  cd ..
  
  peer lifecycle chaincode package edu-ledger.tar.gz \
    --path ./chaincode-go \
    --lang golang \
    --label edu-ledger_1.0
  
  echo -e "${GREEN}✓ Chaincode packaged${NC}"
}

# Install chaincode on peer
function installChaincode() {
  echo -e "${GREEN}Installing edu-ledger chaincode...${NC}"
  
  setOrg1
  peer lifecycle chaincode install edu-ledger.tar.gz
  
  setOrg2
  peer lifecycle chaincode install edu-ledger.tar.gz
  
  echo -e "${GREEN}✓ Chaincode installed on both peers${NC}"
}

# Query installed chaincode to get package ID
function queryInstalled() {
  setOrg1
  peer lifecycle chaincode queryinstalled >&log.txt
  cat log.txt
  PACKAGE_ID=$(sed -n "/edu-ledger_1.0/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
  echo "Package ID: ${PACKAGE_ID}"
}

# Approve chaincode for organization
function approveChaincode() {
  queryInstalled
  
  echo -e "${GREEN}Approving chaincode for Org1...${NC}"
  setOrg1
  peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    --channelID mychannel \
    --name edu-ledger \
    --version 1.0 \
    --package-id ${PACKAGE_ID} \
    --sequence 1
  
  echo -e "${GREEN}Approving chaincode for Org2...${NC}"
  setOrg2
  peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    --channelID mychannel \
    --name edu-ledger \
    --version 1.0 \
    --package-id ${PACKAGE_ID} \
    --sequence 1
  
  echo -e "${GREEN}✓ Chaincode approved by both organizations${NC}"
}

# Commit chaincode definition
function commitChaincode() {
  echo -e "${GREEN}Committing chaincode definition...${NC}"
  
  peer lifecycle chaincode checkcommitreadiness \
    --channelID mychannel \
    --name edu-ledger \
    --version 1.0 \
    --sequence 1 \
    --output json
  
  peer lifecycle chaincode commit \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    --channelID mychannel \
    --name edu-ledger \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles $PEER0_ORG2_CA \
    --version 1.0 \
    --sequence 1
  
  echo -e "${GREEN}✓ Chaincode committed${NC}"
}

# Deploy chaincode
function deployChaincode() {
  echo -e "${YELLOW}========== Deploying Edu-Ledger Chaincode ==========${NC}"
  
  packageChaincode
  installChaincode
  approveChaincode
  commitChaincode
  
  echo -e "${GREEN}✓ Chaincode deployment complete${NC}"
  
  # Query committed chaincodes
  peer lifecycle chaincode querycommitted --channelID mychannel
}

# Initialize the ledger
function initLedger() {
  echo -e "${GREEN}Initializing ledger with sample data...${NC}"
  
  setOrg1
  peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    -C mychannel \
    -n edu-ledger \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles $PEER0_ORG2_CA \
    -c '{"function":"CertificateManager:InitLedger","Args":[]}'
  
  echo -e "${GREEN}✓ Certificate ledger initialized${NC}"
  
  peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    -C mychannel \
    -n edu-ledger \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles $PEER0_ORG2_CA \
    -c '{"function":"ConsentManager:InitLedger","Args":[]}'
  
  echo -e "${GREEN}✓ Consent ledger initialized${NC}"
}

# Bring up the network
function networkUp() {
  echo -e "${YELLOW}========== Starting Edu-Ledger Network ==========${NC}"
  
  # Check if network is already running
  if [ -d "../organizations/peerOrganizations" ]; then
    echo -e "${YELLOW}Network appears to be running. Use './network.sh down' first.${NC}"
    exit 1
  fi
  
  # Start the test network
  cd ..
  ./network.sh up createChannel -ca -s couchdb
  cd edu-ledger
  
  echo -e "${GREEN}✓ Network is up${NC}"
  
  # Deploy chaincode
  deployChaincode
  
  # Initialize ledger
  initLedger
  
  echo -e "${GREEN}========== Edu-Ledger Network is Ready ==========${NC}"
  echo -e "${YELLOW}You can now run the TypeScript applications:${NC}"
  echo -e "  cd application-typescript"
  echo -e "  npm install"
  echo -e "  npm run start:institution"
  echo -e "  npm run start:student"
  echo -e "  npm run start:verifier"
}

# Bring down the network
function networkDown() {
  echo -e "${YELLOW}========== Shutting Down Network ==========${NC}"
  
  cd ..
  ./network.sh down
  cd edu-ledger
  
  # Clean up
  rm -f edu-ledger.tar.gz
  rm -f log.txt
  
  echo -e "${GREEN}✓ Network is down and cleaned up${NC}"
}

# Restart the network
function networkRestart() {
  networkDown
  sleep 2
  networkUp
}

# Upgrade chaincode
function upgradeChaincode() {
  echo -e "${YELLOW}========== Upgrading Edu-Ledger Chaincode ==========${NC}"
  
  # Increment sequence number
  SEQUENCE=2
  
  packageChaincode
  installChaincode
  
  queryInstalled
  
  echo -e "${GREEN}Approving chaincode upgrade for Org1...${NC}"
  setOrg1
  peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    --channelID mychannel \
    --name edu-ledger \
    --version 1.1 \
    --package-id ${PACKAGE_ID} \
    --sequence ${SEQUENCE}
  
  echo -e "${GREEN}Approving chaincode upgrade for Org2...${NC}"
  setOrg2
  peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    --channelID mychannel \
    --name edu-ledger \
    --version 1.1 \
    --package-id ${PACKAGE_ID} \
    --sequence ${SEQUENCE}
  
  echo -e "${GREEN}Committing chaincode upgrade...${NC}"
  peer lifecycle chaincode commit \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $ORDERER_CA \
    --channelID mychannel \
    --name edu-ledger \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles $PEER0_ORG2_CA \
    --version 1.1 \
    --sequence ${SEQUENCE}
  
  echo -e "${GREEN}✓ Chaincode upgrade complete${NC}"
}

## Parse mode
if [[ $# -lt 1 ]] ; then
  printHelp
  exit 0
else
  MODE=$1
  shift
fi

# Parse flags
while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -h )
    printHelp
    exit 0
    ;;
  * )
    echo "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done

# Determine mode of operation
if [ "$MODE" == "up" ]; then
  networkUp
elif [ "$MODE" == "down" ]; then
  networkDown
elif [ "$MODE" == "restart" ]; then
  networkRestart
elif [ "$MODE" == "deployCC" ]; then
  deployChaincode
elif [ "$MODE" == "upgradeCC" ]; then
  upgradeChaincode
elif [ "$MODE" == "init" ]; then
  initLedger
else
  printHelp
  exit 1
fi
