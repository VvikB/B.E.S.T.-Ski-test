import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  BONES,
  MARKERS,
  SKI_OUTLINE,
  markerPoint,
  sampleMotion,
  tipRise,
} from "./rig";
import type { Guides, MarkerId, ScenarioId, SkiTransform, Vec3 } from "./rig";
import { LAST_FRAME } from "./motion";

function Rod({
  from,
  to,
  radius,
  color,
  low = false,
  depth = true,
  depthRadius,
}: {
  from: Vec3;
  to: Vec3;
  radius: number;
  color: string;
  low?: boolean;
  depth?: boolean;
  depthRadius?: number;
}) {
  const a = new THREE.Vector3(...from),
    b = new THREE.Vector3(...to),
    delta = b.clone().sub(a);
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    delta.clone().normalize(),
  );
  return (
    <mesh
      position={a.add(b).multiplyScalar(0.5)}
      quaternion={rotation}
      scale={[radius, delta.length(), depthRadius ?? radius]}
      renderOrder={depth ? 0 : 3}
    >
      <cylinderGeometry args={[1, 1, 1, low ? 8 : 16]} />
      <meshStandardMaterial color={color} roughness={0.75} depthTest={depth} />
    </mesh>
  );
}
function Joint({
  point,
  radius,
  color,
  low = false,
}: {
  point: Vec3;
  radius: number;
  color: string;
  low?: boolean;
}) {
  return (
    <mesh position={point}>
      <sphereGeometry args={[radius, low ? 8 : 16, low ? 8 : 12]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}
function SkiBoot({
  transform,
  low,
}: {
  transform: SkiTransform;
  low: boolean;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    SKI_OUTLINE.forEach(([x, z], i) =>
      i ? shape.lineTo(x, z) : shape.moveTo(x, z),
    );
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.028,
      bevelEnabled: false,
      curveSegments: low ? 4 : 8,
    });
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, 0.028, 0);
    const points = geometry.getAttribute("position");
    for (let i = 0; i < points.count; i++)
      points.setY(i, points.getY(i) + tipRise(points.getZ(i)));
    geometry.computeVertexNormals();
    return geometry;
  }, [low]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group position={transform.anchor} rotation={[0, transform.yaw, 0]}>
      <group rotation={[0, 0, transform.roll]}>
        <mesh geometry={geometry}>
          <meshStandardMaterial
            color="#375f65"
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, 0.034, 0.02]}>
          <boxGeometry args={[0.105, 0.028, 0.35]} />
          <meshStandardMaterial color="#b5c9c4" />
        </mesh>
        <mesh position={[0, 0.085, 0.065]}>
          <boxGeometry args={[0.13, 0.1, 0.29]} />
          <meshStandardMaterial color="#263c4e" />
        </mesh>
        <mesh position={[0, 0.18, 0]} rotation={[-0.06, 0, 0]}>
          <cylinderGeometry args={[0.082, 0.07, 0.2, low ? 8 : 16]} />
          <meshStandardMaterial color="#314f60" />
        </mesh>
        {[0.14, 0.22].map((y) => (
          <mesh key={y} position={[0, y, 0.064]}>
            <boxGeometry args={[0.137, 0.024, 0.035]} />
            <meshStandardMaterial color="#eab084" metalness={0.25} />
          </mesh>
        ))}
        <mesh position={[0, 0.032, 0.64]}>
          <boxGeometry args={[0.035, 0.004, 0.21]} />
          <meshStandardMaterial color="#e6b17c" />
        </mesh>
      </group>
    </group>
  );
}
function GuideLabel({ point, text }: { point: Vec3; text: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = "#c5d4cc";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 124);
    ctx.font = "80px sans-serif";
    ctx.fillStyle = "#294b42";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.split(" · ")[0], 128, 64);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={point} scale={[0.32, 0.16, 1]} renderOrder={5}>
      <spriteMaterial
        map={texture}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}
