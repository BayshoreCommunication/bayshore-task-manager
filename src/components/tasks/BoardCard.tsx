"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { PriorityBadge } from "@/components/shared/Badges";
import { DetailModal } from "@/components/tasks/DetailModal";
import { cn, uid, now, fmt } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { Task, Comment } from "@/types";

interface BoardCardProps {
  task: Task;
}

export function BoardCard({ task }: BoardCardProps) {
  const { me, users, tasks, setTasks, addLog, pushNotification } =
    useAppStore();
  const live = tasks.find((t) => t.id === task.id) ?? task;

  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const postComment = async () => {
    if (!comment.trim() && !linkUrl.trim()) return;
    const c: Comment = {
      id: uid(),
      userId: me!.id,
      text: comment,
      attachments: linkUrl ? [{ type: "link", url: linkUrl }] : [],
      at: now(),
    };
    await setTasks(
      tasks.map((t) =>
        t.id === task.id ? { ...t, comments: [...(t.comments ?? []), c] } : t,
      ),
    );
    await addLog(
      "comment",
      `${me?.name} commented on "${live.title}"`,
      comment.slice(0, 60),
      me?.id,
      { ico: "💬", taskId: task.id },
    );
    const tags = comment.match(/@(\w+)/g) ?? [];
    for (const tag of tags) {
      const u = users.find((x) =>
        x.name.toLowerCase().includes(tag.slice(1).toLowerCase()),
      );
      if (u && u.id !== me?.id) {
        await pushNotification({
          targetUserId: u.id,
          message: `${me?.name} tagged you in "${live.title}"`,
          linkPage: "/board",
        });
      }
    }
    setComment("");
    setLinkUrl("");
    setShowLink(false);
    toast.success("Comment posted");
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-3 mb-2 hover:-translate-y-0.5 transition-transform shadow-sm">
        <div onClick={() => setExpanded((o) => !o)} className="cursor-pointer">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium leading-snug flex-1">
              {live.title}
            </p>
            <PriorityBadge priority={live.priority} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {fmt(live.dueDate)}
            </span>
            {(live.comments?.length ?? 0) > 0 && (
              <span className="text-[11px] text-muted-foreground">
                💬 {live.comments.length}
              </span>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {live.details && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {live.details}
              </p>
            )}

            {/* Comments */}
            {(live.comments?.length ?? 0) > 0 && (
              <div className="max-h-28 overflow-y-auto space-y-2">
                {live.comments.map((c) => {
                  const u = users.find((x) => x.id === c.userId);
                  return (
                    <div key={c.id} className="flex gap-2">
                      <UserAvatar user={u} size="xs" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold">
                          {u?.name.split(" ")[0]}
                        </span>
                        <p className="text-xs leading-snug">{c.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick comment input */}
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Input
                className="flex-1 h-7 text-xs"
                placeholder="Comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && postComment()}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setShowLink((o) => !o)}
              >
                <Link2 className="h-3 w-3" />
              </Button>
              <Button size="icon" className="h-7 w-7" onClick={postComment}>
                <Send className="h-3 w-3" />
              </Button>
            </div>
            {showLink && (
              <Input
                className="h-7 text-xs"
                placeholder="https://…"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            )}

            <button
              className="text-xs text-primary underline-offset-2 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetail(true);
              }}
            >
              Open full detail →
            </button>
          </div>
        )}
      </div>

      {showDetail && (
        <DetailModal open task={live} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
