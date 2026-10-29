import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {supabaseAdmin} from "../../../lib/supabase/admin";

const EXTENSIONS = {"image/png": ".png", "image/jpeg": ".jpeg"};

export async function POST(request: Request) {
  const formData = await request.formData();
  const photoFile = formData.get("photo");
  if (!(photoFile instanceof File) || !EXTENSIONS[photoFile.type]) {
    return new Response(
      "Invalid file type. Only PNG and JPEG files are allowed.",
      {status: 400}
    );
  }

  // Consuming the link up front means two submits can't both use it.
  const supabase = supabaseAdmin();
  const token = request.headers.get("Authorization") ?? "";
  const {data: consumed, error: tokenError} = await supabase
    .from("testimonial_links")
    .delete()
    .eq("token", token)
    .select("token");
  if (tokenError) {
    console.error("Error checking testimonial link", tokenError);
    return new Response("Server Error", {status: 500});
  }
  if (!consumed.length) return new Response("Invalid token", {status: 401});

  const postID = randomUUID();
  const imagePath = `testimonialImages/${postID}${EXTENSIONS[photoFile.type]}`;
  try {
    const {error: uploadError} = await supabase.storage
      .from("media")
      .upload(imagePath, photoFile, {contentType: photoFile.type});
    if (uploadError) throw uploadError;
    const {error} = await supabase.from("testimonials").insert({
      id: postID,
      first_name: formData.get("firstName"),
      last_name: formData.get("lastName"),
      title: formData.get("title"),
      text: formData.get("text"),
      image_path: imagePath,
    });
    if (error) throw error;
  } catch (err) {
    console.error("Error saving testimonial", err);
    // Give the link back so the person can try again.
    await supabase.from("testimonial_links").insert({token});
    return new Response(`Webhook error: ${err.message}`, {status: 500});
  }

  revalidatePath("/testimonials");
  return new Response("Success!!", {status: 200});
}
