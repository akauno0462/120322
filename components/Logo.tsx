import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeState } from '../types';

// Helper to generate a transparent texture for text
// We render White text on Transparent background.
// This allows us to use it as an alphaMap/map and tint it with material color.
const useTextTexture = (text: string, font: string, width: number, height: number) => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      
      // Text styling
      ctx.fillStyle = '#ffffff'; // Always white, color controlled by Material
      ctx.font = font; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Shadow for softness
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 4;

      ctx.fillText(text, width / 2, height / 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [text, font, width, height]);
};

interface LogoElementProps {
  state: TreeState;
  text: string;
  font: string;
  texWidth: number;
  texHeight: number;
  scale: [number, number, number];
  targetOffset: [number, number, number]; // Offset from center [0, -1, 10]
  materialType: 'glow' | 'velvet';
}

const LogoElement: React.FC<LogoElementProps> = ({ 
  state, text, font, texWidth, texHeight, scale, targetOffset, materialType 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTextTexture(text, font, texWidth, texHeight);
  
  // Base position for the Logo Group in Tree State
  const treeBasePos = new THREE.Vector3(0, -1, 11); // Slightly pushed forward
  const finalTreePos = new THREE.Vector3().copy(treeBasePos).add(new THREE.Vector3(...targetOffset));

  // Random scatter position unique to this element
  const scatterConfig = useMemo(() => {
    return {
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 45,
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 20
      ),
      rotSpeed: new THREE.Vector3(
        Math.random() * 0.5,
        Math.random() * 0.5,
        Math.random() * 0.5
      ),
      randomPhase: Math.random() * 10
    };
  }, []);

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;

    const targetFactor = state === TreeState.TREE_SHAPE ? 1 : 0;
    const currentFactor = meshRef.current.userData.factor ?? 0;
    
    // Smooth lerp for transition
    const speed = 2.0;
    const newFactor = THREE.MathUtils.lerp(currentFactor, targetFactor, delta * speed);
    meshRef.current.userData.factor = newFactor;

    // 1. Position Interpolation
    meshRef.current.position.lerpVectors(scatterConfig.pos, finalTreePos, newFactor);

    // 2. Rotation Handling
    if (newFactor > 0.95) {
      // Snap to perfectly flat/front-facing when fully formed
      meshRef.current.rotation.set(0, 0, 0);
    } else {
      // Tumble when scattered
      const time = stateThree.clock.elapsedTime + scatterConfig.randomPhase;
      const tumbleX = time * scatterConfig.rotSpeed.x;
      const tumbleY = time * scatterConfig.rotSpeed.y;
      const tumbleZ = time * scatterConfig.rotSpeed.z * 0.5;

      // Interpolate tumble to zero
      const invFactor = 1 - newFactor;
      meshRef.current.rotation.set(
        tumbleX * invFactor,
        tumbleY * invFactor,
        tumbleZ * invFactor
      );
    }

    // 3. Floating Effect when formed
    if (newFactor > 0.8) {
      const time = stateThree.clock.elapsedTime + scatterConfig.randomPhase;
      // Gentle bobbing
      meshRef.current.position.y += Math.sin(time * 1.5) * 0.002;
    }
  });

  return (
    <mesh ref={meshRef} scale={scale}>
      <planeGeometry args={[1, 1]} />
      {materialType === 'glow' ? (
        // Glowing White Material (For Chinese Text)
        <meshStandardMaterial 
          map={texture} 
          transparent 
          alphaTest={0.01}
          color="#FFFFFF"
          emissive="#FFFFFF"
          emissiveIntensity={3} 
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      ) : (
        // Silver Velvet Material (For English Text)
        // Uses alphaMap so the texture defines opacity, but color defines the surface
        <meshStandardMaterial 
          alphaMap={texture}
          transparent
          // Silver/Light Grey Color
          color="#dcdcdc"
          // Velvet properties: High roughness (matte), low/med metalness (sheen)
          roughness={1.0} 
          metalness={0.4}
          envMapIntensity={0.8}
          emissive="#000000" // No glow
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
};

export const Logo: React.FC<{ state: TreeState }> = ({ state }) => {
  return (
    <>
      {/* 1. Chinese Characters - Separate Elements - Glowing White */}
      <LogoElement 
        state={state}
        text="珀"
        font="bold 300px sans-serif"
        texWidth={512} texHeight={512}
        scale={[1.8, 1.8, 1]}
        targetOffset={[-2.4, 0.8, 0]} 
        materialType="glow"
      />
      <LogoElement 
        state={state}
        text="森"
        font="bold 300px sans-serif"
        texWidth={512} texHeight={512}
        scale={[1.8, 1.8, 1]}
        targetOffset={[-0.8, 0.8, 0]}
        materialType="glow"
      />
      <LogoElement 
        state={state}
        text="咖"
        font="bold 300px sans-serif"
        texWidth={512} texHeight={512}
        scale={[1.8, 1.8, 1]}
        targetOffset={[0.8, 0.8, 0]}
        materialType="glow"
      />
      <LogoElement 
        state={state}
        text="啡"
        font="bold 300px sans-serif"
        texWidth={512} texHeight={512}
        scale={[1.8, 1.8, 1]}
        targetOffset={[2.4, 0.8, 0]}
        materialType="glow"
      />

      {/* 2. English Title - Now Glowing White */}
      <LogoElement 
        state={state}
        text="Passion Coffee Shop"
        font="bold 80px sans-serif"
        texWidth={1024} texHeight={256}
        scale={[7, 1.75, 1]}
        targetOffset={[0, -0.6, 0]}
        materialType="glow"
      />

      {/* 3. Subtitle - Now Glowing White */}
      <LogoElement 
        state={state}
        text="EST2021 YUNFU"
        font="60px sans-serif"
        texWidth={512} texHeight={128}
        scale={[3.5, 0.875, 1]}
        targetOffset={[0, -1.5, 0]}
        materialType="glow"
      />
    </>
  );
};