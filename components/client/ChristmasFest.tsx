import Image from "next/legacy/image";

export default function ChristmasFest({}) {
  return (
    <main
      className="relative flex flex-col items-center justify-center min-h-screen
    "
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-20">
        <Image
          src="/christmaspic.png"
          alt="Christmas Fest"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-20 blur-sm brightness-50 bg-white bg-opacity-50"></div>
      <div className="text-center space-y-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-thin text-white mt-8">
          Upcoming Event...
        </h1>
        <h1 className="text-4xl md:text-8xl font-bold text-red-500">
          Christmas Fest
        </h1>
        <h2 className="text-2xl font- text-gray-200">
          December 6: A Day for Family Fun
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="mx-4 p-4 bg-green-50 rounded-lg shadow-md text-left">
            <h3 className="text-xl font-semibold text-gray-700">
              Competitive tournaments
            </h3>
          </div>
          <div className="mx-4 p-4 bg-green-50 rounded-lg shadow-md text-left">
            <h3 className="text-xl font-semibold text-gray-700">Yard Games</h3>
          </div>
          <div className="mx-4 p-4 bg-green-50 rounded-lg shadow-md text-left">
            <h3 className="text-xl font-semibold text-gray-700">
              Dinner and Booths
            </h3>
          </div>
          <div className="mx-4 p-4 bg-green-50 rounded-lg shadow-md text-left">
            <h3 className="text-xl font-semibold text-gray-700">
              Community Coat Drive
            </h3>
          </div>
          <p className="text-gray-100 col-span-1 md:col-span-2 mt-4 p-4 text-xl text-left font-serif">
            Join in on the fun with Christmas Fest at NOS. It&apos;s about
            hometown joy, familiar faces, and creating memories with those you
            care about. Simple, community-focused festivities. That&apos;s what
            it&apos;s all about, and you&apos;re at the heart of it.
          </p>
        </div>
        <div className="mt-8">
          <a
            href="https://www.facebook.com/share/17FnKd5jxs/"
            className="inline-block px-6 py-3 border-2 border-white text-white font-semibold rounded-md shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-500 hover:text-white transition-all"
          >
            RSVP
          </a>
        </div>
      </div>
    </main>
  );
}
