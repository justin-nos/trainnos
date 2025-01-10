"use client";
import {authAdmins, firestoreAdmins} from "./firebaseAdmins";
import {useContext, useEffect, useState} from "react";
import {useAuthState} from "react-firebase-hooks/auth";
import {collection, doc, setDoc, onSnapshot} from "firebase/firestore";
import {AdminContext, AuthContext} from "./context";
import {useRouter} from "next/navigation";
import {onAuthStateChanged} from "firebase/auth";

export function useAdminData() {
  const [admin] = useAuthState(authAdmins);
  const [email, setEmail] = useState(null);
  const [adminLevel, setAdminLevel] = useState(null);

  useEffect(() => {
    // turn off realtime subscription
    let unsubscribe;
    if (admin) {
      const ref = doc(firestoreAdmins, "admins", admin.uid);
      unsubscribe = onSnapshot(ref, doc => {
        console.log("Current data: ", doc.data());
        console.log(admin.email);
        setEmail(admin.email);
        setAdminLevel(doc.data()?.adminLevel);
      });
    } else {
      setEmail(null);
      setAdminLevel(null);
    }

    return unsubscribe;
  }, [admin]);
  return {admin, email, adminLevel};
}

export function usePathValidation(slugCollectionString, slug, redirectPath) {
  const router = useRouter();
  const pathDoc = queryMainDatabaseById(slugCollectionString, slug);
  const [returnComponent, setReturnComponent] = useState(false);
  useEffect(() => {
    if (pathDoc instanceof Error) {
      if (pathDoc.code == 401) {
        console.log("No permission... rerouting");
        router.push(redirectPath);
        setReturnComponent(false);
      } else {
        console.log(pathDoc.message);
      }
    } else {
      setReturnComponent(true);
    }
  }, [pathDoc]);

  return returnComponent;
}
