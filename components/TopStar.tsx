import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

interface TopStarProps {
  state: TreeState;
}

export const TopStar: React.FC<TopStarProps> = ({ state }) => {
  const meshRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Target position (Top of tree)
  // Tree height in MorphingGroup goes roughly from -9 to +9.
  // The star sits proudly at the peak.
  const treePos = new THREE.Vector3(0, 10.5, 0);
  
  // Random scatter position
  const scatterPos = useMemo(() => {
    const r = 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }, []);

  // Create a 5-pointed Star Shape
  const starGeometry = useMemo(() => {
    const pts = [];
    const numPoints = 5;
    const outerRadius = 1.2;
    const innerRadius = 0.6;
    
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (numPoints * 2)) * Math.PI * 2;
      // -Math.PI / 2 to start point at top
      const finalAngle = angle - Math.PI / 2;
      pts.push(new THREE.Vector2(Math.cos(finalAngle) * radius, Math.sin(finalAngle) * radius));
    }
    const shape = new THREE.Shape(pts);
    const extrudeSettings = {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center geometry so rotation happens around the center
    geom.center();
    return geom;
  }, []);

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;

    // Interpolation factor
    const targetFactor = state === TreeState.TREE_SHAPE ? 1 : 0;
    const currentFactor = meshRef.current.userData.factor ?? 0;
    const speed = 2.0;
    const newFactor = THREE.MathUtils.lerp(currentFactor, targetFactor, delta * speed);
    meshRef.current.userData.factor = newFactor;

    // Position interpolation
    meshRef.current.position.lerpVectors(scatterPos, treePos, newFactor);

    // Rotation: Continuous spin + alignment
    // When scattered, it tumbles. When in tree, it spins gracefully upright.
    const time = stateThree.clock.elapsedTime;
    
    // Smooth transition of rotation speed/axis
    // Base spin
    meshRef.current.rotation.y = time * 0.5;
    
    // Tumble effect when scattered (reduced as we approach tree)
    const tumble = (1 - newFactor) * 2;
    meshRef.current.rotation.x = Math.sin(time) * tumble;
    meshRef.current.rotation.z = Math.cos(time * 0.8) * tumble;

    // Scale pulsing
    // Pop in when forming tree, slightly smaller when scattered
    const scaleBase = THREE.MathUtils.lerp(0.8, 1.2, newFactor);
    const pulseScale = 1 + Math.sin(time * 3) * 0.05;
    meshRef.current.scale.setScalar(scaleBase * pulseScale);

    // Pulsing Effects
    const pulse = Math.sin(time * 3); // -1 to 1

    // 1. Light Intensity Pulsing
    if (lightRef.current) {
      const baseIntensity = 20 * newFactor;
      const lightPulse = pulse * 5; 
      lightRef.current.intensity = Math.max(0, baseIntensity + (lightPulse * newFactor));
    }

    // 2. Material Emissive Intensity Pulsing (The Glowing Aura)
    // We drive this high to ensure it hits the Bloom threshold
    if (materialRef.current) {
       const glowFactor = newFactor; // Only glow intensely when forming the tree
       // Base emissive when tree is formed: 4.5
       // Pulse range: 3.0 to 6.0
       const dynamicEmissive = 4.5 + (pulse * 1.5);
       
       // When scattered, keep it dim (0.5). When tree, pulse high.
       materialRef.current.emissiveIntensity = 0.5 + (dynamicEmissive * glowFactor);
    }
  });

  return (
    <group ref={meshRef}>
      <mesh geometry={starGeometry} castShadow>
        <meshStandardMaterial 
          ref={materialRef}
          color="#ffdd00" 
          emissive="#ffaa00"
          // emissiveIntensity is controlled in useFrame
          metalness={1}
          roughness={0.1}
          toneMapped={false} // Critical for Bloom
        />
      </mesh>
      {/* Light source attached to star */}
      <pointLight 
        ref={lightRef}
        color="#ffaa00" 
        distance={25} 
        decay={2} 
        // intensity is controlled in useFrame
      />
    </group>
  );
};
