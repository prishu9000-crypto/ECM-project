import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isConfigured } from '../lib/firebase';
import { DEMO_USERS } from './demoSeedService';

const LOCAL_STORAGE_USER_KEY = 'ecm_auth_user';

/**
 * Signs in user with email & password.
 */
export async function loginUser(email, password) {
  // If demo credentials or Firebase not configured
  if (!isConfigured) {
    const demoUser = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (demoUser) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));
      return { user: demoUser };
    }
    // Allow any demo login if not configured
    const fallbackUser = {
      uid: 'demo_' + Date.now(),
      email,
      fullName: email.split('@')[0],
      role: email.includes('admin') ? 'admin' : (email.includes('coord') ? 'coordinator' : 'student'),
      accountStatus: 'active'
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fallbackUser));
    return { user: fallbackUser };
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Retrieve user profile and role from Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  let profile = { uid: user.uid, email: user.email, role: 'student' };

  if (userDoc.exists()) {
    profile = { ...profile, ...userDoc.data() };
  }

  return { user: profile, firebaseUser: user };
}

/**
 * Registers a new student.
 */
export async function registerStudent(studentData) {
  const { email, password, fullName, rollNumber, department, academicYear, section } = studentData;

  if (!isConfigured) {
    const newStudent = {
      uid: 'student_' + Date.now(),
      email,
      fullName,
      rollNumber,
      department,
      academicYear,
      section,
      role: 'student',
      accountStatus: 'active',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newStudent));
    return { user: newStudent };
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Send email verification
  try {
    await sendEmailVerification(user);
  } catch (err) {
    console.warn('Verification email could not be sent:', err);
  }

  // Create Firestore profile record
  const profile = {
    uid: user.uid,
    fullName,
    email,
    normalizedEmail: email.toLowerCase().trim(),
    rollNumber: (rollNumber || '').toUpperCase().trim(),
    normalizedRollNumber: (rollNumber || '').toUpperCase().trim(),
    department,
    academicYear,
    section,
    role: 'student',
    accountStatus: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, 'users', user.uid), profile);

  return { user: profile };
}

/**
 * Sends a password reset email.
 */
export async function resetPassword(email) {
  if (!isConfigured) {
    return { success: true, message: 'Password reset link simulated in preview mode.' };
  }
  await sendPasswordResetEmail(auth, email);
  return { success: true };
}

/**
 * Logs out current user.
 */
export async function logoutUser() {
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  if (isConfigured && auth) {
    await fbSignOut(auth);
  }
}

/**
 * Subscribes to authentication state changes.
 */
export function subscribeToAuthState(callback) {
  if (!isConfigured) {
    const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (stored) {
      try {
        callback(JSON.parse(stored));
      } catch (e) {
        callback(null);
      }
    } else {
      callback(null);
    }
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        callback({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() });
      } else {
        callback({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'student' });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      callback({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'student' });
    }
  });
}
