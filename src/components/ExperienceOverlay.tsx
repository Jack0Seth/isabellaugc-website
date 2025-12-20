"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import NavigationOverlay from "./NavigationOverlay";

interface ExperienceOverlayProps {
    isVisible: boolean;
}

const ExperienceOverlay: React.FC<ExperienceOverlayProps> = ({ isVisible }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const topBarRef = useRef<HTMLDivElement>(null);
    const bottomLeftRef = useRef<HTMLDivElement>(null);
    const bottomRightRef = useRef<HTMLDivElement>(null);
    const cornersRef = useRef<HTMLDivElement>(null);
    const [shouldRender, setShouldRender] = useState(isVisible);

    // Handle appear/disappear animations
    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
        }
    }, [isVisible]);

    useGSAP(() => {
        if (!containerRef.current) return;

        const tl = gsap.timeline({
            onComplete: () => {
                if (!isVisible) setShouldRender(false);
            }
        });

        if (isVisible && shouldRender) {
            // Appear animation
            tl.set([topBarRef.current, bottomLeftRef.current, bottomRightRef.current], {
                opacity: 0,
                y: (i) => i === 0 ? -30 : 30,
            })
                .set(".corner-decoration", { opacity: 0, scale: 0.5 })
                .set(".gradient-overlay", { opacity: 0 })

                // Animate gradients first
                .to(".gradient-overlay", {
                    opacity: 1,
                    duration: 0.4,
                    ease: "power2.out"
                })

                // Top bar slides down
                .to(topBarRef.current, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    ease: "power3.out"
                }, "-=0.2")

                // Bottom elements slide up with stagger
                .to([bottomLeftRef.current, bottomRightRef.current], {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "power3.out"
                }, "-=0.3")

                // Corners pop in
                .to(".corner-decoration", {
                    opacity: 1,
                    scale: 1,
                    duration: 0.3,
                    stagger: 0.05,
                    ease: "back.out(2)"
                }, "-=0.2");
        } else if (!isVisible && shouldRender) {
            // Disappear animation
            tl.to(".corner-decoration", {
                opacity: 0,
                scale: 0.5,
                duration: 0.2,
                stagger: 0.02,
                ease: "power2.in"
            })
                .to([bottomLeftRef.current, bottomRightRef.current], {
                    opacity: 0,
                    y: 30,
                    duration: 0.3,
                    stagger: 0.05,
                    ease: "power2.in"
                }, "-=0.1")
                .to(topBarRef.current, {
                    opacity: 0,
                    y: -30,
                    duration: 0.3,
                    ease: "power2.in"
                }, "-=0.2")
                .to(".gradient-overlay", {
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.in"
                }, "-=0.2");
        }
    }, { scope: containerRef, dependencies: [isVisible, shouldRender] });

    if (!shouldRender) return null;

    return (
        <>
            <NavigationOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <div ref={containerRef} className="absolute inset-0 z-50 pointer-events-none">
                {/* Top gradient overlay for better text visibility */}
                <div className="gradient-overlay absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-none"></div>

                {/* Bottom gradient overlay for better text visibility */}
                <div className="gradient-overlay absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none"></div>

                {/* Top Bar - Header Style */}
                <div ref={topBarRef} className="absolute top-5 left-0 w-full z-50 py-8 px-6 md:px-18 pointer-events-auto">
                    <div className="flex justify-between items-center">
                        {/* Left: Experience Badge */}
                        <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-white/80 font-instrument-sans text-[10px] tracking-[0.3em] uppercase">
                                Virtual Experience
                            </span>
                        </div>
                        {/* Menu button on the right - Dark theme style */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`cursor-pointer px-4 py-2 font-instrument-sans text-[10px] tracking-widest uppercase rounded-full shadow-lg transition-all duration-300 z-50 relative backdrop-blur-md
                                ${isMenuOpen
                                    ? 'bg-white text-black hover:bg-gray-200'
                                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                                }`}
                            aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
                        >
                            {isMenuOpen ? "Close" : "Menu"}
                        </button>
                    </div>
                </div>

                {/* Bottom HUD */}
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6 md:p-8 pointer-events-auto">
                    {/* Left: Controls Hint */}
                    <div ref={bottomLeftRef} className="flex flex-col gap-2 bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                        <span className="text-white/50 font-instrument-sans text-[10px] tracking-[0.2em] uppercase">
                            Controls
                        </span>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="grid grid-cols-3 gap-0.5">
                                    <div className="col-start-2 w-5 h-5 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white/60 text-[10px]">W</div>
                                    <div className="col-start-1 w-5 h-5 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white/60 text-[10px]">A</div>
                                    <div className="col-start-2 w-5 h-5 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white/60 text-[10px]">S</div>
                                    <div className="col-start-3 row-start-2 w-5 h-5 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white/60 text-[10px]">D</div>
                                </div>
                                <span className="text-white/50 text-[10px] uppercase">Move</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white/60 text-[8px]">ESC</div>
                                <span className="text-white/50 text-[10px] uppercase">Exit</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Status */}
                    <div ref={bottomRightRef} className="flex flex-col items-end gap-1 bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                        <span className="text-white/50 font-instrument-sans text-[10px] tracking-[0.2em] uppercase">
                            Status
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-white/80 font-instrument-sans text-xs">Exploring</span>
                        </div>
                    </div>
                </div>

                {/* Corner Decorations */}
                <div ref={cornersRef}>
                    <div className="corner-decoration absolute top-6 left-6 w-8 h-8 border-l border-t border-white/20 pointer-events-none"></div>
                    <div className="corner-decoration absolute top-6 right-6 w-8 h-8 border-r border-t border-white/20 pointer-events-none"></div>
                    <div className="corner-decoration absolute bottom-6 left-6 w-8 h-8 border-l border-b border-white/20 pointer-events-none"></div>
                    <div className="corner-decoration absolute bottom-6 right-6 w-8 h-8 border-r border-b border-white/20 pointer-events-none"></div>
                </div>
            </div>
        </>
    );
};

export default ExperienceOverlay;
