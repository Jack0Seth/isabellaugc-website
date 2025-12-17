"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useProgress, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { LoaderShaderMaterial } from "./shaders/LoaderShaderMaterial";
import * as THREE from "three";
import { Suspense, useMemo } from "react";





// OKAY, SIMPLEST WAY:
// Just load the scene, traverse it in a useEffect, apply a SINGLE material instance to all meshes.
const PenthouseHologram = ({ 
    globalMouse, 
    interactionState 
}: { 
    globalMouse: React.MutableRefObject<THREE.Vector2>,
    interactionState: React.MutableRefObject<{ isHolding: boolean; clickPos: THREE.Vector2; clickTime: number; }>
}) => {
    const { scene } = useGLTF('/models/penthouse.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);
    
    // Create material once
    const material = useMemo(() => {
        const mat = new LoaderShaderMaterial();
        return mat;
    }, []);

    // Internal state for hold time calculation
    const holdTimeRef = useRef(0);

    useFrame((state, delta) => {
        material.uTime += delta;
        const gx = globalMouse.current.x;
        const gy = globalMouse.current.y;
        
        // Direct global mapping since it's full screen now
        material.uMouse.set(gx, gy); 

        // Handle Interactions
        // 1. Sonar Pulse (Click) - REMOVED
        
        // 2. Overdrive (Hold)
        // Smoothly interpolate uHold based on isHolding state
        // Also accrue uHoldTime
        if (interactionState.current.isHolding) {
            holdTimeRef.current += delta;
        } else {
            // Decay hold time quickly on release or reset instantly?
            // Reset instantly for now so effect stops
            holdTimeRef.current = 0;
        }

        const targetHold = interactionState.current.isHolding ? 1.0 : 0.0;
        
        // Simple lerp for smooth transition
        material.uHold += (targetHold - material.uHold) * delta * 5.0;
        
        // Pass accumulated hold time
        material.uHoldTime = holdTimeRef.current;
    });

    useEffect(() => {
        clonedScene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                (obj as THREE.Mesh).material = material;
            }
        });
    }, [clonedScene, material]);

    // ADJUST THE MODEL POSITION HERE:
    // position={[x, y, z]} -> Move model Left/Right, Up/Down, Forward/Backward
    // rotation={[x, y, z]} -> Rotate model
    return <primitive object={clonedScene} position={[0, -2, -6]} rotation={[0, 0, 0]} />;
}

