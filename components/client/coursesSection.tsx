"use client"; // Required for client-side hooks in Next.js App Router

import React, {useState, useRef, useEffect, useCallback} from "react";
import {
  FaPlay,
  FaPause,
  FaVolumeMute,
  FaVolumeUp,
  FaAward,
  FaDumbbell,
  FaBolt,
  FaRunning,
  FaStar,
} from "react-icons/fa";

const TemporaryEventSection: React.FC = () => {
  const [headerOpacity, setHeaderOpacity] = useState(1); // Starts fully visible
  const [isPlaying, setIsPlaying] = useState(false); // Video playback state
  const [showButton, setShowButton] = useState(false); // Button visibility
  const [isMuted, setIsMuted] = useState(true); // Optional: handle muted state
  const videoRef = useRef<HTMLVideoElement>(null);

  // Memoized scroll handler
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const fadeOutThreshold = 200; // Fade out over 200px scroll
    const newOpacity = Math.max(1 - scrollY / fadeOutThreshold, 0);
    setHeaderOpacity(newOpacity);

    // Once fully faded, play video if not already playing
    if (newOpacity === 0 && videoRef.current && !isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, {passive: true});
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // set up video timeupdate listener

  // Memoized video timeupdate handler for button visibility
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && videoRef.current.currentTime >= 48) {
      setShowButton(true);
      // Optional: Remove listener after trigger to optimize
      videoRef.current.removeEventListener("timeupdate", handleTimeUpdate);
    }
  }, []);

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("play", () => setIsPlaying(true));
      video.addEventListener("pause", () => setIsPlaying(false));
      video.addEventListener("muted", () => setIsMuted(true)); // Optional: handle muted state
      video.addEventListener("unmuted", () => setIsMuted(false)); // Optional
    }
    return () => {
      if (video) {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("play", () => setIsPlaying(true));
        video.removeEventListener("pause", () => setIsPlaying(false));
        video.removeEventListener("muted", () => setIsMuted(true)); // Optional
        video.removeEventListener("unmuted", () => setIsMuted(false)); // Optional
      }
    };
  }, [handleTimeUpdate]);

  // Memoized play/pause handlers
  const handlePlay = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const handlePause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  return (
    <section className="sticky min-h-[200vh]">
      {/* Fixed Header - Fades out on scroll */}
      <header
        className="fixed bottom-[25%] left-0 right-0 z-10 p-4 text-center transition-opacity duration-300"
        style={{opacity: headerOpacity}}
      >
        <h1 className="text-2xl font-bold text-white animate-bounce">
          Current Courses...
        </h1>{" "}
        {/* Customize this */}
      </header>

      {/* Video - Full width on mobile, centered on desktop */}
      <div className="relative border-t-[1px] border-white">
        {" "}
        {/* Offset for header */}
        <video
          ref={videoRef}
          className="w-full md:w-auto md:max-w-4xl mx-auto"
          playsInline // Helps with mobile auto-play
          muted
        >
          <source src="/BRANNON_PROMO_2_WEB.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Custom Controls - Positioned over the video */}
        {isPlaying ? (
          <button
            onClick={handlePause}
            className="p-2 bottom-4 left-4 text-white rounded-full "
            aria-label="Pause"
          >
            <FaPause />
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="absolute p-2 bottom-4 left-4 text-white rounded-full hover:bg-gray-600"
            aria-label="Play"
          >
            <FaPlay />
          </button>
        )}
        <button
          onClick={handleMuteToggle}
          className="absolute right-4 top-4 p-2 text-white rounded-full"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <FaVolumeMute className="w-8 h-8 animate-bounce" />
          ) : (
            <FaVolumeUp className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Mobile-only Sales Copy */}
      <div className="md:hidden p-4 text-left pl-8">
        <h2 className="text-4xl font-bold my-8">Kids Classes this Fall</h2>
        <h3 className="text-lg">
          We are passionate about helping your child become:
        </h3>
        <ul className="list-inside mt-8 font-semibold">
          <li>
            <FaAward className="inline mr-2 my-4 text-yellow-200" />
            More Confident and Self-Assured
          </li>
          <li>
            <FaDumbbell className="inline mr-2 my-4 text-red-200" />
            Stronger and More Powerful
          </li>
          <li>
            <FaBolt className="inline mr-2 my-4 text-blue-200" />
            Faster and More Explosive
          </li>
          <li>
            <FaRunning className="inline mr-2 my-4 text-green-200" />
            More Agile and Athletic
          </li>
          <li>
            <FaStar className="inline mr-2 my-4 text-purple-200" />
            Better Prepared for Competition and Life
          </li>
        </ul>
      </div>

      {/* Time-tracked Button - Shows on both mobile and desktop at 48s */}
      {showButton && (
        <a href="sms:+12518954302?body=Hey%20Brannon%2C%20this%20is%20%5BYour%20Name%5D.%20I'm%20interested%20in%20reserving%20a%20spot%20for%20a%2012%20week%20speed%20and%20agility%20course.">
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 h-fit w-fit p-4 rounded-lg text-black bg-yellow-300 animate-bounce">
            Reserve a Spot
          </div>
        </a>
      )}
    </section>
  );
};

export default TemporaryEventSection;
