#!/bin/bash
#
# Fix channel joining issue for edu-ledger
# Executes commands inside Docker containers to bypass 127.0.0.1 networking issues

set -e

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

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Fixing Edu-Ledger Channel Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if network is up
info "Checking if Docker containers are running..."
if [ $(docker ps | grep hyperledger | wc -l) -lt 3 ]; then
    error "Network not running. Please start with: ./network.sh up"
    exit 1
fi
success "Docker containers are running"
echo ""

# Check if channel block exists
CHANNEL_BLOCK="/home/beast/Documents/Personal/Projects/ledger/fabric-samples/test-network/channel-artifacts/certchannel.block"
if [ ! -f "$CHANNEL_BLOCK" ]; then
    error "Channel genesis block not found at: $CHANNEL_BLOCK"
    exit 1
fi
success "Channel genesis block exists"
echo ""

# Join Org1 peer to channel
info "Joining Org1 peer (peer0.org1.example.com) to certchannel..."
docker exec peer0.org1.example.com peer channel join \
    -b /var/hyperledger/production/channel-artifacts/certchannel.block 2>&1 | grep -q "Successfully" || \
docker exec -e CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp \
    peer0.org1.example.com sh -c \
    "peer channel fetch 0 certchannel.block -c certchannel -o orderer.example.com:7050 \
    --tls --cafile /etc/hyperledger/fabric/tls/ca.crt && \
    peer channel join -b certchannel.block"

if [ $? -eq 0 ]; then
    success "Org1 peer joined certchannel"
else
    error "Org1 peer failed to join channel"
    exit 1
fi
echo ""

# Join Org2 peer to channel
info "Joining Org2 peer (peer0.org2.example.com) to certchannel..."
docker exec peer0.org2.example.com peer channel join \
    -b /var/hyperledger/production/channel-artifacts/certchannel.block 2>&1 | grep -q "Successfully" || \
docker exec -e CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp \
    peer0.org2.example.com sh -c \
    "peer channel fetch 0 certchannel.block -c certchannel -o orderer.example.com:7050 \
    --tls --cafile /etc/hyperledger/fabric/tls/ca.crt && \
    peer channel join -b certchannel.block"

if [ $? -eq 0 ]; then
    success "Org2 peer joined certchannel"
else
    error "Org2 peer failed to join channel"
    exit 1
fi
echo ""

# Verify both peers joined
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Verifying channel membership..."
echo ""

echo "Org1 peer channels:"
docker exec peer0.org1.example.com peer channel list | grep "Channels peers has joined"

echo ""
echo "Org2 peer channels:"
docker exec peer0.org2.example.com peer channel list | grep "Channels peers has joined"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Channel configuration fixed successfully!"
echo ""
echo "📊 Channel: certchannel"
echo "🏢 Organizations: Org1MSP, Org2MSP"
echo "👥 Peers: peer0.org1.example.com, peer0.org2.example.com"
echo ""
echo "Next step: Deploy chaincode with: ./network.sh deployCC"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
