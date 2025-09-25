// Script to create admin account in Firebase
// Run this with: node scripts/createAdminAccount.js

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration - using the same config from firebase.ts
const firebaseConfig = {
  apiKey: 'AIzaSyB9OTHfn8ys8kC_9TWikwQegLfb3oJuKpE',
  authDomain: 'keyword-insight-pro.firebaseapp.com',
  projectId: 'keyword-insight-pro',
  storageBucket: 'keyword-insight-pro.appspot.com',
  messagingSenderId: '814882225550',
  appId: '1:814882225550:web:275de97363373b3f3eb8df'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminAccount() {
  const email = 'admin@keywordinsight.com';
  const password = 'Admin@2025!';
  const name = '관리자';

  try {
    console.log('Creating admin account...');

    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('Admin account created successfully. UID:', user.uid);

    // Create admin profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: email,
      name: name,
      plan: 'enterprise',
      role: 'admin',
      createdAt: new Date(),
      usage: {
        searches: 0,
        lastReset: new Date()
      }
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('Admin profile created in Firestore');

    console.log('\n✅ Admin account setup complete!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: admin');
    console.log('Plan: enterprise (unlimited)');

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('❌ Admin account already exists with this email.');
      console.log('You can login with:');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.error('Error creating admin account:', error.message);
    }
  }

  process.exit(0);
}

// Run the function
createAdminAccount();