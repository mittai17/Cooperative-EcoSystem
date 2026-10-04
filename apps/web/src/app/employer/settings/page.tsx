"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { NotificationSettings } from "@/components/employer/settings/notification-settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings, TEAM_ROLES, type EmployerSettings } from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";

export default function EmployerSettingsPage() {
  const api = useApi();
  const [settings, setSettings] = useState<EmployerSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSettings(await getSettings(api));
    } catch (err) {
      setError(errorMessage(err, "Settings could not be loaded. Check your connection and try again."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const roleLabel = settings ? TEAM_ROLES.find((r) => r.value === settings.account.role)?.label ?? settings.account.role : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Your account details and when NURVEX should notify you." />

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Settings unavailable</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!error && settings === null && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      )}

      {!error && settings && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-heading text-base">Account</CardTitle>
              <CardDescription>Your sign-in details. Ask an Employer Admin to change your name or role.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">{settings.account.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium text-foreground">{settings.account.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Role</dt>
                  <dd className="font-medium text-foreground">{roleLabel}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-heading text-base">Notifications</CardTitle>
              <CardDescription>Changes save as soon as you switch them.</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings key={JSON.stringify(settings.notifications)} api={api} initial={settings.notifications} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
