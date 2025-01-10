export default function WhatToExpect({}) {
  return (
    <video
      width="1920"
      height="1080"
      src={"/whattoexpect.mp4"}
      autoPlay={true}
      playsInline
      muted
      controls
      className="aspect-video w-screen"
    ></video>
  );
}
