import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, FileText } from "lucide-react";

export default function ApplicationsPage() {
  const applications = [
    { id: 1, title: "Dairy Procurement Supervisor", employer: "Amul Dairy Cooperative Union", date: "2026-09-15", status: "Interview" },
    { id: 2, title: "Cooperative Society Accountant", employer: "Vaikunth Cooperative Credit Society", date: "2026-09-10", status: "Shortlisted" },
    { id: 3, title: "Junior Loan Officer", employer: "Navbharat Credit Coop", date: "2026-09-01", status: "Applied" },
    { id: 4, title: "Data Analyst", employer: "National Cooperative Dev Corp", date: "2026-08-20", status: "Rejected" },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Interview": return <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Interviewing</Badge>;
      case "Shortlisted": return <Badge className="bg-success/20 text-success hover:bg-success/30">Shortlisted</Badge>;
      case "Applied": return <Badge variant="secondary">Applied</Badge>;
      case "Rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Job Applications"
        description="Track your applications and upcoming interviews."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-sm text-muted-foreground">Total Applied</span>
            <span className="text-3xl font-bold mt-1">12</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-sm text-muted-foreground">Shortlisted</span>
            <span className="text-3xl font-bold mt-1">3</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-sm text-muted-foreground">Interviews</span>
            <span className="text-3xl font-bold mt-1">1</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-sm text-muted-foreground">Offers</span>
            <span className="text-3xl font-bold mt-1">0</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Job Details</th>
                  <th className="px-4 py-3">Applied Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{app.title}</span>
                        <span className="text-xs text-muted-foreground flex items-center mt-1">
                          <Building2 className="size-3 mr-1" /> {app.employer}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="size-3 mr-1" /> {app.date}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="outline" size="sm">
                        <FileText className="size-4 mr-2" /> View Job
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
