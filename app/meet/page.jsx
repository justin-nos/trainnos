import Image from "next/image";
import {MdMail} from "react-icons/md";
import {FiPhoneOutgoing} from "react-icons/fi";
import {TiContacts} from "react-icons/ti";
import Mailto from "../../components/server/emailAssets";
import {trainerFromRow} from "../../lib/db/rows.mjs";
import {publicUrl} from "../../lib/media/storage";
import {isFounder, vCardHref} from "../../lib/trainers/schema.mjs";
import {supabaseAdmin} from "../../lib/supabase/admin";

// Admin edits revalidate immediately; hourly covers dashboard edits.
export const revalidate = 3600;

export const metadata = {
  title: "Meet Our Team | No Off Season",
  description:
    "We exist to come along side you to build confidence, grow physically, and cultivate lifelong purpose within a Christ-centered gym community. There is no off season in life!",
};

// null when the query fails, so the page still renders its intro.
async function getTrainers() {
  try {
    const {data, error} = await supabaseAdmin()
      .from("trainers")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return data.map(row => trainerFromRow(row, publicUrl));
  } catch (error) {
    console.error("Error reading trainers for /meet", error);
    return null;
  }
}

export default async function Meet() {
  const trainers = await getTrainers();
  const founders = trainers?.filter(isFounder) ?? [];
  const team = trainers?.filter(t => !isFounder(t)) ?? [];
  return (
    <div className="bg-white py-24 md:py-32 lg:py-40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-20 px-6 lg:px-8 xl:grid-cols-3">
        <div data-section="team-intro" className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Our team
          </h2>
          <p className="mt-6 text-lg/8 text-gray-600">
            There is no off season in life! Therefore, our mission is to come
            along side you to build confidence, grow physically, and cultivate
            lifelong purpose within a Christ centered gym community.
          </p>
        </div>
        {founders.length > 0 && (
          <ul
            data-section="team"
            role="list"
            className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:gap-x-8 xl:col-span-2"
          >
            {founders.map(person => (
              <TrainerCard key={person.id} person={person} />
            ))}
          </ul>
        )}
      </div>
      {team.length > 0 && (
        <div
          data-section="trainers"
          className="mx-auto mt-24 max-w-7xl px-6 md:mt-32 lg:px-8"
        >
          <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Trainers
          </h2>
          <ul
            role="list"
            className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-x-6 gap-y-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8"
          >
            {team.map(person => (
              <TrainerCard key={person.id} person={person} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Photos are cropped to the same portrait shape the founder photos use.
function TrainerCard({person}) {
  const contactUrl = vCardHref(person);
  return (
    <li>
      <Image
        alt={`Image of ${person.name}`}
        width={800}
        height={1000}
        sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
        src={person.photo.url}
        className="aspect-[4/5] w-full rounded-2xl object-cover object-top"
      />
      <h3 className="mt-6 text-lg/8 font-semibold text-gray-900">{person.name}</h3>
      <p className="text-base/7 text-gray-600">{person.position}</p>
      {person.bio && <p className="mt-4 text-base/7 text-gray-600">{person.bio}</p>}
      {contactUrl && (
        <ul role="list" className="mt-6 flex gap-x-6">
          {person.email && (
            <li>
              <Mailto
                email={person.email}
                subject="Hello! My Name is ..."
                body="I am interested in/have a question about..."
              >
                <span className="sr-only">Email</span>
                <MdMail />
              </Mailto>
            </li>
          )}
          {person.phone && (
            <li>
              <a href={`tel:${person.phone}`} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Phone</span>
                <FiPhoneOutgoing />
              </a>
            </li>
          )}
          <li>
            <a href={contactUrl}>
              <span className="sr-only">Add to contacts</span>
              <TiContacts />
            </a>
          </li>
        </ul>
      )}
    </li>
  );
}
