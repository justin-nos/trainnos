import {redirect} from "next/navigation";
import TestimonialForm from "../../../../components/client/TestimonialForm";
import FunctionAfterForm from "../../../../components/server/FormFunction";
import {initializeAdminApp} from "../../../../lib/initFirebaseAdmin";

const firestoreDB = initializeAdminApp();

export default async function Page({params}) {
  let validAuth = undefined;
  const {validationSlug} = await params;
  try {
    // Await the slug from params
    if (!validationSlug) {
      throw new Error("No slug provided");
    }
    // Use the slug to fetch data
    const docSnap = firestoreDB
      .collection("adminkeys")
      .doc(validationSlug)
      .get();

    if (!(await docSnap).exists) {
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
