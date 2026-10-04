import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/employer/candidates-api";

interface CandidateAvatarProps {
  name: string;
  photoUrl?: string | null;
  className?: string;
}

/** Photo when the API provides one, otherwise initials. Never a placeholder image. */
export function CandidateAvatar({ name, photoUrl, className }: CandidateAvatarProps) {
  return (
    <Avatar className={cn("size-11 border border-border", className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt={`Photo of ${name}`} />}
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}

export function scoreChipClass(score: number): string {
  if (score >= 80) return "bg-success/10 text-success";
  if (score >= 65) return "bg-primary/10 text-primary";
  return "bg-warning/10 text-warning";
}
