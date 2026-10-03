/**
 * Natija chizig'i: har savolga bitta katak, to'g'ri javoblar soni bo'yicha bo'yaladi (qaysi
 * savol ekani emas — faqat nechtasi; to'g'ri javoblar 23:00 dan keyin ochiladi).
 */
export function DailyStrip({
  correct,
  total,
  label,
}: {
  correct: number;
  total: number;
  label: string;
}) {
  return (
    <div className="daily-strip" role="img" aria-label={label}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} data-right={index < correct ? "" : undefined} />
      ))}
    </div>
  );
}
