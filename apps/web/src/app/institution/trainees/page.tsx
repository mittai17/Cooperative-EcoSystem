import { Download, Search, Filter } from "lucide-react";
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

const mockTrainees = [
  { id: "1", name: "Anjali Rathore", programme: "Cooperative Management Fundamentals", batch: "Batch A", attendance: 95, score: 88, status: "Active" },
  { id: "2", name: "Vikram Solanki", programme: "Cooperative Bookkeeping", batch: "Batch B", attendance: 82, score: 75, status: "Active" },
  { id: "3", name: "Farida Khatoon", programme: "Dairy Cooperative Operations", batch: "Batch A", attendance: 98, score: 92, status: "Completed" },
];

export default function TraineesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trainee Roster"
        description="View and manage all trainees across your institution's programmes."
        action={<Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Report</Button>}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="font-heading text-base">Trainees</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
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
                <TableHead>Trainee Name</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Assessment Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTrainees.map((trainee) => (
                <TableRow key={trainee.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground">{trainee.name}</TableCell>
                  <TableCell>{trainee.programme}</TableCell>
                  <TableCell>{trainee.batch}</TableCell>
                  <TableCell>{trainee.attendance}%</TableCell>
                  <TableCell>{trainee.score}%</TableCell>
                  <TableCell>
                    <Badge variant={trainee.status === "Active" ? "secondary" : "outline"}>
                      {trainee.status}
                    </Badge>
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
