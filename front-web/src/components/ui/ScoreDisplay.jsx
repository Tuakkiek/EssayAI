import { useEffect, useMemo, useState } from "react";

const getScoreColor = (score) => {
  if (score >= 7) return "#58CC02";
  if (score >= 5) return "#F59E0B";
  return "#EF4444";
};

const getBandLabel = (score) => {
  if (score >= 7.5) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 5) return "Competent";
  if (score >= 4) return "Modest";
  return "Limited";
};

/**
 * Animated score value with color band and label.
 */
function ScoreDisplay({ score = 0, animate = true }) {
  const targetScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  const [displayScore, setDisplayScore] = useState(() => (animate ? 0 : targetScore));

  useEffect(() => {
    if (!animate) {
      return;
    }

    let value = 0;
    const duration = 900;
    const stepTime = 16;
    const steps = Math.max(1, Math.floor(duration / stepTime));
    const increment = targetScore / steps;

    const timer = setInterval(() => {
      value += increment;
      if (value >= targetScore) {
        setDisplayScore(targetScore);
        clearInterval(timer);
      } else {
        setDisplayScore(value);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetScore, animate]);

  const shownScore = animate ? displayScore : targetScore;
  const color = useMemo(() => getScoreColor(targetScore), [targetScore]);
  const bandLabel = useMemo(() => getBandLabel(targetScore), [targetScore]);

  return (
    <div className="text-center">
      <p className="text-6xl font-black leading-none tracking-tight md:text-7xl" style={{ color }}>
        {shownScore.toFixed(1)}
      </p>
      <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-gray-600">{bandLabel}</p>
    </div>
  );
}

export default ScoreDisplay;
