"use client";
import {last} from "lodash";
import {useState} from "react";
import {PhotoIcon, UserCircleIcon} from "@heroicons/react/24/solid";

export default function TestimonialForm({validSlug}) {
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    title: "",
    text: "",
    photo: null,
  });

  const handleChange = e => {
    if (e.target.type === "file") {
      setFormState(prevState => ({...prevState, photo: e.target.files[0]}));
    } else {
      setFormState(prevState => ({
        ...prevState,
        [e.target.name]: e.target.value,
      }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(formState).forEach(key => formData.append(key, formState[key]));

    const response = await fetch("/api/submitTestimonial", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: validSlug,
      },
    });

    if (response.ok) {
      // Handle success scenario (redirect, clear form, show message, etc.)
    } else {
      console.log("RRRR");
    }
  };

  return (
    <form onSubmit={handleSubmit} onChange={handleChange}>
      <div className="space-y-12 py-12 px-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base/7 font-semibold text-gray-900">
            Testimonial
          </h2>
          <p className="mt-1 text-sm/6 text-gray-600">
            We are so thankful for you. We value your input highly, and we
            review all of these. Also, this testimonial will be displayed
            publicly so be careful what you share.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label
                htmlFor="firstName"
                className="block text-sm/6 font-medium text-gray-900"
              >
                First Name
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-red-500">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="First Name"
                    className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                  />
                </div>
              </div>
            </div>
            <div className="sm:col-span-4">
              <label
                htmlFor="lastName"
                className="block text-sm/6 font-medium text-gray-900"
              >
                Last Name
              </label>
              <div className="mt-2">
                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-red-500">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="First Name"
                    className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                  />
                </div>
              </div>
            </div>
            <div className="col-span-full">
              <label
                htmlFor="TitleofTestimony"
                className="block text-sm/6 font-medium text-gray-900"
              >
                Title
              </label>
              <div className="mt-2">
                <textarea
                  id="title"
                  name="title"
                  rows={1}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                  defaultValue={""}
                />
              </div>
              <p className="mt-3 text-sm/6 text-gray-600">
                What's your one-sentence summary of NOS?
              </p>
            </div>
            <div className="col-span-full">
              <label
                htmlFor="review"
                className="block text-sm/6 font-medium text-gray-900"
              >
                Review
              </label>
              <div className="mt-2">
                <textarea
                  id="text"
                  name="text"
                  rows={3}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
                  defaultValue={""}
                />
              </div>
              <p className="mt-3 text-sm/6 text-gray-600">
                Feel free to elaborate on how you've been changed by NOS. How
                did you feel when you first came to NOS? What did we help you
                achieve? What did we help you overcome?
              </p>
            </div>

            <div className="col-span-full">
              <label
                htmlFor="cover-photo"
                className="block text-sm/6 font-medium text-gray-900"
              >
                Photo - Your favorite photo of yourself
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  <PhotoIcon
                    aria-hidden="true"
                    className="mx-auto size-12 text-gray-300"
                  />
                  <div className="mt-4 flex text-sm/6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs/5 text-gray-600">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="rounded-md bg-red-300 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
