import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";
import {getAuth} from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
const firebaseConfig = {
  apiKey: "AIzaSyCMIjQFq0GKDkNByGePssXOF2aFJteZO1g",
  authDomain: "nos-training-facility.firebaseapp.com",
  databaseURL: "https://nos-training-facility-default-rtdb.firebaseio.com",
  projectId: "nos-training-facility",
  storageBucket: "nos-training-facility.appspot.com",
  messagingSenderId: "274695028107",
  appId: "1:274695028107:web:59c5efa4e3fd2f612d438e",
  measurementId: "G-NPBRQ7310N",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
export const firestoreDB = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
