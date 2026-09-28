import { FileText, Download, Play } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const mockReports = [
  { id: "1", title: "Trainee Progress Report", desc: "Detailed breakdown of trainee attendance and assessment scores across all active programmes.", lastGen: "2026-09-20" },
  { id: "2", title: "Employment Outcomes", desc: "Placement statistics, top hiring employers, and average salary trends.", lastGen: "2026-09-01" },
  { id: "3", title: "Skill Gap Analysis", desc: "Comparison of current market skill demand against capacity of training institutions.", lastGen: "2026-08-15" },
  { id: "4", title: "Institution Performance", desc: "Benchmarking institutions based on completion rates, attendance, and placements.", lastGen: "2026-09-25" },
  { id: "5", title: "Certificate Registry", desc: "Full ledger of all certificates issued, including revoked and expired status.", lastGen: "2026-09-27" },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports Center"
        description="Generate and download system-wide reports and analytics."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockReports.map((report) => (
          <Card key={report.id} className="flex flex-col">
            <CardHeader>
              <div className="mb-2 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="font-heading text-lg">{report.title}</CardTitle>
              <CardDescription>{report.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">Last generated: {report.lastGen}</p>
            </CardContent>
            <CardFooter className="flex gap-2 border-t pt-4">
              <Button variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button className="flex-1">
                <Play className="mr-2 h-4 w-4" /> Generate
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
