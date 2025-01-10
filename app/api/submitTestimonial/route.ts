import {firestoreDB, storage} from "../../../lib/firebase";
import {getDoc, setDoc, doc, deleteDoc} from "firebase/firestore";
import {uploadBytes, ref} from "firebase/storage";
import randomId from "random-id";

export async function POST(request: Request) {
  const formData = await request.formData();
  const postID = randomId(30, "aA0");
  const token = request.headers.get("Authorization");
  console.log(token);

  const tokenDoc = await getDoc(doc(firestoreDB, "adminkeys", token));
  if (!tokenDoc.exists()) {
    return new Response("Invalid token", {status: 401});
  }

  try {
    await setDoc(doc(firestoreDB, "testimonials", postID), {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      title: formData.get("title"),
      text: formData.get("text"),
    });
  } catch (err) {
    console.error("Error when setting Firestore Docs", err);
    return new Response(`Webhook error: ${err.message}`, {status: 500});
  }

  try {
    const photoFile = formData.get("photo") as File;
    let extension = "";

    // Check the file type and set the extension accordingly
    if (photoFile.type === "image/png") {
      extension = ".png";
    } else if (photoFile.type === "image/jpeg") {
      extension = ".jpeg";
    } else {
      // If the file is not a PNG or JPEG, return an error
      return new Response(
        "Invalid file type. Only PNG and JPEG files are allowed.",
        {status: 400}
      );
    }

    const storageRef = ref(storage, `testimonialImages/${postID}${extension}`);

    await uploadBytes(storageRef, photoFile);
    console.log("Uploaded a blob or file!");
  } catch (err) {
    console.error("Error when uploading file to Firebase Storage", err);
    return new Response(`Webhook error: ${err.message}`, {status: 500});
  }

  try {
    // Assuming the token is stored in a document with the same ID as postID
    await deleteDoc(doc(firestoreDB, "adminkeys", token));
    console.log("Token deleted successfully!");
  } catch (err) {
    console.error("Error when deleting token", err);
    return new Response(`Webhook error: ${err.message}`, {status: 500});
  }

  return new Response("Success!!", {status: 200});
}
