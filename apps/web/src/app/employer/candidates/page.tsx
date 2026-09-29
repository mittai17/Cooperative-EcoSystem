"use client";

import { useEffect, useState } from "react";
import { AlertCircle, MapPin, Search, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ApiError, useApi } from "@/lib/use-api";

interface Candidate {
  id: string;
  name: string;
  location: string;
  occupation: string | null;
  match_score: number | null;
}

interface CandidateDetail {
  id: string;
  name: string;
  bio: string | null;
  location: string;
  occupation: string | null;
  education_level: string | null;
  years_of_experience: number | null;
  skills: { name: string; level: string; confidence: number; verified: boolean }[];
  certificates: { id: string; programme_title: string; verification_code: string; verification_state: string }[];
}

export default function CandidatesPage() {
  const api = useApi();
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function search() {
    setCandidates(null);
    setError(null);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (skill.trim()) params.set("skill", skill.trim());
    if (verifiedOnly) params.set("verified_only", "true");
    params.set("limit", "24");
    try {
      const data = await api.get<{ candidates: Candidate[] }>(`/api/v1/employer/candidates?${params.toString()}`);
      setCandidates(data.candidates);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not reach the CoopSetu API");
      setCandidates([]);
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => void search(), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function viewProfile(id: string) {
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const data = await api.get<CandidateDetail>(`/api/v1/employer/candidates/${id}`);
      setDetail(data);
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.detail : "Could not load this candidate.");
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Candidate Discovery"
        description="Search verified trainees who have opted their Skill Passport in to employer visibility."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
          </div>
          <div className="flex-1 min-w-40 space-y-1.5">
            <Label htmlFor="cand-skill">Skill</Label>
            <Input
              id="cand-skill"
              placeholder="e.g. Bookkeeping"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="verified-only" checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(Boolean(v))} />
            <Label htmlFor="verified-only" className="text-sm text-muted-foreground">Verified skills only</Label>
          </div>
          <Button onClick={search}>Search</Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Search failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {candidates === null ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No candidates match these filters</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Try a broader skill or clear the verified-only filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-heading text-lg">{candidate.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{candidate.occupation ?? "Occupation not set"}</p>
                  </div>
                  {candidate.match_score !== null && (
                    <Badge variant={candidate.match_score > 80 ? "default" : "secondary"}>{candidate.match_score}% Match</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 text-sm">
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {candidate.location || "Location not set"}
                </p>
                {detail?.id === candidate.id && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {detail.skills.slice(0, 6).map((skillItem) => (
                        <Badge key={skillItem.name} variant="outline" className="bg-primary/5">
                          {skillItem.name}
                          {skillItem.verified && <ShieldCheck className="ml-1 size-3 text-success" />}
                        </Badge>
                      ))}
                      {detail.skills.length === 0 && (
                        <p className="text-xs text-muted-foreground">No skills recorded yet.</p>
                      )}
                    </div>
                    {detail.certificates.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {detail.certificates.length} certificate{detail.certificates.length === 1 ? "" : "s"} on record.
                      </p>
                    )}
                  </div>
                )}
                {detailLoading && detail === null && <Skeleton className="mt-3 h-16 w-full" />}
                {detailError && candidates.some((c) => c.id === candidate.id) && detail === null && !detailLoading && (
                  <p className="mt-2 text-xs text-destructive">{detailError}</p>
                )}
              </CardContent>
              <CardFooter className="mt-4 border-t pt-0">
                <Button className="mt-4 w-full" variant="outline" onClick={() => viewProfile(candidate.id)}>
                  {detail?.id === candidate.id ? "Refresh profile" : "View Profile"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
