import readline = require('readline-sync');
import { Gateway, Wallets, Contract } from 'fabric-network';
import path = require('path');
import fs = require('fs');

/**
 * Verifier Portal Application
 * Allows third parties to verify certificates with proper consent
 */

class VerifierPortal {
    private gateway: Gateway;
    private certContract: Contract | null = null;
    private consentContract: Contract | null = null;
    private verifierId: string;
    private verifierName: string;

    constructor(verifierId: string, verifierName: string) {
        this.gateway = new Gateway();
        this.verifierId = verifierId;
        this.verifierName = verifierName;
    }

    async connect(): Promise<void> {
        try {
            // Load connection profile
            const ccpPath = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org2.example.com', 'connection-org2.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            // Create a wallet
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await Wallets.newFileSystemWallet(walletPath);

            // Check if user identity exists
            const identity = await wallet.get('verifierUser');
            if (!identity) {
                console.log('An identity for the user "verifierUser" does not exist in the wallet');
                console.log('Run the enrollment script before running this application');
                return;
            }

            // Connect to gateway
            await this.gateway.connect(ccp, {
                wallet,
                identity: 'verifierUser',
                discovery: { enabled: true, asLocalhost: true }
            });

            // Get network and contracts
            const network = await this.gateway.getNetwork('mychannel');
            this.certContract = network.getContract('edu-ledger', 'CertificateManager');
            this.consentContract = network.getContract('edu-ledger', 'ConsentManager');

            console.log(`Connected as ${this.verifierName} (${this.verifierId})`);
        } catch (error) {
            console.error(`Failed to connect: ${error}`);
            throw error;
        }
    }

    async verifyCertificate(): Promise<void> {
        if (!this.certContract || !this.consentContract) {
            console.log('Not connected to network');
            return;
        }

        try {
            const certId = readline.question('Enter Certificate ID: ');
            const consentId = readline.question('Enter Consent ID: ');

            // First, verify consent
            const consentValid = await this.consentContract.evaluateTransaction(
                'VerifyConsent',
                consentId,
                this.verifierId
            );

            if (consentValid.toString() !== 'true') {
                console.log('✗ Invalid or expired consent');
                return;
            }

            // Get consent details to see what data can be accessed
            const consentResult = await this.consentContract.evaluateTransaction(
                'ReadConsent',
                consentId
            );
            const consent = JSON.parse(consentResult.toString());

            // Verify consent is for this certificate
            if (consent.certificateId !== certId) {
                console.log('✗ Consent is not for this certificate');
                return;
            }

            // Get certificate details
            const certResult = await this.certContract.evaluateTransaction('ReadCertificate', certId);
            const certificate = JSON.parse(certResult.toString());

            console.log('\n--- Certificate Verification Result ---');
            console.log('✓ Certificate is valid');
            console.log(`✓ Consent verified (expires: ${new Date(consent.expiryDate).toLocaleDateString()})`);
            console.log('\n--- Accessible Data ---');
            
            // Display only the data that consent was granted for
            consent.dataShared.forEach((field: string) => {
                if (certificate[field] !== undefined) {
                    console.log(`${field}: ${certificate[field]}`);
                }
            });

            console.log(`\nStatus: ${certificate.status}`);
        } catch (error) {
            console.error(`Verification failed: ${error}`);
        }
    }

    async viewMyConsents(): Promise<void> {
        if (!this.consentContract) {
            console.log('Not connected to network');
            return;
        }

        try {
            const result = await this.consentContract.evaluateTransaction(
                'QueryConsentsByVerifier',
                this.verifierId
            );
            const consents = JSON.parse(result.toString());

            console.log('\n--- Consents Granted to Me ---');
            if (consents.length === 0) {
                console.log('No consents found');
            } else {
                consents.forEach((consent: any, index: number) => {
                    console.log(`\n${index + 1}. ${consent.id}`);
                    console.log(`   Student: ${consent.studentId}`);
                    console.log(`   Certificate: ${consent.certificateId}`);
                    console.log(`   Purpose: ${consent.purpose}`);
                    console.log(`   Status: ${consent.status}`);
                    console.log(`   Expires: ${new Date(consent.expiryDate).toLocaleDateString()}`);
                    console.log(`   Data Shared: ${consent.dataShared.join(', ')}`);
                });
            }
        } catch (error) {
            console.error(`Failed to retrieve consents: ${error}`);
        }
    }

