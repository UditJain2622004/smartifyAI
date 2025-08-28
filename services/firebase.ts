// Centralized Firebase initialization and helpers (placeholders for config). 
// Replace placeholders in firebaseConfig with your real values in your environment.

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  Firestore,
  increment,
} from 'firebase/firestore';

// You can also use Vite env vars via import.meta.env, but we maintain a config object for clarity.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'YOUR_FIREBASE_AUTH_DOMAIN',
  projectId: process.env.FIREBASE_PROJECT_ID || 'YOUR_FIREBASE_PROJECT_ID',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'YOUR_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
  appId: process.env.FIREBASE_APP_ID || 'YOUR_FIREBASE_APP_ID',
};

let app: FirebaseApp | null = null;
let authInitialized = false;
let dbInitialized = false;

export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseAuth = () => {
  const app = getFirebaseApp();
  if (!authInitialized) {
    authInitialized = true;
  }
  return getAuth(app);
};

export const getFirestoreDb = (): Firestore => {
  const app = getFirebaseApp();
  if (!dbInitialized) {
    dbInitialized = true;
  }
  return getFirestore(app);
};

// --- Auth helpers ---
export const signInWithGooglePopup = async (): Promise<User> => {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signOutUser = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  await signOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
};

// --- Firestore data helpers ---
export interface StoredUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: any;
}

export const upsertUserProfile = async (user: User): Promise<void> => {
  const db = getFirestoreDb();
  const ref = doc(db, 'users', user.uid);
  await setDoc(ref, {
    uid: user.uid,
    displayName: user.displayName || null,
    email: user.email || null,
    photoURL: user.photoURL || null,
    createdAt: Timestamp.now(),
  }, { merge: true });
};

export interface StoredClosetItem {
  id: string; // app id
  uid: string; // owner uid
  imageDataUrl: string; // data URL (base64)
  mimeType: string;
  tags: string[];
  createdAt: any;
}

export const addClosetItem = async (uid: string, item: { id: string; image: string; mimeType: string; tags: string[]; }): Promise<void> => {
  const db = getFirestoreDb();
  const col = collection(db, 'users', uid, 'closet');
  await setDoc(doc(col, item.id), {
    id: item.id,
    uid,
    imageDataUrl: item.image,
    mimeType: item.mimeType,
    tags: item.tags,
    createdAt: Timestamp.now(),
  });
};

export const saveUserFaceImage = async (uid: string, image: { data: string; mimeType: string }): Promise<void> => {
  const db = getFirestoreDb();
  const ref = doc(db, 'users', uid, 'profile', 'face');
  const dataUrl = `data:${image.mimeType};base64,${image.data}`;
  await setDoc(ref, {
    uid,
    mimeType: image.mimeType,
    imageDataUrl: dataUrl,
    updatedAt: Timestamp.now(),
  });
};

// --- Retrieval helpers ---
const parseDataUrl = (dataUrl: string): { data: string; mimeType: string } | null => {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const parts = dataUrl.split(',');
  if (parts.length < 2) return null;
  const mimeTypeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream';
  return { data: parts[1], mimeType };
};

export const getUserFaceImageForUser = async (uid: string): Promise<{ data: string; mimeType: string } | null> => {
  const db = getFirestoreDb();
  const ref = doc(db, 'users', uid, 'profile', 'face');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  const parsed = parseDataUrl(data.imageDataUrl);
  return parsed;
};

export const getClosetItemsForUser = async (
  uid: string
): Promise<Array<{ id: string; image: string; mimeType: string; tags: string[] }>> => {
  const db = getFirestoreDb();
  const col = collection(db, 'users', uid, 'closet');
  const snaps = await getDocs(col);
  const result: Array<{ id: string; image: string; mimeType: string; tags: string[] }> = [];
  snaps.forEach(docSnap => {
    const d = docSnap.data() as any;
    result.push({
      id: d.id,
      image: d.imageDataUrl,
      mimeType: d.mimeType,
      tags: Array.isArray(d.tags) ? d.tags : [],
    });
  });
  return result;
};

// --- Logging & Metrics helpers ---
export const createGenerationLog = async (
  uid: string,
  payload: Record<string, any>
): Promise<string> => {
  const db = getFirestoreDb();
  const colRef = collection(db, 'users', uid, 'generationLogs');
  const docRef = await addDoc(colRef, {
    status: 'started',
    createdAt: Timestamp.now(),
    ...payload,
  });
  return docRef.id;
};

export const updateGenerationLog = async (
  uid: string,
  logId: string,
  updates: Record<string, any>
): Promise<void> => {
  const db = getFirestoreDb();
  const ref = doc(db, 'users', uid, 'generationLogs', logId);
  await setDoc(ref, {
    updatedAt: Timestamp.now(),
    ...updates,
  }, { merge: true });
};

export const incrementGenerationCounters = async (
  uid: string,
  fields: { started?: number; success?: number; error?: number }
): Promise<void> => {
  const db = getFirestoreDb();
  const started = fields.started || 0;
  const success = fields.success || 0;
  const error = fields.error || 0;

  // Per-user counters
  const userCountersRef = doc(db, 'users', uid, 'metrics', 'counters');
  await setDoc(userCountersRef, {
    totalGenerations: increment(started),
    totalSuccess: increment(success),
    totalFailures: increment(error),
    updatedAt: Timestamp.now(),
  }, { merge: true });

  // Global counters
  const globalCountersRef = doc(db, 'analytics', 'counters');
  await setDoc(globalCountersRef, {
    totalGenerations: increment(started),
    totalSuccess: increment(success),
    totalFailures: increment(error),
    updatedAt: Timestamp.now(),
  }, { merge: true });

  // Daily counters
  const now = new Date();
  const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dailyCountersRef = doc(db, 'analytics', 'daily', dayKey);
  await setDoc(dailyCountersRef, {
    date: dayKey,
    totalGenerations: increment(started),
    totalSuccess: increment(success),
    totalFailures: increment(error),
    updatedAt: Timestamp.now(),
  }, { merge: true });
};
