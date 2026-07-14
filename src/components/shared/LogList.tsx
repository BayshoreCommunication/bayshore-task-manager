import { fmtTime } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { LogEntry, User } from "@/types";

interface LogListProps {
  entries: LogEntry[];
  users: User[];
  limit?: number;
  emptyText?: string;
}

export function LogList({
  entries,
  users,
  limit = 30,
  emptyText = "No activity yet",
}: LogListProps) {
  const shown = entries.slice(0, limit);
  if (!shown.length) {
    return <p className="text-sm text-muted-foreground py-2">{emptyText}</p>;
  }
  return (
    <div className="space-y-0 divide-y divide-border">
      {shown.map((e) => {
        const actor = users.find((u) => u.id === e.actorId);
        return (
          <div key={e.id} className="flex gap-3 py-3">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-sm shrink-0 mt-0.5">
              {e.ico ?? "📌"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">{e.message}</p>
              {e.details && (
                <p className="text-xs text-muted-foreground italic mt-0.5 truncate">
                  {e.details}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-muted-foreground">
                  {fmtTime(e.at)}
                </span>
                {actor && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <UserAvatar user={actor} size="xs" />
                    {actor.name.split(" ")[0]}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
