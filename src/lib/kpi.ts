import type { Task, DailyReport, MonthlyTask, KPIResult } from "@/types";

function monthStart(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1);
}

export function computeKPI(
  userId: string,
  tasks: Task[],
  daily: DailyReport[],
  monthly: MonthlyTask[],
): KPIResult {
  const ms = monthStart();
  const curMonth = new Date().toISOString().slice(0, 7);

  // Tasks assigned to this user (not muted)
  const mine = tasks.filter((t) => !t.muted && t.assignees.includes(userId));
  const done = mine.filter((t) => t.status === "done");
  const overdueTasks = mine.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
  );
  const onTime = done.filter((t) => {
    if (!t.dueDate) return true;
    const completed = t.completedAt ? new Date(t.completedAt) : new Date();
    return completed <= new Date(t.dueDate);
  });

  // Daily reports this month
  const reps = daily.filter(
    (r) => r.userId === userId && new Date(r.at || r.date) >= ms,
  );

  // Monthly tasks this person is assigned to
  const mTasks = monthly.filter(
    (m) =>
      !m.muted && (m.assignees.length === 0 || m.assignees.includes(userId)),
  );
  const mDone = mTasks.filter((m) =>
    m.completions.some((c) => c.userId === userId && c.month === curMonth),
  );

  // Component scores (0–100)
  const cr = mine.length ? Math.round((done.length / mine.length) * 100) : 0;
  const ot = done.length ? Math.round((onTime.length / done.length) * 100) : 0;
  const rs = Math.min(100, reps.length * 5);
  const od = mine.length
    ? Math.max(0, 100 - Math.round((overdueTasks.length / mine.length) * 100))
    : 100;
  const mr = mTasks.length
    ? Math.round((mDone.length / mTasks.length) * 100)
    : 100;

  // Weighted overall score
  const ov = Math.round(cr * 0.3 + ot * 0.25 + rs * 0.2 + od * 0.15 + mr * 0.1);

  return {
    cr,
    ot,
    rs,
    od,
    mr,
    ov,
    done: done.length,
    total: mine.length,
    overdue: overdueTasks.length,
    reports: reps.length,
    mDone: mDone.length,
    mTotal: mTasks.length,
  };
}
