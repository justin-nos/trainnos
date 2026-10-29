import {randomUUID} from "node:crypto";
import {getAdminSession} from "../../../../lib/admin/session";
import {isUuid} from "../../../../lib/analytics/schema.mjs";
import {VARIANTS, checkUpload, objectPath} from "../../../../lib/media/rules.mjs";
import {signUpload} from "../../../../lib/media/storage";

export const dynamic = "force-dynamic";

// Returns a short-lived URL the browser PUTs the file to directly, since
// Vercel caps function request bodies at 4.5 MB. Pass an existing `id` to
// put a video's poster in the same folder as the video.
export async function POST(req) {
  if (!(await getAdminSession())) {
    return Response.json({error: "Unauthorized"}, {status: 401});
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({error: "Invalid JSON"}, {status: 400});
  }
  const {purpose, contentType, size, variant = "original"} = body ?? {};
  const check = checkUpload({purpose, contentType, size});
  if (!check.ok) return Response.json({error: check.error}, {status: 400});
  if (!VARIANTS.includes(variant)) {
    return Response.json({error: "Invalid variant"}, {status: 400});
  }
  if (body.id !== undefined && !isUuid(body.id)) {
    return Response.json({error: "Invalid id"}, {status: 400});
  }
  const id = body.id ?? randomUUID();
  const path = objectPath({purpose, id, ext: check.ext, variant});
  try {
    const uploadUrl = await signUpload({path, contentType});
    return Response.json({id, path, uploadUrl});
  } catch (error) {
    console.error("Error signing upload", error);
    return Response.json({error: "Server Error"}, {status: 500});
  }
}