export function ArticulatedSkier({
  frame,
  scenario,
  low,
  guides,
  marker,
  local = false,
  accent = "#dd8e5c",
}: {
  frame: number;
  scenario: ScenarioId;
  low: boolean;
  guides: Guides;
  marker: MarkerId;
  local?: boolean;
  accent?: string;
}) {
  const pose = sampleMotion(frame, scenario),
    j = pose.joints;
  const root: Vec3 = local ? [0, 0, 0] : pose.root;
  const n = low ? 10 : 20;
  return (
    <group position={root} name="articulated-skier-v02">
      <mesh
        position={[0, 0.007, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1, 1.6, 1]}
      >
        <circleGeometry args={[0.4, 24]} />
        <meshBasicMaterial
          color="#81968b"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
      <SkiBoot transform={pose.skis.left} low={low} />
      <SkiBoot transform={pose.skis.right} low={low} />
      <mesh
        position={j.pelvis}
        rotation={[0, pose.parameters.bodyYaw, 0]}
        scale={[0.205, 0.125, 0.14]}
      >
        <sphereGeometry args={[1, n, n]} />
        <meshStandardMaterial color="#293d50" />
      </mesh>
      <Rod
        from={j.lumbar}
        to={j.chest}
        radius={0.235}
        depthRadius={0.137}
        color={accent}
        low={low}
      />
      <Joint point={j.chest} radius={0.125} color={accent} low={low} />
      <Rod
        from={j.chest}
        to={j.neck}
        radius={0.065}
        color="#e0bda4"
        low={low}
      />
      <Rod
        from={j.leftShoulder}
        to={j.rightShoulder}
        radius={0.105}
        color={accent}
        low={low}
      />
      {(["left", "right"] as const).map((side) => {
        const hip = j[`${side}Hip`],
          knee = j[`${side}Knee`],
          ankle = j[`${side}Ankle`],
          shoulder = j[`${side}Shoulder`],
          elbow = j[`${side}Elbow`],
          wrist = j[`${side}Wrist`];
        return (
          <group key={side}>
            <Rod
              from={hip}
              to={knee}
              radius={0.087}
              color="#293d50"
              low={low}
            />
            <Joint point={knee} radius={0.088} color="#344c5c" low={low} />
            <Rod
              from={knee}
              to={ankle}
              radius={0.068}
              color="#293d50"
              low={low}
            />
            <Joint point={hip} radius={0.092} color="#293d50" low={low} />
            <Joint point={ankle} radius={0.061} color="#314f60" low={low} />
            <Joint point={shoulder} radius={0.09} color={accent} low={low} />
            <Rod
              from={shoulder}
              to={elbow}
              radius={0.07}
              color={accent}
              low={low}
            />
            <Joint point={elbow} radius={0.071} color={accent} low={low} />
            <Rod
              from={elbow}
              to={wrist}
              radius={0.055}
              color={accent}
              low={low}
            />
            <Joint point={wrist} radius={0.065} color="#263f4e" low={low} />
          </group>
        );
      })}
      <group
        position={j.head}
        rotation={[pose.parameters.flex * 0.35, pose.parameters.bodyYaw, 0]}
      >
        <group>
          <mesh scale={[0.137, 0.165, 0.14]}>
            <sphereGeometry args={[1, n, n]} />
            <meshStandardMaterial color="#d9b397" />
          </mesh>
          <mesh position={[0, 0.045, -0.018]} scale={[0.151, 0.155, 0.143]}>
            <sphereGeometry args={[1, n, n]} />
            <meshStandardMaterial color="#244651" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.012, 0.126]}>
            <boxGeometry args={[0.225, 0.068, 0.035]} />
            <meshStandardMaterial
              color="#b2d9d5"
              metalness={0.3}
              roughness={0.24}
            />
          </mesh>
        </group>
      </group>
      {guides.joints && (
        <group>
          {BONES.map((bone, i) => (
            <Rod
              key={i}
              from={j[bone.from]}
              to={j[bone.to]}
              radius={0.009}
              color="#fff3be"
              depth={false}
              low
            />
          ))}
          {Object.entries(j)
            .filter(([key]) => !["head", "lumbar", "neck"].includes(key))
            .map(([key, p]) => (
              <mesh key={key} position={p} renderOrder={4}>
                <sphereGeometry args={[0.022, 8, 8]} />
                <meshBasicMaterial color="#263f62" depthTest={false} />
              </mesh>
            ))}
          <GuideLabel point={j.leftKnee} text="Kₗ · колено" />
          <GuideLabel point={j.rightElbow} text="Eᵣ · локоть" />
          <GuideLabel point={j.leftAnkle} text="Aₗ · голеностоп" />
        </group>
      )}
      {guides.body && (
        <group>
          <Rod
            from={j.pelvis}
            to={j.neck}
            radius={0.012}
            color="#b75539"
            low
            depth={false}
          />
          <Rod
            from={j.leftShoulder}
            to={j.rightShoulder}
            radius={0.009}
            color="#445993"
            low
            depth={false}
          />
          <Rod
            from={j.leftHip}
            to={j.rightHip}
            radius={0.009}
            color="#445993"
            low
            depth={false}
          />
          <GuideLabel point={j.pelvis} text="P · таз" />
          <GuideLabel point={j.chest} text="C · плечевой пояс" />
        </group>
      )}
      {guides.skis &&
        (["left", "right"] as const).map((side) => {
          const ski = pose.skis[side];
          return (
            <group key={side} position={ski.anchor} rotation={[0, ski.yaw, 0]}>
              <group rotation={[0, 0, ski.roll]}>
                <Rod
                  from={[0, 0.038, -0.78]}
                  to={[0, 0.038, 0.82]}
                  radius={0.009}
                  color={side === "left" ? "#be6c40" : "#3865a4"}
                  low
                  depth={false}
                />
                <Rod
                  from={[-0.16, 0.05, 0]}
                  to={[0.16, 0.05, 0]}
                  radius={0.008}
                  color="#553f69"
                  low
                  depth={false}
                />
                <GuideLabel
                  point={[0, 0.09, 0.66]}
                  text={side === "left" ? "L · левая" : "Rₛ · правая"}
                />
              </group>
            </group>
          );
        })}
      <mesh position={markerPoint(pose, marker, true)} renderOrder={5}>
        <sphereGeometry args={[0.034, 12, 12]} />
        <meshBasicMaterial color="#bd623b" depthTest={false} />
      </mesh>
      {marker !== "root" && (
        <GuideLabel
          point={markerPoint(pose, marker, true)}
          text={MARKERS.find((m) => m.id === marker)!.code}
        />
      )}
    </group>
  );
}
export function RigTrajectory({
  scenario,
  marker,
}: {
  scenario: ScenarioId;
  marker: MarkerId;
}) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      Array.from(
        { length: LAST_FRAME + 1 },
        (_, f) =>
          new THREE.Vector3(...markerPoint(sampleMotion(f, scenario), marker)),
      ),
    );
    return new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: "#b4643f",
        transparent: true,
        opacity: 0.75,
        depthTest: false,
      }),
    );
  }, [scenario, marker]);
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );
  return <primitive object={line} dispose={null} renderOrder={2} />;
}
export function ComparisonPair({
  a,
  b,
  scenario,
  low,
  guides,
  marker,
}: {
  a: number;
  b: number;
  scenario: ScenarioId;
  low: boolean;
  guides: Guides;
  marker: MarkerId;
}) {
  const left = useRef<THREE.Group>(null),
    right = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(() => {
    const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    left.current?.position.copy(axis).multiplyScalar(-1.18);
    right.current?.position.copy(axis).multiplyScalar(1.18);
  });
  return (
    <>
      <group ref={left}>
        <ArticulatedSkier
          frame={a}
          scenario={scenario}
          low={low}
          guides={guides}
          marker={marker}
          local
        />
      </group>
      <group ref={right}>
        <ArticulatedSkier
          frame={b}
          scenario={scenario}
          low={low}
          guides={guides}
          marker={marker}
          local
          accent="#699e9f"
        />
      </group>
    </>
  );
}
