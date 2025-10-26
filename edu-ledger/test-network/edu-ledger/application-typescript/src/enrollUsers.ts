import { Wallets, Gateway } from 'fabric-network';
import FabricCAServices = require('fabric-ca-client');
import path = require('path');
import fs = require('fs');

async function main() {
    try {
        // Load connection profile
        const ccpPath = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create CA client
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Enroll admin
        console.log('\nEnrolling admin user...');
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('✓ Successfully enrolled admin user and imported it into the wallet');

        // Register and enroll application users
        const adminUser = await wallet.get('admin');
        const provider = wallet.getProviderRegistry().getProvider(adminUser!.type);
        const adminUserContext = await provider.getUserContext(adminUser!, 'admin');

        // Register institution user
        console.log('\nRegistering institutionUser...');
        const institutionSecret = await ca.register({
            enrollmentID: 'institutionUser',
            enrollmentSecret: '',
            role: 'client',
            affiliation: 'org1.department1',
            maxEnrollments: -1
        }, adminUserContext);
        
        const institutionEnrollment = await ca.enroll({ enrollmentID: 'institutionUser', enrollmentSecret: institutionSecret });
        const institutionIdentity = {
            credentials: {
                certificate: institutionEnrollment.certificate,
                privateKey: institutionEnrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('institutionUser', institutionIdentity);
        console.log('✓ Successfully registered and enrolled institutionUser');

        // Register student user
        console.log('\nRegistering studentUser...');
        const studentSecret = await ca.register({
            enrollmentID: 'studentUser',
            enrollmentSecret: '',
            role: 'client',
            affiliation: 'org1.department1',
            maxEnrollments: -1
        }, adminUserContext);
        
        const studentEnrollment = await ca.enroll({ enrollmentID: 'studentUser', enrollmentSecret: studentSecret });
        const studentIdentity = {
            credentials: {
                certificate: studentEnrollment.certificate,
                privateKey: studentEnrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('studentUser', studentIdentity);
        console.log('✓ Successfully registered and enrolled studentUser');

        // Register verifier user (Org2)
        const ccpPath2 = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org2.example.com', 'connection-org2.json');
        const ccp2 = JSON.parse(fs.readFileSync(ccpPath2, 'utf8'));
        
        const caInfo2 = ccp2.certificateAuthorities['ca.org2.example.com'];
        const caTLSCACerts2 = caInfo2.tlsCACerts.pem;
        const ca2 = new FabricCAServices(caInfo2.url, { trustedRoots: caTLSCACerts2, verify: false }, caInfo2.caName);
        
        console.log('\nEnrolling Org2 admin...');
        const enrollment2 = await ca2.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity2 = {
            credentials: {
                certificate: enrollment2.certificate,
                privateKey: enrollment2.key.toBytes(),
            },
            mspId: 'Org2MSP',
            type: 'X.509',
        };
        await wallet.put('org2admin', x509Identity2);
        console.log('✓ Successfully enrolled Org2 admin');

        const org2AdminUser = await wallet.get('org2admin');
        const org2AdminUserContext = await provider.getUserContext(org2AdminUser!, 'org2admin');

        console.log('\nRegistering verifierUser...');
        const verifierSecret = await ca2.register({
            enrollmentID: 'verifierUser',
            enrollmentSecret: '',
            role: 'client',
            affiliation: 'org2.department1',
            maxEnrollments: -1
        }, org2AdminUserContext);
        
        const verifierEnrollment = await ca2.enroll({ enrollmentID: 'verifierUser', enrollmentSecret: verifierSecret });
        const verifierIdentity = {
            credentials: {
                certificate: verifierEnrollment.certificate,
                privateKey: verifierEnrollment.key.toBytes(),
            },
            mspId: 'Org2MSP',
            type: 'X.509',
        };
        await wallet.put('verifierUser', verifierIdentity);
        console.log('✓ Successfully registered and enrolled verifierUser');
        
        console.log('\n========================================');
        console.log('✓ All users enrolled successfully!');
        console.log('========================================');
        console.log('\nYou can now run the applications:');
        console.log('  npm run start:institution');
        console.log('  npm run start:student');
        console.log('  npm run start:verifier');

    } catch (error) {
        console.error(`Failed to enroll users: ${error}`);
        process.exit(1);
    }
}

main();
