"use client";

import * as THREE from 'three';
import React, { useRef, useMemo, useEffect } from 'react';
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { MeshSurfaceSampler } from 'three-stdlib';

// --- Grass Blade Shader Material ---
// We need to manually handle instancing in the vertex shader
const GrassBladeMaterialImpl = shaderMaterial(
    {
        uTime: 0,
        uMouse: new THREE.Vector2(0, 0),
        uMouseInfluence: 0.0,
        uWindStrength: 0.2, // Increased for visibility
        uWindFrequency: 1.0,
        uGrassColorTop: new THREE.Color('#4ade80'),
        uGrassColorBottom: new THREE.Color('#166534'),
        uGrassColorHighlight: new THREE.Color('#86efac'),
    },
    // Vertex Shader
    /* glsl */ `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uMouseInfluence;
    uniform float uWindStrength;
    uniform float uWindFrequency;

    varying vec2 vUv;
    varying float vHeight;
    varying float vWaveIntensity;
    varying float vRandom; // Pass random to fragment

    // Simplex noise (same as before)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m * m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
    
    // Pseudo-random hash
    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
        vUv = uv;
        vHeight = uv.y; // Assumes blade geometry UVs go from 0 to 1 on Y

        // Instance handling
        // Apply modelMatrix to get true World Position
        vec4 instancePosition = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        vec3 worldPos = instancePosition.xyz;
        
        // Generate random value based on instance position
        vRandom = hash(instancePosition.xz);

        // Local Position Modification (Wind & Mouse)
        vec3 pos = position;

        // 1. Wind Effect
        float windNoise = snoise(vec2(worldPos.x * 0.1 + uTime * 0.5 * uWindFrequency, worldPos.z * 0.1));
        float windLean = windNoise * uWindStrength * vHeight; // Lean more at tip
        
        // Add random variation to wind
        windLean *= (0.8 + 0.4 * vRandom);
        
        // Apply wind lean
        pos.x += windLean;
        pos.z += windLean * 0.5;
        vWaveIntensity = windLean; // Pass to fragment

        // 2. Mouse Interaction
        vec2 mouseCurrent = uMouse; // Mouse world pos (x, z)
        vec2 bladePos = worldPos.xz;
        float dist = distance(mouseCurrent, bladePos);
        
        // Reduced radius and softer strength
        float interactionRadius = 0.8;
        float pushStrength = smoothstep(interactionRadius, 0.0, dist) * uMouseInfluence * 0.6;
        
        if (pushStrength > 0.0) {
            vec2 dir = normalize(bladePos - mouseCurrent);
            pos.x += dir.x * pushStrength * vHeight;
            pos.z += dir.y * pushStrength * vHeight;
            pos.y -= pushStrength * vHeight * 0.2;
        }

        // Apply modelMatrix to the final position to place it correctly in the scene hierarchy
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(pos, 1.0);
    }
    `,
    // Fragment Shader
    /* glsl */ `
    uniform vec3 uGrassColorTop;
    uniform vec3 uGrassColorBottom;
    uniform vec3 uGrassColorHighlight;
    
    varying vec2 vUv;
    varying float vHeight;
    varying float vWaveIntensity;
    varying float vRandom;

    void main() {
        // Base gradient
        vec3 color = mix(uGrassColorBottom, uGrassColorTop, vHeight);
        
        // Apply Random Variation
        // Slight hue/brightness shift per blade
        color = mix(color, uGrassColorHighlight, vRandom * 0.2);
        
        // Highlight tips based on wind
        float highlight = smoothstep(0.0, 0.2, vWaveIntensity);
        // More subtle highlight using mix
        color = mix(color, uGrassColorHighlight, highlight * 0.4 * vHeight);
        
        // Fake Ambient Occlusion at bottom
        float ao = smoothstep(0.0, 0.35, vHeight);
        color *= (0.5 + 0.5 * ao);
        
        // Simple Specular Lighting
        // Assuming light from top-ish: Standard normal is up-ish?
        // Since we don't have true normals passed easily, we fake it.
        // Light vector approx (0.5, 1.0, 0.5)
        // View vector approx (0,0,1)
        
        // Translucency imitation (backlighting)
        float translucency = 0.5;
        color *= 1.0 + translucency * vHeight; // Tips are brighter/translucent

        gl_FragColor = vec4(color, 1.0);
    }
    `
);

extend({ GrassBladeMaterial: GrassBladeMaterialImpl });

// Extend R3F module for the new material
declare module '@react-three/fiber' {
    interface ThreeElements {
        grassBladeMaterial: {
            attach?: string;
            args?: any[];
            ref?: React.Ref<any>;
            side?: THREE.Side;
            uTime?: number;
            uMouse?: THREE.Vector2;
            uMouseInfluence?: number;
            uWindStrength?: number;
            uWindFrequency?: number;
            uGrassColorTop?: THREE.Color;
            uGrassColorBottom?: THREE.Color;
            uGrassColorHighlight?: THREE.Color;
            vertexColors?: boolean;
        } & THREE.ShaderMaterialParameters;
    }
}

// GrassGroundProps extending ThreeElements['group'] to accept standard group props
interface GrassGroundProps extends Omit<ThreeElements['group'], 'ref'> {
    geometry: THREE.BufferGeometry;
    bladeCount?: number;
}

