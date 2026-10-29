import {supabaseAdmin} from "../../../lib/supabase/admin";

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
    const {error} = await supabaseAdmin()
      .from("email_signups")
      .upsert({email: data.email, name: data.name});
    if (error) throw error;
    return Response.json({
      success: true,
      message: "Email added successfully.",
      status: 200,
    });
  } catch (error) {
    console.error("Error saving email signup", error);
    return Response.json({error: "Server Error.", status: 500});
  }
}
