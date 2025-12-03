
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const FloatingSnow: React.FC = () => {
  const count = 2000; // Increased count for finer density
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = new THREE.Object3D();

  // Generate a procedural snowflake texture
  const snowflakeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#00000000'; // Transparent background
    ctx.fillRect(0, 0, 128, 128);

    // Draw Glow
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(64, 64, 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw 6-pointed star lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.translate(64, 64);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 48);
      ctx.stroke();
      
      // Add little branches
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(10, 40);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(-10, 40);
      ctx.stroke();

      ctx.rotate(Math.PI / 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Initial random positions
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 100, // Wider spread
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 60 - 10,
      speed: 0.02 + Math.random() * 0.05, // Slower fall speed
      wobbleSpeed: 0.5 + Math.random(),
      wobbleRadius: 0.5 + Math.random() * 1.5,
      randomOffset: Math.random() * 100,
      scale: Math.random() * 0.4 + 0.1 // Varied small sizes
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    particles.forEach((particle, i) => {
      // Downward drift
      let y = particle.y - t * particle.speed * 5; // Multiplier for consistent speed
      
      // Loop vertically
      const range = 100;
      const loopY = ((y + range / 2) % range) - range / 2;

      // Gentle wobble (Fluttering effect)
      // Snow doesn't fall straight, it sways
      const x = particle.x + Math.sin(t * particle.wobbleSpeed + particle.randomOffset) * particle.wobbleRadius;
      const z = particle.z + Math.cos(t * particle.wobbleSpeed * 0.8 + particle.randomOffset) * particle.wobbleRadius;

      tempObject.position.set(x, loopY, z);
      tempObject.scale.setScalar(particle.scale);
      
      // Rotate slowly to catch light/show shape, but not spin crazily
      tempObject.rotation.set(
        Math.sin(t * 0.5 + particle.randomOffset) * 0.5,
        Math.cos(t * 0.3 + particle.randomOffset) * 0.5,
        t * 0.1 + particle.randomOffset
      );
      
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Use a simple plane for the texture */}
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={snowflakeTexture} 
        transparent 
        opacity={0.7} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} // Prevents occlusion issues with transparent particles
        side={THREE.DoubleSide} // Visible from both sides as it tumbles
      />
    </instancedMesh>
  );
};
