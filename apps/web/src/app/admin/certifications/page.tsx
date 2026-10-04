"use client";

import { useEffect, useState } from "react";
import { Award, CheckCircle2, Eye, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { Pager } from "@/components/admin/shared/pager";
import {
  listCertifications,
  verifyCertification,
  type Certification,
  type CertificationStatus,
} from "@/lib/admin/admin-api";
import { CERTIFICATE_STATUSES, DEMO_CERTIFICATIONS } from "@/components/admin/certifications/certification-data";
import { formatDate } from "@/components/admin/programmes/admin-helpers";

const ALL = "";
const selectClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary";

const STATE_TONE: Record<CertificationStatus, string> = {
  valid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  revoked: "bg-red-50 text-red-600 border-red-200",
  expired: "bg-muted text-muted-foreground border-border",
};

const INTEGRITY_TEXT = {
  ok: "Integrity check passed.",
  failed: "Integrity check failed. Review this certificate.",
  unverified: "Not verified: the signing secret is not configured on the server.",
} as const;

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
        setRows(res.items);
        setTotal(res.total);
        setError(null);
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
        setError(err instanceof Error ? err.message : "Failed to load certifications");
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
    } catch (err) {
      setRowMessages((prev) => ({
        ...prev,
        [cert.id]: { ok: false, text: err instanceof Error ? err.message : "Verification failed" },
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

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {error && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
            <DemoBanner />
            <span className="text-xs text-slate-500">Live data unavailable: {error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        )}

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
            <select
              aria-label="Status"
              className={selectClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value={ALL}>All Status</option>
              {CERTIFICATE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          }
        />

        {selected && (
          <div className="mx-5 mb-2 flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-base font-semibold text-slate-900">{selected.holder_name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {selected.programme_title ?? "No programme"} · Issued {formatDate(selected.issue_date)}
                {selected.expiry_date ? ` · Expires ${formatDate(selected.expiry_date)}` : ""}
                {selected.grade ? ` · Grade ${selected.grade}` : ""}
              </p>
              <p className="mt-1 text-sm text-slate-600">Verification code: {selected.verification_code}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
              aria-label="Close certificate details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="overflow-x-auto px-5 pb-2">
          {loading ? (
            <div className="space-y-3 py-3" aria-busy="true" aria-label="Loading certifications">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="my-4 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              No certifications match these filters.
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">Trainee Name</th>
                  <th className="px-3 py-3 font-semibold">Program</th>
                  <th className="px-3 py-3 font-semibold">Issue Date</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((cert) => (
                  <tr key={cert.id} className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{cert.holder_name}</td>
                    <td className="px-3 py-3 text-slate-600">{cert.programme_title ?? "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{formatDate(cert.issue_date)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATE_TONE[cert.status]}`}
                      >
                        {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelected(cert)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerify(cert)}
                          disabled={verifying === cert.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {verifying === cert.id ? "Verifying..." : "Verify"}
                        </button>
                      </div>
                      {rowMessages[cert.id] && (
                        <p
                          role="status"
                          className={`mt-2 text-right text-xs ${rowMessages[cert.id].ok ? "text-emerald-700" : "text-red-600"}`}
                        >
                          {rowMessages[cert.id].text}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-5">
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
      </div>
    </div>
  );
}
