import { useRef, useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Crisis } from '../../types/crisis';

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function severityColor(severity: number): THREE.Color {
  if (severity >= 8) return new THREE.Color('#FF3B5C');
  if (severity >= 6) return new THREE.Color('#FF8C00');
  if (severity >= 4) return new THREE.Color('#FFC857');
  return new THREE.Color('#2EF2A3');
}

interface MarkerProps {
  crisis: Crisis;
  onClick: (crisis: Crisis) => void;
}

function CrisisMarker({ crisis, onClick }: MarkerProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => severityColor(crisis.severity), [crisis.severity]);
  const position = useMemo(() => latLngToVector3(crisis.lat, crisis.lng, 2.02), [crisis.lat, crisis.lng]);

  // Track pointer-down position to distinguish click from drag
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) {
      const scale = 1 + Math.sin(t * 2 + crisis.severity) * 0.4;
      ringRef.current.scale.setScalar(scale);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * 2 + crisis.severity) * 0.2;
    }
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.7 + Math.sin(t * 3) * 0.3;
    }
  });

  const normal = position.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!pointerDownPos.current) return;
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    // Only fire click if pointer barely moved (not a drag)
    if (Math.sqrt(dx * dx + dy * dy) < 6) {
      onClick(crisis);
    }
    pointerDownPos.current = null;
  };

  return (
    <group position={position} quaternion={quaternion}>
      {/* Large invisible hit area — makes clicking much easier */}
      <mesh onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <circleGeometry args={[0.12, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Pulse ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.025, 0.045, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Core dot */}
      <mesh ref={coreRef}>
        <circleGeometry args={[0.018, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

interface Props {
  crises: Crisis[];
  onSelect: (crisis: Crisis) => void;
}

export function CrisisMarkers({ crises, onSelect }: Props) {
  return (
    <>
      {crises.map((crisis) => (
        <CrisisMarker key={crisis.id} crisis={crisis} onClick={onSelect} />
      ))}
    </>
  );
}
