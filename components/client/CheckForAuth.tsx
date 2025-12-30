"use client";
import {useSession} from "next-auth/react";
import {signIn} from "next-auth/react";
import {useEffect, useState} from "react";

export default function AuthCheck({children}: {children: React.ReactNode}) {
  const {data: session, status} = useSession();
  const [isClient, setIsClient] = useState(false);

  // This effect will run only once after the initial render
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log(session);
  }, [session]);

  if (isClient && status === "loading") return null;
  else if (!session && isClient) {
    setTimeout(() => {
      signIn("google");
    }, 500);
    return (
      <div className="w-screen h-screen place-content-center text-center">
        You are not logged in to see this. Redirecting...
      </div>
    );
  } else {
    return children;
  }
}
