import {getAdminSession} from "../../../auth";
import {initializeAdminApp} from "../../../../lib/initFirebaseAdmin";

const firestoreDB = initializeAdminApp();
export const dynamic = "force-dynamic";

// How many leads nobody has followed up yet.
export async function GET() {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  try {
    const snap = await firestoreDB
      .collection("leads")
      .where("status", "==", "new")
      .count()
      .get();
    return Response.json({count: snap.data().count});
  } catch (error) {
    console.error("Error counting new leads", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
}
