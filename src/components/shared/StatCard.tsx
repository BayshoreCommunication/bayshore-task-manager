import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  color = "hsl(var(--primary))",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "p-4 border-l-[3px] hover:-translate-y-0.5 transition-transform",
        className,
      )}
      style={{ borderLeftColor: color }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-2xl font-black" style={{ color }}>
        {value}
      </p>
    </Card>
  );
}
