/**
 * Admin Setup Script
 * Run this script to promote a user to admin role
 * 
 * Usage: 
 * 1. Set the email of the user you want to promote
 * 2. Run: npx ts-node --skip-project scripts/promote-admin.ts
 * 
 * OR use Firebase Console:
 * 1. Go to Firestore → users collection
 * 2. Find the user document
 * 3. Change "role" field from "free" to "admin"
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Configuration - change this to the email you want to promote
const ADMIN_EMAIL = 'gopalakrishnachennu@gmail.com';

async function promoteToAdmin() {
    try {
        // Initialize Firebase Admin (requires service account)
        // For local development, you can use the emulator or download service account key

        // Option 1: Using environment variable (recommended)
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            initializeApp();
        } else {
            // Option 2: If you have a service account JSON file
            // Download from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
            console.log(`
=================================
ADMIN PROMOTION HELPER
=================================

To promote a user to admin, you have two options:

OPTION 1: Firebase Console (Easiest)
-------------------------------------
1. Go to: https://console.firebase.google.com/project/post-designer-5bf55/firestore
2. Click on "users" collection
3. Find the document with email: ${ADMIN_EMAIL}
4. Click on it and change "role" from "free" to "admin"
5. Save

OPTION 2: Run this script with service account
----------------------------------------------
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as ./service-account.json
4. Run: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npx ts-node scripts/promote-admin.ts

After making yourself admin, you'll have access to:
- User Management (/admin/users)
- Analytics Dashboard (/admin/analytics)
- System Logs (/admin/logs)
- All Admin Settings (/admin)
`);
            return;
        }

        const db = getFirestore();

        // Find user by email
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', ADMIN_EMAIL).get();

        if (snapshot.empty) {
            console.log(`❌ No user found with email: ${ADMIN_EMAIL}`);
            console.log('Make sure you have registered first at http://localhost:3000/register');
            return;
        }

        // Promote to admin
        const userDoc = snapshot.docs[0];
        await userDoc.ref.update({
            role: 'admin',
            tier: 'enterprise', // Give full access
        });

        console.log(`✅ Successfully promoted ${ADMIN_EMAIL} to admin!`);
        console.log(`
You now have access to:
- /admin - Main admin panel
- /admin/users - User management
- /admin/analytics - Analytics dashboard
- /admin/logs - System logs

Refresh your browser to see the admin navigation.
`);

    } catch (error) {
        console.error('Error:', error);
    }
}

promoteToAdmin();
