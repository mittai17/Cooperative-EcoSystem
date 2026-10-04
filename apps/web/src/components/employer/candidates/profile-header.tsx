"use client";

import Link from "next/link";
import { BadgeCheck, Ellipsis, Download, Mail, MapPin, Share2, CalendarPlus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CandidateApplicationRef, CandidateProfile } from "@/lib/employer/candidates-api";
import { CandidateAvatar } from "./candidate-avatar";
import { ShortlistButton } from "./shortlist-button";

interface ProfileHeaderProps {
  profile: CandidateProfile;
  jobId?: string;
  application: CandidateApplicationRef | null;
  onDownload: () => void;
  onCopyLink: () => void;
  onShortlistError: (message: string) => void;
  onShortlisted: () => void;
}

export function ProfileHeader({
  profile,
  jobId,
  application,
  onDownload,
  onCopyLink,
  onShortlistError,
  onShortlisted,
}: ProfileHeaderProps) {
  const isVerifiedPassport = profile.skills.some((skill) => skill.verified);
  const contactHref = profile.email ? `mailto:${profile.email}` : null;
  const matchHref = `/employer/matches${jobId ? `?job=${encodeURIComponent(jobId)}` : ""}`;
  const interviewHref = application ? `/employer/interviews/new?application=${application.id}` : null;

  return (
    <header className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
      <div className="flex items-center gap-4">
        <CandidateAvatar name={profile.name} photoUrl={profile.photo_url} className="size-20 text-xl" />
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">{profile.name}</h2>
            {isVerifiedPassport && (
              <Badge className="gap-1 bg-success/10 text-success hover:bg-success/10">
                <BadgeCheck className="size-3.5" /> Verified Skill Passport
              </Badge>
            )}
          </div>
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">Target role: </span>
            {profile.occupation ?? "Not available"}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {profile.location || "Location not available"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ShortlistButton
          candidateId={profile.id}
          candidateName={profile.name}
          applicationId={application?.id ?? null}
          applicationStatus={application?.status ?? null}
          onError={onShortlistError}
          onDone={onShortlisted}
        />
        {contactHref ? (
          <a href={contactHref} className={buttonVariants({ variant: "outline" })}>
            <Mail /> Contact
          </a>
        ) : (
          <Button variant="outline" disabled title="Contact details are shared once this candidate applies to one of your postings.">
            <Mail /> Contact
          </Button>
        )}
        <Button variant="outline" onClick={onDownload}>
          <Download /> Download Profile
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon" aria-label="More actions">
                <Ellipsis />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onCopyLink}>
              <Share2 /> Copy profile link
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={matchHref} />}>
              <Sparkles /> Open in AI Matching
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {interviewHref ? (
              <DropdownMenuItem render={<Link href={interviewHref} />}>
                <CalendarPlus /> Schedule interview
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled>
                <CalendarPlus /> Schedule interview (needs an application)
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
