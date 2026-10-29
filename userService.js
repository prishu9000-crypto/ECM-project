import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, isConfigured } from '../lib/firebase';
import {
  DEFAULT_ADMINS,
  DEFAULT_COORDINATORS,
  DEFAULT_STUDENTS
} from './demoSeedService';

const STORAGE_KEYS = {
  admin: 'ecm_users_admin',
  coordinator: 'ecm_users_coordinator',
  student: 'ecm_users_student'
};

function getLocalUsers(role) {
  const key = STORAGE_KEYS[role];
  if (!key) return [];
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) { }
  }

  // Initial defaults
  if (role === 'admin') return [...DEFAULT_ADMINS];
  if (role === 'coordinator') return [...DEFAULT_COORDINATORS];
  if (role === 'student') return [...DEFAULT_STUDENTS];
  return [];
}

function saveLocalUsers(role, users) {
  const key = STORAGE_KEYS[role];
  if (key) {
    localStorage.setItem(key, JSON.stringify(users));
  }
}

/**
 * Fetch all users by role ('admin' | 'coordinator' | 'student').
 */
export async function getUsersByRole(role) {
  if (!isConfigured) {
    return getLocalUsers(role);
  }

  try {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const snap = await getDocs(q);
    if (snap.empty) {
      return getLocalUsers(role);
    }
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch (err) {
    console.warn(`Firestore get users by role '${role}' error, using fallback:`, err);
    return getLocalUsers(role);
  }
}

/**
 * Add a new user (admin, coordinator, or student).
 */
export async function addUser(userData) {
  const { role = 'student' } = userData;

  if (!isConfigured) {
    const users = getLocalUsers(role);

    // Check duplicate email
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error(`A user with email '${userData.email}' already exists.`);
    }

    // Check duplicate roll number for students
    if (role === 'student' && userData.rollNumber) {
      if (users.some(u => u.rollNumber?.toUpperCase() === userData.rollNumber?.toUpperCase())) {
        throw new Error(`A student with roll number '${userData.rollNumber}' already exists.`);
      }
    }

    const newUser = {
      uid: `${role}_${Date.now()}`,
      ...userData,
      email: userData.email.trim(),
      normalizedEmail: userData.email.toLowerCase().trim(),
      accountStatus: userData.accountStatus || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (role === 'student') {
      newUser.rollNumber = (userData.rollNumber || '').toUpperCase().trim();
      newUser.registeredEventsCount = 0;
      newUser.attendedEventsCount = 0;
      newUser.totalVerifiedHours = '0.00';
    } else if (role === 'coordinator') {
      newUser.assignedEventsCount = 0;
    }

    users.unshift(newUser);
    saveLocalUsers(role, users);
    return newUser;
  }

  const userRef = doc(collection(db, 'users'));
  const payload = {
    uid: userRef.id,
    ...userData,
    email: userData.email.trim(),
    normalizedEmail: userData.email.toLowerCase().trim(),
    accountStatus: userData.accountStatus || 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(userRef, payload);
  return { uid: userRef.id, ...payload };
}

/**
 * Update an existing user.
 */
export async function updateUser(uid, role, updates) {
  if (!isConfigured) {
    const users = getLocalUsers(role);
    const index = users.findIndex(u => u.uid === uid);
    if (index === -1) throw new Error('User not found.');

    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveLocalUsers(role, users);
    return users[index];
  }

  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });
  return { uid, ...updates };
}

/**
 * Toggle user account status (active <-> suspended).
 */
export async function toggleUserStatus(uid, role, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  return updateUser(uid, role, { accountStatus: newStatus });
}

/**
 * Delete / Remove a user permanently.
 */
export async function deleteUser(uid, role) {
  if (!isConfigured) {
    const users = getLocalUsers(role);
    const filtered = users.filter(u => u.uid !== uid);
    saveLocalUsers(role, filtered);
    return true;
  }

  await deleteDoc(doc(db, 'users', uid));
  return true;
}
