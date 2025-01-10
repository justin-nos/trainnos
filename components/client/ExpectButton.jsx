"use client";
import Link from "next/link";

export default function ExpectButton({children}) {
  return (
    <Link
      href={"/whattoexpect"}
      className="my-4 mx-3 px-3 py-2 bg-amber-200 font-sans font-medium"
    >
      What to Expect
      {children}
    </Link>
  );
}
