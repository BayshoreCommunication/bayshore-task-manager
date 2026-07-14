"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, X, Edit2, VolumeX, Volume2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskTable } from "@/components/tasks/TaskTable";
import { ArchiveSection } from "@/components/tasks/ArchiveSection";
import { TaskModal } from "@/components/tasks/TaskModal";
import { DateRangePicker } from "@/components/tasks/Daterangepicker";
import { UserAvatar, AvatarStack } from "@/components/shared/UserAvatar";
import { PriorityBadge } from "@/components/shared/Badges";
import { cn, thisMonth } from "@/lib/utils";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { MonthlyTask, TaskPriority, TaskStatus } from "@/types";

// ── Monthly task form ────────────────────────────────────────────────────────

type FormState = {
  title: string;
  details: string;
  dueDay: number;
  priority: TaskPriority;
  assignees: string[];
};

const BLANK: FormState = {
  title: "",
  details: "",
  dueDay: 25,
  priority: "high",
  assignees: [],
};

function MonthlyTaskForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: FormState;
  onSave: (f: FormState) => void;
  onCancel: () => void;
}) {
  const { users } = useAppStore();
  const [f, setF] = useState(initial);

  const toggle = (id: string) =>
    setF((p) => ({
      ...p,
      assignees: p.assignees.includes(id)
        ? p.assignees.filter((x) => x !== id)
        : [...p.assignees, id],
    }));

  return (
    <Card className="border-primary mb-4">
      <CardContent className="pt-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              placeholder="Recurring task name…"
              autoFocus
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Details</Label>
            <Textarea
              rows={2}
              value={f.details}
              onChange={(e) => setF({ ...f, details: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Due Day of Month</Label>
            <Input
              type="number"
              min={1}
              max={28}
              value={f.dueDay}
              onChange={(e) => setF({ ...f, dueDay: +e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={f.priority}
              onValueChange={(v) => setF({ ...f, priority: v as TaskPriority })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Assign To (empty = everyone)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {users
                .filter((u) => !u.muted)
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      f.assignees.includes(u.id)
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted border-transparent text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <UserAvatar user={u} size="xs" />
                    {u.name.split(" ")[0]}
                    {f.assignees.includes(u.id) && (
                      <Check className="h-3 w-3" />
                    )}
                  </button>
                ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Leave empty to assign to everyone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => f.title.trim() && onSave(f)}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const {
    me,
    users,
    tasks,
    monthly,
    createMonthlyTask,
    updateMonthlyTask,
    toggleMonthlyComplete,
    can,
  } = useAppStore();

  const [tab, setTab] = useState("universal");

  // Universal filters
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">(
    "all",
  );
  const [filterUser, setFilterUser] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Monthly state
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  if (!me) return null;

  const canCreate = can("create_task");
  const curMonth = thisMonth();

  // ── Universal task splits ────────────────────────────────────────────────
  const active = tasks.filter(
    (t) => !t.muted && t.type === "universal" && t.status !== "done",
  );
  const done = tasks.filter(
    (t) => !t.muted && t.type === "universal" && t.status === "done",
  );
  const muted = tasks.filter((t) => t.muted && t.type === "universal");

  // Universal filters applied
  let filtered = active;
  if (filterStatus !== "all")
    filtered = filtered.filter((t) => t.status === filterStatus);
  if (filterPriority !== "all")
    filtered = filtered.filter((t) => t.priority === filterPriority);
  if (filterUser !== "all")
    filtered = filtered.filter((t) => t.assignees.includes(filterUser));
  if (query)
    filtered = filtered.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase()),
    );
  if (fromDate && toDate) {
    filtered = filtered.filter((t) => {
      if (!t.dueDate) return false;
      const d = t.dueDate.split("T")[0];
      return d >= fromDate && d <= toDate;
    });
  } else if (fromDate) {
    filtered = filtered.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate.split("T")[0] === fromDate;
    });
  }

  const hasFilters =
    filterStatus !== "all" ||
    filterPriority !== "all" ||
    filterUser !== "all" ||
    !!fromDate ||
    !!toDate ||
    !!query;

  const clearAll = () => {
    setQuery("");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterUser("all");
    setFromDate("");
    setToDate("");
  };

  const selectedUser = users.find((u) => u.id === filterUser);

  // ── Monthly task helpers ─────────────────────────────────────────────────
  const isAssigned = (m: MonthlyTask) =>
    m.assignees.length === 0 || m.assignees.includes(me.id);

  const isDone = (m: MonthlyTask) =>
    m.completions.some((c) => c.userId === me.id && c.month === curMonth);

  const myMonthlyTasks = monthly.filter((m) => !m.muted);
  const monthlyDoneCount = myMonthlyTasks.filter((m) => isDone(m)).length;

  const handleMonthlyCreate = async (f: FormState) => {
    await createMonthlyTask({ ...f, muted: false, createdBy: me.id });
    toast.success("Monthly task created");
    setShowMonthlyForm(false);
  };

  const handleMonthlyUpdate = async (id: string, f: FormState) => {
    await updateMonthlyTask(id, f);
    toast.success("Updated");
    setEditId(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="universal">
              Universal Tasks
              <span className="ml-1.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {active.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="monthly">
              Monthly Tasks
              <span className="ml-1.5 text-[10px] font-bold bg-orange-500 text-white rounded-full px-1.5 py-0.5">
                {myMonthlyTasks.length - monthlyDoneCount}
              </span>
            </TabsTrigger>
          </TabsList>

          {canCreate && tab === "universal" && (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          )}
          {canCreate && tab === "monthly" && (
            <Button
              size="sm"
              onClick={() => {
                setShowMonthlyForm((o) => !o);
                setEditId(null);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Monthly Task
            </Button>
          )}
        </div>

        {/* ── Universal tab ── */}
        <TabsContent value="universal" className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 py-5"
                placeholder="Search tasks…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as TaskStatus | "all")}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG)
                  .filter(([k]) => k !== "done")
                  .map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={filterPriority}
              onValueChange={(v) =>
                setFilterPriority(v as TaskPriority | "all")
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                {users
                  .filter((u) => !u.muted)
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={u} size="xs" />
                        <span>{u.name.split(" ")[0]}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              from={fromDate}
              to={toDate}
              onChange={(f, t) => {
                setFromDate(f);
                setToDate(t);
              }}
              placeholder="Filter by date"
            />
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {filtered.length} task{filtered.length !== 1 ? "s" : ""} found
              </span>
              {filterStatus !== "all" && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {STATUS_CONFIG[filterStatus as TaskStatus]?.label}
                  <button onClick={() => setFilterStatus("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterPriority !== "all" && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {PRIORITY_CONFIG[filterPriority as TaskPriority]?.label}
                  <button onClick={() => setFilterPriority("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterUser !== "all" && selectedUser && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  <UserAvatar user={selectedUser} size="xs" />
                  {selectedUser.name.split(" ")[0]}
                  <button onClick={() => setFilterUser("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(fromDate || toDate) && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {fromDate}
                  {toDate && toDate !== fromDate ? ` – ${toDate}` : ""}
                  <button
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {query && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  "{query}"
                  <button onClick={() => setQuery("")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={clearAll}
              >
                Clear all
              </button>
            </div>
          )}

          <TaskTable
            tasks={filtered}
            showAssignee
            emptyText="No active tasks"
          />
          <ArchiveSection title="Completed Tasks" tasks={done} showAssignee />
          <ArchiveSection title="Muted Tasks" tasks={muted} showAssignee />
        </TabsContent>

        {/* ── Monthly tab ── */}
        <TabsContent value="monthly">
          <div className="space-y-4 max-w-2xl">
            <div>
              <h2 className="font-black text-lg">
                Monthly Tasks —{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {monthlyDoneCount} of {myMonthlyTasks.length} completed ·
                repeats every month
              </p>
            </div>

            {showMonthlyForm && (
              <MonthlyTaskForm
                initial={BLANK}
                onSave={handleMonthlyCreate}
                onCancel={() => setShowMonthlyForm(false)}
              />
            )}

            {myMonthlyTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No monthly tasks yet
              </p>
            ) : (
              myMonthlyTasks.map((m) => {
                const done = isDone(m);
                const myTask = isAssigned(m);
                const completors = m.completions.filter(
                  (c) => c.month === curMonth,
                );
                const assignedUsers =
                  m.assignees.length > 0
                    ? users.filter((u) => m.assignees.includes(u.id))
                    : null;

                if (editId === m.id) {
                  return (
                    <MonthlyTaskForm
                      key={m.id}
                      initial={{
                        title: m.title,
                        details: m.details,
                        dueDay: m.dueDay,
                        priority: m.priority,
                        assignees: m.assignees,
                      }}
                      onSave={(f) => handleMonthlyUpdate(m.id, f)}
                      onCancel={() => setEditId(null)}
                    />
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card",
                      m.muted && "opacity-50",
                    )}
                  >
                    <button
                      onClick={() =>
                        myTask &&
                        !m.muted &&
                        toggleMonthlyComplete(m.id, me.id, curMonth)
                      }
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                        done
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-border",
                        (!myTask || m.muted) && "opacity-30 cursor-not-allowed",
                      )}
                    >
                      {done && <Check className="h-3 w-3" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-medium text-sm",
                          done && "line-through text-muted-foreground",
                        )}
                      >
                        {m.title}
                      </p>
                      {m.details && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {m.details}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">
                          Due day {m.dueDay} every month
                        </span>
                        <PriorityBadge priority={m.priority} />
                        <span className="text-[11px] text-muted-foreground">
                          →{" "}
                          {assignedUsers
                            ? assignedUsers
                                .map((u) => u.name.split(" ")[0])
                                .join(", ")
                            : "Everyone"}
                        </span>
                        {completors.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <AvatarStack
                              userIds={completors.map((c) => c.userId)}
                              users={users}
                              max={5}
                              size="xs"
                            />
                            <span className="text-[11px] text-muted-foreground">
                              {completors.length} done
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {canCreate && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditId(m.id)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "h-7 w-7",
                            m.muted
                              ? "text-green-600"
                              : "text-muted-foreground",
                          )}
                          onClick={() => {
                            updateMonthlyTask(m.id, { muted: !m.muted });
                            toast.success(m.muted ? "Unmuted" : "Muted");
                          }}
                        >
                          {m.muted ? (
                            <Volume2 className="h-3.5 w-3.5" />
                          ) : (
                            <VolumeX className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showModal && (
        <TaskModal
          open
          defaults={{ type: "universal" }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
