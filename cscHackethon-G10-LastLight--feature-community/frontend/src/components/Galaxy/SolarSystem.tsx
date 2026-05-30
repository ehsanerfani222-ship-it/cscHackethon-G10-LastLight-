import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { SpaceEvent } from '../../types/crisis';

interface PlanetData {
  id: string;
  orbitR: number;
  radius: number;
  speed: number;
  color: string;
  hasRings?: boolean;
  tiltAxis?: number;
}

const PLANETS: PlanetData[] = [
  { id: 'mercury', orbitR: 5,  radius: 0.12, speed: 1.8,  color: '#9b9b9b' },
  { id: 'venus',   orbitR: 8,  radius: 0.22, speed: 1.1,  color: '#e8cda0' },
  { id: 'earth',   orbitR: 11, radius: 0.25, speed: 0.7,  color: '#4fa3e0' },
  { id: 'mars',    orbitR: 15, radius: 0.15, speed: 0.5,  color: '#c1440e' },
  { id: 'jupiter', orbitR: 22, radius: 0.85, speed: 0.22, color: '#c88b3a' },
  { id: 'saturn',  orbitR: 30, radius: 0.72, speed: 0.15, color: '#e4d191', hasRings: true },
  { id: 'uranus',  orbitR: 38, radius: 0.45, speed: 0.10, color: '#b2e0e8', tiltAxis: 1.7 },
  { id: 'neptune', orbitR: 45, radius: 0.43, speed: 0.07, color: '#5b73df' },
];

interface SunProps {
  events: SpaceEvent[];
}

function Sun({ events }: SunProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const hasSevereEvent = events.some((e) => e.planetId === 'sun' && e.severity >= 6);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const pulse = 1.0 + Math.sin(clock.elapsedTime * 1.5) * 0.05;
      mat.emissiveIntensity = pulse * 2;
    }
    if (glowRef.current) {
      const s = 1.0 + Math.sin(clock.elapsedTime * 0.8) * 0.08;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <pointLight intensity={300} distance={200} decay={1.5} color="#fff5e0" />
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshStandardMaterial
          color="#fff5e0"
          emissive="#ffaa00"
          emissiveIntensity={2}
          roughness={0.4}
        />
      </mesh>
      {/* Glow halo 1 */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.4, 32, 32]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Glow halo 2 */}
      <mesh>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Alert ring if severe event */}
      {hasSevereEvent && (
        <PulsingRing radius={3.0} color="#ff4400" />
      )}
    </group>
  );
}

interface PulsingRingProps {
  radius: number;
  color: string;
}

function PulsingRing({ radius, color }: PulsingRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1.0 + Math.sin(clock.elapsedTime * 3) * 0.15;
      meshRef.current.scale.setScalar(scale);
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(clock.elapsedTime * 3) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.05, 8, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

interface OrbitPathProps {
  radius: number;
}

function OrbitPath({ radius }: OrbitPathProps) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#334466" transparent opacity={0.3} depthWrite={false} />
    </lineSegments>
  );
}

interface PlanetProps {
  data: PlanetData;
  events: SpaceEvent[];
  onSelect: (id: string) => void;
}

function Planet({ data, events, onSelect }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const planetEvents = events.filter((e) => e.planetId === data.id);
  const hasAlert = planetEvents.some((e) => e.severity >= 6);
  const maxSeverity = planetEvents.reduce((mx, e) => Math.max(mx, e.severity), 0);
  const alertColor = maxSeverity >= 8 ? '#ff2244' : maxSeverity >= 6 ? '#ff8800' : '#ffcc00';

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime * data.speed * 0.3;
      groupRef.current.position.x = Math.cos(t) * data.orbitR;
      groupRef.current.position.z = Math.sin(t) * data.orbitR;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  // Jupiter banding effect via vertex colors approximation
  const isJupiter = data.id === 'jupiter';

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        rotation={data.tiltAxis ? [data.tiltAxis, 0, 0] : [0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(data.id); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[data.radius, 32, 32]} />
        <meshStandardMaterial
          color={isJupiter ? '#c88b3a' : data.color}
          roughness={0.7}
          metalness={0.1}
          emissive={isJupiter ? '#7a4a10' : '#000000'}
          emissiveIntensity={isJupiter ? 0.1 : 0}
        />
      </mesh>

      {/* Saturn rings */}
      {data.hasRings && (
        <group rotation={[Math.PI / 6, 0, 0.2]}>
          <mesh>
            <ringGeometry args={[data.radius * 1.4, data.radius * 2.2, 64]} />
            <meshBasicMaterial
              color="#d4c57a"
              side={THREE.DoubleSide}
              transparent
              opacity={0.6}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[data.radius * 2.3, data.radius * 2.6, 64]} />
            <meshBasicMaterial
              color="#b8a855"
              side={THREE.DoubleSide}
              transparent
              opacity={0.3}
            />
          </mesh>
        </group>
      )}

      {/* Alert glow ring */}
      {hasAlert && (
        <PulsingRing radius={data.radius * 2.2} color={alertColor} />
      )}

      {/* Atmosphere for Earth */}
      {data.id === 'earth' && (
        <mesh scale={[1.15, 1.15, 1.15]}>
          <sphereGeometry args={[data.radius, 32, 32]} />
          <meshBasicMaterial
            color="#4499ff"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

function AsteroidBelt() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 800;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const r = 17.5 + (Math.random() - 0.5) * 3;
      const y = (Math.random() - 0.5) * 0.5;
      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.elapsedTime * 0.02;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial color="#8899aa" size={0.05} transparent opacity={0.6} />
    </points>
  );
}

function MilkyWayBand() {
  const positions = useMemo(() => {
    const count = 2000;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const r = 120 + (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 15;
      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    return arr;
  }, []);

  const colors = useMemo(() => {
    const count = 2000;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      arr[i * 3] = 0.4 + t * 0.4;       // R
      arr[i * 3 + 1] = 0.3 + t * 0.3;   // G
      arr[i * 3 + 2] = 0.6 + t * 0.4;   // B
    }
    return arr;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return (
    <points geometry={geometry}>
      <pointsMaterial vertexColors size={0.3} transparent opacity={0.4} />
    </points>
  );
}

interface SceneProps {
  events: SpaceEvent[];
  onSelectPlanet: (id: string) => void;
}

function Scene({ events, onSelectPlanet }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.05} />
      <Stars radius={100} depth={50} count={5000} factor={4} fade speed={0.5} />
      <MilkyWayBand />
      <Sun events={events} />
      {PLANETS.map((p) => (
        <group key={p.id}>
          <OrbitPath radius={p.orbitR} />
          <Planet data={p} events={events} onSelect={onSelectPlanet} />
        </group>
      ))}
      <AsteroidBelt />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={5}
        maxDistance={120}
        target={[0, 0, 0]}
      />
    </>
  );
}

export interface SolarSystemProps {
  events: SpaceEvent[];
  onSelectPlanet: (id: string) => void;
}

export function SolarSystem({ events, onSelectPlanet }: SolarSystemProps) {
  return (
    <Canvas
      camera={{ position: [0, 30, 80], fov: 60, near: 0.1, far: 1000 }}
      style={{ background: '#000008' }}
      gl={{ antialias: true }}
    >
      <Scene events={events} onSelectPlanet={onSelectPlanet} />
    </Canvas>
  );
}
