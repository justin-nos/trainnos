import {FieldValue} from "firebase-admin/firestore";
import {getAdminSession} from "../../../auth";
import {initializeAdminApp} from "../../../../lib/initFirebaseAdmin";

const firestoreDB = initializeAdminApp();
const STATUSES = ["new", "contacted", "booked", "not-a-fit"];
// Firestore's gRPC code for a missing document.
const NOT_FOUND = 5;

export async function PATCH(req, {params}) {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  const {id} = await params;
  let status;
  try {
    ({status} = await req.json());
  } catch {
    return Response.json({error: "Invalid JSON"}, {status: 400});
  }
  if (!STATUSES.includes(status)) {
    return Response.json({error: "Invalid status"}, {status: 400});
  }
  try {
    await firestoreDB
      .collection("leads")
      .doc(id)
      .update({status, updatedAt: FieldValue.serverTimestamp()});
  } catch (error) {
    if (error.code === NOT_FOUND) {
      return Response.json({error: "Lead not found"}, {status: 404});
    }
    console.error("Error updating lead status", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
  return Response.json({success: true});
}
