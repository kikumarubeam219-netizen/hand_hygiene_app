// Firebase設定
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase設定
const firebaseConfig = {
    apiKey: "AIzaSyC1h86G4eR1cAIpN7fYeG8_xYXCPeOJYwQ",
    authDomain: "hand-5-moments-tracker.firebaseapp.com",
    projectId: "hand-5-moments-tracker",
    storageBucket: "hand-5-moments-tracker.firebasestorage.app",
    messagingSenderId: "471940000726",
    appId: "1:471940000726:web:0e49baa11757de82ecd277"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// 認証
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);

export { onAuthStateChanged };
export type { User };

export default app;
