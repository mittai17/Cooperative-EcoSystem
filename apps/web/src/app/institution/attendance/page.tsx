import { Download, QrCode } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
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

const mockSessions = [
  { id: "s1", date: "2026-09-29", time: "10:00 AM", programme: "Cooperative Management", topic: "Intro to Bylaws", attendance: 92 },
  { id: "s2", date: "2026-09-29", time: "02:00 PM", programme: "Bookkeeping", topic: "Ledger Entries", attendance: 88 },
  { id: "s3", date: "2026-09-30", time: "10:00 AM", programme: "Dairy Operations", topic: "Procurement Lifecycle", attendance: 0 },
];

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance Management"
        description="Track trainee attendance across all active sessions."
        action={
          <div className="flex gap-2">
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download Report</Button>
            <Button><QrCode className="mr-2 h-4 w-4" /> Generate QR</Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Recent & Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.date}</TableCell>
                  <TableCell>{session.time}</TableCell>
                  <TableCell className="font-medium text-foreground">{session.programme}</TableCell>
                  <TableCell>{session.topic}</TableCell>
                  <TableCell>{session.attendance > 0 ? `${session.attendance}%` : 'Pending'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
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
