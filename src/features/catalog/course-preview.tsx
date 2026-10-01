import { Database, Monitor, MousePointer2, Server } from "lucide-react";
import type { CSSProperties } from "react";

/**
 * Kurs kartochkasidagi "nimani yasaysiz" mini-animatsiyasi (faqat CSS, `data-play` bilan
 * ekrandan chiqqanda to'xtaydi). Kurs belgisiga qarab tanlanadi.
 */
const KIND: Record<string, "code" | "server" | "design" | "network"> = {
  code: "code",
  terminal: "code",
  server: "server",
  database: "server",
  palette: "design",
  smartphone: "design",
  brain: "network",
  shield: "network",
};

function index(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

export function CoursePreview({ icon }: { icon: string }) {
  switch (KIND[icon] ?? "code") {
    case "server":
      return <ServerPreview />;
    case "design":
      return <DesignPreview />;
    case "network":
      return <NetworkPreview />;
    default:
      return <CodePreview />;
  }
}

/** Kod yoziladi — o'ng tomonda sahifa yig'iladi. */
function CodePreview() {
  const lines = ["62%", "44%", "78%", "36%", "56%"];
  return (
    <div className="pv pv-code">
      <div className="pv-code__editor">
        {lines.map((width, i) => (
          <span
            key={i}
            className="pv-code__line"
            style={{ ...index(i), "--w": width } as CSSProperties}
          />
        ))}
      </div>
      <div className="pv-code__browser">
        <span className="pv-code__bar" />
        <span className="pv-code__block pv-code__block--hero" style={index(0)} />
        <span className="pv-code__block" style={index(1)} />
        <span className="pv-code__block" style={index(2)} />
      </div>
    </div>
  );
}

/** So'rov: brauzer → server → baza va javob qaytadi. */
function ServerPreview() {
  return (
    <div className="pv pv-server">
      <span className="pv-server__node">
        <Monitor className="size-5" />
      </span>
      <span className="pv-server__wire">
        <span className="pv-server__packet" />
        <span className="pv-server__packet pv-server__packet--back" />
      </span>
      <span className="pv-server__node pv-server__node--main">
        <Server className="size-5" />
      </span>
      <span className="pv-server__wire pv-server__wire--short">
        <span className="pv-server__packet pv-server__packet--db" />
      </span>
      <span className="pv-server__node">
        <Database className="size-5" />
      </span>
      <span className="pv-server__status">200 OK</span>
    </div>
  );
}

/** Artboard: shakllar joyiga tushadi, kursor ularni suradi. */
function DesignPreview() {
  return (
    <div className="pv pv-design">
      <div className="pv-design__board">
        <span className="pv-design__shape pv-design__shape--circle" />
        <span className="pv-design__shape pv-design__shape--card" />
        <span className="pv-design__shape pv-design__shape--pill" />
        <MousePointer2 className="pv-design__cursor size-5" />
      </div>
      <div className="pv-design__swatches">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={index(i)} />
        ))}
      </div>
    </div>
  );
}

/** Tugunlar navbat bilan ulanadi (algoritm, mantiq). */
function NetworkPreview() {
  const nodes: [number, number][] = [
    [30, 70],
    [70, 30],
    [100, 80],
    [135, 40],
    [170, 72],
  ];
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [0, 2],
    [2, 3],
    [3, 4],
    [2, 4],
  ];
  return (
    <div className="pv pv-network">
      <svg viewBox="0 0 200 110">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a][0]}
            y1={nodes[a][1]}
            x2={nodes[b][0]}
            y2={nodes[b][1]}
            pathLength={1}
            style={index(i)}
          />
        ))}
        {nodes.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={6} style={index(i)} />
        ))}
      </svg>
    </div>
  );
}
