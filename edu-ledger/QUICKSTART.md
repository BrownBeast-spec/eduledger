# Edu-Ledger Quick Start Guide

Get the University Certificate Management System running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:

```bash
# Check Docker
docker --version
docker-compose --version

# Check Go
go version  # Should be 1.21 or higher

# Check Fabric binaries
peer version
```

## Step-by-Step Setup

### 1. Navigate to edu-ledger

```bash
cd /path/to/fabric-samples/edu-ledger
```

### 2. Initialize Go Dependencies

```bash
cd chaincode-go
go mod download
go mod vendor
cd ..
```

### 3. Start the Network

```bash
# This will start Fabric network and create the channel
./network.sh up
```

**Expected Output:**
```
✅ Starting edu-ledger network
✅ Edu-ledger network started successfully
ℹ  Channel 'certchannel' created
```

### 4. Deploy Chaincode

```bash
# Deploy the smart contracts
./network.sh deployCC
```

**Expected Output:**
```
✅ Packaging chaincode...
✅ Installing chaincode on Org1...
✅ Installing chaincode on Org2...
✅ Approving chaincode for Org1...
✅ Approving chaincode for Org2...
✅ Committing chaincode...
✅ Chaincode deployed successfully!
```

### 5. Run System Tests

```bash
# Run comprehensive tests
./test-system.sh
```

**Expected Output:**
```
ℹ Starting edu-ledger system tests...

ℹ Test 1: Issuing certificate for Alice...
✓ Certificate issued successfully

ℹ Test 2: Reading certificate...
✓ Certificate read successfully
  Certificate ID: TEST-CERT-001
  Student: TEST-STU001

ℹ Test 3: Granting consent to verifier...
✓ Consent granted successfully

ℹ Test 4: Verifying consent...
✓ Consent verification successful
  Consent Status: ACTIVE

ℹ Test 5: Accessing certificate with consent...
✓ Filtered certificate access successful
  Verifier can see: degreeName, major, graduationDate
  Verifier CANNOT see: gpa (not in consent scope)

ℹ Test 6: Revoking consent...
✓ Consent revoked successfully

ℹ Test 7: Verifying consent revocation...
✓ Consent revocation verified

ℹ Test 8: Querying student certificates...
✓ Student certificate query successful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ ALL TESTS PASSED! 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Manual Testing

### Issue a Certificate

```bash
cd ../test-network

# Set environment variables
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Issue a certificate
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c '{"function":"CertificateManager:IssueCertificate","Args":["MY-CERT-001","myhash123","QmMyIPFS","did:web:university.edu","did:web:student:MYSTUDENT","MYSTUDENT","{\"degreeName\":\"BSc Computer Science\",\"major\":\"CS\",\"graduationDate\":\"2024-05-20\",\"gpa\":\"3.9\"}"]}'
```

### Read the Certificate

```bash
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:ReadCertificate","Args":["MY-CERT-001"]}'
```

### Grant Consent

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c '{"function":"ConsentManager:GrantConsent","Args":["MY-CONSENT-001","did:web:student:MYSTUDENT","did:web:employer:MYEMPLOYER","MY-CERT-001","employment","[\"degreeName\",\"major\"]","30"]}'
```

### Verify Certificate with Consent

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C certchannel \
  -n eduledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${CORE_PEER_TLS_ROOTCERT_FILE}" \
  -c '{"function":"ConsentManager:AccessCertificateWithConsent","Args":["MY-CONSENT-001","did:web:employer:MYEMPLOYER"]}'
```

## Common Operations

### Stop the Network

```bash
cd edu-ledger
./network.sh down
```

### Restart the Network

```bash
./network.sh restart
```

### View Logs

```bash
# View peer logs
docker logs peer0.org1.example.com

# View orderer logs
docker logs orderer.example.com

# View all fabric containers
docker ps -a --filter label=service=hyperledger-fabric
```

## Troubleshooting

### Issue: "Command not found: peer"

**Solution**: Fabric binaries not in PATH

```bash
cd fabric-samples
export PATH=${PWD}/bin:$PATH
```

### Issue: "Network already running"

**Solution**: Stop existing network first

```bash
./network.sh down
./network.sh up
```

### Issue: "Chaincode already installed"

**Solution**: Use a different version or clean up

```bash
./network.sh down
rm -rf eduledger.tar.gz
./network.sh up
./network.sh deployCC
```

### Issue: "Certificate already exists"

**Solution**: Use unique certificate IDs

Each certificate needs a unique ID. Increment the ID:
- CERT-001, CERT-002, CERT-003, etc.

## Next Steps

Now that your system is running:

1. **Explore Detailed Testing**: See [TESTING.md](./TESTING.md) for comprehensive test scenarios
2. **Read the Architecture**: Check [README.md](./README.md) for system architecture details
3. **Customize**: Modify chaincode in `chaincode-go/chaincode/` directory
4. **Build Applications**: Create custom portals using the chaincode functions

## Key Concepts

### 1. Certificate Lifecycle

```
Issue → Store on Blockchain → Grant Consent → Verify → Revoke Consent/Certificate
```

### 2. Privacy Model

- Students **own** their certificates
- Students **control** who can see them
- Students **define** what data is shared
- Students **can revoke** access anytime

### 3. Actors

- **University (Org1MSP)**: Issues and revokes certificates
- **Students**: Own certificates, manage consents
- **Verifiers (Org2MSP)**: Verify certificates with consent

## Support & Documentation

- **Full Testing Guide**: [TESTING.md](./TESTING.md)
- **System README**: [README.md](./README.md)
- **Hyperledger Fabric Docs**: https://hyperledger-fabric.readthedocs.io

---

## Success! 🎉

Your Edu-Ledger system is now running. You can:

✅ Issue blockchain-based certificates  
✅ Manage student consents  
✅ Verify certificates with privacy  
✅ Track complete audit trails  
✅ Revoke certificates and consents  

**Happy building!** 🚀
