/** D0.2 shared articulated pose. Geometry, not biomechanics or a ski simulator. */
import { clampFrame, LAST_FRAME, poseAtFrame, SAMPLE_RATE } from "./motion";
import type { CameraView } from "./motion";
export type Vec3 = [number, number, number];
export type ScenarioId = "balance" | "edge" | "steering" | "trust" | "neutral";
export type MarkerId = "root" | "pelvis" | "chest" | "leftKnee" | "rightWrist";
export type Guides = { joints: boolean; body: boolean; skis: boolean };
export type Scenario = {
  id: ScenarioId;
  letter: string;
  title: string;
  goal: string;
  observe: string;
  limitation: string;
  bestView: CameraView;
  phases: [string, string, string, string, string];
};
export const SCENARIOS: Scenario[] = [
  {
    id: "balance",
    letter: "B",
    title: "Balance · опора и положение",
    goal: "Различить положение таза, корпуса и суставов в одной условной модели.",
    observe:
      "Сравните высоту таза, сгибание коленей и направление оси корпуса. Лыжи сохраняют ориентацию.",
    limitation:
      "Положение сегментов не определяет распределение нагрузки, устойчивость или безопасность реального человека.",
    bestView: "side",
    phases: [
      "Исходное положение",
      "Плавное изменение",
      "Нижнее положение таза",
      "Возврат",
      "Исходное положение",
    ],
  },
  {
    id: "edge",
    letter: "E",
    title: "Edge Control · ориентация кантов",
    goal: "Увидеть поворот двух отдельных лыж вокруг их продольных осей.",
    observe:
      "Смотрите спереди на поперечные ориентиры лыж и положение ботинок. Связанные суставы следуют за ботинками.",
    limitation:
      "Кантование показано геометрически. Снег, сцепление, давление и тормозной путь не рассчитываются.",
    bestView: "front",
    phases: [
      "Нейтральные лыжи",
      "Наклон в одну сторону",
      "Возврат к нулю",
      "Наклон в другую сторону",
      "Нейтральные лыжи",
    ],
  },
  {
    id: "steering",
    letter: "S",
    title: "Steering · направление лыж",
    goal: "Отделить ориентацию лыж от пути выбранного маркера.",
    observe:
      "Смотрите сверху: две независимые лыжи меняют направление. Оси лыж и линия маркера обозначают разные величины.",
    limitation:
      "Это не модель поворота на склоне. Движение корпуса не объявляется универсальным способом управления лыжами.",
    bestView: "top",
    phases: [
      "Исходные оси",
      "Поворот осей влево",
      "Исходное направление",
      "Поворот осей вправо",
      "Исходные оси",
    ],
  },
  {
    id: "trust",
    letter: "T",
    title: "Trust · запрос и пауза",
    goal: "Обсудить сообщение о затруднении, не измеряя уверенность по позе.",
    observe:
      "В условном сценарии правая кисть поднимается, затем возвращается. Оси лыж остаются прежними.",
    limitation:
      "Жест — пример для обсуждения, не универсальный сигнал. По анимации нельзя диагностировать страх или уровень доверия.",
    bestView: "front",
    phases: [
      "Перед обсуждением",
      "Условный запрос",
      "Пауза для объяснения",
      "Возврат кисти",
      "Исходное положение",
    ],
  },
  {
    id: "neutral",
    letter: "N",
    title: "Нейтральный клип · наследие D0.1",
    goal: "Сохранить возможность просмотреть исходные временные параметры D0.1 на новом rig.",
    observe:
      "Сочетаются небольшие технические изменения положения. Для разбора отдельных величин выберите B, E, S или T.",
    limitation:
      "Параметры наследуются из D0.1; новый rig не делает старый клип методически принятым.",
    bestView: "side",
    phases: ["Начало", "Изменение", "Середина", "Возврат", "Начало"],
  },
];
export const MARKERS: { id: MarkerId; code: string; label: string }[] = [
  { id: "root", code: "R", label: "R · начало модели, не центр масс" },
  { id: "pelvis", code: "P", label: "P · середина таза модели" },
  { id: "chest", code: "C", label: "C · плечевой пояс модели" },
  { id: "leftKnee", code: "Kₗ", label: "Kₗ · левое колено модели" },
  { id: "rightWrist", code: "Wᵣ", label: "Wᵣ · правая кисть модели" },
];
export const RIG_VERSION = "articulated-0.2.0";
export const LENGTHS = {
  thigh: 0.44,
  shin: 0.43,
  upperArm: 0.29,
  forearm: 0.27,
  spine: 0.5,
};
export const add = (a: Vec3, b: Vec3): Vec3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
export const sub = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
export const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const length = (a: Vec3) => Math.hypot(...a);
export const distance = (a: Vec3, b: Vec3) => length(sub(a, b));
export const unit = (a: Vec3): Vec3 => mul(a, 1 / (length(a) || 1));
export function solveTwoBone(
  start: Vec3,
  end: Vec3,
  l1: number,
  l2: number,
  hint: Vec3,
): Vec3 {
  const d = distance(start, end);
  if (d > l1 + l2 + 1e-8 || d < Math.abs(l1 - l2) - 1e-8 || d < 1e-8)
    throw Error("Unreachable technical rig target");
  const u = unit(sub(end, start));
  const perpendicular = unit(sub(hint, mul(u, dot(hint, u))));
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  return add(add(start, mul(u, along)), mul(perpendicular, height));
}
export type SkiTransform = { anchor: Vec3; yaw: number; roll: number };
export function skiPoint(ski: SkiTransform, point: Vec3): Vec3 {
  const [x, y, z] = point,
    cr = Math.cos(ski.roll),
    sr = Math.sin(ski.roll),
    cy = Math.cos(ski.yaw),
    sy = Math.sin(ski.yaw);
  const xr = x * cr - y * sr,
    yr = x * sr + y * cr;
  return add(ski.anchor, [xr * cy + z * sy, yr, -xr * sy + z * cy]);
}
export const SKI_OUTLINE: [number, number][] = [
  [-0.055, -0.84],
  [-0.055, 0.72],
  [-0.045, 0.87],
  [-0.025, 0.94],
  [0, 0.97],
  [0.025, 0.94],
  [0.045, 0.87],
  [0.055, 0.72],
  [0.055, -0.84],
  [0.035, -0.9],
  [0, -0.92],
  [-0.035, -0.9],
];
export const tipRise = (z: number) =>
  z > 0.7 ? Math.pow((z - 0.7) / 0.27, 2) * 0.045 : 0;
