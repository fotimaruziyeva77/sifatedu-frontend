import type { CSSProperties } from "react";

/**
 * Davomat jurnali: daftardan tizimga o'tishning ko'rinishi. Bezak, shuning uchun ekran
 * o'quvchidan yashirin; belgilar qator-qator ruchka bilan yozilgandek chiqadi.
 */

const DAYS = [3, 5, 8, 10, 12];
const ABSENT = "n/b";
const STUDENTS: { name: string; marks: (0 | 1)[]; score: number }[] = [
  { name: "Aziza K.", marks: [1, 1, 1, 1, 1], score: 92 },
  { name: "Bekzod R.", marks: [1, 0, 1, 1, 1], score: 78 },
  { name: "Dilnoza S.", marks: [1, 1, 1, 0, 1], score: 85 },
  { name: "Javohir T.", marks: [0, 1, 1, 1, 1], score: 71 },
  { name: "Madina Y.", marks: [1, 1, 1, 1, 1], score: 96 },
  { name: "Sardor N.", marks: [1, 1, 0, 1, 1], score: 64 },
];

function Check() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M2.5 8.8 6.2 12.6 13.6 3.4" />
    </svg>
  );
}

function order(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

export function Journal({ group, test }: { group: string; test: string }) {
  let index = 0;

  return (
    <div aria-hidden className="pf-journal">
      <p className="pf-journal__head">
        <span>{group}</span>
        <span>14:00</span>
      </p>
      <table>
        <thead>
          <tr>
            <th />
            {DAYS.map((day) => (
              <th key={day}>{day}</th>
            ))}
            <th>{test}</th>
          </tr>
        </thead>
        <tbody>
          {STUDENTS.map((student) => (
            <tr key={student.name}>
              <td>{student.name}</td>
              {student.marks.map((mark, day) => (
                <td key={DAYS[day]}>
                  {mark ? (
                    <span className="pf-mark" style={order(index++)}>
                      <Check />
                    </span>
                  ) : (
                    <span className="pf-mark pf-mark--absent" style={order(index++)}>
                      {ABSENT}
                    </span>
                  )}
                </td>
              ))}
              <td>
                <span className="pf-mark pf-mark--score" style={order(index++)}>
                  {student.score}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
