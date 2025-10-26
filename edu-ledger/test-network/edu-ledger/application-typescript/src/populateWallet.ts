import { Wallets } from 'fabric-network';
import path = require('path');
import fs = require('fs');

async function main() {
    try {
        // Create wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Org1 Users
        const org1UsersPath = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'users');
        
        // Add Admin
        console.log('\nAdding Admin...');
        const adminCertPath = path.join(org1UsersPath, 'Admin@org1.example.com', 'msp', 'signcerts', 'Admin@org1.example.com-cert.pem');
        const adminKeyDir = path.join(org1UsersPath, 'Admin@org1.example.com', 'msp', 'keystore');
        const adminKeyFiles = fs.readdirSync(adminKeyDir);
        const adminKeyPath = path.join(adminKeyDir, adminKeyFiles[0]);
        
        const adminIdentity = {
            credentials: {
                certificate: fs.readFileSync(adminCertPath, 'utf8'),
                privateKey: fs.readFileSync(adminKeyPath, 'utf8'),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', adminIdentity);
        console.log('✓ Successfully added admin to wallet');

        // Add User1 as studentUser
        console.log('\nAdding studentUser (User1)...');
        const userCertPath = path.join(org1UsersPath, 'User1@org1.example.com', 'msp', 'signcerts', 'User1@org1.example.com-cert.pem');
        const userKeyDir = path.join(org1UsersPath, 'User1@org1.example.com', 'msp', 'keystore');
        const userKeyFiles = fs.readdirSync(userKeyDir);
        const userKeyPath = path.join(userKeyDir, userKeyFiles[0]);
        
        const studentIdentity = {
            credentials: {
                certificate: fs.readFileSync(userCertPath, 'utf8'),
                privateKey: fs.readFileSync(userKeyPath, 'utf8'),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('studentUser', studentIdentity);
        console.log('✓ Successfully added studentUser to wallet');

        // Add User1 as institutionUser too
        await wallet.put('institutionUser', studentIdentity);
        console.log('✓ Successfully added institutionUser to wallet');

        // Org2 Users
        const org2UsersPath = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org2.example.com', 'users');
        
        // Add Org2 Admin
        console.log('\nAdding Org2 Admin...');
        const org2AdminCertPath = path.join(org2UsersPath, 'Admin@org2.example.com', 'msp', 'signcerts', 'Admin@org2.example.com-cert.pem');
        const org2AdminKeyDir = path.join(org2UsersPath, 'Admin@org2.example.com', 'msp', 'keystore');
        const org2AdminKeyFiles = fs.readdirSync(org2AdminKeyDir);
        const org2AdminKeyPath = path.join(org2AdminKeyDir, org2AdminKeyFiles[0]);
        
        const org2AdminIdentity = {
            credentials: {
                certificate: fs.readFileSync(org2AdminCertPath, 'utf8'),
                privateKey: fs.readFileSync(org2AdminKeyPath, 'utf8'),
            },
            mspId: 'Org2MSP',
            type: 'X.509',
        };
        await wallet.put('org2admin', org2AdminIdentity);
        console.log('✓ Successfully added org2admin to wallet');

        // Add Org2 User1 as verifierUser
        console.log('\nAdding verifierUser (Org2 User1)...');
        const org2UserCertPath = path.join(org2UsersPath, 'User1@org2.example.com', 'msp', 'signcerts', 'User1@org2.example.com-cert.pem');
        const org2UserKeyDir = path.join(org2UsersPath, 'User1@org2.example.com', 'msp', 'keystore');
        const org2UserKeyFiles = fs.readdirSync(org2UserKeyDir);
        const org2UserKeyPath = path.join(org2UserKeyDir, org2UserKeyFiles[0]);
        
        const verifierIdentity = {
            credentials: {
                certificate: fs.readFileSync(org2UserCertPath, 'utf8'),
                privateKey: fs.readFileSync(org2UserKeyPath, 'utf8'),
            },
            mspId: 'Org2MSP',
            type: 'X.509',
        };
        await wallet.put('verifierUser', verifierIdentity);
        console.log('✓ Successfully added verifierUser to wallet');

        console.log('\n========================================');
        console.log('✓ All identities loaded successfully!');
        console.log('========================================');
        console.log('\nYou can now run the applications:');
        console.log('  npm run start:institution');
        console.log('  npm run start:student');
        console.log('  npm run start:verifier');

    } catch (error) {
        console.error(`Failed to populate wallet: ${error}`);
        process.exit(1);
    }
}

main();
