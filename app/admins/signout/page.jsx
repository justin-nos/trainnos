"use client";
import {authAdmins} from "../../../lib/firebaseAdmins";
import {signOut} from "firebase/auth";
import {useRouter} from "next/navigation";
export default function SignOut({}) {
  const router = useRouter();
  signOut(authAdmins)
    .then(() => {
      // Sign-out successful.
      console.log("SignOut Successful");
      router.push("/");
    })
    .catch(error => {
      // An error happened.
    });
  return <div>Signing Out..</div>;
}
