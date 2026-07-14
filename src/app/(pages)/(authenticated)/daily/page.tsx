"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Edit2 } from "lucide-react";
import { cn, today, fmt } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

// ── Types ────────────────────────────────────────────────────────────────────

type HourEntry = {
  hour: number;
  note: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  const period = i < 12 ? "AM" : "PM";
  const h = i === 0 ? 12 : i > 12 ? i - 12 : i;
  return `${h}:00 ${period}`;
});

function buildEmptyHours(): HourEntry[] {
  return Array.from({ length: 24 }, (_, i) => ({ hour: i, note: "" }));
}

function toSavedHours(hours: HourEntry[]): HourEntry[] {
  return hours.filter((h) => h.note.trim() !== "");
}

function mergeHours(saved: HourEntry[]): HourEntry[] {
  const base = buildEmptyHours();
  saved.forEach((s) => {
    base[s.hour].note = s.note;
  });
  return base;
}

// ── Hour grid ────────────────────────────────────────────────────────────────

function HourGrid({
  hours,
  onChange,
  readOnly = false,
}: {
  hours: HourEntry[];
  onChange?: (updated: HourEntry[]) => void;
  readOnly?: boolean;
}) {
  const update = (hour: number, note: string) => {
    if (!onChange) return;
    onChange(hours.map((h) => (h.hour === hour ? { ...h, note } : h)));
  };

  return (
    <div className="space-y-1 max-h-120 overflow-y-auto pr-1">
      {hours.map((h) => (
        <div
          key={h.hour}
          className={cn(
            "flex items-start gap-3 px-2 py-1.5 rounded-md transition-colors",
            h.note.trim()
              ? "bg-primary/5 border border-primary/20"
              : "hover:bg-muted/50",
          )}
        >
          <span className="text-[11px] font-mono text-muted-foreground w-16 shrink-0 pt-2">
            {HOUR_LABELS[h.hour]}
          </span>
          {readOnly ? (
            h.note.trim() ? (
              <p className="text-sm py-1.5 leading-relaxed">{h.note}</p>
            ) : (
              <p className="text-xs text-muted-foreground py-1.5 italic">—</p>
            )
          ) : (
            <Input
              className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
              placeholder="What did you do this hour?"
              value={h.note}
              onChange={(e) => update(h.hour, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Report card ──────────────────────────────────────────────────────────────

function ReportCard({
  report,
  onEdit,
}: {
  report: {
    id: string;
    date: string;
    content: string;
    plan?: string;
    blockers?: string;
    userId: string;
    hours?: HourEntry[];
  };
  onEdit?: () => void;
}) {
  const { users } = useAppStore();
  const [showHours, setShowHours] = useState(false);
  const user = users.find((u) => u.id === report.userId);
  const filledHours = (report.hours ?? []).filter((h) => h.note.trim());

  return (
    <Card className="mb-3">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserAvatar user={user} size="sm" />
            <span className="text-sm font-semibold">{user?.name}</span>
            <span className="text-xs text-muted-foreground">
              {fmt(report.date)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {filledHours.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setShowHours((o) => !o)}
              >
                {showHours ? "Hide" : `${filledHours.length}h logged`}
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onEdit}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="border-l-2 border-primary pl-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Today
          </p>
          <p className="text-sm leading-relaxed">{report.content}</p>
        </div>
        {report.plan && (
          <div className="border-l-2 border-green-500 pl-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
              Tomorrow
            </p>
            <p className="text-sm leading-relaxed">{report.plan}</p>
          </div>
        )}
        {report.blockers && (
          <div className="border-l-2 border-destructive pl-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">
              Blockers
            </p>
            <p className="text-sm leading-relaxed">{report.blockers}</p>
          </div>
        )}

        {showHours && filledHours.length > 0 && (
          <div className="mt-2 border-t pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Hour Log
            </p>
            <HourGrid hours={mergeHours(filledHours)} readOnly />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function DailyPage() {
  const { me, users, dailyReports, createDailyReport, updateDailyReport, can } =
    useAppStore();

  const [date, setDate] = useState(today());
  const [content, setContent] = useState("");
  const [plan, setPlan] = useState("");
  const [blockers, setBlockers] = useState("");
  const [hours, setHours] = useState<HourEntry[]>(buildEmptyHours());

  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    content: "",
    plan: "",
    blockers: "",
    hours: buildEmptyHours(),
  });

  if (!me) return null;

  const myReports = dailyReports.filter((r) => r.userId === me.id);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Accomplishments required");
      return;
    }
    await createDailyReport({
      userId: me.id,
      date,
      content,
      plan,
      blockers,
      hours: toSavedHours(hours),
      at: new Date().toISOString(),
    });
    toast.success("Report submitted!");
    setContent("");
    setPlan("");
    setBlockers("");
    setHours(buildEmptyHours());
    setDate(today());
  };

  const handleEdit = async () => {
    if (!editId) return;
    await updateDailyReport(editId, {
      ...editData,
      hours: toSavedHours(editData.hours),
    });
    toast.success("Report updated");
    setEditId(null);
  };

  const startEdit = (r: (typeof dailyReports)[0]) => {
    setEditId(r.id);
    setEditData({
      content: r.content,
      plan: r.plan ?? "",
      blockers: r.blockers ?? "",
      hours: mergeHours(r.hours ?? []),
    });
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My Reports</TabsTrigger>
          <TabsTrigger value="new">+ New Report</TabsTrigger>
          {can("view_daily_reports") && (
            <TabsTrigger value="team">Team Reports</TabsTrigger>
          )}
        </TabsList>

        {/* ── New report ── */}
        <TabsContent value="new" className="mt-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Today's Accomplishments *</Label>
                <Textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What did you work on?"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Plan for Tomorrow</Label>
                <Textarea
                  rows={3}
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="What's next?"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Blockers</Label>
                <Textarea
                  rows={2}
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  placeholder="Any issues?"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Hour Log{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    (optional — fill any hours you worked)
                  </span>
                </Label>
                <HourGrid hours={hours} onChange={setHours} />
              </div>
              <Button onClick={handleSubmit}>Submit Report</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── My reports ── */}
        <TabsContent value="mine" className="mt-4">
          {myReports.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No reports yet
            </p>
          ) : (
            myReports.map((r) =>
              editId === r.id ? (
                <Card key={r.id} className="mb-3 border-primary">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold">
                        Editing — {fmt(r.date)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Textarea
                      rows={3}
                      value={editData.content}
                      onChange={(e) =>
                        setEditData({ ...editData, content: e.target.value })
                      }
                      placeholder="Today"
                    />
                    <Textarea
                      rows={2}
                      value={editData.plan}
                      onChange={(e) =>
                        setEditData({ ...editData, plan: e.target.value })
                      }
                      placeholder="Tomorrow"
                    />
                    <Textarea
                      rows={2}
                      value={editData.blockers}
                      onChange={(e) =>
                        setEditData({ ...editData, blockers: e.target.value })
                      }
                      placeholder="Blockers"
                    />
                    <div className="space-y-1.5">
                      <Label>Hour Log</Label>
                      <HourGrid
                        hours={editData.hours}
                        onChange={(updated) =>
                          setEditData({ ...editData, hours: updated })
                        }
                      />
                    </div>
                    <Button size="sm" onClick={handleEdit}>
                      Save
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ReportCard key={r.id} report={r} onEdit={() => startEdit(r)} />
              ),
            )
          )}
        </TabsContent>

        {/* ── Team reports ── */}
        {can("view_daily_reports") && (
          <TabsContent value="team" className="mt-4">
            {users
              .filter((u) => !u.muted)
              .map((u) => {
                const ur = dailyReports.filter((r) => r.userId === u.id);
                if (!ur.length) return null;
                return (
                  <div key={u.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <UserAvatar user={u} size="sm" />
                      <span className="font-bold text-sm">{u.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ur.length} report{ur.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {ur.slice(0, 3).map((r) => (
                      <ReportCard key={r.id} report={r} />
                    ))}
                  </div>
                );
              })}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
