import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAg0LOLHXkR4iDbgbwINZQ88i0e0FjJH9U",
  authDomain: "sistema-genius.firebaseapp.com",
  projectId: "sistema-genius",
  storageBucket: "sistema-genius.firebasestorage.app",
  messagingSenderId: "501246364383",
  appId: "1:501246364383:web:9cb55ba7e9a1666c61776a"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Firestore with persistence
export const db = initializeFirestore(app, {
  cache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});