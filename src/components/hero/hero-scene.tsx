import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

/**
 * The homepage 3D hero: floating study objects drifting in a violet/cyan glow.
 * Pure Three.js primitives, so nothing is fetched at runtime.
 */

const PALETTE = {
  violet: "#a855f7",
  blue: "#3b82f6",
  cyan: "#22d3ee",
  mint: "#34d399",
};

function FloatingShape({
  position,
  color,
  speed,
  kind,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  kind: "ico" | "torus" | "octa" | "box";
}) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += delta * speed * 0.4;
    mesh.current.rotation.y += delta * speed * 0.6;
    mesh.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * speed + position[0]) * 0.28;
  });

  return (
    <mesh ref={mesh} position={position}>
      {kind === "ico" ? (
        <icosahedronGeometry args={[0.9, 0]} />
      ) : kind === "torus" ? (
        <torusGeometry args={[0.7, 0.22, 16, 48]} />
      ) : kind === "octa" ? (
        <octahedronGeometry args={[0.8, 0]} />
      ) : (
        <boxGeometry args={[1, 1, 1]} />
      )}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.45}
        metalness={0.35}
        roughness={0.18}
        wireframe={kind === "ico"}
      />
    </mesh>
  );
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.8]}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color={PALETTE.cyan} />
      <pointLight position={[-5, -3, 2]} intensity={30} color={PALETTE.violet} />
      <pointLight position={[5, 3, -2]} intensity={24} color={PALETTE.blue} />

      <FloatingShape kind="ico" position={[-2.6, 0.6, 0]} color={PALETTE.violet} speed={0.5} />
      <FloatingShape kind="torus" position={[2.4, -0.4, -0.6]} color={PALETTE.cyan} speed={0.4} />
      <FloatingShape kind="octa" position={[0.4, 1.6, -1.4]} color={PALETTE.blue} speed={0.6} />
      <FloatingShape kind="box" position={[-1.2, -1.5, -1]} color={PALETTE.mint} speed={0.35} />
      <FloatingShape kind="ico" position={[3.4, 1.4, -2]} color={PALETTE.violet} speed={0.45} />
    </Canvas>
  );
}
