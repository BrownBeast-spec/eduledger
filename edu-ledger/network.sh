#!/usr/bin/env bash
#
# Copyright 2024 University Certificate Management System
# SPDX-License-Identifier: Apache-2.0
#
# This script manages the edu-ledger Hyperledger Fabric network
# for university certificate management

ROOTDIR=$(cd "$(dirname "$0")" && pwd)
export PATH=${ROOTDIR}/../bin:${PATH}
export FABRIC_CFG_PATH=${ROOTDIR}/configtx
export VERBOSE=false

pushd ${ROOTDIR} > /dev/null
trap "popd > /dev/null" EXIT

. ../test-network/scripts/utils.sh

: ${CONTAINER_CLI:="docker"}
if command -v ${CONTAINER_CLI}-compose > /dev/null 2>&1; then
    : ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI}-compose"}
else
    : ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI} compose"}
fi

# Print the usage message
function printHelp() {
  echo "Usage: "
  echo "  network.sh <Mode> [Flags]"
  echo "    Modes:"
  echo "      up - Bring up the network"
  echo "      down - Shut down the network"
  echo "      restart - Restart the network"
  echo "      deployCC - Deploy the edu-ledger chaincode"
  echo "      createChannel - Create the certificate channel"
  echo
  echo "    Flags:"
  echo "    -c <channel name> - Channel name to use (default: \"certchannel\")"
  echo "    -ccn <chaincode name> - Chaincode name (default: \"eduledger\")"
  echo "    -v - Verbose mode"
  echo
  echo "  Example:"
  echo "    network.sh up"
  echo "    network.sh deployCC"
  echo "    network.sh down"
}

# Network functions
function networkUp() {
  infoln "Starting edu-ledger network"
  
  # Use test-network as base
  cd ../test-network
  ./network.sh up createChannel -c certchannel -ca
  cd - > /dev/null
  
  successln "Edu-ledger network started successfully"
  infoln "Channel 'certchannel' created"
}

function networkDown() {
  infoln "Stopping edu-ledger network"
  
  cd ../test-network
  ./network.sh down
  cd - > /dev/null
  
  # Clean up chaincode artifacts
  rm -rf ${ROOTDIR}/chaincode-go/vendor
  rm -f ${ROOTDIR}/eduledger.tar.gz
  
  successln "Edu-ledger network stopped"
}

function deployChaincode() {
  infoln "Deploying edu-ledger chaincode"
  
  CHANNEL_NAME="certchannel"
  CC_NAME="eduledger"
  CC_SRC_PATH="${ROOTDIR}/chaincode-go"
  CC_VERSION="1.0"
  CC_SEQUENCE="1"
  
  cd ../test-network
  
  # Set FABRIC_CFG_PATH
  export FABRIC_CFG_PATH=${PWD}/../config/
  
  # Package chaincode
  infoln "Packaging chaincode..."
  peer lifecycle chaincode package ${ROOTDIR}/eduledger.tar.gz \
    --path ${CC_SRC_PATH} \
    --lang golang \
    --label ${CC_NAME}_${CC_VERSION}
  
  # Install on Org1
  infoln "Installing chaincode on Org1..."
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID="Org1MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
  export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
  export CORE_PEER_ADDRESS=localhost:7051
  
  peer lifecycle chaincode install ${ROOTDIR}/eduledger.tar.gz
  
  # Install on Org2
  infoln "Installing chaincode on Org2..."
  export CORE_PEER_LOCALMSPID="Org2MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
  export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
  export CORE_PEER_ADDRESS=localhost:9051
  
  peer lifecycle chaincode install ${ROOTDIR}/eduledger.tar.gz
  
  # Query installed chaincode
  peer lifecycle chaincode queryinstalled >&log.txt
  PACKAGE_ID=$(sed -n "/${CC_NAME}_${CC_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
  infoln "Package ID: ${PACKAGE_ID}"
  
  # Approve for Org1
  infoln "Approving chaincode for Org1..."
  export CORE_PEER_LOCALMSPID="Org1MSP"
  export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
  export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
  export CORE_PEER_ADDRESS=localhost:7051
  
  peer lifecycle chaincode approveformyorg -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence ${CC_SEQUENCE}
  
  # Approve for Org2
  infoln "Approving chaincode for Org2..."
  export CORE_PEER_LOCALMSPID="Org2MSP"
  export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
  export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
  export CORE_PEER_ADDRESS=localhost:9051
  
  peer lifecycle chaincode approveformyorg -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence ${CC_SEQUENCE}
  
  # Check commit readiness
  infoln "Checking commit readiness..."
  peer lifecycle chaincode checkcommitreadiness \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --output json
  
  # Commit chaincode
  infoln "Committing chaincode..."
  peer lifecycle chaincode commit -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
    --channelID ${CHANNEL_NAME} \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
  
  # Query committed chaincode
  peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CC_NAME}
  
  cd - > /dev/null
  
  successln "Chaincode deployed successfully!"
}

# Parse mode
if [[ $# -lt 1 ]] ; then
  printHelp
  exit 0
fi

MODE=$1
shift

# Parse flags
while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -h )
    printHelp
    exit 0
    ;;
  -v )
    VERBOSE=true
    ;;
  * )
    errorln "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done

# Execute mode
if [ "${MODE}" == "up" ]; then
  networkUp
elif [ "${MODE}" == "down" ]; then
  networkDown
elif [ "${MODE}" == "restart" ]; then
  networkDown
  networkUp
elif [ "${MODE}" == "deployCC" ]; then
  deployChaincode
else
  printHelp
  exit 1
fi
