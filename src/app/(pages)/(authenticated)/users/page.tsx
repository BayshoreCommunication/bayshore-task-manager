"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit2, VolumeX, Volume2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { RoleBadge } from "@/components/shared/Badges";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { ROLE_ORDER, ROLE_CONFIG } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { UserRole, User } from "@/types";

type UserFormData = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  designation: string;
  department: string;
  responsibilities: string;
};

const BLANK: UserFormData = {
  name: "",
  email: "",
  password: "",
  role: "executive",
  designation: "",
  department: "",
  responsibilities: "",
};

function UserFormDialog({
  open,
  onClose,
  initial,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  initial: UserFormData;
  userId?: string;
}) {
  const { users, createUser, updateUser, addLog, me } = useAppStore();
  const [f, setF] = useState(initial);
  const [err, setErr] = useState("");
  const isEdit = !!userId;

  // const save = async () => {
  //   if (!f.name.trim() || !f.email.trim() || !f.password.trim()) {
  //     setErr("Name, email and password are required");
  //     return;
  //   }
  //   if (!isEdit && users.find((u) => u.email === f.email)) {
  //     setErr("Email already exists");
  //     return;
  //   }
  //   if (isEdit) {
  //     await updateUser(userId!, f);
  //     await addLog("user_edited", `Updated user: ${f.name}`, "", me?.id, {
  //       ico: "✏️",
  //     });
  //     toast.success("User updated");
  //   } else {
  //     await createUser({
  //       ...f,
  //       avatar: null,
  //       muted: false,
  //       theme: "dark",
  //       sessionVersion: 0,
  //     });
  //     toast.success("User created");
  //   }
  //   onClose();
  // };

  const save = async () => {
    if (!f.name.trim() || !f.email.trim()) {
      setErr("Name and email are required");
      return;
    }

    // password required only when creating
    if (!isEdit && !f.password.trim()) {
      setErr("Password is required");
      return;
    }

    if (!isEdit && users.find((u) => u.email === f.email)) {
      setErr("Email already exists");
      return;
    }

    if (isEdit) {
      const payload = {
        ...f,
        ...(f.password?.trim() ? { password: f.password } : {}),
      };

      await updateUser(userId!, payload);

      await addLog("user_edited", `Updated user: ${f.name}`, "", me?.id, {
        ico: "✏️",
      });

      toast.success("User updated");
    } else {
      await createUser({
        ...f,
        avatar: null,
        muted: false,
        theme: "dark",
        sessionVersion: 0,
      });

      toast.success("User created");
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md"
        aria-describedby={undefined}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "New User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {err && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {err}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input
                type="password"
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
                placeholder={isEdit ? "Leave blank to keep" : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={f.role}
                onValueChange={(v) => setF({ ...f, role: v as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {ROLE_ORDER.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Input
                value={f.designation}
                onChange={(e) => setF({ ...f, designation: e.target.value })}
                placeholder="e.g. Senior Manager"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input
                value={f.department}
                onChange={(e) => setF({ ...f, department: e.target.value })}
                placeholder="e.g. Marketing"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Responsibilities</Label>
              <Textarea
                rows={2}
                value={f.responsibilities}
                onChange={(e) =>
                  setF({ ...f, responsibilities: e.target.value })
                }
                placeholder="Key responsibilities…"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            {isEdit ? "Save Changes" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const { me, users, toggleMuteUser, can } = useAppStore();
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [muteTarget, setMuteTarget] = useState<User | null>(null);

  if (!me) return null;

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search users…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {can("create_account") && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add User
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((u) => (
          <Card
            key={u.id}
            className={cn("transition-opacity", u.muted && "opacity-60")}
          >
            <CardContent className="pt-4 flex gap-3">
              <UserAvatar user={u} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{u.name}</p>
                      {u.muted && (
                        <span className="text-[10px] font-bold bg-destructive/10 text-destructive rounded-full px-2 py-0.5">
                          Muted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {u.designation} · {u.department}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    {u.responsibilities && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        <span className="font-medium text-foreground/70">
                          Resp:{" "}
                        </span>
                        {u.responsibilities}
                      </p>
                    )}
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setEditUser(u)}
                    disabled={me?.role !== "admin" && me?.role !== "o_level"}
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </Button>
                  {u.id !== me.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        "h-7 text-xs",
                        u.muted
                          ? "text-green-600 hover:text-green-600"
                          : "text-orange-600 hover:text-orange-600",
                      )}
                      onClick={() => setMuteTarget(u)}
                      disabled={me?.role !== "admin" && me?.role !== "o_level"}
                    >
                      {u.muted ? (
                        <Volume2 className="h-3 w-3" />
                      ) : (
                        <VolumeX className="h-3 w-3" />
                      )}
                      {u.muted ? "Unmute" : "Mute"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreate && (
        <UserFormDialog
          open
          initial={BLANK}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editUser && (
        <UserFormDialog
          open
          userId={editUser.id}
          initial={{
            name: editUser.name,
            email: editUser.email,
            password: editUser.password,
            role: editUser.role,
            designation: editUser.designation,
            department: editUser.department,
            responsibilities: editUser.responsibilities,
          }}
          onClose={() => setEditUser(null)}
        />
      )}

      <ConfirmDialog
        open={!!muteTarget}
        title={
          muteTarget?.muted
            ? `Unmute ${muteTarget?.name}?`
            : `Mute ${muteTarget?.name}?`
        }
        description={
          muteTarget?.muted
            ? "They will be able to log in again."
            : "Their login will be blocked. All data is preserved."
        }
        confirmLabel={muteTarget?.muted ? "Unmute" : "Mute"}
        danger={!muteTarget?.muted}
        onConfirm={async () => {
          if (muteTarget) {
            await toggleMuteUser(muteTarget.id);
            toast.success(
              `${muteTarget.name} ${muteTarget.muted ? "unmuted" : "muted"}`,
            );
            setMuteTarget(null);
          }
        }}
        onCancel={() => setMuteTarget(null)}
      />
    </div>
  );
}
