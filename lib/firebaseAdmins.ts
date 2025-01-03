"use client";
import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";
import {getAuth, GoogleAuthProvider} from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
const firebaseConfig = {
  apiKey: "AIzaSyC6pqNz5wURwsnhN0b2LS29YoxCsJj6pCE",
  authDomain: "nosadmins.firebaseapp.com",
  projectId: "nosadmins",
  storageBucket: "nosadmins.firebasestorage.app",
  messagingSenderId: "1037588108377",
  appId: "1:1037588108377:web:32903648b78c29b8cd8d48",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, "admin");
// Initialize Cloud Firestore and get a reference to the service
export const firestoreAdmins = getFirestore(app);
export const authAdmins = getAuth(app);
export const googleAuthInstance = new GoogleAuthProvider();
