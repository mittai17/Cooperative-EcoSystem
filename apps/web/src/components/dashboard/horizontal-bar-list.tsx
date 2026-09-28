interface HorizontalBarListProps {
  items: { label: string; value: number }[];
  max?: number;
  valueFormatter?: (value: number) => string;
  barColorClassName?: string;
}

export function HorizontalBarList({
  items,
  max,
  valueFormatter = (v) => String(v),
  barColorClassName = "bg-primary",
}: HorizontalBarListProps) {
  const maxValue = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="text-muted-foreground">{valueFormatter(item.value)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${barColorClassName}`}
              style={{ width: `${Math.min(100, Math.round((item.value / maxValue) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
