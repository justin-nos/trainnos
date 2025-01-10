"use client";
import {useState, useRef, useEffect} from "react";
import randomId from "random-id";
import {firestoreDB} from "../../../lib/firebase";
import {setDoc, doc} from "firebase/firestore";

export default function TestimonialLinkCreation({}) {
  const [links, SetLinks] = useState([]);
  const refs = useRef([]);
  const parentrefs = useRef([]);

  useEffect(() => {
    console.log(links);
    parentrefs.current = parentrefs.current.slice(0, links.length);
    refs.current = refs.current.slice(0, links.length);
  }, [links]);

  const copyToClipboard = index => {
    if (refs.current[index]) {
      const text = refs.current[index].innerText;
      navigator.clipboard.writeText(text).then(
        () => {
          parentrefs.current[index].className = "hidden";
          alert(`Copied: ${text}`);
        },
        err => {
          console.error("Could not copy text: ", err);
        }
      );
    } else {
      console.error("Ref does not exist for index: ", index);
    }
  };

  async function createAdminLink(e) {
    e.preventDefault();
    const randomconst = randomId(30, "aA0");
    try {
      await setDoc(doc(firestoreDB, "adminkeys", `${randomconst}`), {});
      SetLinks([...links, randomconst]);
    } catch (err) {
      console.error(err);
    }
  }
  const CreateAdminPage = () => {
    return (
      <button
        className="bg-red-500 text-white px-3 py-2 rounded-lg"
        onClick={e => {
          createAdminLink(e);
        }}
      >
        Create an admin link
      </button>
    );
  };
  return (
    <div className="flex flex-col gap-3 bg-gray-300 py-10 px-6">
      <CreateAdminPage></CreateAdminPage>
      {Array.isArray(links) &&
        links.map((link, i) => {
          return (
            <div
              key={link}
              ref={el => (parentrefs.current[i] = el)}
              className="flex flex-row place-items-center"
            >
              <div
                ref={el => (refs.current[i] = el)}
                className="mr-2"
              >{`https://trainnos.com/testimonials/create/${link}`}</div>
              <button
                onClick={() => {
                  copyToClipboard(i);
                }}
                className="px-2 py-2 bg-white rounded-2xl"
              >
                Copy
              </button>
            </div>
          );
        })}
    </div>
  );
}
