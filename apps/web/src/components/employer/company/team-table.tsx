"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TEAM_ROLES,
  updateTeamMember,
  type Api,
  type TeamMember,
  type TeamRole,
  type TeamStatus,
} from "@/lib/employer/workflow-api";
import { errorMessage, formatDate } from "@/lib/employer/workflow-format";
import { cn } from "@/lib/utils";

const ROLE_ITEMS = TEAM_ROLES.map((r) => ({ label: r.label, value: r.value }));
const ROLE_LABEL = Object.fromEntries(TEAM_ROLES.map((r) => [r.value, r.label])) as Record<TeamRole, string>;

const STATUS_TONE: Record<TeamStatus, string> = {
  active: "bg-success/10 text-success",
  invited: "bg-primary/10 text-primary",
  disabled: "bg-muted text-muted-foreground",
};

interface TeamTableProps {
  api: Api;
  members: TeamMember[];
  canManage: boolean;
  onChanged: (message: string) => void;
}

export function TeamTable({ api, members, canManage, onChanged }: TeamTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeRole(member: TeamMember, next: TeamRole) {
    if (next === member.role) return;
    setBusyId(member.id);
    setError(null);
    try {
      await updateTeamMember(api, member.id, { role: next });
      onChanged(`${member.name} is now ${ROLE_LABEL[next]}.`);
    } catch (err) {
      setError(errorMessage(err, "The role could not be changed. Try again."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell>
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      <Select
                        items={ROLE_ITEMS}
                        value={member.role}
                        onValueChange={(v) => v && changeRole(member, v as TeamRole)}
                        disabled={busyId === member.id}
                      >
                        <SelectTrigger className="h-8 w-44" aria-label={`Role for ${member.name}`}>
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
                      {busyId === member.id && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    </div>
                  ) : (
                    ROLE_LABEL[member.role]
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={cn("border-0 capitalize", STATUS_TONE[member.status])}>{member.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.last_active ? formatDate(member.last_active) : "Never"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!canManage && (
        <p className="text-xs text-muted-foreground">Only Employer Admins can invite members or change roles.</p>
      )}
    </div>
  );
}
