import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

import { CARET, LETTER_PATHS, LOGO_VIEWBOX } from "@/components/brand/logo-paths";

const CENTER = {
  x: LOGO_VIEWBOX.x + LOGO_VIEWBOX.width / 2,
  y: LOGO_VIEWBOX.y + LOGO_VIEWBOX.height / 2,
};

/** Bir harfning tashqi va ichki konturlari ("A"dagi tirqish — alohida kontur). */
function contoursOf(d: string): THREE.Path[] {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill-rule="evenodd"/></svg>`;
  return new SVGLoader()
    .parse(svg)
    .paths.flatMap((path) => path.toShapes())
    .flatMap((shape) => [shape, ...shape.holes]);
}

function caretContour(): THREE.Path {
  const { x, y, width, height } = CARET;
  const path = new THREE.Path();
  path.moveTo(x, y);
  path.lineTo(x + width, y);
  path.lineTo(x + width, y + height);
  path.lineTo(x, y + height);
  path.closePath();
  return path;
}

/** Nuqtalar sonini konturlar uzunligiga mutanosib taqsimlaydi (yig'indisi aniq `total`). */
function distribute(lengths: number[], total: number): number[] {
  const sum = lengths.reduce((a, b) => a + b, 0);
  const counts = lengths.map((length) => Math.max(4, Math.round((total * length) / sum)));
  let diff = total - counts.reduce((a, b) => a + b, 0);
  while (diff !== 0) {
    const step = diff > 0 ? 1 : -1;
    // Eng uzun (yoki eng zich) konturga qo'shamiz / undan olamiz.
    let target = 0;
    for (let index = 1; index < counts.length; index += 1) {
      if (
        step > 0
          ? lengths[index] / counts[index] > lengths[target] / counts[target]
          : counts[index] > counts[target]
      ) {
        target = index;
      }
    }
    counts[target] += step;
    diff -= step;
  }
  return counts;
}

export type LogoSample = {
  /** x, y juftliklari: logo eni 1 ga teng, markaz (0, 0), Y yuqoriga qaraydi. */
  points: Float32Array;
  /** Kontur bo'ylab qo'shni nuqtalar juftliklari (indekslar). */
  edges: Uint16Array;
  /** Qizil chiziq nuqtalari soni: ular ro'yxat boshida turadi. */
  caretCount: number;
};

/** SIFAT logosini "nuqtalarni bog'lang" rasmiga aylantiradi: konturlar bo'ylab `total` ta nuqta. */
export function sampleLogo(total: number): LogoSample {
  const contours = [caretContour(), ...Object.values(LETTER_PATHS).flatMap(contoursOf)];
  const counts = distribute(
    contours.map((contour) => contour.getLength()),
    total,
  );

  const points = new Float32Array(total * 2);
  const edges: number[] = [];
  let offset = 0;

  contours.forEach((contour, contourIndex) => {
    const count = counts[contourIndex];
    // getSpacedPoints(n) n+1 nuqta qaytaradi: yopiq konturda oxirgisi birinchisi bilan bir xil.
    const sampled = contour.getSpacedPoints(count).slice(0, count);
    sampled.forEach((point, index) => {
      points[(offset + index) * 2] = (point.x - CENTER.x) / LOGO_VIEWBOX.width;
      points[(offset + index) * 2 + 1] = -(point.y - CENTER.y) / LOGO_VIEWBOX.width;
      edges.push(offset + index, offset + ((index + 1) % count));
    });
    offset += count;
  });

  return { points, edges: Uint16Array.from(edges), caretCount: counts[0] };
}
