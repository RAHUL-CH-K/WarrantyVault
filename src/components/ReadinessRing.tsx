import { useEffect, useState } from 'react';

interface ReadinessRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ReadinessRing({
  percentage,
  size = 64,
  strokeWidth = 6,
  label,
}: ReadinessRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAnimatedPct(clamped);
    });
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;

  const strokeColor =
    clamped >= 85 ? '#0F766E' : clamped >= 60 ? '#D97706' : '#DC2626';

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-label={label ? `${label}: ${clamped}%` : `${clamped}% claim readiness`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      <span className="absolute text-xs font-semibold text-slate-900 tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}
