import { Plus, Search, Filter } from "lucide-react";
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
import { adminInstitutionsSummary } from "@/lib/mock-data/dashboards";

export default function InstitutionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Institutions"
        description="Manage all registered cooperative training institutions."
        action={<Button><Plus className="mr-2 h-4 w-4" /> Add Institution</Button>}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="font-heading text-base">Registered Institutions</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              State Filter
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
                <TableHead>State</TableHead>
                <TableHead>Active Programmes</TableHead>
                <TableHead>Trainees</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminInstitutionsSummary.map((inst) => (
                <TableRow key={inst.id}>
                  <TableCell className="font-medium text-foreground">{inst.name}</TableCell>
                  <TableCell>{inst.state}</TableCell>
                  <TableCell>{inst.programmes}</TableCell>
                  <TableCell>{inst.trainees.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Manage</Button>
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
