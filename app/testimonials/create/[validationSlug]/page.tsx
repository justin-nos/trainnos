import {usePathValidation} from "../../../../lib/hooks";
import {doc, getDoc} from "firebase/firestore";
import {firestoreDB} from "../../../../lib/firebase";
import {redirect} from "next/navigation";
import TestimonialForm from "../../../../components/client/TestimonialForm";
import FunctionAfterForm from "../../../../components/server/FormFunction";

export default async function Page({
  params,
}: {
  params: Promise<{validationSlug: string}>;
}) {
  let validAuth = undefined;
  const {validationSlug} = await params;
  try {
    // Await the slug from params
    if (!validationSlug) {
      throw new Error("No slug provided");
    }
    // Use the slug to fetch data
    const docRef = doc(firestoreDB, "adminkeys", validationSlug);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      validAuth = false;
    } else {
      validAuth = true;
    }
  } catch (error) {
    validAuth = false;
    throw new Error(
      `Failed to retrieve document: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  if (validAuth) {
    return <TestimonialForm validSlug={validationSlug} />;
  } else {
    console.log("Redirecting...");
    redirect("/");
  }
}
