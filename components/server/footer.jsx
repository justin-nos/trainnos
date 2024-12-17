export default function Footer({}) {
  return (
    <>
      <div className="flex gap-8 bg-gray-900 text-white flex-col md:flex-row">
        <div className="px-8 py-10">
          <p className="font-sans text-2xl text-center mb-5">Don&apos;t Hesitate to reach out!</p>
          <p className="medium zs thin topBarDivThin gavinContactP">
            Gavin Willisson: <span className="noLineBreak">(251) 656 6025</span> | gavin@trainnos.com
          </p>
          <p className="medium zs thin brannonContactP">
            Brannon Willisson: <span className="noLineBreak">(251) 895 4302</span> | brannon@trainnos.com
          </p>
        </div>
        <div className="px-8 pb-10 md:py-10">
          <p className="font-sans text-2xl text-center">Or drop by!</p>
          <p className="text-center mb-5">25620 Friendship Rd, Daphne Al, 36526</p>
          <p className="medium zs thin topBarDivThinBlue gavinContactP">
            Monday-Thursday: 5-11am, <span className="noLineBreak">3:30-6:30</span>
          </p>
          <p className="medium zs thin">Friday: 5-11am</p>
        </div>
      </div>
      <div className="font-extralight text-sm">© 2022 NO OFF SEASON, LLC</div>
    </>
  );
}
