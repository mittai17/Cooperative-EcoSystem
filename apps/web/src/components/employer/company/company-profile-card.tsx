"use client";

import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyProfile } from "@/lib/employer/workflow-api";

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

export function CompanyProfileCard({ company, action }: { company: CompanyProfile; action: React.ReactNode }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading text-xl font-bold text-primary-foreground"
          >
            {initialsOf(company.name)}
          </div>
          <div className="min-w-0">
            <CardTitle className="font-heading text-lg">{company.name}</CardTitle>
            <CardDescription>{company.sector || "Sector not set"}</CardDescription>
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="text-sm text-foreground/80">{company.description || "No description yet. Add one so candidates know what your organisation does."}</p>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span>{company.location || "Location not set"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="size-4 shrink-0" />
            {company.website ? (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="truncate text-primary underline-offset-4 hover:underline">
                {company.website}
              </a>
            ) : (
              <span>Website not set</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-4 shrink-0" />
            <span className="truncate">{company.contact_email || "Contact email not set"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-4 shrink-0" />
            <span>{company.contact_phone || "Contact phone not set"}</span>
          </div>
        </dl>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Departments</p>
          {company.departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No departments added.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {company.departments.map((dept) => (
                <li key={dept}>
                  <Badge variant="outline">{dept}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
