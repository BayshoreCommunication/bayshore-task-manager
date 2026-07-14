"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Eye, EyeOff, Copy, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogList } from "@/components/shared/LogList";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { ROLE_CONFIG } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";

export default function VaultEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { users, vault, log, deleteVaultEntry, isElevated } = useAppStore();

  const entry = vault.find((v) => v.id === id);
  const [showPw, setShowPw] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!entry) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Entry not found.</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => router.push("/vault")}
        >
          ← Back
        </Button>
      </div>
    );
  }

  const entryLog = log.filter((e) => e.vaultId === id);
  const accessUsers = users.filter((u) => entry.accessList.includes(u.id));

  const copy = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied!`))
      .catch(() => toast.error("Copy failed"));
  };

  const handleDelete = async () => {
    await deleteVaultEntry(id);
    toast.success("Credential deleted");
    router.push("/vault");
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/vault")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-lg truncate">
            {entry.client} — {entry.platform}
          </h2>
        </div>
        {isElevated() && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/vault?edit=${id}`)}
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Credentials card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Username / Email
              </p>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-mono bg-muted rounded px-2 py-1">
                  {entry.username}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => copy(entry.username, "Username")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </p>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <span
                  className={cn(
                    "flex-1 text-sm font-mono",
                    !showPw && "tracking-widest",
                  )}
                >
                  {showPw ? entry.password : "••••••••••••"}
                </span>
                <button
                  onClick={() => setShowPw((s) => !s)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => copy(entry.password, "Password")}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {entry.url && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Login URL
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-sm text-primary truncate hover:underline"
                  >
                    {entry.url}
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copy(entry.url, "URL")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {entry.notes && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Notes
                </p>
                <p className="text-sm bg-muted rounded-lg px-3 py-2">
                  {entry.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Access card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Access Control</CardTitle>
          </CardHeader>
          <CardContent>
            {entry.accessList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Admin & O Level only (no others selected)
              </p>
            ) : (
              <div className="space-y-2">
                {accessUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2.5 py-2 border-b border-border last:border-0"
                  >
                    <UserAvatar user={u} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {ROLE_CONFIG[u.role].label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border">
              Admin and O Level always have access regardless.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <LogList
            entries={entryLog}
            users={users}
            limit={30}
            emptyText="No activity recorded for this entry yet."
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this credential?"
        description={`${entry.client} / ${entry.platform} will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
