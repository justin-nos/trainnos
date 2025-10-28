"use client";
import {useEffect, useState, useCallback} from "react";
import {GrAchievement} from "react-icons/gr";

export default function EmailSubmissionForm() {
  const [emailFormValue, setEmailFormValue] = useState("");
  const [nameFormValue, setNameFormValue] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleEmailChange = e => {
    e.preventDefault();
    setEmailFormValue(e.target.value);
  };
  const handleNameChange = e => {
    e.preventDefault();
    setNameFormValue(e.target.value);
  };
  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      setLoading(true);
      console.log("Submitting email => " + emailFormValue);
      try {
        await fetch("/api/submitEmail", {
          method: "POST",
          body: JSON.stringify({email: emailFormValue, name: nameFormValue}),
        });
        setSuccess(true);
        setLoading(false);
      } catch (error) {
        console.log(error.message);
        setError(error.message);
        setLoading(false);
      }
    },
    [emailFormValue, nameFormValue]
  );

  return loading ? (
    <div className="mt-3 p-4 animate-pulse bg-slate-300 rounded-lg text-white">
      Loading...
    </div>
  ) : success ? (
    <div className="text-md text-white mt-3 py-3 px-3 bg-slate-400 rounded-2xl flex flex-row place-items-center">
      Email received, gains incoming!
      <GrAchievement className="fill-green-300 border-green-300 stroke-green-300 ml-2 md:ml-4" />
    </div>
  ) : error ? (
    <div className="text-red-300 font-bold text-lg">{error}</div>
  ) : (
    <div className="max-w-xl lg:max-w-lg">
      <h2 className="text-4xl mt-8 md:mt-14font-thin tracking-tight text-black">
        Subscribe to our newsletter
      </h2>
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col max-w-md gap-x-4 gap-y-4"
      >
        <label htmlFor="email-address" className="sr-only">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          onChange={handleNameChange}
          required
          placeholder="Enter your name"
          autoComplete="name"
          className="min-w-0 flex-auto rounded-md bg-white/5 px-3.5 py-2 text-base text-black outline outline-1 -outline-offset-1 outline-gray-200 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
        />
        <label htmlFor="email-address" className="sr-only">
          Email address
        </label>
        <input
          id="email-address"
          name="email"
          type="email"
          onChange={handleEmailChange}
          required
          placeholder="Enter your email"
          autoComplete="email"
          className="min-w-0 flex-auto rounded-md bg-white/5 px-3.5 py-2 text-base text-black outline outline-1 -outline-offset-1 outline-gray-200 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 sm:text-sm/6"
        />
        <button
          type="submit"
          className="flex-none rounded-md bg-red-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
