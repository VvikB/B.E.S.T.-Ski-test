import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import type { ComponentRef } from "react";
import { cameraPosition } from "./motion";
import { ArticulatedSkier, ComparisonPair, RigTrajectory } from "./RigModel";
import type { Guides, MarkerId, ScenarioId } from "./rig";
import type { CameraView } from "./motion";
type Props = {
  frame: number;
  view: CameraView;
  reset: number;
  rotation: number;
  quality: "low" | "high";
  trajectory: boolean;
  compare: boolean;
  a: number;
  b: number;
  onContextLost: () => void;
  scenario: ScenarioId;
  guides: Guides;
  marker: MarkerId;
};
function ContextLifecycle({ onLoss }: { onLoss: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const node = gl.domElement;
    const listener = (event: Event) => {
      event.preventDefault();
      onLoss();
    };
    node.addEventListener("webglcontextlost", listener);
    return () => node.removeEventListener("webglcontextlost", listener);
  }, [gl, onLoss]);
  return null;
}
function CameraRig({
  view,
  reset,
  rotation,
  compare,
}: {
  view: CameraView;
  reset: number;
  rotation: number;
  compare: boolean;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, invalidate, size } = useThree();
  useEffect(() => {
    camera.position.set(...cameraPosition(view, compare));
    if (view === "orbit")
      camera.position.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rotation * 0.25,
      );
    camera.up.set(0, view === "top" ? 0 : 1, view === "top" ? -1 : 0);
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom = Math.max(
        25,
        Math.min(
          (size.height - 90) / 1.9,
          (size.width - 40) / (compare ? 3.7 : 1.7),
          compare ? 110 : 160,
        ),
      );
      camera.updateProjectionMatrix();
    }
    camera.lookAt(0, 1, 0);
    if (controls.current) {
      controls.current.target.set(0, 1, 0);
      controls.current.update();
    }
    invalidate();
  }, [
    view,
    reset,
    rotation,
    compare,
    camera,
    invalidate,
    size.width,
    size.height,
  ]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping={false}
      minDistance={2}
      maxDistance={14}
      minZoom={25}
      maxZoom={160}
      enableRotate={view === "orbit"}
      maxPolarAngle={view === "orbit" ? Math.PI * 0.49 : Math.PI}
      target={[0, 1, 0]}
      enablePan={false}
    />
  );
}
export default function SkierScene(props: Props) {
  const {
    frame,
    view,
    reset,
    rotation,
    quality,
    trajectory,
    compare,
    a,
    b,
    onContextLost,
    scenario,
    guides,
    marker,
  } = props;
  const low = quality === "low";
  return (
    <Canvas
      key={quality}
      frameloop="demand"
      dpr={low ? 1 : [1, 1.5]}
      gl={{
        antialias: !low,
        powerPreference: low ? "low-power" : "default",
        preserveDrawingBuffer: true,
      }}
      aria-label="Интерактивная 3D-модель лыжника и двух лыж"
      role="img"
    >
      <color attach="background" args={["#edf2f0"]} />
      {view === "orbit" ? (
        <PerspectiveCamera
          makeDefault
          position={cameraPosition(view, compare)}
          fov={compare ? 36 : 30}
        />
      ) : (
        <OrthographicCamera
          makeDefault
          position={cameraPosition(view, compare)}
          zoom={compare ? 70 : 120}
          near={0.01}
          far={100}
        />
      )}
      <ambientLight intensity={1.5} />
      <hemisphereLight args={["#ffffff", "#aabcb4", 1.5]} />
      <directionalLight position={[4, 6, 4]} intensity={2.6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#edf2f0" />
      </mesh>
      <gridHelper args={[14, 28, "#ccd9d2", "#dbe4de"]} position={[0, 0, 0]} />
      {trajectory && !compare && (
        <RigTrajectory scenario={scenario} marker={marker} />
      )}
      <Suspense fallback={null}>
        {compare ? (
          <ComparisonPair
            a={a}
            b={b}
            scenario={scenario}
            low={low}
            guides={guides}
            marker={marker}
          />
        ) : (
          <ArticulatedSkier
            frame={frame}
            scenario={scenario}
            low={low}
            guides={guides}
            marker={marker}
          />
        )}
      </Suspense>
      <ContextLifecycle onLoss={onContextLost} />
      <CameraRig
        view={view}
        reset={reset}
        rotation={rotation}
        compare={compare}
      />
    </Canvas>
  );
}
