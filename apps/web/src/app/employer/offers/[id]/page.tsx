"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Send, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConfirmOfferDialog } from "@/components/employer/offers/confirm-offer-dialog";
import { OfferStatusChip } from "@/components/employer/offers/offer-status-chip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOffer, EMPLOYMENT_TYPES, type Offer } from "@/lib/employer/workflow-api";
import { errorMessage, formatCurrency, formatDate, formatTime } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-line text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

export default function OfferDetailPage() {
  const api = useApi();
  const params = useParams();
  const id = String(params.id);

  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [action, setAction] = useState<"send" | "withdraw" | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setOffer(await getOffer(api, id));
    } catch (err) {
      setError(errorMessage(err, "Could not load this offer."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const backLink = (
    <Button variant="outline" render={<Link href="/employer/offers" />}>
      <ArrowLeft />
      All offers
    </Button>
  );

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Offer" description="Offer details and status." action={backLink} />
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Offer not available</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const employmentLabel = EMPLOYMENT_TYPES.find((t) => t.value === offer.employment_type)?.label ?? "Not set";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Offer — ${offer.candidate_name}`}
        description={offer.job_title}
        action={
          <>
            <OfferStatusChip status={offer.status} />
            {backLink}
          </>
        }
      />

      {notice && (
        <Alert>
          <CheckCircle2 className="text-success" />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Offer terms</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Candidate">{offer.candidate_name}</Field>
              <Field label="Job">{offer.job_title}</Field>
              <Field label="Salary">{offer.salary ? `${formatCurrency(offer.salary)} per year` : "Not set"}</Field>
              <Field label="Employment type">{employmentLabel}</Field>
              <Field label="Joining date">{formatDate(offer.joining_date)}</Field>
              <Field label="Location">{offer.location || "Not set"}</Field>
              <div className="sm:col-span-2">
                <Field label="Benefits">{offer.benefits || "None listed"}</Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Additional terms">{offer.additional_terms || "None"}</Field>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ol className="flex flex-col gap-3 text-sm">
              <li>
                <span className="font-medium">Created</span>
                <span className="block text-muted-foreground">{formatDate(offer.created_at)}</span>
              </li>
              <li>
                <span className="font-medium">Sent</span>
                <span className="block text-muted-foreground">
                  {offer.sent_at ? `${formatDate(offer.sent_at)}, ${formatTime(offer.sent_at)}` : "Not sent yet"}
                </span>
              </li>
              <li>
                <span className="font-medium">Candidate response</span>
                <span className="block text-muted-foreground">
                  {offer.responded_at ? `${formatDate(offer.responded_at)}, ${formatTime(offer.responded_at)}` : "Awaiting response"}
                </span>
              </li>
            </ol>

            {offer.status === "draft" && (
              <Button onClick={() => setAction("send")}>
                <Send />
                Send Offer
              </Button>
            )}
            {offer.status === "sent" && (
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setAction("withdraw")}>
                <Undo2 />
                Withdraw Offer
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {action && (
        <ConfirmOfferDialog
          api={api}
          offer={offer}
          action={action}
          open
          onOpenChange={(open) => !open && setAction(null)}
          onDone={(message) => {
            setNotice(message);
            void load();
          }}
        />
      )}
    </div>
  );
}
