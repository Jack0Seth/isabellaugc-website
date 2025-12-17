"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const LoaderProgress = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Indeterminate loading animation
    gsap.fromTo(
      barRef.current,
      { scaleX: 0, transformOrigin: "left" },
      {
        scaleX: 1,
        duration: 1.5,
        repeat: -1,
        ease: "expo.inOut",
        yoyo: false, // Reset to 0 and start again looks more like a "loading" state for route navigation
      }
    );
  });

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F6F3E8]">
      <h2 className="font-instrument-sans text-xs md:text-sm text-[#231F20] tracking-[0.3em] uppercase mb-4 opacity-80">
        Loading View
      </h2>
      
      {/* Progress Track */}
      <div className="w-64 h-[2px] bg-[#E5E0D0] relative overflow-hidden">
        {/* Progress Bar */}
        <div
          ref={barRef}
          className="absolute top-0 left-0 w-full h-full bg-[#231F20]"
        ></div>
      </div>
    </div>
  );
};

export default LoaderProgress;
