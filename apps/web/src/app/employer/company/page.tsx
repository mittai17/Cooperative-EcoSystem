"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Pencil, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CompanyProfileCard } from "@/components/employer/company/company-profile-card";
import { EditProfileDialog } from "@/components/employer/company/edit-profile-dialog";
import { InviteMemberDialog } from "@/components/employer/company/invite-member-dialog";
import { TeamTable } from "@/components/employer/company/team-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCompany,
  getTeam,
  type CompanyProfile,
  type TeamResponse,
} from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";

export default function CompanyPage() {
  const api = useApi();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [companyData, teamData] = await Promise.all([getCompany(api), getTeam(api)]);
      setCompany(companyData);
      setTeam(teamData);
    } catch (err) {
      setError(errorMessage(err, "Could not load the company profile. Check your connection and try again."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const isAdmin = team?.current_role === "employer_admin";
  const loading = !error && (company === null || team === null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Company Profile"
        description="Your organisation's public details and the recruiters who manage hiring for it."
      />

      {notice && (
        <Alert>
          <CheckCircle2 className="text-success" />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Company profile unavailable</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <Skeleton className="h-96 rounded-2xl xl:col-span-2" />
          <Skeleton className="h-96 rounded-2xl xl:col-span-3" />
        </div>
      )}

      {!error && company && team && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <CompanyProfileCard
              company={company}
              action={
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil />
                  Edit Profile
                </Button>
              }
            />
          </div>

          <Card className="rounded-2xl xl:col-span-3">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="font-heading text-base">Recruiter accounts</CardTitle>
                <CardDescription>People who can post jobs, review candidates and make offers.</CardDescription>
              </div>
              {isAdmin && (
                <Button size="sm" onClick={() => setInviting(true)}>
                  <UserPlus />
                  Invite member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {team.members.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
                  <Users className="size-7 text-muted-foreground" />
                  <p className="text-sm font-medium">No team members yet.</p>
                  {isAdmin && <p className="text-sm text-muted-foreground">Invite a recruiter to share the workload.</p>}
                </div>
              ) : (
                <TeamTable
                  api={api}
                  members={team.members}
                  canManage={isAdmin}
                  onChanged={(message) => {
                    setNotice(message);
                    void load();
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {editing && company && (
        <EditProfileDialog
          api={api}
          company={company}
          open={editing}
          onOpenChange={setEditing}
          onSaved={() => {
            setNotice("Company profile saved.");
            void load();
          }}
        />
      )}

      {inviting && (
        <InviteMemberDialog
          api={api}
          open={inviting}
          onOpenChange={setInviting}
          onInvited={(email) => {
            setNotice(`Invitation sent to ${email}.`);
            void load();
          }}
        />
      )}
    </div>
  );
}
