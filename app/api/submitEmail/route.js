"use server";
import {initializeAdminApp} from "../../../lib/initFirebaseAdmin";

const firestoreDB = initializeAdminApp();

export async function POST(req) {
  /* try {
    const data = await req.json();
    console.log(data.email);
    return Response.json({
      success: true,
      message: "Received the json",
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return Response.json({error: "Server Error", status: 500});
  } */
  try {
    const data = await req.json();
    await firestoreDB.collection("emails").doc(data.email).set({
      email: data.email,
      name: data.name,
    });
    return Response.json({
      success: true,
      message: "Email added successfully.",
      status: 200,
    });
  } catch (error) {
    console.error("Error writing to Firestore", error);
    return Response.json({error: "Server Error.", status: 500});
  }
}
