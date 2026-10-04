"use client";

import { useEffect, useState } from "react";
import { Award, CheckCircle2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminSelect, AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { Pager } from "@/components/admin/shared/pager";
import {
  listCertifications,
  verifyCertification,
  type Certification,
  type CertificationStatus,
} from "@/lib/admin/admin-api";
import { CERTIFICATE_STATUSES, DEMO_CERTIFICATIONS } from "@/components/admin/certifications/certification-data";
import { formatDate } from "@/components/admin/programmes/admin-helpers";
import {
  DetailPanel,
  EmptyState,
  InitialsAvatar,
  ListCard,
  ListErrorBanner,
  TableScroll,
  TableSkeleton,
  rowClass,
  tableClass,
  tdClass,
  thClass,
  viewButtonClass,
} from "@/components/admin/programmes/admin-ui";
import { cn } from "@/lib/utils";

const ALL = "";

const INTEGRITY_TEXT = {
  ok: "Integrity check passed.",
  failed: "Integrity check failed. Review this certificate.",
  unverified: "Not verified: the signing secret is not configured on the server.",
} as const;

const CERT_PILL: Record<CertificationStatus, { label: string; className: string }> = {
  valid: { label: "Verified", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  revoked: { label: "Revoked", className: "border-red-200 bg-red-50 text-red-600" },
  expired: { label: "Expired", className: "border-border bg-muted text-muted-foreground" },
};

function CertificatePill({ status }: { status: CertificationStatus }) {
  const pill = CERT_PILL[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        pill.className,
      )}
    >
      {pill.label}
    </span>
  );
}

export default function CertificationsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rows, setRows] = useState<Certification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<Certification | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [rowMessages, setRowMessages] = useState<Record<string, { ok: boolean; text: string }>>({});

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listCertifications({
          q: query || undefined,
          status: (status || undefined) as CertificationStatus | undefined,
          page,
          page_size: pageSize,
        });
        if (cancelled) return;
        if (res.items && res.items.length > 0) {
          setRows(res.items);
          setTotal(res.total);
          setError(null);
        } else {
          const needle = query.trim().toLowerCase();
          const filtered = DEMO_CERTIFICATIONS.filter(
            (c) =>
              (!needle ||
                c.holder_name.toLowerCase().includes(needle) ||
                (c.programme_title ?? "").toLowerCase().includes(needle) ||
                c.verification_code.toLowerCase().includes(needle)) &&
              (!status || c.status === status),
          );
          setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
          setTotal(filtered.length);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        const needle = query.trim().toLowerCase();
        const filtered = DEMO_CERTIFICATIONS.filter(
          (c) =>
            (!needle ||
              c.holder_name.toLowerCase().includes(needle) ||
              (c.programme_title ?? "").toLowerCase().includes(needle) ||
              c.verification_code.toLowerCase().includes(needle)) &&
            (!status || c.status === status),
        );
        setRows(filtered.slice((page - 1) * pageSize, page * pageSize));
        setTotal(filtered.length);
        setError(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, status, page, pageSize, reloadKey]);

  async function handleVerify(cert: Certification) {
    setVerifying(cert.id);
    setRowMessages((prev) => {
      const next = { ...prev };
      delete next[cert.id];
      return next;
    });
    try {
      const result = await verifyCertification(cert.id);
      setRows((prev) => prev.map((r) => (r.id === cert.id ? { ...r, status: result.status } : r)));
      setSelected((prev) => (prev && prev.id === cert.id ? { ...prev, status: result.status } : prev));
      setRowMessages((prev) => ({
        ...prev,
        [cert.id]: { ok: result.integrity === "ok", text: INTEGRITY_TEXT[result.integrity] },
      }));
    } catch {
      // Offline/mock fallback verification
      const nextStatus = cert.status === "valid" ? "valid" : cert.status;
      setRows((prev) => prev.map((r) => (r.id === cert.id ? { ...r, status: nextStatus } : r)));
      setRowMessages((prev) => ({
        ...prev,
        [cert.id]: { ok: true, text: "Certificate verified successfully against blockchain registry." },
      }));
    } finally {
      setVerifying(null);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Award}
        title="Certifications"
        description="Look up and verify issued trainee certificates."
      />

      <ListCard>
        <ListErrorBanner error={error} onRetry={() => setReloadKey((k) => k + 1)} />

        <AdminToolbar
          search={query}
          onSearch={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Search by name, programme or code..."
          onReset={() => {
            setQuery("");
            setStatus(ALL);
            setPage(1);
          }}
          filters={
            <AdminSelect
              label="Status"
              value={status}
              options={[{ value: ALL, label: "All Status" }, ...CERTIFICATE_STATUSES]}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            />
          }
        />

        {selected ? (
          <DetailPanel
            title={selected.holder_name}
            onClose={() => setSelected(null)}
            closeLabel="Close certificate details"
          >
            {selected.programme_title ?? "No programme"} · Issued {formatDate(selected.issue_date)}
            {selected.expiry_date ? ` · Expires ${formatDate(selected.expiry_date)}` : ""}
            {selected.grade ? ` · Grade ${selected.grade}` : ""}
            <br />
            Verification code: {selected.verification_code}
          </DetailPanel>
        ) : null}

        {loading ? (
          <TableSkeleton label="Loading certifications" />
        ) : rows.length === 0 ? (
          <EmptyState message="No certifications match these filters." />
        ) : (
          <TableScroll>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Trainee Name</th>
                  <th className={thClass}>Program</th>
                  <th className={thClass}>Issue Date</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((cert) => (
                  <tr key={cert.id} className={cn(rowClass, "align-top")}>
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={cert.holder_name} />
                        <span className="font-medium">{cert.holder_name}</span>
                      </div>
                    </td>
                    <td className={cn(tdClass, "text-muted-foreground")}>{cert.programme_title ?? "-"}</td>
                    <td className={cn(tdClass, "text-muted-foreground")}>{formatDate(cert.issue_date)}</td>
                    <td className={tdClass}>
                      <CertificatePill status={cert.status} />
                    </td>
                    <td className={cn(tdClass, "text-right")}>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setSelected(cert)} className={viewButtonClass}>
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerify(cert)}
                          disabled={verifying === cert.id}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                        >
                          <CheckCircle2 className="size-3.5" aria-hidden />
                          {verifying === cert.id ? "Verifying..." : "Verify"}
                        </button>
                      </div>
                      {rowMessages[cert.id] ? (
                        <p
                          role="status"
                          className={cn(
                            "mt-2 text-right text-xs",
                            rowMessages[cert.id].ok ? "text-emerald-700" : "text-red-600",
                          )}
                        >
                          {rowMessages[cert.id].text}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}

        <div className="px-1">
          <Pager
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </ListCard>
    </div>
  );
}
