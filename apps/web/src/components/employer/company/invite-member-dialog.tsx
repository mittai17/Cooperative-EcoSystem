"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteTeamMember, TEAM_ROLES, type Api, type TeamRole } from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_ITEMS = TEAM_ROLES.map((r) => ({ label: r.label, value: r.value }));

interface InviteMemberDialogProps {
  api: Api;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: (email: string) => void;
}

export function InviteMemberDialog({ api, open, onOpenChange, onInvited }: InviteMemberDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("recruiter");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invite() {
    if (!name.trim()) {
      setError("Enter the team member's name.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid work email address.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await inviteTeamMember(api, { name: name.trim(), email: email.trim(), role });
      onOpenChange(false);
      onInvited(email.trim());
      setName("");
      setEmail("");
      setRole("recruiter");
    } catch (err) {
      setError(errorMessage(err, "The invitation could not be sent. Check the email and try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>They receive an invitation at this email address to join your employer workspace.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Name</Label>
            <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Work email</Label>
            <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select items={ROLE_ITEMS} value={role} onValueChange={(v) => v && setRole(v as TeamRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={invite} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