export function skiOutline(ski: SkiTransform): Vec3[] {
  return SKI_OUTLINE.map(([x, z]) => skiPoint(ski, [x, 0.028 + tipRise(z), z]));
}
export function sampleMotion(
  rawFrame: number,
  scenario: ScenarioId = "balance",
) {
  const frame = clampFrame(rawFrame),
    phase = (frame / LAST_FRAME) * Math.PI * 2,
    s = Math.sin(phase),
    wave = (1 - Math.cos(phase)) / 2;
  let flex = 0.12,
    hipDrop = 0.02,
    lean = 0.015 * s,
    bodyYaw = 0,
    leftYaw = 0,
    rightYaw = 0,
    leftRoll = 0,
    rightRoll = 0,
    handLift = 0;
  let root: Vec3 = [0.09 * s, 0, 0.08 * (1 - Math.cos(phase))];
  if (scenario === "balance") {
    hipDrop = 0.02 + 0.1 * wave;
    flex = 0.12 + 0.1 * wave;
  }
  if (scenario === "edge") {
    leftRoll = rightRoll = s * 0.14;
    hipDrop = 0.045;
    lean = s * 0.025;
    flex = 0.14;
  }
  if (scenario === "steering") {
    leftYaw = rightYaw = s * 0.22;
    bodyYaw = s * 0.1;
    hipDrop = 0.05;
    flex = 0.15;
    root = [0.32 * s, 0, 0.16 * (1 - Math.cos(phase))];
  }
  if (scenario === "trust") {
    const u = frame / LAST_FRAME;
    const ease = (t: number) => t * t * (3 - 2 * t);
    root = [0, 0, 0];
    handLift =
      u < 0.2
        ? ease(u / 0.2)
        : u <= 0.55
          ? 1
          : u < 0.85
            ? 1 - ease((u - 0.55) / 0.3)
            : 0;
    hipDrop = 0.025;
    lean = 0;
  }
  if (scenario === "neutral") {
    const old = poseAtFrame(frame);
    hipDrop = 0.02 + old.bend * 0.5;
    flex = 0.12 + old.bend * 0.4;
    lean = old.sway * 0.35;
    leftYaw = old.skiYaw;
    rightYaw = -old.skiYaw;
    root = [old.rootX, 0, old.rootZ];
  }
  const leftSki: SkiTransform = {
    anchor: [-0.24, 0.02 + Math.abs(Math.sin(leftRoll)) * 0.065, 0],
    yaw: leftYaw,
    roll: leftRoll,
  };
  const rightSki: SkiTransform = {
    anchor: [0.24, 0.02 + Math.abs(Math.sin(rightRoll)) * 0.065, 0],
    yaw: rightYaw,
    roll: rightRoll,
  };
  const pelvis: Vec3 = [lean, 1.03 - hipDrop, -0.045];
  const across: Vec3 = [Math.cos(bodyYaw), 0, -Math.sin(bodyYaw)];
  const spineAxis: Vec3 = unit([lean * 0.5, Math.cos(flex), Math.sin(flex)]);
  const lumbar = add(pelvis, mul(spineAxis, 0.09)),
    chest = add(pelvis, mul(spineAxis, LENGTHS.spine));
  const neck = add(chest, mul(spineAxis, 0.1)),
    head = add(neck, mul(spineAxis, 0.17));
  const leftHip = add(pelvis, mul(across, -0.145)),
    rightHip = add(pelvis, mul(across, 0.145));
  const leftAnkle = skiPoint(leftSki, [0, 0.235, 0.01]),
    rightAnkle = skiPoint(rightSki, [0, 0.235, 0.01]);
  const leftKnee = solveTwoBone(
    leftHip,
    leftAnkle,
    LENGTHS.thigh,
    LENGTHS.shin,
    [0, 0, 1],
  );
  const rightKnee = solveTwoBone(
    rightHip,
    rightAnkle,
    LENGTHS.thigh,
    LENGTHS.shin,
    [0, 0, 1],
  );
  const leftShoulder = add(chest, mul(across, -0.245)),
    rightShoulder = add(chest, mul(across, 0.245));
  const leftWrist = add(leftShoulder, [-0.13, -0.36, 0.26]);
  const rightWrist = add(rightShoulder, [
    0.15 + 0.06 * handLift,
    -0.36 + 0.51 * handLift,
    0.26 - 0.06 * handLift,
  ]);
  const leftElbow = solveTwoBone(
    leftShoulder,
    leftWrist,
    LENGTHS.upperArm,
    LENGTHS.forearm,
    [-1, -0.1, -0.1],
  );
  const rightElbow = solveTwoBone(
    rightShoulder,
    rightWrist,
    LENGTHS.upperArm,
    LENGTHS.forearm,
    [1, -0.1, -0.1],
  );
  const joints = {
    pelvis,
    lumbar,
    chest,
    neck,
    head,
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    leftAnkle,
    rightAnkle,
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
  };
  return {
    frame,
    seconds: frame / SAMPLE_RATE,
    scenario,
    root,
    joints,
    skis: { left: leftSki, right: rightSki },
    parameters: {
      flex,
      hipDrop,
      bodyYaw,
      leftYaw,
      rightYaw,
      leftRoll,
      rightRoll,
      handLift,
    },
  };
}
export type MotionSample = ReturnType<typeof sampleMotion>;
export type JointId = keyof MotionSample["joints"];
export const BONES: {
  from: JointId;
  to: JointId;
  group: "leg" | "arm" | "spine" | "pelvis" | "shoulder";
}[] = [
  { from: "leftHip", to: "leftKnee", group: "leg" },
  { from: "leftKnee", to: "leftAnkle", group: "leg" },
  { from: "rightHip", to: "rightKnee", group: "leg" },
  { from: "rightKnee", to: "rightAnkle", group: "leg" },
  { from: "leftShoulder", to: "leftElbow", group: "arm" },
  { from: "leftElbow", to: "leftWrist", group: "arm" },
  { from: "rightShoulder", to: "rightElbow", group: "arm" },
  { from: "rightElbow", to: "rightWrist", group: "arm" },
  { from: "pelvis", to: "lumbar", group: "spine" },
  { from: "lumbar", to: "chest", group: "spine" },
  { from: "chest", to: "neck", group: "spine" },
  { from: "neck", to: "head", group: "spine" },
  { from: "leftHip", to: "rightHip", group: "pelvis" },
  { from: "leftShoulder", to: "rightShoulder", group: "shoulder" },
];
export function markerPoint(
  sample: MotionSample,
  marker: MarkerId,
  local = false,
): Vec3 {
  const point: Vec3 = marker === "root" ? [0, 0.008, 0] : sample.joints[marker];
  return local ? point : add(sample.root, point);
}
export function projectPoint(point: Vec3, view: CameraView): [number, number] {
  if (view === "top") return [point[0], point[2]];
  if (view === "side") return [-point[2], -point[1]];
  return [point[0], -point[1]];
}
export function phaseLabel(frame: number, scenario: ScenarioId) {
  return SCENARIOS.find((s) => s.id === scenario)!.phases[
    Math.min(4, Math.floor(clampFrame(frame) / 60))
  ];
}
export function compareStates(a: number, b: number, scenario: ScenarioId) {
  const A = sampleMotion(a, scenario),
    B = sampleMotion(b, scenario),
    deg = 180 / Math.PI;
  return [
    {
      label: "Высота таза · условные ед.",
      value: B.joints.pelvis[1] - A.joints.pelvis[1],
      unit: "ед.",
    },
    {
      label: "Наклон оси корпуса · модель",
      value: (B.parameters.flex - A.parameters.flex) * deg,
      unit: "°",
    },
    {
      label: "Направление левой лыжи",
      value: (B.parameters.leftYaw - A.parameters.leftYaw) * deg,
      unit: "°",
    },
    {
      label: "Поворот вокруг продольной оси · левая лыжа",
      value: (B.parameters.leftRoll - A.parameters.leftRoll) * deg,
      unit: "°",
    },
    {
      label: "Высота правой кисти · локально",
      value: B.joints.rightWrist[1] - A.joints.rightWrist[1],
      unit: "ед.",
    },
  ];
}
