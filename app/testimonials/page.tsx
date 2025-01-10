import {collection, getDocs} from "firebase/firestore";
import {firestoreDB, storage} from "../../lib/firebase";
import {getDownloadURL, ref} from "firebase/storage";
import {FirebaseError} from "firebase/app";
import Image from "next/image";
import {Suspense} from "react";

type testimonial = {
  id: string;
  name: string;
  body: string;
  title: string;
  imageRef: string | null;
};

async function getTestimonials() {
  try {
    const docsSnap = await getDocs(collection(firestoreDB, "testimonials"));
    const testimonials: testimonial[] = [];
    const imagePromises = docsSnap.docs.map(doc => {
      const pngRef = ref(storage, `testimonialImages/${doc.id}.png`);
      const jpegRef = ref(storage, `testimonialImages/${doc.id}.jpeg`);

      return getDownloadURL(pngRef)
        .then(imref => {
          return imref; // PNG found, return this URL
        })
        .catch(() => {
          // PNG not found, try JPEG
          return getDownloadURL(jpegRef);
        })
        .then(imref => {
          let url = imref && imref.length > 0 ? imref : null;
          //console.log(url); // Optional: for debugging
          testimonials.push({
            id: doc.id,
            name: doc.data().firstName + " " + doc.data().lastName,
            body: doc.data().text,
            title: doc.data().title,
            imageRef: url,
          });
        })
        .catch(error => {
          // Neither PNG nor JPEG found
          console.log(`Error downloading image for doc ${doc.id}: ${error}`);
          testimonials.push({
            id: doc.id,
            name: doc.data().firstName + " " + doc.data().lastName,
            body: doc.data().text,
            title: doc.data().title,
            imageRef: null,
          });
        });
    });

    // Wait for all image URL promises to resolve
    await Promise.all(imagePromises);
    return testimonials;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export default async function Testimonials() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base/7 font-semibold text-red-500">
            Testimonials
          </h2>
          <p className="mt-2 text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            We&#39;re thankful for all of you
          </p>
        </div>
        <Suspense
          fallback={
            <div className="mt-16 pt-8 w-full h-screen sm:inline-block sm:w-screen sm:px-4 animate-pulse bg-slate-300 rounded-3xl"></div>
          }
        >
          <TestimonialLazyComponent></TestimonialLazyComponent>
        </Suspense>
      </div>
    </div>
  );
}

async function TestimonialLazyComponent() {
  const testimonials: testimonial[] = await getTestimonials();
  return (
    <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
      <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
        {testimonials.map(testimonial => (
          <div
            key={testimonial.id}
            className="pt-8 sm:inline-block sm:w-full sm:px-4"
          >
            <figure className="rounded-2xl bg-gray-50 p-8 text-sm/6">
              <h3 className="text-black mb-3 mt-1 mx-3 font-bold text-lg">{`${testimonial.title}`}</h3>
              <blockquote className="text-gray-900">
                <p>{`“${testimonial.body}”`}</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-x-4">
                <Suspense
                  fallback={
                    <div className="size-10 rounded-full bg-gray-50animate-pulse bg-slate-300"></div>
                  }
                >
                  <img
                    alt={`Image of ${testimonial.name}`}
                    src={testimonial.imageRef}
                    //width={250}
                    //height={250}
                    className="size-10 rounded-full bg-gray-50"
                  />
                </Suspense>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                </div>
              </figcaption>
            </figure>
          </div>
        ))}
      </div>
    </div>
  );
}
