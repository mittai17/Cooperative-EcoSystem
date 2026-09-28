import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { employerJobPostings } from "@/lib/mock-data/dashboards";

export default function JobsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Job Postings"
        description="Manage your job listings and view applicant matches."
        action={<Button><Plus className="mr-2 h-4 w-4" /> Create Job</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">All Postings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employerJobPostings.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium text-foreground">{job.title}</TableCell>
                  <TableCell>{job.applications}</TableCell>
                  <TableCell>{Math.floor(job.applications * 0.4)}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === "Open" ? "secondary" : "outline"}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" title="View Matches">
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">Edit</Button>
                      {job.status === "Open" && (
                        <Button variant="ghost" size="sm" className="text-destructive">Close</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
