"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { Theme } from "@/components/theme/theme";

import {
  createConstellation,
  heroFocus,
  SKILL_LINKS,
  SKILLS,
  SKILLS_LOW_TIER,
  type Track,
} from "./constellation";
import { sampleLogo } from "./geometry";

export type SceneTier = "high" | "low";

/** Kursor holati: canvas'ga nisbatan NDC (-1..1), oxirgi harakat vaqti (ms). */
export type PointerState = { x: number; y: number; inside: boolean; at: number };

/** Ko'nikma yorlig'ini (DOM) joylashtirish: canvas pikselida, shaffoflik va "yongan" holat. */
export type LabelUpdate = (
  index: number,
  x: number,
  y: number,
  opacity: number,
  hot: boolean,
) => void;

export type HeroSceneProps = {
  tier: SceneTier;
  theme: Theme;
  active: boolean;
  /** Logo nuqtalardan yig'iladigan kirish animatsiyasi (sessiyada bir marta). */
  intro: boolean;
  /** Hero scroll progressi: 0 (yuqorida) → 1 (hero ekrandan chiqdi). */
  progress: RefObject<number>;
  pointer: RefObject<PointerState>;
  /** Har kadrda ko'nikma yorliqlarini tugunlarga ergashtiradi. */
  onLabel: LabelUpdate;
  onReady: () => void;
  onIntroEnd: () => void;
  onFallback: () => void;
};

const COUNTS: Record<SceneTier, { nodes: number; skills: number }> = {
  high: { nodes: 150, skills: SKILLS.length },
  low: { nodes: 84, skills: SKILLS_LOW_TIER },
};

const MAX_SEGMENTS = 1400;
/** Kirish: nuqtalar paydo bo'ladi → logo chiziladi → turkumga aylanadi (soniyalar). */
const TIMELINE = { drawStart: 0.15, drawEnd: 1.5, morphStart: 2.3, morphLength: 1.9 };

type Palette = {
  star: string;
  spark: string;
  line: string;
  hot: string;
  tracks: Record<Track, string>;
  glow: number;
  additive: boolean;
  starAlpha: number;
  lineAlpha: number;
};

const PALETTES: Record<Theme, Palette> = {
  dark: {
    star: "#b7bdff",
    spark: "#ff3b45",
    line: "#8f98ff",
    hot: "#ff3b45",
    tracks: { frontend: "#ffbe4d", backend: "#45dfbd", design: "#ff79b0", basics: "#67b2ff" },
    glow: 1,
    additive: true,
    starAlpha: 0.85,
    lineAlpha: 1,
  },
  light: {
    star: "#3f47a8",
    spark: "#e31e24",
    line: "#3f47a8",
    hot: "#e31e24",
    tracks: { frontend: "#c77800", backend: "#0a9277", design: "#d4357d", basics: "#1e6fd6" },
    glow: 0.3,
    additive: false,
    starAlpha: 0.75,
    lineAlpha: 0.7,
  },
};

const POINT_VERTEX = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aAlpha;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (10.0 / -mv.z);
    vColor = aColor;
    vAlpha = aAlpha;
  }
`;

const POINT_FRAGMENT = /* glsl */ `
  uniform float uGlow;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.26, 0.16, d);
    float halo = smoothstep(0.5, 0.0, d) * uGlow * 0.5;
    gl_FragColor = vec4(vColor, max(core, halo) * vAlpha);
    #include <colorspace_fragment>
  }
