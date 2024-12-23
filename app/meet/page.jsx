import Image from "next/image";
import Link from "next/link";
import GavinSrc from "../../public/Gavin_MeetUs.png";
import BrannonSrc from "../../public/Brannon_MeetUs.png";
import {MdMail} from "react-icons/md";
import {FiPhoneOutgoing} from "react-icons/fi";
import {TiContacts} from "react-icons/ti";
import Mailto from "../../components/server/emailAssets";

const gavinContact =
  "data:text/vcard;charset=utf-8,%20BEGIN:VCARD%0D%0AVERSION:3.0%0D%0APRODID:-//Apple Inc.//macOS 15.2//EN%0D%0AN:Willisson;Gavin;;;%0D%0AFN:Gavin Willisson%0D%0AORG:NOS;%0D%0AEMAIL;type=INTERNET;type=WORK;type=pref:gavin@trainnos.com%0D%0ATEL;type=pref:+12516566025%0D%0AEND:VCARD";
const brannonContact =
  "data:text/vcard;charset=utf-8,%20BEGIN:VCARD%0D%0AVERSION:3.0%0D%0APRODID:-//Apple Inc.//macOS 15.2//EN%0D%0AN:Willisson;Brannon;;;%0D%0AFN:Brannon Willisson%0D%0AORG:NOS;%0D%0AEMAIL;type=INTERNET;type=WORK;type=pref:brannon@trainnos.com%0D%0ATEL;type=pref:+12518954302%0D%0AEND:VCARD";

const people = [
  {
    name: "Gavin Willisson",
    role: "Co Founder",
    imageUrl: GavinSrc,
    bio: "We have seen God do great things in this gym to allow it to happen. From being funded by a guy we had only known for a few months to the step by step oddities that have led to what we are today, The Lord has allowed us to do what we enjoy doing: train all ages for great things in life and pour into their lives even outside of the gym.",
    emailUrl: "gavin@trainnos.com",
    phoneUrl: "tel:+12516566025",
    contactUrl: gavinContact,
  },
  {
    name: "Brannon Willisson",
    role: "Co Founder",
    imageUrl: BrannonSrc,
    bio: "When Gavin and I were growing up we always had a dream of opening a gym and calling it No Off Season. We wanted to have a place where kids in the community could come and get better at their sports but also grow in a relationship with Christ. I wanted to invest in the kids and local community the way a mentor of mine did for me.",
    emailUrl: "brannon@trainnos.com",
    phoneUrl: "tel:+12518954302",
    contactUrl: brannonContact,
  },
];

export default function Meet() {
  return (
    <div className="bg-white py-24 md:py-32 lg:py-40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-20 px-6 lg:px-8 xl:grid-cols-3">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Our team
          </h2>
          <p className="mt-6 text-lg/8 text-gray-600">
            There is no off season in life! Therefore, our mission is to come
            along side you to build confidence, grow physically, and cultivate
            lifelong purpose within a Christ centered gym community.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:gap-x-8 xl:col-span-2"
        >
          {people.map(person => (
            <li key={person.name}>
              <Image
                alt=""
                width={750}
                height={500}
                src={person.imageUrl}
                className="w-full rounded-2xl object-center object-fill"
              />
              <h3 className="mt-6 text-lg/8 font-semibold text-gray-900">
                {person.name}
              </h3>
              <p className="text-base/7 text-gray-600">{person.role}</p>
              <p className="mt-4 text-base/7 text-gray-600">{person.bio}</p>
              <ul role="list" className="mt-6 flex gap-x-6">
                <li>
                  <Mailto
                    email={person.emailUrl}
                    subject="Hello! My Name is ..."
                    body="I am interested in/have a question about..."
                  >
                    <span className="sr-only">Email</span>
                    <MdMail />
                  </Mailto>
                </li>
                <li>
                  <a
                    href={person.phoneUrl}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Phone</span>
                    <FiPhoneOutgoing />
                  </a>
                </li>
                <li>
                  <a href={person.contactUrl}>
                    <TiContacts />
                  </a>
                </li>
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
