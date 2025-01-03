import {usePathValidation} from "../../../../lib/hooks";
import {doc, getDoc} from "firebase/firestore";
import {firestoreDB} from "../../../../lib/firebase";

interface DBFetchError extends Error {
  code: number;
}

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

  return validAuth ? (
    <h1 className="h-screen place-content-center justify-items-center px-12">{`Blog Post ${validationSlug}`}</h1>
  ) : (
    <h1>You can't view this</h1>
  );
}
