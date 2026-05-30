import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Atmosphere } from './Atmosphere';
import { Starfield } from './Starfield';
import { CrisisMarkers } from './CrisisMarkers';
import type { Crisis } from '../../types/crisis';

const EARTH_DAY = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg';
const EARTH_NIGHT = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg';
const EARTH_CLOUDS = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-water.png';

function EarthMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, nightMap, cloudMap] = useTexture([EARTH_DAY, EARTH_NIGHT, EARTH_CLOUDS]);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.04;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.05;
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={dayMap}
          emissiveMap={nightMap}
          emissive={new THREE.Color(0x334466)}
          emissiveIntensity={0.4}
          specularMap={cloudMap}
          specular={new THREE.Color(0x888888)}
          shininess={15}
        />
      </mesh>
      {/* Cloud layer */}
      <mesh ref={cloudsRef} scale={[1.003, 1.003, 1.003]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial map={cloudMap} transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </>
  );
}

function LoadingEarth() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (meshRef.current) meshRef.current.rotation.y += delta * 0.05; });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshPhongMaterial color="#1a3a6b" emissive="#0a1a3a" shininess={25} />
    </mesh>
  );
}

interface SceneProps { crises: Crisis[]; onSelect: (c: Crisis) => void; }

function Scene({ crises, onSelect }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} />
      <directionalLight position={[-8, -2, -5]} intensity={0.15} color="#4488ff" />
      <Starfield />
      <Suspense fallback={<LoadingEarth />}>
        <EarthMesh />
      </Suspense>
      <Atmosphere />
      <CrisisMarkers crises={crises} onSelect={onSelect} />
      <OrbitControls enablePan={false} minDistance={2.8} maxDistance={14} dampingFactor={0.08} enableDamping />
    </>
  );
}

interface EarthProps { crises: Crisis[]; onSelectCrisis: (c: Crisis) => void; }

export function Earth({ crises, onSelectCrisis }: EarthProps) {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true }} style={{ background: '#050816' }}>
      <Scene crises={crises} onSelect={onSelectCrisis} />
    </Canvas>
  );
}
