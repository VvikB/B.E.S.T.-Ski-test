import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import type { ComponentRef } from "react";
import { cameraPosition, LAST_FRAME, poseAtFrame } from "./motion";
import type { CameraView } from "./motion";
type Point = [number, number, number];
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
};
function Segment({
  from,
  to,
  radius,
  color,
  low,
}: {
  from: Point;
  to: Point;
  radius: number;
  color: string;
  low: boolean;
}) {
  const { position, rotation, length } = useMemo(() => {
    const start = new THREE.Vector3(...from),
      end = new THREE.Vector3(...to);
    const delta = end.clone().sub(start);
    return {
      position: start.add(end).multiplyScalar(0.5),
      rotation: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        delta.clone().normalize(),
      ),
      length: delta.length(),
    };
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);
  return (
    <mesh position={position} quaternion={rotation}>
      <cylinderGeometry args={[radius * 0.92, radius, length, low ? 6 : 12]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}
function Ski({ yaw, x, color }: { yaw: number; x: number; color: string }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.075, -0.88);
    s.lineTo(-0.075, 0.84);
    s.quadraticCurveTo(-0.075, 1.06, 0, 1.1);
    s.quadraticCurveTo(0.075, 1.06, 0.075, 0.84);
    s.lineTo(0.075, -0.88);
    s.quadraticCurveTo(0, -0.99, -0.075, -0.88);
    return s;
  }, []);
  return (
    <group position={[x, 0.07, 0]} rotation={[0, yaw, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI]}>
        <extrudeGeometry
          args={[
            shape,
            { depth: 0.035, bevelEnabled: false, curveSegments: 8 },
          ]}
        />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.048, 0.02]}>
        <boxGeometry args={[0.095, 0.04, 0.38]} />
        <meshStandardMaterial color="#263d42" />
      </mesh>
      <mesh position={[0, 0.115, 0.07]}>
        <boxGeometry args={[0.14, 0.16, 0.3]} />
        <meshStandardMaterial color="#385c61" />
      </mesh>
      <mesh position={[0, 0.145, 0.18]}>
        <boxGeometry args={[0.145, 0.055, 0.07]} />
        <meshStandardMaterial color="#eaa062" />
      </mesh>
    </group>
  );
}
function Skier({
  frame,
  offset = 0,
  comparison = false,
  low = false,
  accent = "#eaa062",
}: {
  frame: number;
  offset?: number;
  comparison?: boolean;
  low?: boolean;
  accent?: string;
}) {
  const p = poseAtFrame(frame);
  const hipY = 1.03 - p.bend;
  const shoulderY = hipY + 0.48;
  const segments = low ? 8 : 16;
  const leftAnkle: Point = [-0.22, 0.23, 0.03],
    rightAnkle: Point = [0.22, 0.23, 0.03];
  const leftKnee: Point = [-0.23, 0.6 - p.bend * 0.25, 0.12 + p.bend],
    rightKnee: Point = [0.23, 0.6 - p.bend * 0.25, 0.12 + p.bend];
  const leftHip: Point = [-0.15 + p.sway, hipY, -0.05 - p.bend * 0.5],
    rightHip: Point = [0.15 + p.sway, hipY, -0.05 - p.bend * 0.5];
  const shoulders: [Point, Point] = [
    [-0.28 + p.sway, shoulderY, 0.03 + p.bend * 0.3],
    [0.28 + p.sway, shoulderY, 0.03 + p.bend * 0.3],
  ];
  return (
    <group
      position={[
        offset + (comparison ? 0 : p.rootX),
        0,
        comparison ? 0 : p.rootZ,
      ]}
      name="original-technical-skier"
    >
      <mesh
        position={[0, 0.008, 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.8, 1.35, 1]}
      >
        <circleGeometry args={[0.55, segments * 2]} />
        <meshBasicMaterial
          color="#8aa39a"
          transparent
          opacity={0.13}
          depthWrite={false}
        />
      </mesh>
      <Ski x={-0.22} yaw={p.skiYaw} color="#416e66" />
      <Ski x={0.22} yaw={-p.skiYaw} color="#416e66" />
      {[
        [leftAnkle, leftKnee],
        [rightAnkle, rightKnee],
        [leftKnee, leftHip],
        [rightKnee, rightHip],
      ].map(([from, to], i) => (
        <Segment
          key={i}
          from={from}
          to={to}
          radius={i < 2 ? 0.1 : 0.125}
          color="#263e49"
          low={low}
        />
      ))}
      <Segment
        from={leftHip}
        to={rightHip}
        radius={0.135}
        color="#263e49"
        low={low}
      />
      <mesh
        position={[p.sway, hipY + 0.26, p.bend * 0.05]}
        rotation={[p.bend * 0.55, 0, 0]}
      >
        <cylinderGeometry args={[0.27, 0.2, 0.49, segments]} />
        <meshStandardMaterial color={accent} roughness={0.8} />
      </mesh>
      <mesh position={[p.sway, shoulderY + 0.06, 0.04 + p.bend * 0.3]}>
        <sphereGeometry args={[0.1, segments, segments]} />
        <meshStandardMaterial color="#ead8bf" />
      </mesh>
      <mesh position={[p.sway, shoulderY + 0.25, 0.06 + p.bend * 0.3]}>
        <sphereGeometry args={[0.19, segments, segments]} />
        <meshStandardMaterial color="#24434a" roughness={0.6} />
      </mesh>
      <mesh position={[p.sway, shoulderY + 0.25, 0.225 + p.bend * 0.3]}>
        <boxGeometry args={[0.27, 0.09, 0.06]} />
        <meshStandardMaterial
          color="#a6ceca"
          metalness={0.25}
          roughness={0.3}
        />
      </mesh>
      {shoulders.map((shoulder, i) => {
        const sign = i === 0 ? -1 : 1;
        const elbow: Point = [sign * 0.39 + p.sway, shoulderY - 0.21, 0.17];
        const hand: Point = [
          sign * 0.34 + p.sway,
          shoulderY - 0.35,
          0.36 + p.bend * 0.2,
        ];
        return (
          <group key={i}>
            <mesh position={shoulder}>
              <sphereGeometry args={[0.12, segments, segments]} />
              <meshStandardMaterial color={accent} />
            </mesh>
            <Segment
              from={shoulder}
              to={elbow}
              radius={0.095}
              color={accent}
              low={low}
            />
            <Segment
              from={elbow}
              to={hand}
              radius={0.075}
              color={accent}
              low={low}
            />
            <mesh position={hand}>
              <sphereGeometry args={[0.085, segments, segments]} />
              <meshStandardMaterial color="#24434a" />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.055, 0]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial color="#bd6d39" />
      </mesh>
    </group>
  );
}
function Trajectory() {
  const geometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: LAST_FRAME + 1 }, (_, frame) => {
          const p = poseAtFrame(frame);
          return new THREE.Vector3(p.rootX, 0.045, p.rootZ);
        }),
      ),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <primitive
      object={useMemo(
        () =>
          new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({ color: "#be794c" }),
          ),
        [geometry],
      )}
      dispose={null}
    />
  );
}
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
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.position.set(...cameraPosition(view, compare));
    if (view === "orbit")
      camera.position.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rotation * 0.25,
      );
    camera.lookAt(0, 0.85, 0);
    if (controls.current) {
      controls.current.target.set(0, 0.85, 0);
      controls.current.update();
    }
    invalidate();
  }, [view, reset, rotation, compare, camera, invalidate]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping={false}
      minDistance={2}
      maxDistance={14}
      minZoom={25}
      maxZoom={160}
      maxPolarAngle={Math.PI * 0.49}
      target={[0, 0.85, 0]}
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
          fov={36}
        />
      ) : (
        <OrthographicCamera
          makeDefault
          position={cameraPosition(view, compare)}
          zoom={compare ? 62 : 88}
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
      {trajectory && !compare && <Trajectory />}
      <Suspense fallback={null}>
        {compare ? (
          <>
            <Skier
              frame={a}
              offset={-1.35}
              comparison
              low={low}
              accent="#eaa062"
            />
            <Skier
              frame={b}
              offset={1.35}
              comparison
              low={low}
              accent="#6e9b9a"
            />
          </>
        ) : (
          <Skier frame={frame} low={low} />
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
