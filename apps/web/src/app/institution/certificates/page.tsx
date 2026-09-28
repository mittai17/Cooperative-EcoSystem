import { Award, CheckCircle } from "lucide-react";
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

const mockCertificates = [
  { id: "1", trainee: "Anjali Rathore", course: "Cooperative Management", score: 88, attendance: 95, status: "Eligible" },
  { id: "2", trainee: "Farida Khatoon", course: "Dairy Operations", score: 92, attendance: 98, status: "Issued" },
  { id: "3", trainee: "Ramesh Singh", course: "Bookkeeping", score: 65, attendance: 70, status: "Pending" },
];

export default function CertificatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Certificates"
        description="Issue and manage course completion certificates for your trainees."
        action={<Button><Award className="mr-2 h-4 w-4" /> Bulk Issue Eligible</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Trainee Certification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainee</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCertificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium text-foreground">{cert.trainee}</TableCell>
                  <TableCell>{cert.course}</TableCell>
                  <TableCell>{cert.score}%</TableCell>
                  <TableCell>{cert.attendance}%</TableCell>
                  <TableCell>
                    <Badge variant={
                      cert.status === "Issued" ? "secondary" : 
                      cert.status === "Eligible" ? "default" : "outline"
                    }>
                      {cert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {cert.status === "Eligible" ? (
                      <Button size="sm"><CheckCircle className="mr-2 h-4 w-4" /> Issue</Button>
                    ) : (
                      <Button variant="ghost" size="sm">View</Button>
                    )}
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
