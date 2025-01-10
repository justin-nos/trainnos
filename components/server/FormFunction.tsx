"use server";

export default async function FunctionAfterForm(
  first: string,
  last: string,
  title: string,
  text: string,
  photo: File
) {
  console.log("From the After Form Function => " + first);
}