export function GrassGround({ geometry, bladeCount = 8000, position, rotation, scale, ...props }: GrassGroundProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const materialRef = useRef<any>(null);
    const { pointer, camera, raycaster, clock } = useThree();

    // Interaction state
    const mousePosition = useMemo(() => new THREE.Vector2(0, 0), []);
    const mouseInfluence = useRef(0);
    const targetMouseInfluence = useRef(0);
    const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
    const intersectionPoint = useMemo(() => new THREE.Vector3(), []);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Blade geometry: A tapered plane with curvature (Optimized)
    const bladeGeometry = useMemo(() => {
        // Create base geometry
        // Reduced height segments from 4 to 2 for performance
        const geo = new THREE.PlaneGeometry(0.1, 0.5, 1, 2);
        geo.translate(0, 0.25, 0); // Move pivot to bottom

        // Access position attribute to taper width
        const posAttribute = geo.attributes.position;
        const vertex = new THREE.Vector3();

        // Taper: Scale X based on Y height
        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            // Normalize height 0..1 (geometry is 0 to 0.5, so /0.5)
            const h = vertex.y / 0.5;
            // Taper factor: 1.0 at bottom, 0.0 at top
            const width = 1.0 - Math.pow(h, 1.5);
            vertex.x *= width;
            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        geo.computeVertexNormals();
        return geo;
    }, []);

    // Distribute instances on the ground surface
    useEffect(() => {
        if (meshRef.current && geometry) {
            // MeshSurfaceSampler samples points in GEOMETRY LOCAL SPACE.
            // We need to offset these by the ground mesh's world position.
            const sampler = new MeshSurfaceSampler(
                new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())
            )
                .setWeightAttribute(null)
                .build();

            // Extract position offset from props
            let offsetX = 0, offsetY = 0, offsetZ = 0;
            if (position) {
                if (Array.isArray(position)) {
                    offsetX = position[0] ?? 0;
                    offsetY = position[1] ?? 0;
                    offsetZ = position[2] ?? 0;
                } else if (typeof position === 'object') {
                    offsetX = (position as any).x ?? 0;
                    offsetY = (position as any).y ?? 0;
                    offsetZ = (position as any).z ?? 0;
                }
            }

            const tempPosition = new THREE.Vector3();
            const tempNormal = new THREE.Vector3();

            for (let i = 0; i < bladeCount; i++) {
                // Sample returns local geometry coordinates
                sampler.sample(tempPosition, tempNormal);

                // Apply the ground's world position offset
                dummy.position.set(
                    tempPosition.x + offsetX,
                    tempPosition.y + offsetY,
                    tempPosition.z + offsetZ
                );

                // Random scale
                const s = 0.6 + Math.random() * 0.4;
                dummy.scale.set(s, s, s);

                // Random Y rotation
                dummy.rotation.y = Math.random() * Math.PI * 2;

                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;

            // Re-enable frustum culling by computing the bounding sphere
            meshRef.current.computeBoundingSphere();
        }
    }, [geometry, bladeCount, dummy, position]);

    // Animation Loop
    useFrame((state, delta) => {
        if (materialRef.current) {
            // Update time
            materialRef.current.uTime = state.clock.elapsedTime;

            // Handle Mouse Interaction
            // Optimize: Only raycast every few frames or if mouse moved significantly? 
            // For now, keep as is for responsiveness.
            raycaster.setFromCamera(pointer, camera);

            // Update ground plane to match current world height of the ground
            // We approximate the ground height using the Y position
            let posY = 0;
            if (position) {
                if (Array.isArray(position)) posY = position[1];
                else if (typeof position === 'object' && 'y' in position) posY = (position as any).y;
            }
            // Plane constant d where ax + by + cz + d = 0. for (0,1,0), y + d = 0 => d = -y
            // Tune: Lift the plane significantly (0.4) to match visible grass height better and fix "above cursor" parallax
            groundPlane.constant = -(posY + 2);

            if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
                mousePosition.set(intersectionPoint.x, intersectionPoint.z);
                targetMouseInfluence.current = 1.0;
            } else {
                targetMouseInfluence.current = 0.0;
            }

            // Smooth fade
            mouseInfluence.current += (targetMouseInfluence.current - mouseInfluence.current) * delta * 5.0;

            materialRef.current.uMouse = mousePosition;
            materialRef.current.uMouseInfluence = mouseInfluence.current;
        }
    });

    return (
        <group {...props}>
            {/* 
               The InstancedMesh is placed at WORLD ORIGIN (identity transform).
               This ensures that the "world positions" we calculated in useEffect are correct
               and not double-transformed by this group.
            */}
            <instancedMesh
                ref={meshRef}
                args={[bladeGeometry, undefined, bladeCount]}
                // Enable culling now that we compute bounding sphere
                frustumCulled={true}
                position={[0, 0, 0]}
            >
                <grassBladeMaterial ref={materialRef} />
            </instancedMesh>

            {/* The underlying ground mesh */}
            {/* Must match the visual position */}
            <mesh
                geometry={geometry}
                position={position}
                receiveShadow
            >
                <meshStandardMaterial color="#166534" roughness={1} />
            </mesh>
        </group>
    );
}
