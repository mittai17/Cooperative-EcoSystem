"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisStyle = { fontSize: 12, fill: "var(--muted-foreground)" };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number | string; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <p className="font-medium text-popover-foreground">{label}</p>}
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-1.5 text-muted-foreground">
          {item.color && (
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          )}
          {item.name}: <span className="font-medium text-popover-foreground">{item.value}</span>
        </p>
      ))}
    </div>
  );
}

export function TrendLineChart({
  data,
  xKey,
  series,
  height = 260,
}: {
  data: Record<string, number | string>[];
  xKey: string;
  series: { key: string; color: string; label: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={36} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0, fill: s.color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrendBarChart({
  data,
  xKey,
  series,
  height = 260,
}: {
  data: Record<string, number | string>[];
  xKey: string;
  series: { key: string; color: string; label: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={36} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[6, 6, 0, 0]} maxBarSize={32} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Ring / donut chart with an optional centered headline value, used for
 * composition summaries such as Skill Passport completion or an application
 * funnel breakdown. */
export function DonutChart({
  data,
  height = 220,
  innerRadius = 64,
  outerRadius = 92,
  centerValue,
  centerLabel,
}: {
  data: DonutSlice[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  centerValue?: string;
  centerLabel?: string;
}) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={data.length > 1 ? 3 : 0}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((slice) => (
              <Cell key={slice.key} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="font-heading text-2xl font-bold text-foreground">{centerValue}</span>
          )}
          {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function DonutLegend({ data, valueFormatter = (v) => String(v) }: { data: DonutSlice[]; valueFormatter?: (value: number) => string }) {
  return (
    <ul className="flex flex-col gap-2">
      {data.map((slice) => (
        <li key={slice.key} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-foreground">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            {slice.label}
          </span>
          <span className="font-medium text-muted-foreground">{valueFormatter(slice.value)}</span>
        </li>
      ))}
    </ul>
  );
}
