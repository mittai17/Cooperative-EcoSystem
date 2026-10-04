"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, FileText, Send, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConfirmOfferDialog } from "@/components/employer/offers/confirm-offer-dialog";
import { OfferStatusChip } from "@/components/employer/offers/offer-status-chip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listOffers, type Offer } from "@/lib/employer/workflow-api";
import { errorMessage, formatCurrency, formatDate } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";

type PendingAction = { offer: Offer; action: "send" | "withdraw" } | null;

export default function OffersPage() {
  const api = useApi();
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listOffers(api);
      setOffers(data.offers);
    } catch (err) {
      setError(errorMessage(err, "Could not load offers. Check your connection and try again."));
      setOffers(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Offers"
        description="Draft, send and track job offers to shortlisted and interviewed candidates."
        action={
          <Button render={<Link href="/employer/applications" />}>
            <FileText />
            Create offer from applications
          </Button>
        }
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
          <AlertTitle>Could not load offers</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!error && offers === null && <Skeleton className="h-72 w-full rounded-2xl" />}

      {!error && offers !== null && offers.length === 0 && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="font-medium text-foreground">No offers yet.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Open a candidate in Applications and choose Create Offer. Drafts you save appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {!error && offers !== null && offers.length > 0 && (
        <Card className="rounded-2xl p-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Offer Date</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">{offer.candidate_name}</TableCell>
                    <TableCell className="text-muted-foreground">{offer.job_title}</TableCell>
                    <TableCell>{formatDate(offer.sent_at ?? offer.created_at)}</TableCell>
                    <TableCell>{formatCurrency(offer.salary)}</TableCell>
                    <TableCell>{formatDate(offer.joining_date)}</TableCell>
                    <TableCell>
                      <OfferStatusChip status={offer.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" render={<Link href={`/employer/offers/${offer.id}`} />}>
                          <Eye />
                          View Offer
                        </Button>
                        {offer.status === "draft" && (
                          <Button size="sm" onClick={() => setPending({ offer, action: "send" })}>
                            <Send />
                            Send Offer
                          </Button>
                        )}
                        {offer.status === "sent" && (
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPending({ offer, action: "withdraw" })}>
                            <Undo2 />
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pending && (
        <ConfirmOfferDialog
          api={api}
          offer={pending.offer}
          action={pending.action}
          open
          onOpenChange={(open) => !open && setPending(null)}
          onDone={(message) => {
            setNotice(message);
            void load();
          }}
        />
      )}
    </div>
  );
}
