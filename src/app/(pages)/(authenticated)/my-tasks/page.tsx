"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Lock, Edit2, VolumeX, Volume2, Check } from "lucide-react";
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
import { UserAvatar, AvatarStack } from "@/components/shared/UserAvatar";
import { PriorityBadge } from "@/components/shared/Badges";
import { cn, thisMonth } from "@/lib/utils";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { MonthlyTask, TaskPriority } from "@/types";

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

export default function MyTasksPage() {
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

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"universal" | "private">(
    "universal",
  );
  const [tab, setTab] = useState("assigned");
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  if (!me) return null;

  const canCreate = can("create_task");
  const curMonth = thisMonth();

  // — Assigned / Private task filters —
  const activeAssigned = tasks.filter(
    (t) =>
      !t.muted &&
      t.type === "universal" &&
      t.status !== "done" &&
      t.assignees.includes(me.id),
  );
  const doneAssigned = tasks.filter(
    (t) =>
      !t.muted &&
      t.type === "universal" &&
      t.status === "done" &&
      t.assignees.includes(me.id),
  );
  const activePrivate = tasks.filter(
    (t) =>
      !t.muted &&
      t.type === "private" &&
      t.createdBy === me.id &&
      t.status !== "done",
  );
  const donePrivate = tasks.filter(
    (t) =>
      !t.muted &&
      t.type === "private" &&
      t.createdBy === me.id &&
      t.status === "done",
  );
  const mutedPrivate = tasks.filter(
    (t) => t.muted && t.type === "private" && t.createdBy === me.id,
  );

  // — Monthly task helpers —
  const isAssigned = (m: MonthlyTask) =>
    m.assignees.length === 0 || m.assignees.includes(me.id);

  const isDone = (m: MonthlyTask) =>
    m.completions.some((c) => c.userId === me.id && c.month === curMonth);

  const myMonthlyTasks = monthly.filter((m) => !m.muted && isAssigned(m));
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

  const openModal = (type: "universal" | "private") => {
    setModalType(type);
    setShowModal(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="assigned">
              Assigned to Me
              <span className="ml-1.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {activeAssigned.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="private">
              Private Tasks
              <span className="ml-1.5 text-[10px] font-bold bg-violet-600 text-white rounded-full px-1.5 py-0.5">
                {activePrivate.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="monthly">
              Monthly
              <span className="ml-1.5 text-[10px] font-bold bg-orange-500 text-white rounded-full px-1.5 py-0.5">
                {myMonthlyTasks.length - monthlyDoneCount}
              </span>
            </TabsTrigger>
          </TabsList>

          {canCreate && tab !== "monthly" && (
            <Button
              size="sm"
              onClick={() =>
                openModal(tab === "private" ? "private" : "universal")
              }
            >
              <Plus className="h-3.5 w-3.5" />
              {tab === "private" ? "Private Task" : "Add Task"}
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

        {/* ── Assigned tab ── */}
        <TabsContent value="assigned">
          <TaskTable
            tasks={activeAssigned}
            showAssignee={false}
            emptyText="No active assigned tasks"
          />
          <ArchiveSection title="Completed Assigned" tasks={doneAssigned} />
        </TabsContent>

        {/* ── Private tab ── */}
        <TabsContent value="private">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-400 text-sm mb-3">
            <Lock className="h-4 w-4 shrink-0" />
            Only visible to you.
          </div>
          <TaskTable
            tasks={activePrivate}
            showAssignee={false}
            emptyText="No active private tasks"
          />
          <ArchiveSection title="Completed Private" tasks={donePrivate} />
          <ArchiveSection title="Muted Private" tasks={mutedPrivate} />
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
          defaults={{ type: modalType, assignees: [me.id] }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
