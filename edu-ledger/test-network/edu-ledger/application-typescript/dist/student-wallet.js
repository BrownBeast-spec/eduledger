"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline-sync");
const fabric_network_1 = require("fabric-network");
const path = require("path");
const fs = __importStar(require("fs"));
/**
 * Student Wallet Application
 * Allows students to view their certificates and manage consent
 */
class StudentWallet {
    constructor(studentId, studentName) {
        this.certContract = null;
        this.consentContract = null;
        this.gateway = new fabric_network_1.Gateway();
        this.studentId = studentId;
        this.studentName = studentName;
    }
    async connect() {
        try {
            // Load connection profile
            const ccpPath = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
            // Create a wallet
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await fabric_network_1.Wallets.newFileSystemWallet(walletPath);
            // Check if user identity exists
            const identity = await wallet.get('studentUser');
            if (!identity) {
                console.log('An identity for the user "studentUser" does not exist in the wallet');
                console.log('Run the enrollment script before running this application');
                return;
            }
            // Connect to gateway
            await this.gateway.connect(ccp, {
                wallet,
                identity: 'studentUser',
                discovery: { enabled: true, asLocalhost: true }
            });
            // Get network and contracts
            const network = await this.gateway.getNetwork('certchannel');
            this.certContract = network.getContract('eduledger', 'CertificateManager');
            this.consentContract = network.getContract('eduledger', 'ConsentManager');
            console.log(`Connected as ${this.studentName} (${this.studentId})`);
        }
        catch (error) {
            console.error(`Failed to connect: ${error}`);
            throw error;
        }
    }
    async viewMyCertificates() {
        if (!this.certContract) {
            console.log('Not connected to network');
            return;
        }
        try {
            // Convert studentId to studentDID format
            const studentDID = `did:web:student:${this.studentId}`;
            const result = await this.certContract.evaluateTransaction('QueryCertificatesByStudent', studentDID);
            const certificates = JSON.parse(result.toString());
            console.log('\n--- My Certificates ---');
            console.log(`Student DID: ${studentDID}`);
            if (certificates.length === 0) {
                console.log('No certificates found');
            }
            else {
                certificates.forEach((cert, index) => {
                    console.log(`\n${index + 1}. Certificate ID: ${cert.certificateID}`);
                    console.log(`   Issuer DID: ${cert.issuerDID}`);
                    console.log(`   Certificate Hash: ${cert.certificateHash}`);
                    console.log(`   IPFS Hash: ${cert.ipfsCertificateHash}`);
                    console.log(`   Issued: ${new Date(cert.issuanceDate).toLocaleDateString()}`);
                    console.log(`   Status: ${cert.revocationStatus}`);
                    if (cert.metadata) {
                        console.log(`   Metadata:`);
                        console.log(`     Degree: ${cert.metadata.degreeName || 'N/A'}`);
                        console.log(`     Major: ${cert.metadata.major || 'N/A'}`);
                        console.log(`     GPA: ${cert.metadata.gpa || 'N/A'}`);
                        console.log(`     Graduation: ${cert.metadata.graduationDate || 'N/A'}`);
                    }
                });
            }
        }
        catch (error) {
            console.error(`Failed to retrieve certificates: ${error}`);
        }
    }
    async viewCertificateDetails() {
        if (!this.certContract) {
            console.log('Not connected to network');
            return;
        }
        try {
            const certId = readline.question('Enter Certificate ID: ');
            const result = await this.certContract.evaluateTransaction('ReadCertificate', certId);
            const certificate = JSON.parse(result.toString());
            console.log('\n--- Certificate Details ---');
            console.log(JSON.stringify(certificate, null, 2));
        }
        catch (error) {
            console.error(`Failed to read certificate: ${error}`);
        }
    }
    async grantConsent() {
        if (!this.consentContract) {
            console.log('Not connected to network');
            return;
        }
        try {
            console.log('\n--- Grant Consent ---');
            const consentId = readline.question('Consent ID: ');
            const verifierDID = readline.question('Verifier DID (e.g., did:web:employer:HR001): ');
            const certId = readline.question('Certificate ID: ');
            const purpose = readline.question('Purpose: ');
            console.log('Data to share (comma separated): degreeName, major, gpa, graduationDate');
            const dataInput = readline.question('Enter fields: ');
            const dataShared = JSON.stringify(dataInput.split(',').map(s => s.trim()));
            const validityDays = parseInt(readline.question('Validity (days): '));
            const studentDID = `did:web:student:${this.studentId}`;
            await this.consentContract.submitTransaction('GrantConsent', consentId, studentDID, verifierDID, certId, purpose, dataShared, validityDays.toString());
            console.log('✓ Consent granted successfully');
        }
        catch (error) {
            console.error(`Failed to grant consent: ${error}`);
        }
    }
    async viewMyConsents() {
        if (!this.consentContract) {
            console.log('Not connected to network');
            return;
        }
        try {
            const studentDID = `did:web:student:${this.studentId}`;
            const result = await this.consentContract.evaluateTransaction('QueryConsentsByStudent', studentDID);
            const consents = JSON.parse(result.toString());
            console.log('\n--- My Consents ---');
            console.log(`Student DID: ${studentDID}`);
            if (consents.length === 0) {
                console.log('No consents found');
            }
            else {
                consents.forEach((consent, index) => {
                    console.log(`\n${index + 1}. Consent ID: ${consent.consentID}`);
                    console.log(`   Verifier DID: ${consent.verifierDID}`);
                    console.log(`   Certificate ID: ${consent.certificateID}`);
                    console.log(`   Purpose: ${consent.purpose}`);
                    console.log(`   Status: ${consent.status}`);
                    console.log(`   Expires: ${new Date(consent.expiryDate).toLocaleDateString()}`);
                    console.log(`   Data Shared: ${consent.dataShared ? JSON.parse(consent.dataShared).join(', ') : 'N/A'}`);
                });
            }
        }
        catch (error) {
            console.error(`Failed to retrieve consents: ${error}`);
        }
    }
    async revokeConsent() {
        if (!this.consentContract) {
            console.log('Not connected to network');
            return;
        }
        try {
            const consentId = readline.question('Enter Consent ID to revoke: ');
            const confirm = readline.question(`Are you sure you want to revoke ${consentId}? (yes/no): `);
            if (confirm.toLowerCase() === 'yes') {
                await this.consentContract.submitTransaction('RevokeConsent', consentId);
                console.log('✓ Consent revoked successfully');
            }
            else {
                console.log('Revocation cancelled');
            }
        }
        catch (error) {
            console.error(`Failed to revoke consent: ${error}`);
        }
    }
    async disconnect() {
        this.gateway.disconnect();
        console.log('Disconnected from network');
    }
    async run() {
        await this.connect();
        let running = true;
        while (running) {
            console.log('\n=== Student Wallet ===');
            console.log('1. View My Certificates');
            console.log('2. View Certificate Details');
            console.log('3. Grant Consent');
            console.log('4. View My Consents');
            console.log('5. Revoke Consent');
            console.log('6. Exit');
            const choice = readline.question('Select an option: ');
            switch (choice) {
                case '1':
                    await this.viewMyCertificates();
                    break;
                case '2':
                    await this.viewCertificateDetails();
                    break;
                case '3':
                    await this.grantConsent();
                    break;
                case '4':
                    await this.viewMyConsents();
                    break;
                case '5':
                    await this.revokeConsent();
                    break;
                case '6':
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
    const studentId = process.env.STUDENT_ID || 'STU001';
    const studentName = process.env.STUDENT_NAME || 'Alice Johnson';
    const wallet = new StudentWallet(studentId, studentName);
    await wallet.run();
}
main().catch(error => {
    console.error('Application error:', error);
    process.exit(1);
});