    async viewCertificateHistory(): Promise<void> {
        if (!this.certContract) {
            console.log('Not connected to network');
            return;
        }

        try {
            const certId = readline.question('Enter Certificate ID: ');
            const consentId = readline.question('Enter Consent ID (for access): ');

            // Verify consent first
            const consentValid = await this.consentContract!.evaluateTransaction(
                'VerifyConsent',
                consentId,
                this.verifierId
            );

            if (consentValid.toString() !== 'true') {
                console.log('✗ Invalid or expired consent');
                return;
            }

            const result = await this.certContract.evaluateTransaction(
                'GetCertificateHistory',
                certId
            );
            const history = JSON.parse(result.toString());

            console.log('\n--- Certificate History ---');
            if (history.length === 0) {
                console.log('No history found');
            } else {
                history.forEach((entry: any, index: number) => {
                    console.log(`\n${index + 1}. Transaction: ${entry.txId}`);
                    console.log(`   Timestamp: ${new Date(entry.timestamp).toLocaleString()}`);
                    console.log(`   Is Delete: ${entry.isDelete}`);
                    if (entry.value) {
                        console.log(`   Status: ${entry.value.status}`);
                    }
                });
            }
        } catch (error) {
            console.error(`Failed to retrieve history: ${error}`);
        }
    }

    async quickVerify(): Promise<void> {
        if (!this.certContract) {
            console.log('Not connected to network');
            return;
        }

        try {
            const certId = readline.question('Enter Certificate ID for quick check: ');
            const certHash = readline.question('Enter Certificate Hash to verify: ');

            const result = await this.certContract.evaluateTransaction('ReadCertificate', certId);
            const certificate = JSON.parse(result.toString());

            console.log('\n--- Quick Verification ---');
            if (certificate.certificateHash === certHash && certificate.status === 'Active') {
                console.log('✓ Certificate is valid and active');
                console.log(`   Institution: ${certificate.institutionName}`);
                console.log(`   Student: ${certificate.studentName}`);
                console.log(`   Degree: ${certificate.degree}`);
            } else if (certificate.certificateHash !== certHash) {
                console.log('✗ Certificate hash does not match');
            } else if (certificate.status !== 'Active') {
                console.log(`✗ Certificate status: ${certificate.status}`);
            }
        } catch (error) {
            console.error(`Verification failed: ${error}`);
        }
    }

    async disconnect(): Promise<void> {
        this.gateway.disconnect();
        console.log('Disconnected from network');
    }

    async run(): Promise<void> {
        await this.connect();

        let running = true;
        while (running) {
            console.log('\n=== Verifier Portal ===');
            console.log('1. Verify Certificate (with Consent)');
            console.log('2. View My Consents');
            console.log('3. View Certificate History');
            console.log('4. Quick Verify (Public Data)');
            console.log('5. Exit');

            const choice = readline.question('Select an option: ');

            switch (choice) {
                case '1':
                    await this.verifyCertificate();
                    break;
                case '2':
                    await this.viewMyConsents();
                    break;
                case '3':
                    await this.viewCertificateHistory();
                    break;
                case '4':
                    await this.quickVerify();
                    break;
                case '5':
                    running = false;
                    break;
                default:
                    console.log('Invalid option');
            }
        }

        await this.disconnect();
    }
}

// Main execution
async function main() {
    const verifierId = process.env.VERIFIER_ID || 'VER001';
    const verifierName = process.env.VERIFIER_NAME || 'ABC Company';

    const portal = new VerifierPortal(verifierId, verifierName);
    await portal.run();
}

main().catch(error => {
    console.error('Application error:', error);
    process.exit(1);
});
