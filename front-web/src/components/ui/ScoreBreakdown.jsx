import { useEffect, useMemo, useState } from "react";

const CRITERIA = [
  { key: "taskAchievement", label: "Task Achievement" },
  { key: "coherenceCohesion", label: "Coherence & Cohesion" },
  { key: "lexicalResource", label: "Lexical Resource" },
  { key: "grammaticalRangeAccuracy", label: "Grammatical Range & Accuracy" },
];

const clampPercent = (value) => {
  const numericValue = Number(value) || 0;
  const percent = (numericValue / 9) * 100;
  return Math.max(0, Math.min(100, percent));
};

/**
 * Four-criterion score bars with mount animation.
 */
function ScoreBreakdown({ breakdown = {} }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setActive(true), 30);
    return () => clearTimeout(timer);
  }, []);

  const items = useMemo(
    () =>
      CRITERIA.map((criterion) => {
        const value = Number(breakdown[criterion.key]) || 0;
        return {
          ...criterion,
          value,
          width: clampPercent(value),
        };
      }),
    [breakdown],
  );

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
            <p className="text-sm font-semibold text-gray-800">{item.value.toFixed(1)}</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: active ? `${item.width}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ScoreBreakdown;