const ShaderBackground = ({ 
    globalMouse,
    interactionState
}: { 
    globalMouse: React.MutableRefObject<THREE.Vector2>,
    interactionState: React.MutableRefObject<{ isHolding: boolean; clickPos: THREE.Vector2; clickTime: number; }>
}) => (
    <div className="absolute inset-0 w-full h-full">
         {/* ADJUST THE CAMERA POSITION HERE:
             position: [x, y, z] -> [Left/Right, Up/Down, Zoom]
             fov: Field of View (Zoom level) 
         */}
         <Canvas camera={{ position: [0, 0, 10], fov: 100 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
            <Suspense fallback={null}>
                <PenthouseHologram globalMouse={globalMouse} interactionState={interactionState} />
            </Suspense>
            <ambientLight intensity={1} /> 
        </Canvas>
    </div>
);

interface PreLoaderExperienceProps {
  onEnter?: () => void;
}

const PreLoaderExperience: React.FC<PreLoaderExperienceProps> = ({ onEnter }) => {
  const { progress } = useProgress();
  const [showEnter, setShowEnter] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [isHolding, setIsHolding] = useState(false); // UI State for indicator
  
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);

  // Global Mouse Tracker
  const globalMouse = useRef(new THREE.Vector2(0, 0));
  
  // Interaction Tracker
  const interactionState = useRef({
      isHolding: false,
      clickPos: new THREE.Vector2(-10, -10),
      clickTime: -100
  });

  useEffect(() => {
    // LOCK SCROLL ON MOUNT
    document.body.style.overflow = 'hidden';

    const handleMouseMove = (e: MouseEvent) => {
        // Normalize to -1 to 1
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        globalMouse.current.set(x, y);
    };
    
    // Global mouse down/up handlers for the scene interaction
    const handleMouseDown = (e: MouseEvent) => {
        // Ignore if clicking UI buttons
        if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
            return;
        }

        interactionState.current.isHolding = true;
        setIsHolding(true); // Trigger UI
        
        // Track start time for click duration check
        (interactionState as any).current.holdStartTime = Date.now();
    };
    
    const handleMouseUp = (e: MouseEvent) => {
        interactionState.current.isHolding = false;
        setIsHolding(false); // Reset UI
        // Click logic removed.
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
        // UNLOCK SCROLL ON UNMOUNT (Fallsafe)
        document.body.style.overflow = '';
        
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Handle Loading Progress
  useEffect(() => {
    if (progress === 100) {
      // Small delay to ensure everything is actually stable
      const timer = setTimeout(() => {
        setShowEnter(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  // Entrance Animation (Button Appear)
  useGSAP(() => {
    if (showEnter && buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      );
      
      // Hide loading percentage
      if (progressTextRef.current) {
        gsap.to(progressTextRef.current, { opacity: 0, duration: 0.5 });
      }
    }
  }, [showEnter]);

  // Exit Animation (Fade Out)
  const handleEnterClick = () => {
    if (onEnter) onEnter();

    // Animate container out
    if (containerRef.current) {
        gsap.to(containerRef.current, {
            opacity: 0,
            duration: 1.0,
            ease: "power2.inOut",
            onComplete: () => {
                // UNLOCK SCROLL EXPLICITLY
                document.body.style.overflow = '';
                setRemoved(true);
            }
        });
    }
  };

  if (removed) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center font-instrument-sans text-[#231F20] bg-[#F6F3E8]"
    >
      <ShaderBackground globalMouse={globalMouse} interactionState={interactionState} />
      
      {/* Content Layer */}
      <div
        ref={contentRef}
        className="absolute inset-0 z-20 w-full h-full pointer-events-none"
      >
        {/* Corner: Top Left */}
        <div className="absolute top-8 left-8 md:top-12 md:left-12 flex flex-col items-start bg-transparent">
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] mb-1">
            EXPERIENCE
          </span>
          <span className="text-sm md:text-base font-playfair italic opacity-70">
            Isabelle UGC
          </span>
        </div>

        {/* Corner: Top Right */}
        <div className="absolute top-8 right-8 md:top-12 md:right-12 text-right">
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] block mb-1">
            EST. 2025
          </span>
           <span className="text-sm md:text-base font-playfair italic opacity-70">
            Portfolio
          </span>
        </div>

        {/* Corner: Bottom Left (Status) */}
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-[#231F20] ${!showEnter ? "animate-pulse" : ""}`}></div>
              <span className="text-[10px] md:text-xs font-bold tracking-[0.2em]">
                {showEnter ? "READY" : "LOADING ASSETS"}
              </span>
           </div>
        </div>

        {/* Corner: Bottom Right (Percentage) */}
        <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12">
             <span 
                ref={progressTextRef}
                className="text-4xl md:text-6xl font-playfair font-medium"
             >
                {Math.round(progress)}%
             </span>
        </div>

        {/* Top Center: Hold Indicator (Visible when ready) */}
        {showEnter && (
            <div className="absolute top-32 left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center z-30 pointer-events-none select-none">
                 {/* Container with Backdrop for Visibility */}
                 <div className="relative flex flex-col items-center justify-center gap-4 bg-[#F6F3E8]/80 backdrop-blur-md rounded-full p-6 shadow-lg border border-[#231F20]/10">
                     {/* Progress Ring */}
                     <div className="relative w-24 h-24 flex items-center justify-center">
                         {/* Background Track */}
                         <svg className="absolute w-full h-full transform -rotate-90">
                             <circle
                                 cx="48"
                                 cy="48"
                                 r="44"
                                 stroke="#231F20"
                                 strokeWidth="2"
                                 fill="none"
                                 className="opacity-10"
                             />
                             {/* Progress Circle */}
                             <circle
                                 cx="48"
                                 cy="48"
                                 r="44"
                                 stroke="#231F20"
                                 strokeWidth="3"
                                 fill="none"
                                 strokeDasharray="276" // 2 * pi * 44
                                 strokeDashoffset={isHolding ? "0" : "276"}
                                 className={`transition-[stroke-dashoffset] ease-linear ${isHolding ? "duration-[10000ms]" : "duration-300"}`}
                             />
                         </svg>
                         
                         {/* Center Pulse Line (Decor) */}
                         <div className={`w-px h-12 bg-[#231F20] opacity-20 ${!isHolding ? "animate-pulse" : "h-16 opacity-40"} transition-all duration-500`}></div>
                     </div>

                    {/* Instruction Text */}
                    <div className="flex flex-col items-center gap-1">
                         <span className="text-[10px] font-bold tracking-[0.3em] opacity-80">
                             {isHolding ? "KEEP HOLDING..." : "HOLD TO REVEAL"}
                         </span>
                         <span className="text-[9px] font-instrument-sans italic opacity-50">
                             (10 Seconds)
                         </span>
                    </div>
                </div>
            </div>
        )}

        {/* Center: Interaction Area */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto">
             {!showEnter ? (
                 // LOADING STATE
                 <div className="w-px h-16 bg-[#231F20] opacity-20 animate-pulse"></div>
             ) : (
                 // READY STATE (ENTER BUTTON)
                <button
                    ref={buttonRef}
                    onClick={handleEnterClick}
                    className="group relative px-8 py-3 bg-[#231F20] text-[#F6F3E8] overflow-hidden transition-all duration-300 hover:scale-105"
                >
                    <span className="relative z-10 text-xs md:text-sm font-bold tracking-[0.3em] uppercase">
                        Enter Experience
                    </span>
                    <div className="absolute inset-0 bg-[#3a3536] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out"></div>
                </button>
             )}
        </div>
      </div>
    </div>
  );
};


export default PreLoaderExperience;
