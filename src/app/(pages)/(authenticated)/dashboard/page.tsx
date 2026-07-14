"use client";

import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { computeKPI } from "@/lib/kpi";
import { StatCard } from "@/components/shared/StatCard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/utils";
import { ROLE_CONFIG } from "@/lib/constants";

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { me, users, tasks, dailyReports, monthly } = useAppStore();
  if (!me) return null;

  const ut = tasks.filter((t) => !t.muted && t.type === "universal");
  const total = ut.length;
  const done = ut.filter((t) => t.status === "done").length;
  const inProgress = ut.filter((t) => t.status === "in_progress").length;
  const overdue = ut.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
  ).length;

  const myAssigned = tasks.filter(
    (t) =>
      !t.muted &&
      t.type === "universal" &&
      t.status !== "done" &&
      t.assignees.includes(me.id),
  );
  const myPrivate = tasks.filter(
    (t) =>
      !t.muted &&
      t.type === "private" &&
      t.createdBy === me.id &&
      t.status !== "done",
  );

  const k = computeKPI(me.id, tasks, dailyReports, monthly);
  const scoreColor =
    k.ov >= 80 ? "#16a34a" : k.ov >= 50 ? "#4f8ef7" : "#d97706";

  const metrics = [
    { label: "Completion", value: k.cr, color: "#16a34a" },
    { label: "On-Time", value: k.ot, color: "#4f8ef7" },
    { label: "No Overdue", value: k.od, color: "#d97706" },
    { label: "Monthly", value: k.mr, color: "#7c5ef7" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-black">Hey, {me.name.split(" ")[0]} 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Tasks" value={total} color="#4f8ef7" />
        <StatCard label="In Progress" value={inProgress} color="#d97706" />
        <StatCard label="Completed" value={done} color="#16a34a" />
        <StatCard label="Overdue" value={overdue} color="#dc2626" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* My task overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">My Task Overview</CardTitle>
              <Button variant="ghost" size="sm">
                <Link href="/my-tasks">See all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Assigned ({myAssigned.length})
              </p>
              {myAssigned.length === 0 ? (
                <p className="text-xs text-muted-foreground">None assigned</p>
              ) : (
                myAssigned.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 py-1.5 border-b border-border last:border-0"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "#4f8ef7" }}
                    />
                    <span className="flex-1 text-xs truncate">{t.title}</span>
                    <StatusBadge status={t.status} />
                  </div>
                ))
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Private ({myPrivate.length})
              </p>
              {myPrivate.length === 0 ? (
                <p className="text-xs text-muted-foreground">None</p>
              ) : (
                myPrivate.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 py-1.5 border-b border-border last:border-0"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "#7c5ef7" }}
                    />
                    <span className="flex-1 text-xs truncate">{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* My performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">My Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-semibold" style={{ color: m.color }}>
                    {m.value}%
                  </span>
                </div>
                <ProgressBar value={m.value} color={m.color} />
              </div>
            ))}
            <div className="mt-3 bg-muted rounded-lg p-3 flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: `conic-gradient(${scoreColor} ${k.ov * 3.6}deg, hsl(var(--muted)) 0deg)`,
                }}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span
                    className="text-xs font-black"
                    style={{ color: scoreColor }}
                  >
                    {k.ov}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold">Overall Score</p>
                <p className="text-[11px] text-muted-foreground">
                  {k.done}/{k.total} tasks · {k.reports} reports · {k.mDone}/
                  {k.mTotal} monthly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Team Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {users
              .filter((u) => !u.muted)
              .map((u) => {
                const kpi = computeKPI(u.id, tasks, dailyReports, monthly);
                const c =
                  kpi.ov >= 80
                    ? "#16a34a"
                    : kpi.ov >= 50
                      ? "#4f8ef7"
                      : "#d97706";
                return (
                  <div key={u.id} className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar user={u} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {u.name.split(" ")[0]}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {ROLE_CONFIG[u.role].label}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-bold" style={{ color: c }}>
                        {kpi.ov}
                      </span>
                    </div>
                    <ProgressBar value={kpi.ov} color={c} />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
