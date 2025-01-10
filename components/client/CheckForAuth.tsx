"use client";

import {useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import {signIn} from "next-auth/react";
import {useEffect, useState} from "react";

export default function AuthCheck({children}: {children: React.ReactNode}) {
  const {data: session, status} = useSession();
  const [returnContent, setReturnContent] = useState(
    <div className="w-screen h-screen place-content-center animate-pulse text-center">
      Loading...
    </div>
  );

  useEffect(() => {
    console.log(
      "Status changed... checking if the user is authenticated => status is ...  " +
        status
    );
    if (status === "authenticated") {
      setReturnContent(<>{children}</>);
    } else if (status === "loading") {
    } else {
      console.log("status Unauthenticated");
      console.log(status);
      setTimeout(() => {
        signIn("google");
      }, 500);
      setReturnContent(
        <div className="w-screen h-screen place-content-center text-center">
          You are not logged in to see this. Redirecting...
        </div>
      );
    }
  }, [status]);
  return returnContent;
}
