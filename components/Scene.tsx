import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, Stars, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MorphingGroup } from './MorphingGroup';
import { FloatingSnow } from './FloatingSnow';
import { TopStar } from './TopStar';
import { Logo } from './Logo';
import { RecordButton } from './RecordButton';
import { TreeState } from '../types';

interface SceneProps {
  treeState: TreeState;
  toggleState: () => void;
}

export const Scene: React.FC<SceneProps> = ({ treeState, toggleState }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 25], fov: 45 }}
      gl={{ 
        antialias: false, 
        toneMapping: THREE.ReinhardToneMapping, 
        toneMappingExposure: 1.5,
        preserveDrawingBuffer: true // Required for recording to work reliably
      }}
      dpr={[1, 2]}
      onClick={toggleState} // Interaction happens on the whole canvas
    >
      <color attach="background" args={['#000500']} />
      
      <Suspense fallback={null}>
        {/* UI Overlay for Recording */}
        <Html fullscreen style={{ pointerEvents: 'none' }}>
           <RecordButton />
        </Html>

        {/* Cinematic Lighting */}
        <ambientLight intensity={0.2} color="#002200" />
        <spotLight 
          position={[10, 20, 10]} 
          angle={0.5} 
          penumbra={1} 
          intensity={15} 
          color="#ffd700" 
          castShadow 
        />
        <pointLight position={[-10, 5, -10]} intensity={5} color="#00ff88" />
        <pointLight position={[0, -10, 5]} intensity={5} color="#ff0044" />

        {/* Environment for Reflection (Crucial for Gold) */}
        <Environment preset="city" />

        {/* Particle Groups */}
        
        {/* 1. Golden Spheres (Original High Gloss) - Reduced count to share with Velvet */}
        <MorphingGroup 
          state={treeState}
          config={{
            count: 350,
            color: '#FFD700', // Gold
            metalness: 1,
            roughness: 0.1,
            geometryType: 'sphere',
            scaleMultiplier: 0.8,
            envMapIntensity: 2
          }} 
        />

        {/* 1b. Velvet Gold Spheres (New) - Matte, Fabric-like finish */}
        <MorphingGroup 
          state={treeState}
          config={{
            count: 250,
            color: '#FDB931', // Richer, warmer gold for velvet
            metalness: 0.1,   // Low metalness makes it look like fabric/matte
            roughness: 1.0,   // High roughness for velvet/felt texture
            geometryType: 'sphere',
            scaleMultiplier: 0.8,
            envMapIntensity: 0.2 // Very low reflection
          }} 
        />

        {/* 2. Emerald Gems - Shiny Dark Green (Ink Green) */}
        <MorphingGroup 
          state={treeState}
          config={{
            count: 200,
            color: '#004225', // Deep Ink Green
            metalness: 0.8, 
            roughness: 0.1, 
            geometryType: 'sphere',
            scaleMultiplier: 1.0,
            emissiveIntensity: 0.2, 
            envMapIntensity: 3.0 
          }} 
        />

        {/* 3. Silver Spheres */}
        <MorphingGroup 
          state={treeState}
          config={{
            count: 200,
            color: '#E0E0E0', // Bright Silver
            metalness: 1.0,
            roughness: 0.1,
            geometryType: 'sphere',
            scaleMultiplier: 0.5, 
            envMapIntensity: 2.5
          }} 
        />

        {/* 3b. Matte Red Spheres (New) - Frosted/Ceramic look */}
        <MorphingGroup 
          state={treeState}
          config={{
            count: 150,
            color: '#D32F2F', // Matte Red
            metalness: 0.0,   // Non-metallic
            roughness: 0.8,   // Frosted surface
            geometryType: 'sphere',
            scaleMultiplier: 0.9,
            envMapIntensity: 0.5
          }} 
        />

        {/* 4. Candy Canes */}
        <MorphingGroup 
          state={treeState}
          config={{
            count: 100,
            color: '#FFFFFF', 
            metalness: 0.1, 
            roughness: 0.4,
            geometryType: 'candyCane',
            scaleMultiplier: 1.5, 
            envMapIntensity: 1.0
          }} 
        />

        {/* 5. Gift Boxes (Red, Orange, Blue) */}
        {/* Red Gifts */}
        <MorphingGroup 
          state={treeState}
          config={{
            count: 50,
            color: '#C41E3A', // Cardinal Red
            metalness: 0.5,
            roughness: 0.2,
            geometryType: 'giftBox',
            scaleMultiplier: 0.9,
            envMapIntensity: 1.5
          }} 
        />
        
        {/* Orange Gifts */}
        <MorphingGroup 
          state={treeState}
          config={{
            count: 40,
            color: '#E65100', // Deep Orange / Bronze
            metalness: 0.6,
            roughness: 0.2,
            geometryType: 'giftBox',
            scaleMultiplier: 0.85,
            envMapIntensity: 1.5
          }} 
        />

        {/* Blue Gifts */}
        <MorphingGroup 
          state={treeState}
          config={{
            count: 40,
            color: '#1A237E', // Royal/Midnight Blue
            metalness: 0.6,
            roughness: 0.2,
            geometryType: 'giftBox',
            scaleMultiplier: 0.85,
            envMapIntensity: 1.5
          }} 
        />

        {/* 6. The Tree Top Star */}
        <TopStar state={treeState} />
        
        {/* 7. The Logo */}
        <Logo state={treeState} />

        {/* Background & Atmosphere */}
        <FloatingSnow />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Floor Reflections only visible near bottom */}
        <ContactShadows opacity={0.5} scale={30} blur={2} far={10} resolution={256} color="#000000" />

        {/* Post Processing for the "Dreamy/Luxurious" look */}
        <EffectComposer enableNormalPass={false}>
          <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.4}
          />
          <Noise opacity={0.02} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>

        {/* Camera Controls */}
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 1.8}
          minDistance={15}
          maxDistance={40}
          autoRotate={treeState === TreeState.TREE_SHAPE}
          autoRotateSpeed={0.5}
        />
      </Suspense>
    </Canvas>
  );
};
