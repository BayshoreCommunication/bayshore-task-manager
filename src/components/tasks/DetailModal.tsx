"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { LogList } from "@/components/shared/LogList";
import { Send, Link2, Paperclip, X, Download } from "lucide-react";
import { cn, uid, now, fmtTime, fileToBase64 } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { Task, Comment, Attachment } from "@/types";

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  task: Task;
}

export function DetailModal({ open, onClose, task }: DetailModalProps) {
  const { me, users, tasks, setTasks, addLog, pushNotification, log } =
    useAppStore();
  const live = tasks.find((t) => t.id === task.id) ?? task;

  const [commentText, setCommentText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [docLinkUrl, setDocLinkUrl] = useState("");
  const [docLinkName, setDocLinkName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const taskLog = log.filter((e) => e.taskId === task.id);

  const saveTask = async (updated: Task) => {
    await setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
  };

  const sendComment = async () => {
    if (!commentText.trim() && !linkUrl.trim()) return;
    const c: Comment = {
      id: uid(),
      userId: me!.id,
      text: commentText,
      attachments: linkUrl ? [{ type: "link", url: linkUrl }] : [],
      at: now(),
    };
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
    if (!res.ok) {
      toast.error("Failed to send comment");
      return;
    }
    const comment = await res.json();
    // await saveTask({ ...live, comments: [...(live.comments ?? []), c] });
    await saveTask({
      ...live,
      comments: [...(live.comments ?? []), comment],
    });
    await addLog(
      "comment",
      `${me?.name} commented on "${live.title}"`,
      commentText.slice(0, 80),
      me?.id,
      { ico: "💬", taskId: task.id },
    );
    // @mentions
    const tags = commentText.match(/@(\w+)/g) ?? [];
    for (const tag of tags) {
      const u = users.find((x) =>
        x.name.toLowerCase().includes(tag.slice(1).toLowerCase()),
      );
      if (u && u.id !== me?.id) {
        await pushNotification({
          targetUserId: u.id,
          message: `${me?.name} tagged you in "${live.title}"`,
          linkPage: "/tasks",
        });
      }
    }
    setCommentText("");
    setLinkUrl("");
    setShowLinkInput(false);
    toast.success("Comment posted");
  };

  const addLink = async () => {
    if (!docLinkUrl.trim()) return;
    try {
      const att: Attachment = {
        id: uid(),
        type: "link",
        name: docLinkName || docLinkUrl,
        url: docLinkUrl,
        addedBy: me!.id,
        at: now(),
      };

      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(att),
      });
      if (!res.ok) {
        toast.error("Failed to add link");
      } else {
        await saveTask({
          ...live,
          attachments: [...(live.attachments ?? []), att],
        });
        await addLog(
          "task_edited",
          `"${live.title}" link attached`,
          docLinkUrl,
          me?.id,
          { ico: "🔗", taskId: task.id },
        );
        setDocLinkUrl("");
        setDocLinkName("");
        toast.success("Link added");
      }
    } catch (error) {
      toast.error("Failed to add link");
    }
  };

  const addFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await fileToBase64(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", task.id);
    if (docLinkName) formData.append("name", docLinkName);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      toast.error("Failed to upload file");
      return;
    }
    const { type, url, ...rest } = await res.json();

    console.log("Upload response:", { type, url, rest });
    const att: Attachment = {
      id: rest.id,
      type,
      name: rest.name,
      url,
      addedBy: rest.addedBy,
      at: rest.at,
    };
    await saveTask({
      ...live,
      attachments: [...(live.attachments ?? []), att],
    });
    await addLog(
      "task_edited",
      `"${live.title}" ${type} attached`,
      rest.name,
      me?.id,
      { ico: "📎", taskId: task.id },
    );
    e.target.value = "";
    toast.success("File attached");
  };

  const removeAtt = async (id: string) => {
    await saveTask({
      ...live,
      attachments: (live.attachments ?? []).filter((a) => a.id !== id),
    });
  };

  const renderCommentText = (text: string) =>
    text
      .replace(/@(\w+)/g, '<span class="text-primary font-medium">@$1</span>')
      .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" class="text-primary underline">$1</a>',
      );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base pr-6 leading-snug">
            {live.title}
          </DialogTitle>
          <div className="flex gap-2 flex-wrap pt-1">
            <PriorityBadge priority={live.priority} />
            <StatusBadge status={live.status} />
            {live.type === "private" && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                Private
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Assignees + due */}
        <div className="grid grid-cols-2 gap-4 py-1 px-0.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Assignees
            </p>
            <div className="flex flex-wrap gap-2">
              {(live.assignees ?? []).map((id) => {
                const u = users.find((x) => x.id === id);
                return u ? (
                  <div key={id} className="flex items-center gap-1.5 text-xs">
                    <UserAvatar user={u} size="xs" />
                    <span>{u.name.split(" ")[0]}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Due Date
            </p>
            <p className="text-sm">
              {live.dueDate ? new Date(live.dueDate).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        {live.details && (
          <div className="bg-muted rounded-lg px-4 py-3 text-sm leading-relaxed">
            {live.details}
          </div>
        )}

        <Tabs defaultValue="comments">
          <TabsList className="w-full">
            <TabsTrigger value="comments" className="flex-1">
              Comments ({(live.comments ?? []).length})
            </TabsTrigger>
            <TabsTrigger value="attachments" className="flex-1">
              Attachments ({(live.attachments ?? []).length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">
              Activity ({taskLog.length})
            </TabsTrigger>
          </TabsList>

          {/* Comments */}
          <TabsContent value="comments" className="space-y-3 mt-3">
            <div className="max-h-52 overflow-y-auto space-y-0 divide-y divide-border">
              {(live.comments ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No comments yet
                </p>
              ) : (
                (live.comments ?? []).map((c) => {
                  const cu = users.find((u) => u.id === c.userId);
                  return (
                    <div key={c.id} className="flex gap-2.5 py-3">
                      <UserAvatar user={cu} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {cu?.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {fmtTime(c.at)}
                          </span>
                        </div>
                        <p
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: renderCommentText(c.text),
                          }}
                        />
                        {c.attachments?.map((a, i) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary underline block mt-1"
                          >
                            🔗 {a.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment input */}
            <div className="flex gap-2 items-start">
              <UserAvatar user={me} size="sm" className="mt-1" />
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-1.5">
                  <Input
                    className="flex-1 text-sm"
                    placeholder="Comment… @name to tag"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendComment()
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowLinkInput((o) => !o)}
                    title="Attach link"
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" onClick={sendComment}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {showLinkInput && (
                  <Input
                    placeholder="https://…"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="text-sm"
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Attachments */}
          <TabsContent value="attachments" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Add Link
              </p>
              <div className="flex justify-between gap-1.5 ">
                <Input
                  placeholder="Display name (optional)"
                  value={docLinkName}
                  onChange={(e) => setDocLinkName(e.target.value)}
                  className="text-sm"
                />
                <Input
                  placeholder="https://…"
                  value={docLinkUrl}
                  onChange={(e) => setDocLinkUrl(e.target.value)}
                  className=" text-sm"
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                />

                <Button size="sm" onClick={addLink}>
                  Add
                </Button>
              </div>
            </div>

            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload image or PDF
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={addFile}
              />
            </div>

            {(live.attachments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No attachments yet
              </p>
            ) : (
              <div className="space-y-2">
                {(live.attachments ?? []).map((a) => {
                  const addedBy = users.find((u) => u.id === a.addedBy);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-2.5 bg-muted rounded-lg"
                    >
                      <div className="w-9 h-9 rounded-md bg-background flex items-center justify-center text-base shrink-0">
                        {a.type === "image"
                          ? "🖼️"
                          : a.type === "pdf"
                            ? "📄"
                            : "🔗"}
                      </div>
                      <div className="flex-1 min-w-0">
                        {a.type === "link" ? (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-primary truncate block"
                          >
                            {a.name}
                          </a>
                        ) : (
                          <p className="text-sm font-medium truncate">
                            {a.type === "image" ? (
                              <a
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-primary truncate block"
                              >
                                {a.name}
                              </a>
                            ) : (
                              // <a
                              //   href={
                              //     a.url
                              //       ? getAttachmentUrl(a.url, "application/pdf")
                              //       : undefined
                              //   }
                              //   target="_blank"
                              //   rel="noreferrer"
                              //   className="text-sm font-medium text-primary truncate block"
                              // >
                              //   {a.name}
                              // </a>
                              // <a
                              //   href={a.url}
                              //   download={a.name}
                              //   target="_blank"
                              //   rel="noreferrer"
                              //   className="text-primary underline text-sm"
                              // >
                              //   {a.name} — Download PDF
                              // </a>
                              <a
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline text-sm"
                              >
                                {a.name} — View PDF
                              </a>
                            )}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground truncate">
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-primary truncate block"
                          >
                            {a.type.toUpperCase()} ·{" "}
                            {addedBy?.name.split(" ")[0]}
                          </a>
                        </p>
                      </div>
                      {(a.type === "image" || a.type === "pdf") && a.data && (
                        <a
                          href={a.data}
                          download={a.name}
                          className="p-1.5 rounded hover:bg-background transition-colors"
                        >
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </a>
                      )}
                      <button
                        onClick={() => removeAtt(a.id)}
                        className="p-1.5 rounded hover:bg-background transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="mt-3">
            <LogList
              entries={taskLog}
              users={users}
              limit={50}
              emptyText="No activity on this task yet"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
