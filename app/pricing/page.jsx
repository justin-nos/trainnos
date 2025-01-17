import Image from "next/image";
import pricingimage from "../../public/nos-pricing.JPEG";
import {CheckCircleIcon} from "@heroicons/react/20/solid";
import ExpectButton from "../../components/client/ExpectButton";
import Head from "next/head";

const tiers = [
  {
    name: "Private",
    id: "tier-private",
    athlete: false,
    href: "https://trainnos.pushpress.com/landing/plans?category=plcat_uq5r4c5f9reo3d",
    price: {sessionly: false, hourly: "$75"},
    description: "One-on-One Training, focused on you and your goals.",
    features: [
      "Research-Based programs",
      "Hyper-Personal",
      "$45/30min",
      "$60/45min",
    ],
  },
  {
    name: "Group",
    id: "tier-group",
    athlete: {
      href: "https://trainnos.pushpress.com/landing/plans?category=plcat_0e68e0c7b61236",
    },
    href: "https://trainnos.pushpress.com/landing/plans?category=plcat_d79da2fd40ff3b",
    price: {sessionly: "<$30"},
    description: "For those who want lighthearted, results-based training",
    features: [
      "Relevant Training",
      "Practical Fitness",
      "Injury-Sensitive",
      "Community-Focused",
    ],
  },
  {
    name: "Semi-Private",
    id: "tier-semi_private",
    athlete: false,
    href: "https://trainnos.pushpress.com/landing/plans?category=plcat_dc689ce0a8fcb5",
    price: {sessionly: false, hourly: false, hourlyperson: "$45"},
    description: "Balance personalized care, affordability, and community.",
    features: ["2-4 People", "Custom Workouts", "$30/30min"],
  },
];

export default function Pricing() {
  return (
    <>
      <Head>
        <title>Pricing: Turn Fitness Goals into Action | No Off Season</title>
        <meta name="description" />
      </Head>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl sm:text-center">
            <h2 className="text-base/7 font-semibold text-red-500">Pricing</h2>
            <p className="mt-2 text-pretty text-5xl font-semibold tracking-tight text-gray-900 sm:text-balance sm:text-6xl">
              Turn Ideas into Action
            </p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg font-medium text-gray-600 sm:text-center sm:text-xl/8">
            Choose a plan that fits your needs.
          </p>
          <div className="mx-auto mt-3 text-center">
            also see
            <ExpectButton></ExpectButton>
          </div>
          <div className="mt-20 flow-root">
            <div className="isolate -mt-16 grid max-w-sm grid-cols-1 gap-y-16 divide-y divide-gray-100 sm:mx-auto lg:-mx-8 lg:mt-0 lg:max-w-none lg:grid-cols-3 lg:divide-x lg:divide-y-0 xl:-mx-4">
              {tiers.map(tier => (
                <div key={tier.id} className="pt-16 lg:px-8 lg:pt-0 xl:px-14">
                  <h3
                    id={tier.id}
                    className="text-base/7 font-semibold text-gray-900"
                  >
                    {tier.name}
                  </h3>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-5xl font-semibold tracking-tight text-gray-900">
                      {tier.price.sessionly
                        ? tier.price.sessionly
                        : tier.price.hourly
                        ? tier.price.hourly
                        : tier.price.hourlyperson}
                    </span>
                    <span className="text-sm/6 font-semibold text-gray-600">
                      {tier.price.sessionly
                        ? "/session"
                        : tier.price.hourly
                        ? "/hour"
                        : "/hour per person"}
                    </span>
                  </p>
                  {tier.athlete ? (
                    <>
                      <a
                        href={tier.href}
                        aria-describedby={tier.id}
                        className="mt-10 block rounded-md bg-red-400 px-3 py-2 text-center text-sm/6 font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        Adult: View Plans
                      </a>
                      <a
                        href={tier.athlete.href}
                        aria-describedby={tier.id}
                        className="mt-10 block rounded-md bg-red-400 px-3 py-2 text-center text-sm/6 font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        Athlete: View Plans
                      </a>
                    </>
                  ) : (
                    <a
                      href={tier.href}
                      aria-describedby={tier.id}
                      className="mt-10 block rounded-md bg-red-400 px-3 py-2 text-center text-sm/6 font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                    >
                      View Plans
                    </a>
                  )}
                  <p className="mt-10 text-sm/6 font-semibold text-gray-900">
                    {tier.description}
                  </p>
                  <ul
                    role="list"
                    className="mt-6 space-y-3 text-sm/6 text-gray-600"
                  >
                    {tier.features.map(feature => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckCircleIcon
                          aria-hidden="true"
                          className="h-6 w-5 flex-none text-red-500"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
