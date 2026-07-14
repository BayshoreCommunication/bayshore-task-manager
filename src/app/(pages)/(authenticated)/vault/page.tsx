"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Edit2,
  Trash2,
  FolderOpen,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { ROLE_CONFIG } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { VaultEntry } from "@/types";
import { User } from "@/types/index";

type FormState = Omit<VaultEntry, "id" | "createdAt" | "createdBy">;
const BLANK: FormState = {
  client: "",
  platform: "",
  username: "",
  password: "",
  url: "",
  notes: "",
  accessList: [],
};

function VaultForm({
  initial,
  prefillClient,
  onSave,
  onCancel,
  users,
}: {
  initial: FormState;
  prefillClient?: string;
  onSave: (f: FormState) => void;
  onCancel: () => void;
  users: User[];
}) {
  const [f, setF] = useState({
    ...initial,
    client: prefillClient ?? initial.client,
  });
  const { vault } = useAppStore();
  const existingClients = [...new Set(vault.map((v) => v.client))];
  const nonAdmin = users.filter(
    (u) => !u.muted && u.role !== "admin" && u.role !== "o_level",
  );
  const toggle = (id: string) =>
    setF((p) => ({
      ...p,
      accessList: p.accessList.includes(id)
        ? p.accessList.filter((x) => x !== id)
        : [...p.accessList, id],
    }));

  return (
    <Card className="border-primary mb-4">
      <CardContent className="pt-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Client / Project Folder *</Label>
            <Input
              value={f.client}
              onChange={(e) => setF({ ...f, client: e.target.value })}
              placeholder="e.g. Bully Project"
              list="client-list"
              autoFocus={!prefillClient}
            />
            <datalist id="client-list">
              {existingClients.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label>Platform *</Label>
            <Input
              value={f.platform}
              onChange={(e) => setF({ ...f, platform: e.target.value })}
              placeholder="e.g. Shopify, cPanel"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Username / Email *</Label>
            <Input
              value={f.username}
              onChange={(e) => setF({ ...f, username: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Login URL</Label>
            <Input
              value={f.url}
              onChange={(e) => setF({ ...f, url: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={f.notes}
              onChange={(e) => setF({ ...f, notes: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Who Can See This</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {nonAdmin.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    f.accessList.includes(u.id)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-transparent text-muted-foreground hover:bg-accent",
                  )}
                >
                  <UserAvatar user={u} size="xs" />
                  {u.name.split(" ")[0]}
                  <span className="text-[10px]">
                    ({ROLE_CONFIG[u.role].label})
                  </span>
                  {f.accessList.includes(u.id) && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Admin & O Level always have access. Leave all off = Admin/O Level
              only.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => {
              if (f.client && f.platform && f.username) onSave(f);
              else toast.error("Client, platform and username required");
            }}
          >
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

export default function VaultPage() {
  const router = useRouter();
  const {
    me,
    users,
    vault,
    createVaultEntry,
    updateVaultEntry,
    deleteVaultEntry,
    isElevated,
  } = useAppStore();
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [prefillClient, setPrefillClient] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<VaultEntry | null>(null);

  if (!me) return null;

  const canView = (v: VaultEntry) => {
    if (isElevated()) return true;
    if (!v.accessList.length) return false;
    return v.accessList.includes(me.id);
  };

  const myVault = vault.filter(canView);
  const clients: Record<string, VaultEntry[]> = {};
  myVault.forEach((v) => {
    if (!clients[v.client]) clients[v.client] = [];
    clients[v.client].push(v);
  });

  const toggleShow = (id: string) => setShown((s) => ({ ...s, [id]: !s[id] }));
  const toggleFolder = (name: string) =>
    setOpenFolders((f) => ({ ...f, [name]: !f[name] }));

  const copyText = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied!`))
      .catch(() => toast.error("Copy failed"));
  };

  const getEditInitial = (v: VaultEntry): FormState => ({
    client: v.client,
    platform: v.platform,
    username: v.username,
    password: v.password,
    url: v.url,
    notes: v.notes,
    accessList: v.accessList,
  });

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="flex-1 text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          🔐 Credentials organised by client/project — access controlled per
          entry.
        </div>
        {isElevated() && !adding && !editId && (
          <Button
            size="sm"
            onClick={() => {
              setAdding(true);
              setPrefillClient(undefined);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Client / Project
          </Button>
        )}
      </div>

      {adding && (
        <VaultForm
          initial={BLANK}
          prefillClient={prefillClient}
          users={users}
          onSave={async (f) => {
            await createVaultEntry({ ...f, createdBy: me.id });
            toast.success("Credential added");
            setAdding(false);
            setPrefillClient(undefined);
          }}
          onCancel={() => {
            setAdding(false);
            setPrefillClient(undefined);
          }}
        />
      )}

      {editId && (
        <VaultForm
          initial={getEditInitial(vault.find((v) => v.id === editId)!)}
          users={users}
          onSave={async (f) => {
            await updateVaultEntry(editId, f);
            toast.success("Updated");
            setEditId(null);
          }}
          onCancel={() => setEditId(null)}
        />
      )}

      {Object.keys(clients).length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">
          No credentials yet — click "Add Client / Project" to create your first
          folder.
        </p>
      ) : (
        Object.entries(clients).map(([clientName, entries]) => (
          <div
            key={clientName}
            className="rounded-xl border border-border overflow-hidden bg-card"
          >
            {/* Folder header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleFolder(clientName)}
            >
              <FolderOpen className="h-5 w-5 text-primary shrink-0" />
              <span className="font-bold text-sm flex-1">{clientName}</span>
              <span className="text-xs text-muted-foreground mr-2">
                {entries.length} credential{entries.length !== 1 ? "s" : ""}
              </span>
              {isElevated() && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrefillClient(clientName);
                    setAdding(true);
                    setEditId(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  openFolders[clientName] && "rotate-180",
                )}
              />
            </div>

            {/* Folder body */}
            {openFolders[clientName] && (
              <div className="px-3 pb-3 space-y-2 border-t border-border">
                {entries.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-lg border border-border bg-background p-3 hover:border-primary/30 transition-colors cursor-pointer mt-2"
                    onClick={() => router.push(`/vault/${v.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{v.platform}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.username}
                        </p>
                      </div>
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Copy password"
                          onClick={() => copyText(v.password, "Password")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {isElevated() && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditId(v.id);
                              setAdding(false);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Password row */}
                    <div
                      className="flex items-center gap-2 bg-muted rounded-md px-2.5 py-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={cn(
                          "flex-1 text-sm font-mono truncate",
                          !shown[v.id] &&
                            "tracking-widest text-muted-foreground",
                        )}
                      >
                        {shown[v.id] ? v.password : "••••••••••••"}
                      </span>
                      <button
                        onClick={() => toggleShow(v.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {shown[v.id] ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(v.password, "Password")}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {v.url && (
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs text-primary truncate mt-1.5 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {v.url}
                      </a>
                    )}
                    {v.accessList.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        👥{" "}
                        {users
                          .filter((u) => v.accessList.includes(u.id))
                          .map((u) => u.name.split(" ")[0])
                          .join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete credential?"
        description={
          deleteTarget
            ? `${deleteTarget.client} / ${deleteTarget.platform}`
            : ""
        }
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteVaultEntry(deleteTarget.id);
            toast.success("Deleted");
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
