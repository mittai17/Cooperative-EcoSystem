import { cn } from "@/lib/utils";

const STROKES = {
  red: "#E31B23",
  blue: "#2563EB",
  green: "#16A34A",
  amber: "#D97706",
  violet: "#7C3AED",
} as const;

export type SparklineTone = keyof typeof STROKES;

interface SparklineProps {
  /** Series values, oldest first. Fewer than two points renders nothing. */
  values: number[];
  tone?: SparklineTone;
  className?: string;
}

/** Flat-fill line sparkline. No gradient, so it stays inside the admin palette. */
export function Sparkline({ values, tone = "red", className }: SparklineProps) {
  if (values.length < 2) return null;
  const width = 100;
  const height = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / span) * (height - 4) - 2;
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  const stroke = STROKES[tone];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-10 w-24 shrink-0", className)}
      aria-hidden
    >
      <polygon points={area} fill={stroke} fillOpacity={0.1} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
