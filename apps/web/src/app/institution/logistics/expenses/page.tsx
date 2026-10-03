"use client";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logisticsService } from "@/lib/logistics/logistics-service";
import type { TripExpense } from "@/lib/logistics/types";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setExpenses(logisticsService.getExpenses());
    setReady(true);
    const unsub = logisticsService.subscribe(() => setExpenses(logisticsService.getExpenses()));
    return unsub;
  }, []);

  const total = expenses.reduce((s, e) => s + e.amountInr, 0);
  const approved = expenses.filter((e) => e.approvalStatus === "Approved").reduce((s, e) => s + e.amountInr, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Expenses & Reports" description="Recorded trip expenses. Full financial approval workflow arrives in Phase 3." />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Recorded", value: fmt(total), tint: "icon-tile-red" },
          { label: "Approved", value: fmt(approved), tint: "icon-tile-green" },
          { label: "Pending Approval", value: fmt(total - approved), tint: "icon-tile-amber" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className={cn("size-10 flex items-center justify-center rounded-2xl", s.tint)}>
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="font-heading text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="font-heading text-base">All Expenses</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!ready ? (
            <div className="p-4 flex flex-col gap-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Approval</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell><Badge variant="outline" className="text-xs">{e.category}</Badge></TableCell>
                      <TableCell className="font-mono text-sm font-semibold">{fmt(e.amountInr)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.vendorName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{e.receiptRef}</TableCell>
                      <TableCell className="text-sm">{e.payerName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(
                          e.approvalStatus === "Approved" ? "bg-success/10 text-success" :
                          e.approvalStatus === "Rejected" ? "bg-destructive/10 text-destructive" :
                          "bg-tint-amber-bg text-tint-amber-fg",
                        )}>{e.approvalStatus}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
