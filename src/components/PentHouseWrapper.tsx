"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Penthouse } from "./PentHouse";
import { Canvas } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRouter } from "next/navigation";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Debug info interface
interface DebugInfo {
    progress: number;
    phase: string;
    position: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
}

// Animated wrapper component for the Penthouse
const AnimatedPenthouse = (props: any & { onDebugUpdate?: (info: DebugInfo) => void }) => {
    const groupRef = useRef<THREE.Group>(null);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    useGSAP(() => {
        if (!groupRef.current) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "body", // Use body as trigger for main scroll
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5,
                onUpdate: (self) => {
                    // Update debug info
                    if (props.onDebugUpdate && groupRef.current) {
                        const progress = self.progress;
                        let phase = "Phase 1: Moving right";
                        if (progress > 0.33 && progress <= 0.66) {
                            phase = "Phase 2: Center transition";
                        } else if (progress > 0.66) {
                            phase = "Phase 3: Moving left";
                        }

                        props.onDebugUpdate({
                            progress: Math.round(progress * 100),
                            phase,
                            position: {
                                x: parseFloat(groupRef.current.position.x.toFixed(2)),
                                y: parseFloat(groupRef.current.position.y.toFixed(2)),
                                z: parseFloat(groupRef.current.position.z.toFixed(2)),
                            },
                            scale: {
                                x: parseFloat(groupRef.current.scale.x.toFixed(2)),
                                y: parseFloat(groupRef.current.scale.y.toFixed(2)),
                                z: parseFloat(groupRef.current.scale.z.toFixed(2)),
                            },
                        });
                    }

                    // Check if we are near the end to trigger loading/redirect
                    if (self.progress > 0.95 && !isLoading) {
                        setIsLoading(true);
                        // Fade out effect could go here
                        setTimeout(() => {
                            router.push("/experience");
                        }, 500);
                    }
                },
            },
        });

        // 1. Initial Float Animation (matches previous idle state but subtle)
        // We might want to kill this or blend it, but for now let's keep it simple
        // or just let the scroll override it. 
        // Actually, let's focus on the Scroll Interaction.

        // Scale Up Animation
        tl.to(groupRef.current.scale, {
            x: 5,
            y: 5,
            z: 5,
            duration: 10,
            ease: "power2.inOut",
        }, 0);

        // Move Position with left → center → right movement pattern
        // Phase 1: Move left and forward (0-3.3 seconds / first third)
        tl.to(groupRef.current.position, {
            x: 1.5,  // Move left
            y: 3,   // Slight vertical adjustment
            z: 0,   // Move forward a bit
            duration: 3,
            ease: "power2.out",
        }, 0);

        // Phase 2: Move back to center and continue forward (3.3-6.6 seconds / middle third)
        tl.to(groupRef.current.position, {
            x: 2.5,   // Back to center
            y: 1,  // Continue lowering
            z: 0,   // Move closer
            duration: 3,
            ease: "power2.inOut",
        }, 3.3);

        // Phase 3: Move right and approach final position (6.6-10 seconds / last third)
        tl.to(groupRef.current.position, {
            x: 1,   // Move right
            y: 1,  // Final vertical position
            z: 1,   // Final z position
            duration: 3.4,
            ease: "power2.in",
        }, 6);

        // Door Animation
        // Access doors via getObjectByName since we named them in PentHouse.tsx
        const leftDoor = groupRef.current.getObjectByName("penthouse_door_left");
        const rightDoor = groupRef.current.getObjectByName("penthouse_door_right");

        if (leftDoor && rightDoor) {
            // Open Doors when camera gets near (around 50% of the timeline)
            tl.to(leftDoor.rotation, {
                y: -Math.PI / 2, // Rotate 90 degrees outward
                duration: 3,
                ease: "power1.inOut",
            }, 1);

            tl.to(rightDoor.rotation, {
                y: Math.PI / 2, // Rotate 90 degrees outward
                duration: 3,
                ease: "power1.inOut",
            }, 1);
        }

    }, [isLoading, router]);

    return (
        <>
            <group ref={groupRef} position={props.position} scale={props.scale}>
                <Penthouse />
            </group>
            {isLoading && (
                <mesh position={[0, 0, 10]}>
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial color="black" transparent opacity={0} ref={(ref) => {
                        if (ref) {
                            gsap.to(ref, { opacity: 1, duration: 0.5 });
                        }
                    }} />
                </mesh>
            )}
        </>
    );
};

const PenthouseWrapper = () => {
    return (
        <div style={{ height: "400vh", position: "relative" }}> {/* Add scrollable height */}
            <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}>
                <Canvas style={{ width: "100vw", height: "100vh" }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 1, 10]} intensity={1} />
                    <PerspectiveCamera makeDefault position={[0, 5, 12]} />
                    <Environment preset="sunset" />
                    <Suspense fallback={null}>
                        <AnimatedPenthouse position={[0, 2, -5]} scale={[0.4, 0.4, 0.4]} />
                    </Suspense>
                </Canvas>
            </div>
            <ScrollFadeLogic />
        </div>
    );
};

// Helper component to handle GSAP logic for the indicator outside the main wrapper to avoid re-renders or complexity
const ScrollFadeLogic = () => {
    useGSAP(() => {
        gsap.to(".scroll-indicator", {
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "100px top", // Fade out quickly
                scrub: true,
            },
            opacity: 0,
            y: 20, // Move down slightly while fading
            ease: "power1.out"
        });
    }, []);
    return null;
};

export default PenthouseWrapper;
