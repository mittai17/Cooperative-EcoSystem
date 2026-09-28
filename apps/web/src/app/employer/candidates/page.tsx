import { Search, Filter, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { employerCandidateMatches } from "@/lib/mock-data/dashboards";
import { Input } from "@/components/ui/input";

export default function CandidatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Candidate Discovery"
        description="Find verified candidates matching your skill requirements."
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by skill, role, or ID..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {employerCandidateMatches.map((candidate) => (
          <Card key={candidate.id} className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-heading text-lg">{candidate.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{candidate.role}</p>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant={candidate.matchScore > 80 ? "default" : "secondary"}>
                    {candidate.matchScore}% Match
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 text-sm">
              <div className="mb-4">
                <p className="font-medium mb-2">Verified Skills</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-primary/5">Dairy Ops</Badge>
                  <Badge variant="outline" className="bg-primary/5">Bookkeeping</Badge>
                  <Badge variant="outline" className="bg-primary/5">Team Mgt</Badge>
                </div>
              </div>
              
              <div className="bg-muted/30 p-3 rounded-md flex gap-2 items-start">
                {candidate.verified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-xs">AI Match Explanation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Strong match for {candidate.role} due to high scores in recent practical assessments and 95% attendance in related programmes.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 border-t mt-4">
              <Button className="w-full mt-4" variant="outline">View Profile</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
