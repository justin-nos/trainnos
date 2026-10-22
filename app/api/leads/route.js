import {getAdminSession} from "../../auth";
import {initializeAdminApp} from "../../../lib/initFirebaseAdmin";

const firestoreDB = initializeAdminApp();
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  try {
    const snap = await firestoreDB
      .collection("leads")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    const leads = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate().toISOString() ?? null,
      };
    });
    return Response.json({leads});
  } catch (error) {
    console.error("Error reading leads from Firestore", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
}
