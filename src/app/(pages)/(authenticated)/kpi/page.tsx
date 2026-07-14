"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { RoleBadge } from "@/components/shared/Badges";
import { computeKPI } from "@/lib/kpi";
import { useAppStore } from "@/store/useAppStore";

function MetricBox({
  label,
  value,
  target,
  desc,
  color,
}: {
  label: string;
  value: number;
  target: number;
  desc: string;
  color: string;
}) {
  const pct = Math.min(100, value);
  return (
    <div className="bg-muted rounded-lg p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </p>
      <p className="text-2xl font-black" style={{ color }}>
        {value}%
      </p>
      <div className="h-1.5 bg-background rounded-full overflow-hidden my-2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{desc}</span>
        <span>Target {target}%</span>
      </div>
    </div>
  );
}

export default function KPIPage() {
  const { users, tasks, dailyReports, monthly } = useAppStore();

  const scoreColor = (s: number) =>
    s >= 80 ? "#16a34a" : s >= 50 ? "#4f8ef7" : "#d97706";

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="font-black text-base">KPI Tracker</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Completion 30% · On-time 25% · Reports 20% · No-overdue 15% · Monthly
          10%
        </p>
      </div>

      {users
        .filter((u) => !u.muted)
        .map((u) => {
          const k = computeKPI(u.id, tasks, dailyReports, monthly);
          const c = scoreColor(k.ov);
          const metrics = [
            {
              label: "Task Completion",
              value: k.cr,
              target: 80,
              desc: `${k.done} of ${k.total} done`,
              color: "#16a34a",
            },
            {
              label: "On-Time Rate",
              value: k.ot,
              target: 90,
              desc: "Before due date",
              color: "#4f8ef7",
            },
            {
              label: "No Overdue",
              value: k.od,
              target: 90,
              desc: `${k.overdue} overdue`,
              color: "#d97706",
            },
            {
              label: "Daily Reports",
              value: k.rs,
              target: 100,
              desc: `${k.reports} this month`,
              color: "#7c5ef7",
            },
            {
              label: "Monthly Tasks",
              value: k.mr,
              target: 100,
              desc: `${k.mDone}/${k.mTotal} done`,
              color: "#ec4899",
            },
          ];
          return (
            <Card key={u.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={u} size="md" />
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {u.designation}
                        </span>
                        <RoleBadge role={u.role} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-2.5">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: `conic-gradient(${c} ${k.ov * 3.6}deg, hsl(var(--background)) 0deg)`,
                      }}
                    >
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                        <span
                          className="text-xs font-black"
                          style={{ color: c }}
                        >
                          {k.ov}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Overall Score</p>
                      <p className="text-[11px] text-muted-foreground">
                        out of 100
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {metrics.map((m) => (
                    <MetricBox key={m.label} {...m} />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
