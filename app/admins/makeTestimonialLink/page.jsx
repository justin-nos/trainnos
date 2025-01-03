"use client";
import {useRouter} from "next/navigation";
import {useContext, useEffect, useState} from "react";
import {AdminContext} from "../../../lib/context";
import Link from "next/link";
import randomId from "random-id";
import {firestore} from "../../../lib/firebase";

export default function TestimonialLinkCreation({}) {
  const [returncontent, setreturnContent] = useState(<></>);
  const {admin, adminLevel} = useContext(AdminContext);
  const checkSource = useAdminReroute();

  async function createAdminLink(e) {
    e.preventDefault();
    const randomconst = randomId(30, "aA0");
    setreturnContent(<a>https://trainnos.com/admin/signup/{randomconst}</a>);
    firestore.collection("testimonialKeys").doc(`${randomconst}`).set({});
  }
  const CreateAdminPage = () => {
    return (
      <button
        onClick={e => {
          createAdminLink(e);
        }}
      >
        Create an admin link
      </button>
    );
  };
  return <>{returncontent}</>;
}