`;

export default function HeroScene(props: HeroSceneProps) {
  const { tier, active, onFallback } = props;
  return (
    <Canvas
      dpr={tier === "high" ? [1, 1.75] : [1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 10], fov: 40, near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", onFallback, { once: true });
      }}
    >
      <PerformanceMonitor flipflops={3} onFallback={onFallback} />
      <Constellation {...props} />
    </Canvas>
  );
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function smooth(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function easeInOutCubic(value: number): number {
  const x = clamp01(value);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** Tugunlar, logodagi o'rinlari va bog'lanishlar — bir marta hisoblanadi. */
function buildScene(tier: SceneTier) {
  const { nodes: count, skills } = COUNTS[tier];
  const logo = sampleLogo(count);
  const nodes = createConstellation({ count, skills, sparks: logo.caretCount });

  // Qizil chiziq nuqtalari — "uchqun"larga; qolganlari X bo'yicha tartiblab juftlanadi,
  // shunda o'tishda nuqtalar bir-birini kesib o'tmaydi.
  const logoOf = new Uint16Array(count);
  for (let k = 0; k < logo.caretCount; k += 1) logoOf[skills + k] = k;
  const others = nodes
    .map((_, index) => index)
    .filter((index) => nodes[index].kind !== "spark")
    .sort((a, b) => nodes[a].cloud[0] - nodes[b].cloud[0]);
  const letterPoints = Array.from(
    { length: count - logo.caretCount },
    (_, index) => index + logo.caretCount,
  ).sort((a, b) => logo.points[a * 2] - logo.points[b * 2]);
  others.forEach((node, index) => {
    logoOf[node] = letterPoints[index];
  });

  const nodeOf = new Uint16Array(count);
  logoOf.forEach((point, node) => {
    nodeOf[point] = node;
  });
  const logoEdges = Array.from(logo.edges, (point) => nodeOf[point]);

  const skillIndex = new Map(nodes.map((node, index) => [node.skill, index]));
  const skillEdges = SKILL_LINKS.flatMap(([a, b]) => {
    const from = skillIndex.get(a);
    const to = skillIndex.get(b);
    return from === undefined || to === undefined ? [] : [from, to];
  });

  const logoPositions = new Float32Array(count * 2);
  logoOf.forEach((point, node) => {
    logoPositions[node * 2] = logo.points[point * 2];
    logoPositions[node * 2 + 1] = logo.points[point * 2 + 1];
  });

  return { count, skills, nodes, logoPositions, logoEdges, skillEdges };
}

type SceneData = ReturnType<typeof buildScene>;

function buildColors(data: SceneData, palette: Palette) {
  const color = new THREE.Color();
  const cloud = new Float32Array(data.count * 3);
  const logo = new Float32Array(data.count * 3);
  data.nodes.forEach((node, index) => {
    const cloudColor =
      node.kind === "skill" && node.track
        ? palette.tracks[node.track]
        : node.kind === "spark"
          ? palette.spark
          : palette.star;
    color.set(cloudColor).toArray(cloud, index * 3);
    color.set(node.kind === "spark" ? palette.spark : palette.star).toArray(logo, index * 3);
  });
  return { cloud, logo, line: new THREE.Color(palette.line), hot: new THREE.Color(palette.hot) };
}

type SceneColors = ReturnType<typeof buildColors>;

function dynamicAttribute(array: Float32Array, size: number): THREE.BufferAttribute {
  return new THREE.BufferAttribute(array, size).setUsage(THREE.DynamicDrawUsage);
}

function createBuffers(count: number) {
  const points = new THREE.BufferGeometry();
  points.setAttribute("position", dynamicAttribute(new Float32Array(count * 3), 3));
  points.setAttribute("aColor", dynamicAttribute(new Float32Array(count * 3), 3));
  points.setAttribute("aSize", dynamicAttribute(new Float32Array(count), 1));
  points.setAttribute("aAlpha", dynamicAttribute(new Float32Array(count), 1));

  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", dynamicAttribute(new Float32Array(MAX_SEGMENTS * 6), 3));
  lines.setAttribute("color", dynamicAttribute(new Float32Array(MAX_SEGMENTS * 8), 4));
  lines.setDrawRange(0, 0);

  const cursor = new THREE.BufferGeometry();
  cursor.setAttribute("position", dynamicAttribute(new Float32Array(3), 3));
  cursor.setAttribute("aColor", dynamicAttribute(new Float32Array(3), 3));
  cursor.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array([16]), 1));
  cursor.setAttribute("aAlpha", dynamicAttribute(new Float32Array(1), 1));

  return { points, lines, cursor };
}

/** Kadrlar orasida saqlanadigan holat (React render'idan tashqarida, ref ichida). */
function createSimulation(data: SceneData) {
  return {
    data,
    start: null as number | null,
    frames: 0,
    introEnded: false,
    placed: false,
    current: new Float32Array(data.count * 3),
    hot: new Float32Array(data.count),
    cursor: new THREE.Vector3(),
    cursorTarget: new THREE.Vector3(),
    cursorStrength: 0,
    colors: null as SceneColors | null,
    raycaster: new THREE.Raycaster(),
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    ndc: new THREE.Vector2(),
    hit: new THREE.Vector3(),
    world: new THREE.Vector3(),
  };
}

type Simulation = ReturnType<typeof createSimulation>;

function attribute(geometry: THREE.BufferGeometry, name: string): THREE.BufferAttribute {
  return geometry.getAttribute(name) as THREE.BufferAttribute;
}

function Constellation({
  tier,
  theme,
  intro,
  progress,
  pointer,
  onLabel,
  onReady,
  onIntroEnd,
}: HeroSceneProps) {
  const data = useMemo(() => buildScene(tier), [tier]);
  const palette = PALETTES[theme];
  const colors = useMemo(() => buildColors(data, palette), [data, palette]);
  const pixelRatio = useThree((state) => state.viewport.dpr);
  const buffers = useMemo(() => createBuffers(data.count), [data]);

  const materials = useMemo(() => {
    const blending = palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    return {
      points: new THREE.ShaderMaterial({
        vertexShader: POINT_VERTEX,
        fragmentShader: POINT_FRAGMENT,
        uniforms: { uPixelRatio: { value: pixelRatio }, uGlow: { value: palette.glow } },
        transparent: true,
        depthWrite: false,
        blending,
      }),
      lines: new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending,
      }),
    };
  }, [palette, pixelRatio]);

  useEffect(
    () => () => {
      materials.points.dispose();
      materials.lines.dispose();
    },
    [materials],
  );

  useEffect(
    () => () => {
      buffers.points.dispose();
      buffers.lines.dispose();
      buffers.cursor.dispose();
    },
    [buffers],
  );

  const group = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const cursorRef = useRef<THREE.Points>(null);
  const simulation = useRef<Simulation | null>(null);

  useFrame((state, delta) => {
    const node = group.current;
    const pointsObject = pointsRef.current;
    const linesObject = linesRef.current;
    const cursorObject = cursorRef.current;
    if (!node || !pointsObject || !linesObject || !cursorObject) return;

    let sim = simulation.current;
    if (!sim || sim.data !== data) {
      sim = createSimulation(data);
      simulation.current = sim;
    }

    const dt = Math.min(delta, 1 / 20);
    const now = state.clock.elapsedTime;
    sim.start ??= now;
    const t = now - sim.start;

    // --- Vaqt shkalasi ---
    const appear = smooth(t / (intro ? 0.6 : 0.8));
    const draw = intro
      ? clamp01((t - TIMELINE.drawStart) / (TIMELINE.drawEnd - TIMELINE.drawStart))
      : 1;
    const morph = intro ? easeInOutCubic((t - TIMELINE.morphStart) / TIMELINE.morphLength) : 1;
    if (intro && !sim.introEnded && morph >= 1) {
      sim.introEnded = true;
      onIntroEnd();
    }
    sim.frames += 1;
    if (sim.frames === 2) onReady();

    // --- Joylashuv (piksel → dunyo koordinatalari, z = 0 tekisligi) ---
    const { size, viewport, camera } = state;
    const focus = heroFocus(size.width, size.height);
    const unit = viewport.width / size.width;
    const radius = focus.radius * unit;
    const logoWidth = focus.logoWidth * unit;
    const scroll = progress.current ?? 0;
    const fade = 1 - smooth((scroll - 0.12) / 0.6);

    node.position.set(
      (focus.x / size.width - 0.5) * viewport.width,
      (0.5 - focus.y / size.height) * viewport.height + scroll * radius * 1.4,
      0,
    );

    const ptr = pointer.current;
    const realCursor = ptr.inside && performance.now() - ptr.at < 2500;
    node.rotation.y = THREE.MathUtils.damp(
      node.rotation.y,
      (t * 0.06 + (realCursor ? ptr.x * 0.22 : 0)) * morph,
      2.5,
      dt,
    );
    node.rotation.x = THREE.MathUtils.damp(
      node.rotation.x,
      (realCursor ? -ptr.y * 0.16 : 0) * morph,
      2.5,
      dt,
    );
    node.updateMatrixWorld();

    // --- Kursor: haqiqiy (sichqoncha, teginish) yoki "arvoh" (o'zi aylanadi) ---
    if (realCursor) {
      sim.ndc.set(ptr.x, ptr.y);
      sim.raycaster.setFromCamera(sim.ndc, camera);
      if (sim.raycaster.ray.intersectPlane(sim.plane, sim.hit)) {
        sim.cursorTarget.copy(node.worldToLocal(sim.hit));
      }
    } else {
      sim.cursorTarget.set(
        Math.sin(t * 0.43) * radius * 0.72,
        Math.sin(t * 0.61 + 1.3) * radius * 0.52,
        Math.cos(t * 0.37) * radius * 0.4,
      );
    }
    sim.cursor.lerp(sim.cursorTarget, 1 - Math.exp(-(realCursor ? 14 : 4) * dt));
    sim.cursorStrength = THREE.MathUtils.damp(
      sim.cursorStrength,
      morph > 0.95 ? (realCursor ? 1 : 0.75) : 0,
      4,
      dt,
    );

    // --- Tugunlar ---
    const { count, nodes, logoPositions } = data;
    const reach = radius * 0.62;
    const cur = sim.current;
    const hotness = sim.hot;
    const follow = sim.placed ? 1 - Math.exp(-7 * dt) : 1;
    const pointsGeometry = pointsObject.geometry;
    const position = attribute(pointsGeometry, "position");
    const aSize = attribute(pointsGeometry, "aSize");
    const aAlpha = attribute(pointsGeometry, "aAlpha");
    const aColor = attribute(pointsGeometry, "aColor");

    for (let i = 0; i < count; i += 1) {
      const info = nodes[i];
      const drift = morph * radius * 0.035;
      let x =
        logoPositions[i * 2] * logoWidth * (1 - morph) +
        info.cloud[0] * radius * morph +
        Math.sin(t * 0.55 + info.phase) * drift;
      let y =
        logoPositions[i * 2 + 1] * logoWidth * (1 - morph) +
        info.cloud[1] * radius * morph +
        Math.cos(t * 0.47 + info.phase * 1.3) * drift;
      let z = info.cloud[2] * radius * morph + Math.sin(t * 0.4 + info.phase * 0.7) * drift;

      // Kursor yaqinidagi tugunlar unga tortiladi.
      let heat = 0;
      if (sim.cursorStrength > 0.01) {
        const dx = sim.cursor.x - x;
        const dy = sim.cursor.y - y;
        const dz = sim.cursor.z - z;
        const distance = Math.hypot(dx, dy, dz);
        if (distance < reach) {
          heat = (1 - distance / reach) * sim.cursorStrength;
          const pull = 0.24 * heat * heat;
          x += dx * pull;
          y += dy * pull;
          z += dz * pull;
        }
      }
      hotness[i] = heat;

      cur[i * 3] += (x - cur[i * 3]) * follow;
      cur[i * 3 + 1] += (y - cur[i * 3 + 1]) * follow;
      cur[i * 3 + 2] += (z - cur[i * 3 + 2]) * follow;
      position.setXYZ(i, cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2]);

      const cloudSize = info.kind === "skill" ? 17 : info.kind === "spark" ? 10 : 6.5;
      aSize.setX(i, (6.5 + (cloudSize - 6.5) * morph) * (1 + heat * 0.7));
      const base = info.kind === "star" ? palette.starAlpha : 1;
      aAlpha.setX(i, appear * fade * Math.min(1, base + heat));
    }
    sim.placed = true;
    position.needsUpdate = true;
    aSize.needsUpdate = true;
    aAlpha.needsUpdate = true;

    // Ranglar faqat o'tish paytida va tema o'zgarganda qayta hisoblanadi.
    const nodeColor = aColor.array as Float32Array;
    if (sim.colors !== colors || (morph > 0 && morph < 1)) {
      for (let k = 0; k < count * 3; k += 1) {
        nodeColor[k] = colors.logo[k] + (colors.cloud[k] - colors.logo[k]) * morph;
      }
      aColor.needsUpdate = true;
      sim.colors = morph < 1 ? null : colors;
    }

    // --- Chiziqlar ---
    const lineGeometry = linesObject.geometry;
    const linePosition = attribute(lineGeometry, "position");
    const lineColor = attribute(lineGeometry, "color");
    const lp = linePosition.array as Float32Array;
    const lc = lineColor.array as Float32Array;
    const lineAlpha = palette.lineAlpha;
    let segments = 0;

    const pushLine = (
      a: ArrayLike<number>,
      ai: number,
      b: ArrayLike<number>,
      bi: number,
      ca: ArrayLike<number>,
      cai: number,
      cb: ArrayLike<number>,
      cbi: number,
      opacity: number,
    ) => {
      if (segments >= MAX_SEGMENTS || opacity < 0.01) return;
      const p = segments * 6;
      lp[p] = a[ai];
      lp[p + 1] = a[ai + 1];
      lp[p + 2] = a[ai + 2];
      lp[p + 3] = b[bi];
      lp[p + 4] = b[bi + 1];
      lp[p + 5] = b[bi + 2];
      const c = segments * 8;
      const value = Math.min(opacity, 1) * lineAlpha;
      lc[c] = ca[cai];
      lc[c + 1] = ca[cai + 1];
      lc[c + 2] = ca[cai + 2];
      lc[c + 3] = value;
      lc[c + 4] = cb[cbi];
      lc[c + 5] = cb[cbi + 1];
      lc[c + 6] = cb[cbi + 2];
      lc[c + 7] = value;
      segments += 1;
    };
    const betweenNodes = (i: number, j: number, opacity: number) =>
      pushLine(cur, i * 3, cur, j * 3, nodeColor, i * 3, nodeColor, j * 3, opacity);

    // 1) Logo konturi: nuqtalar ketma-ket "chiziladi", o'tishda so'nadi.
    if (morph < 1) {
      const edges = data.logoEdges;
      const visible = Math.floor((edges.length / 2) * draw);
      const opacity = 0.55 * appear * (1 - morph) * fade;
      for (let e = 0; e < visible; e += 1) betweenNodes(edges[e * 2], edges[e * 2 + 1], opacity);
    }

    if (morph > 0) {
      // 2) Ko'nikmalar grafigi.
      const skillOpacity = 0.5 * morph * fade;
      for (let e = 0; e < data.skillEdges.length; e += 2) {
        const i = data.skillEdges[e];
        const j = data.skillEdges[e + 1];
        betweenNodes(i, j, skillOpacity * (1 + (hotness[i] + hotness[j]) * 1.5));
      }

      // 3) Yaqin tugunlar orasidagi ingichka ulanishlar; kursor atrofida yorqinroq.
      const link = radius * 0.34;
      const link2 = link * link;
      const line = [colors.line.r, colors.line.g, colors.line.b];
      for (let i = 0; i < count; i += 1) {
        const ix = cur[i * 3];
        const iy = cur[i * 3 + 1];
        const iz = cur[i * 3 + 2];
        for (let j = i + 1; j < count; j += 1) {
          const dx = cur[j * 3] - ix;
          const dy = cur[j * 3 + 1] - iy;
          const dz = cur[j * 3 + 2] - iz;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > link2) continue;
          const closeness = 1 - Math.sqrt(d2) / link;
          const boost = 1 + (hotness[i] + hotness[j]) * 2.2;
          pushLine(
            cur,
            i * 3,
            cur,
            j * 3,
            line,
            0,
            line,
            0,
            closeness ** 2 * 0.3 * morph * fade * boost,
          );
        }
      }

      // 4) Kursordan yaqin tugunlarga — qizil "uchqun" chiziqlar.
      const cursor = [sim.cursor.x, sim.cursor.y, sim.cursor.z];
      const hot = [colors.hot.r, colors.hot.g, colors.hot.b];
      for (let i = 0; i < count; i += 1) {
        const heat = hotness[i];
        if (heat > 0.02) {
          pushLine(cursor, 0, cur, i * 3, hot, 0, nodeColor, i * 3, heat * 0.95 * fade);
        }
      }
    }

    lineGeometry.setDrawRange(0, segments * 2);
    linePosition.needsUpdate = true;
    lineColor.needsUpdate = true;

    // --- Kursor tuguni ---
    const cursorGeometry = cursorObject.geometry;
    const cursorPosition = attribute(cursorGeometry, "position");
    cursorPosition.setXYZ(0, sim.cursor.x, sim.cursor.y, sim.cursor.z);
    cursorPosition.needsUpdate = true;
    const cursorColor = attribute(cursorGeometry, "aColor");
    cursorColor.setXYZ(0, colors.hot.r, colors.hot.g, colors.hot.b);
    cursorColor.needsUpdate = true;
    const cursorAlpha = attribute(cursorGeometry, "aAlpha");
    cursorAlpha.setX(0, sim.cursorStrength * fade * (realCursor ? 1 : 0.6));
    cursorAlpha.needsUpdate = true;

    // --- Ko'nikma yorliqlari (DOM) tugunlarga ergashadi ---
    const labelOpacity = smooth((morph - 0.55) / 0.45) * fade;
    const world = sim.world;
    for (let k = 0; k < data.skills; k += 1) {
      world.set(cur[k * 3], cur[k * 3 + 1], cur[k * 3 + 2]).applyMatrix4(node.matrixWorld);
      // Orqa tomondagi tugunlar xiraroq: chuqurlik hissi.
      const depth = clamp01(0.5 + world.z / (radius * 2.2));
      world.project(camera);
      onLabel(
        k,
        (world.x * 0.5 + 0.5) * size.width,
        (0.5 - world.y * 0.5) * size.height,
        labelOpacity * (0.35 + depth * 0.65),
        hotness[k] > 0.3,
      );
    }
  });

  return (
    <group ref={group}>
      <lineSegments
        ref={linesRef}
        geometry={buffers.lines}
        material={materials.lines}
        frustumCulled={false}
      />
      <points
        ref={pointsRef}
        geometry={buffers.points}
        material={materials.points}
        frustumCulled={false}
      />
      <points
        ref={cursorRef}
        geometry={buffers.cursor}
        material={materials.points}
        frustumCulled={false}
      />
    </group>
  );
}
