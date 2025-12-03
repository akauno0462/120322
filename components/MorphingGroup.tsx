import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeState, PositionData, ParticleGroupConfig } from '../types';

interface MorphingGroupProps {
  config: ParticleGroupConfig;
  state: TreeState;
}

const tempObject = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();

export const MorphingGroup: React.FC<MorphingGroupProps> = ({ config, state }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  // Refs for Gift Box decorations
  const ribbon1Ref = useRef<THREE.InstancedMesh>(null);
  const ribbon2Ref = useRef<THREE.InstancedMesh>(null);
  const bowRef = useRef<THREE.InstancedMesh>(null);

  const isGiftBox = config.geometryType === 'giftBox';
  const isCandyCane = config.geometryType === 'candyCane';

  // Pre-calculate positions for both states
  const data = useMemo(() => {
    const items: PositionData[] = [];
    const { count, scaleMultiplier } = config;

    for (let i = 0; i < count; i++) {
      // 1. Scatter Position: Random point in a large sphere
      const rScatter = 35 * Math.cbrt(Math.random()); 
      const thetaScatter = Math.random() * 2 * Math.PI;
      const phiScatter = Math.acos(2 * Math.random() - 1);
      
      const scatterPos = new THREE.Vector3(
        rScatter * Math.sin(phiScatter) * Math.cos(thetaScatter),
        rScatter * Math.sin(phiScatter) * Math.sin(thetaScatter),
        rScatter * Math.cos(phiScatter)
      );

      // 2. Tree Position: Cone spiral
      const hNormalized = Math.random(); 
      const y = (hNormalized * 18) - 9; // -9 to 9 height
      
      const maxRadiusAtY = (1 - (y + 9) / 18) * 6 + 0.5; 
      const radius = Math.random() * maxRadiusAtY; 
      const angle = y * 5 + Math.random() * Math.PI * 2;

      const treePos = new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );

      const rotation = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const scale = (0.5 + Math.random() * 1.5) * scaleMultiplier;

      items.push({ scatterPos, treePos, rotation, scale });
    }
    return items;
  }, [config]);

  // Candy Cane Striped Texture
  const stripedTexture = useMemo(() => {
    if (config.geometryType !== 'candyCane') return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 64);

    // Red stripes
    ctx.fillStyle = '#ff0000';
    
    // Create diagonal stripes
    ctx.beginPath();
    for (let i = -64; i < 128; i += 16) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 16, 64);
      ctx.lineTo(i + 8, 64);
      ctx.lineTo(i - 8, 0);
    }
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    // Repeat texture along the tube length to create spiral
    tex.repeat.set(1, 8); 
    return tex;
  }, [config.geometryType]);

  // Geometry Factory
  const Geometry = useMemo(() => {
    switch (config.geometryType) {
      case 'box': return <boxGeometry args={[0.8, 0.8, 0.8]} />;
      case 'giftBox': return <boxGeometry args={[0.8, 0.8, 0.8]} />; // Main box
      case 'cylinder': return <cylinderGeometry args={[0.3, 0.3, 1, 16]} />;
      case 'dodecahedron': return <dodecahedronGeometry args={[0.6, 0]} />;
      case 'candyCane': {
        // Create a hook shape curve
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.6, 0),
          new THREE.Vector3(0, 0.4, 0),    // Straight up
          new THREE.Vector3(0.1, 0.6, 0),  // Start curve
          new THREE.Vector3(0.3, 0.5, 0),  // Peak
          new THREE.Vector3(0.35, 0.3, 0)  // Tip down
        ]);
        return <tubeGeometry args={[curve, 32, 0.08, 8, false]} />;
      }
      case 'sphere': default: return <sphereGeometry args={[0.5, 32, 32]} />;
    }
  }, [config.geometryType]);

  // Gift Box Decoration Geometries
  const ribbon1Geo = useMemo(() => <boxGeometry args={[0.82, 0.82, 0.2]} />, []);
  const ribbon2Geo = useMemo(() => <boxGeometry args={[0.2, 0.82, 0.82]} />, []);
  const bowGeo = useMemo(() => {
    const geo = new THREE.TorusKnotGeometry(0.15, 0.04, 64, 8);
    geo.translate(0, 0.45, 0); 
    return <primitive object={geo} attach="geometry" />;
  }, []);

  // Animation Loop
  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;

    const targetFactor = state === TreeState.TREE_SHAPE ? 1 : 0;
    const currentFactor = meshRef.current.userData.factor ?? 0;
    
    // Smooth interpolation
    const speed = 2.5;
    const newFactor = THREE.MathUtils.lerp(currentFactor, targetFactor, delta * speed);
    meshRef.current.userData.factor = newFactor;

    const time = stateThree.clock.elapsedTime;

    data.forEach((item, i) => {
      // Interpolate position
      tempVec3.lerpVectors(item.scatterPos, item.treePos, newFactor);
      
      // Floating movement
      const floatIntensity = 1 - newFactor * 0.8; 
      const floatY = Math.sin(time + i * 10) * 0.5 * floatIntensity;
      const floatX = Math.cos(time * 0.5 + i * 5) * 0.5 * floatIntensity;
      
      tempObject.position.copy(tempVec3).add(new THREE.Vector3(floatX, floatY, 0));
      
      // Rotation logic
      if (isCandyCane) {
         // Candy canes should mostly stand upright-ish when in tree, but scattered otherwise
         // We blend between random rotation and a more upright orientation for the hook
         // Actually, let's keep them spinning for fun, maybe slow them down in tree
         tempObject.rotation.set(
            item.rotation.x + time * 0.5,
            item.rotation.y + time * 0.5,
            item.rotation.z
         );
      } else {
         tempObject.rotation.set(
            item.rotation.x + time * 0.2,
            item.rotation.y + time * 0.2,
            item.rotation.z
          );
      }
      
      tempObject.scale.setScalar(item.scale);
      tempObject.updateMatrix();
      
      // Update Main Mesh
      meshRef.current!.setMatrixAt(i, tempObject.matrix);

      // Update Decoration Meshes if Gift Box
      if (isGiftBox) {
        if (ribbon1Ref.current) ribbon1Ref.current.setMatrixAt(i, tempObject.matrix);
        if (ribbon2Ref.current) ribbon2Ref.current.setMatrixAt(i, tempObject.matrix);
        if (bowRef.current) bowRef.current.setMatrixAt(i, tempObject.matrix);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (isGiftBox) {
      if (ribbon1Ref.current) ribbon1Ref.current.instanceMatrix.needsUpdate = true;
      if (ribbon2Ref.current) ribbon2Ref.current.instanceMatrix.needsUpdate = true;
      if (bowRef.current) bowRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Main Object */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, config.count]} castShadow receiveShadow>
        {Geometry}
        <meshStandardMaterial 
          color={isCandyCane ? '#ffffff' : config.color} 
          metalness={config.metalness} 
          roughness={config.roughness}
          emissive={isCandyCane ? '#000000' : config.color}
          emissiveIntensity={isCandyCane ? 0 : (config.emissiveIntensity ?? 0.2)}
          envMapIntensity={config.envMapIntensity ?? 2}
          map={stripedTexture}
        />
      </instancedMesh>

      {/* Decorations for Gift Box */}
      {isGiftBox && (
        <>
          <instancedMesh ref={ribbon1Ref} args={[undefined, undefined, config.count]}>
            {ribbon1Geo}
            <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} envMapIntensity={3} />
          </instancedMesh>
          <instancedMesh ref={ribbon2Ref} args={[undefined, undefined, config.count]}>
            {ribbon2Geo}
            <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} envMapIntensity={3} />
          </instancedMesh>
          <instancedMesh ref={bowRef} args={[undefined, undefined, config.count]}>
            {bowGeo}
            <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} envMapIntensity={3} />
          </instancedMesh>
        </>
      )}
    </group>
  );
};