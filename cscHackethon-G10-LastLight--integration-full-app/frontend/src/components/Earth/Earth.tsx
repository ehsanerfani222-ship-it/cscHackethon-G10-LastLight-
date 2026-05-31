import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Atmosphere } from './Atmosphere';
import { Starfield } from './Starfield';
import { CrisisMarkers } from './CrisisMarkers';
import type { Crisis } from '../../types/crisis';

const EARTH_DAY = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg';

// Static earth mesh — no internal rotation. Parent group handles rotation.
function EarthMesh() {
  const [dayMap] = useTexture([EARTH_DAY]);

  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshPhongMaterial
        map={dayMap}
        emissive={new THREE.Color(0x112244)}
        emissiveIntensity={0.12}
        specular={new THREE.Color(0x333333)}
        shininess={10}
      />
    </mesh>
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

interface RotatingGlobeProps { crises: Crisis[]; onSelect: (c: Crisis) => void; }

// Single rotating group — Earth mesh + crisis markers spin together so
// markers always stay locked to the correct lat/lng on the surface.
function RotatingGlobe({ crises, onSelect }: RotatingGlobeProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.04;
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={<LoadingEarth />}>
        <EarthMesh />
      </Suspense>
      <CrisisMarkers crises={crises} onSelect={onSelect} />
    </group>
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
      <RotatingGlobe crises={crises} onSelect={onSelect} />
      <Atmosphere />
      <OrbitControls enablePan={false} minDistance={2.8} maxDistance={14} dampingFactor={0.08} enableDamping rotateSpeed={0.5} />
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
