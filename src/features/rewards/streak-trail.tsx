/**
 * Seriya — bog'langan nuqtalar: har to'liq bajarilgan kun bitta nuqta, oxirida brend kursori
 * (bugun). Sertifikatdagi "yo'l" bilan bir xil til. 10 kundan ko'pi "+N" bilan.
 */
const SHOWN = 10;
const STEP = 36;

export function StreakTrail({ streak, label }: { streak: number; label: string }) {
  const dots = Math.min(streak, SHOWN);
  const extra = streak - dots;
  const count = Math.max(dots, 1);
  const width = count * STEP + 24;
  // Kichik to'lqin: nuqtalar bir chiziqda emas — "yo'l" bo'lib ko'rinadi.
  const points = Array.from({ length: count }, (_, index) => ({
    x: 14 + index * STEP,
    y: 22 + (index % 2 === 0 ? -5 : 5),
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join("");
  const last = points[points.length - 1];

  return (
    <div className="rw-trail" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${width} 44`} aria-hidden data-empty={streak === 0 ? "" : undefined}>
        {count > 1 && <path d={line} />}
        {points.slice(0, -1).map((point) => (
          <circle key={point.x} cx={point.x} cy={point.y} r={6} />
        ))}
        {streak > 0 ? (
          <rect x={last.x - 3.5} y={last.y - 10} width={7} height={20} rx={2} />
        ) : (
          <circle className="rw-trail__empty" cx={last.x} cy={last.y} r={6} />
        )}
      </svg>
      {extra > 0 && <span className="rw-trail__extra">+{extra}</span>}
    </div>
  );
}
