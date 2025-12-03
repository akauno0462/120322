import * as THREE from 'three';

export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export interface PositionData {
  scatterPos: THREE.Vector3;
  treePos: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
}

// Configuration for different particle groups (Ornaments, Gifts, Candies)
export interface ParticleGroupConfig {
  count: number;
  color: string;
  metalness: number;
  roughness: number;
  geometryType: 'sphere' | 'box' | 'cylinder' | 'dodecahedron' | 'giftBox' | 'candyCane';
  scaleMultiplier: number;
  emissiveIntensity?: number;
  envMapIntensity?: number;
}