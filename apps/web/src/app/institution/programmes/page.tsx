import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
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
import { institutionProgrammeSummary } from "@/lib/mock-data/dashboards";

export default function ProgrammesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Programmes"
        description="Manage your training programmes, batches, and enrollment."
        action={<Button render={<Link href="/institution/programmes/create"><Plus className="mr-2 h-4 w-4" /> Create Programme</Link>} />}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="font-heading text-base">All Programmes</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Enrolled Trainees</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutionProgrammeSummary.map((programme) => (
                <TableRow key={programme.id}>
                  <TableCell className="font-medium text-foreground">{programme.title}</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>{programme.trainees}</TableCell>
                  <TableCell>{programme.attendance}%</TableCell>
                  <TableCell>
                    <Badge variant={programme.status === "Active" ? "secondary" : "outline"}>
                      {programme.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive">Archive</Button>
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
