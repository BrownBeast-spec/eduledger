# Quick Start - Certificate Demo

## TL;DR - Run Everything

```bash
cd /home/beast/Documents/edu-ledger/test-network
./demo-certificate-flow.sh
```

This will:
1. Issue a certificate to student STU001
2. Query it via the blockchain
3. Launch the student wallet app to view it

## Individual Steps

### 1. Issue Certificate Only

```bash
cd /home/beast/Documents/edu-ledger/test-network
./issue-certificate-stu001.sh
```

### 2. Run Student Wallet Only

```bash
cd /home/beast/Documents/edu-ledger/test-network/edu-ledger/application-typescript
STUDENT_ID=STU001 STUDENT_NAME="Alice Johnson" node dist/student-wallet.js
```

### 3. Query via CLI

```bash
# Query all certificates for STU001
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:QueryCertificatesByStudent","Args":["did:web:student:STU001"]}'

# Read specific certificate
peer chaincode query \
  -C certchannel \
  -n eduledger \
  -c '{"function":"CertificateManager:ReadCertificate","Args":["CERT-001"]}'
```

## What Was Fixed

### Issue with Your Original Command
Your command was correct! The issue was in the student wallet app:

**Problems:**
- App was querying with `studentId` (STU001) instead of `studentDID` (did:web:student:STU001)
- Wrong channel name (mychannel vs certchannel)
- Wrong contract name (edu-ledger vs eduledger)

**Fixed:**
- ✅ Student wallet now converts STU001 → did:web:student:STU001
- ✅ Uses correct channel: certchannel
- ✅ Uses correct contract: eduledger
- ✅ Displays actual certificate fields from the blockchain

## Student Wallet Menu

```
1. View My Certificates     ← Shows all certificates for STU001
2. View Certificate Details ← Show specific certificate by ID
3. Grant Consent            ← Give verifier access to certificate fields
4. View My Consents         ← See all consents granted
5. Revoke Consent           ← Revoke verifier access
6. Exit
```

## Files Created/Modified

### New Files:
- `test-network/issue-certificate-stu001.sh` - Issue certificate script
- `test-network/demo-certificate-flow.sh` - Complete demo script
- `test-network/CERTIFICATE_SETUP_GUIDE.md` - Detailed guide
- `test-network/QUICK_START.md` - This file

### Modified Files:
- `edu-ledger/application-typescript/src/student-wallet.ts`:
  - Fixed studentDID format in queries
  - Fixed channel and contract names
  - Updated certificate display format
  - Fixed consent functionality

## Troubleshooting

### "Identity does not exist in wallet"
```bash
cd edu-ledger/application-typescript
node dist/enrollUsers.js
```

### "Chaincode not found"
Verify the network and chaincode are running:
```bash
peer chaincode query -C certchannel -n eduledger -c '{"Args":["org.hyperledger.fabric:GetMetadata"]}'
```

### "No certificates found"
Issue a certificate first:
```bash
./issue-certificate-stu001.sh
```

## Next Steps

1. **Issue Multiple Certificates**: Run the script multiple times
2. **Test Consent Flow**: Use option 3 in student wallet
3. **Verify Certificates**: Use the verifier portal application
4. **Test Revocation**: Revoke a certificate and verify status

For detailed information, see `CERTIFICATE_SETUP_GUIDE.md`
