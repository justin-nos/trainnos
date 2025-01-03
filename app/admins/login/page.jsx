"use client";
import {useContext, useEffect, useState, useCallback} from "react";
import {AdminContext} from "../../../lib/context";
import {
  googleAuthInstance,
  authAdmins,
  firestoreAdmins,
} from "../../../lib/firebaseAdmins";
import {useRouter} from "next/navigation";
import {useAdminData} from "../../../lib/hooks";
import {FcGoogle} from "react-icons/fc";
import {signInWithPopup, GoogleAuthProvider} from "firebase/auth";
import Link from "next/link";

export default function AdminLogin(props) {
  const {admin, email} = useAdminData();
  const router = useRouter();

  useEffect(() => {
    if (admin != null) {
      console.log("Admin is Signed in!");
      console.log(admin);
      router.push("/admins");
    }
  }, [admin]);

  // 1. admin signed out <SignInButton />
  // 2. admin signed in, but missing email <EmailSubmission />
  // 3. admin signed in, has email <SignOutButton />
  return (
    <main className="grid place-items-center h-screen">
      {admin ? "Successfully signed in!" : <SignInButton />}
    </main>
  );
}

// Sign in with Google button
function SignInButton() {
  const signInWithGoogle = async () => {
    signInWithPopup(authAdmins, googleAuthInstance)
      .then(result => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        console.log(user);
        // IdP data available using getAdditionalUserInfo(result)
        // Create refs for both documents
        const userDoc = doc(firestoreAdmins, "admins", admin.uid);
        const usernameDoc = doc(firestoreAdmins, `emails`, admin.email);

        // Commit both docs together as a batch write.
        const batch = batch(firestoreAdmins);
        batch.set(userDoc, {
          displayName: admin.displayName,
          photoURL: admin.photoURL,
          adminLevel: 0,
        });
        batch.set(usernameDoc, {uid: admin.uid});

        batch.commit();
      })
      .catch(error => {
        // Handle Errors here.
        return <div>There was an Error! {error.message}</div>;
      });
  };
  return (
    <button className="btn-google" onClick={signInWithGoogle}>
      <FcGoogle /> Sign in with Google
    </button>
  );
}

// Sign out button
function SignOutButton() {
  const router = useRouter();
  return (
    <div className="grid place-items-center h-screen">
      <div className="flex flex-row gap-5">
        <Link
          href={"/admins/signout"}
          className="bg-red-500 text-white px-4 py-2"
        >
          Sign Out
        </Link>
        <button
          onClick={() => {
            router.push("/admin/createAdmin");
          }}
          className="bg-red-500 text-white px-4 py-2"
        >
          Button 2
        </button>
      </div>
    </div>
  );
}
