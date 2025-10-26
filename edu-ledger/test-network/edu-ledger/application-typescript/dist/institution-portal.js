"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline-sync");
const fabric_network_1 = require("fabric-network");
const path = require("path");
const fs = require("fs");
/**
 * Institution Portal Application
 * Allows educational institutions to issue and manage certificates
 */
class InstitutionPortal {
    constructor(institutionId, institutionName) {
        this.contract = null;
        this.gateway = new fabric_network_1.Gateway();
        this.institutionId = institutionId;
        this.institutionName = institutionName;
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
            const identity = await wallet.get('institutionUser');
            if (!identity) {
                console.log('An identity for the user "institutionUser" does not exist in the wallet');
                console.log('Run the enrollment script before running this application');
                return;
            }
            // Connect to gateway
            await this.gateway.connect(ccp, {
                wallet,
                identity: 'institutionUser',
                discovery: { enabled: true, asLocalhost: true }
            });
            // Get network and contract
            const network = await this.gateway.getNetwork('mychannel');
            this.contract = network.getContract('edu-ledger');
            console.log(`Connected as ${this.institutionName} (${this.institutionId})`);
        }
        catch (error) {
            console.error(`Failed to connect: ${error}`);
            throw error;
        }
    }
    async issueCertificate() {
        if (!this.contract) {
            console.log('Not connected to network');
            return;
        }
        try {
            console.log('\n--- Issue New Certificate ---');
            const certId = readline.question('Certificate ID: ');
            const studentId = readline.question('Student ID: ');
            const studentName = readline.question('Student Name: ');
            const degree = readline.question('Degree: ');
            const major = readline.question('Major: ');
            const gpa = parseFloat(readline.question('GPA: '));
            const graduationDate = readline.question('Graduation Date (YYYY-MM-DD): ');
            const certHash = readline.question('Certificate Hash: ');
            const metadata = readline.question('Metadata (JSON string, or press enter for empty): ') || '{}';
            // Convert date to ISO format
            const gradDateISO = new Date(graduationDate).toISOString();
            await this.contract.submitTransaction('IssueCertificate', certId, studentId, studentName, this.institutionId, this.institutionName, degree, major, gpa.toString(), gradDateISO, certHash, metadata);
            console.log('✓ Certificate issued successfully');
        }
        catch (error) {
            console.error(`Failed to issue certificate: ${error}`);
        }
    }
    async viewCertificate() {
        if (!this.contract) {
            console.log('Not connected to network');
            return;
        }
        try {
            const certId = readline.question('Enter Certificate ID: ');
            const result = await this.contract.evaluateTransaction('ReadCertificate', certId);
            const certificate = JSON.parse(result.toString());
            console.log('\n--- Certificate Details ---');
            console.log(JSON.stringify(certificate, null, 2));
        }
        catch (error) {
            console.error(`Failed to read certificate: ${error}`);
        }
    }
    async revokeCertificate() {
        if (!this.contract) {
            console.log('Not connected to network');
            return;
        }
        try {
            const certId = readline.question('Enter Certificate ID to revoke: ');
            const confirm = readline.question(`Are you sure you want to revoke ${certId}? (yes/no): `);
            if (confirm.toLowerCase() === 'yes') {
                await this.contract.submitTransaction('RevokeCertificate', certId);
                console.log('✓ Certificate revoked successfully');
            }
            else {
                console.log('Revocation cancelled');
            }
        }
        catch (error) {
            console.error(`Failed to revoke certificate: ${error}`);
        }
    }
    async listInstitutionCertificates() {
        if (!this.contract) {
            console.log('Not connected to network');
            return;
        }
        try {
            const result = await this.contract.evaluateTransaction('QueryCertificatesByInstitution', this.institutionId);
            const certificates = JSON.parse(result.toString());
            console.log(`\n--- Certificates issued by ${this.institutionName} ---`);
            if (certificates.length === 0) {
                console.log('No certificates found');
            }
            else {
                certificates.forEach((cert, index) => {
                    console.log(`\n${index + 1}. ${cert.id}`);
                    console.log(`   Student: ${cert.studentName} (${cert.studentId})`);
                    console.log(`   Degree: ${cert.degree} in ${cert.major}`);
                    console.log(`   Status: ${cert.status}`);
                });
            }
        }
        catch (error) {
            console.error(`Failed to list certificates: ${error}`);
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
            console.log('\n=== Institution Portal ===');
            console.log('1. Issue Certificate');
            console.log('2. View Certificate');
            console.log('3. Revoke Certificate');
            console.log('4. List All Certificates');
            console.log('5. Exit');
            const choice = readline.question('Select an option: ');
            switch (choice) {
                case '1':
                    await this.issueCertificate();
                    break;
                case '2':
                    await this.viewCertificate();
                    break;
                case '3':
                    await this.revokeCertificate();
                    break;
                case '4':
                    await this.listInstitutionCertificates();
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
    const institutionId = process.env.INSTITUTION_ID || 'INST001';
    const institutionName = process.env.INSTITUTION_NAME || 'MIT';
    const portal = new InstitutionPortal(institutionId, institutionName);
    await portal.run();
}
main().catch(error => {
    console.error('Application error:', error);
    process.exit(1);
});
