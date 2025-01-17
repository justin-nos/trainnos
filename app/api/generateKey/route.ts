"use server";
import * as admin from "firebase-admin";
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
    const authKey = await req.headers.get("Authorization");
    if (authKey === process.env.NEXT_PUBLIC_SERVERFUNCTION_KEY) {
      const data = await req.json();
      console.log(data);
      if (typeof data.adminkey === "string") {
        await firestoreDB.collection("adminkeys").doc(data.adminkey).set({});
        return Response.json({
          success: true,
          message: "Email added successfully.",
          status: 200,
        });
      } else {
        throw new Error("Incorrect data form");
      }
    } else {
      throw new Error("Authorization is wrong!");
    }
  } catch (error) {
    return Response.json({error: error.message, status: 500});
  }
}
