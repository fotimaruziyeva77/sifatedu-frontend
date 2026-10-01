"use client";

import { useEffect, useRef } from "react";

import { useTheme } from "@/components/theme/use-theme";
import { cn } from "@/lib/utils";

type Node = { x: number; y: number; vx: number; vy: number; r: number };

const REACH = 170;
const LINK = 120;

/**
 * Bo'lim fonidagi 2D tarmoq: nuqtalar sekin suzadi, kursor yaqinidagilari unga va bir-biriga
 * ulanadi. Teginishli qurilmada "arvoh kursor" o'zi aylanadi. Ekrandan chiqsa to'xtaydi.
 */
export function NetworkField({ className, density = 1 }: { className?: string; density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !host || !context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const styles = getComputedStyle(document.documentElement);
    const lineColor = styles.getPropertyValue("--line").trim() || "#8f98ff";
    const sparkColor = styles.getPropertyValue("--caret").trim() || "#e31e24";
    const dotAlpha = theme === "dark" ? 0.5 : 0.35;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let frame = 0;
    let visible = false;
    const pointer = { x: 0, y: 0, at: -Infinity };
    let start = performance.now();

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.round(Math.min(90, ((width * height) / 15000) * density));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 0.8 + Math.random() * 1.4,
      }));
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const t = (time - start) / 1000;

      // Haqiqiy kursor 2 soniya jim tursa — arvoh kursor.
      const real = time - pointer.at < 2000;
      const cx = real ? pointer.x : width * (0.5 + Math.sin(t * 0.31) * 0.38);
      const cy = real ? pointer.y : height * (0.5 + Math.sin(t * 0.47 + 1.1) * 0.34);
      const strength = real ? 1 : 0.6;

      const near: number[] = [];
      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        if (!reduceMotion) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < -10) node.x = width + 10;
          if (node.x > width + 10) node.x = -10;
          if (node.y < -10) node.y = height + 10;
          if (node.y > height + 10) node.y = -10;
        }
        const distance = Math.hypot(node.x - cx, node.y - cy);
        const heat = distance < REACH ? (1 - distance / REACH) * strength : 0;
        if (heat > 0) near.push(index);

        context.globalAlpha = Math.min(1, dotAlpha + heat * 0.6);
        context.fillStyle = heat > 0.35 ? sparkColor : lineColor;
        context.beginPath();
        context.arc(node.x, node.y, node.r + heat * 1.4, 0, Math.PI * 2);
        context.fill();
      }

      context.lineWidth = 1;
      // Kursor atrofidagi nuqtalar bir-biriga ulanadi.
      context.strokeStyle = lineColor;
      for (let a = 0; a < near.length; a += 1) {
        const first = nodes[near[a]];
        for (let b = a + 1; b < near.length; b += 1) {
          const second = nodes[near[b]];
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          if (distance > LINK) continue;
          context.globalAlpha = (1 - distance / LINK) * 0.5 * strength;
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }
      // ...va kursorning o'ziga — qizil "uchqun" chiziqlar.
      context.strokeStyle = sparkColor;
      for (const index of near) {
        const node = nodes[index];
        const distance = Math.hypot(node.x - cx, node.y - cy);
        context.globalAlpha = (1 - distance / REACH) * 0.7 * strength;
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(node.x, node.y);
        context.stroke();
      }
      context.globalAlpha = 1;
    };

    const loop = (time: number) => {
      frame = 0;
      draw(time);
      if (visible && !reduceMotion && document.visibilityState === "visible") {
        frame = requestAnimationFrame(loop);
      }
    };
    const run = () => {
      if (!frame && visible) frame = requestAnimationFrame(loop);
    };

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      pointer.x = x;
      pointer.y = y;
      pointer.at = performance.now();
      if (reduceMotion) run();
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      run();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        start = performance.now() - 1000;
        run();
      }
    });
    const onVisibility = () => run();

    resize();
    resizeObserver.observe(host);
    intersection.observe(canvas);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [theme, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
