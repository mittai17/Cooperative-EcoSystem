"use client";

import { useState } from "react";
import { 
  FileText, Download, Printer, TrendingUp, Users, CheckCircle2, 
  CalendarDays, GraduationCap, Briefcase, ChevronDown, BarChart3,
  Search, Filter
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const BATCH_DATA = [
  { id: "B-2026-01", programme: "Cooperative Management", trainer: "Dr. A. Sharma", enrolled: 45, attendance: 92, pass: 98, placed: 85, status: "Completed" },
  { id: "B-2026-02", programme: "Dairy Cold Chain Ops", trainer: "Priya Patel", enrolled: 30, attendance: 88, pass: 90, placed: 75, status: "Active" },
  { id: "B-2026-03", programme: "PACS Digital Accounting", trainer: "Vikram Singh", enrolled: 60, attendance: 95, pass: 96, placed: 88, status: "Completed" },
  { id: "B-2026-04", programme: "Agri-Business Leadership", trainer: "N. Deshmukh", enrolled: 25, attendance: 84, pass: 88, placed: 80, status: "Active" },
];

export default function InstitutionReportsPage() {
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [programme, setProgramme] = useState("All Programmes");
  const [batch, setBatch] = useState("All Batches");
  const [activeTab, setActiveTab] = useState("batch-performance");

  const downloadReportCsv = () => {
    const headers = ["Batch ID", "Programme", "Trainer", "Enrolled", "Attendance %", "Pass %", "Placed %", "Status"];
    const rows = BATCH_DATA.map(b => 
      [b.id, `"${b.programme}"`, `"${b.trainer}"`, b.enrolled, b.attendance, b.pass, b.placed, b.status].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `institution_report_${academicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Institution Reports & Analytics"
        description="Comprehensive reports across training programmes, batch cohorts, attendance, assessments, and placement outcomes."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadReportCsv}>
              <Download className="mr-2 size-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <FileText className="mr-2 size-4" /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 size-4" /> Print
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-4 items-center bg-muted/30 p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
        </div>
        <Select value={academicYear} onValueChange={(val) => val && setAcademicYear(val)}>
            <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="2025-2026">2025-2026</SelectItem>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
            </SelectContent>
        </Select>

        <Select value={programme} onValueChange={(val) => val && setProgramme(val)}>
            <SelectTrigger className="w-[240px] bg-background">
                <SelectValue placeholder="Programme" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="All Programmes">All Programmes</SelectItem>
                <SelectItem value="Cooperative Management">Cooperative Management</SelectItem>
                <SelectItem value="Dairy Cold Chain Ops">Dairy Cold Chain Ops</SelectItem>
                <SelectItem value="PACS Digital Accounting">PACS Digital Accounting</SelectItem>
            </SelectContent>
        </Select>

        <Select value={batch} onValueChange={(val) => val && setBatch(val)}>
            <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Cohort Batch" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="All Batches">All Batches</SelectItem>
                <SelectItem value="Batch A-2026">Batch A-2026</SelectItem>
                <SelectItem value="Batch B-2026">Batch B-2026</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Enrolled Trainees</p>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold">1,420</h2>
                    <span className="text-xs font-medium text-green-600 flex items-center">
                        <TrendingUp className="size-3 mr-1"/> +12%
                    </span>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold">91.4%</h2>
                    <span className="text-xs font-medium text-green-600 flex items-center">
                        <TrendingUp className="size-3 mr-1"/> +2.1%
                    </span>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Average Attendance</p>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold">88.6%</h2>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Verified Certifications Issued</p>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold">1,298</h2>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Cooperative Placement Rate</p>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold">84.2%</h2>
                    <span className="text-xs font-medium text-green-600 flex items-center">
                        <TrendingUp className="size-3 mr-1"/> +5.4%
                    </span>
                </div>
            </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
            <TabsTrigger value="batch-performance" className="py-2">Batch Performance</TabsTrigger>
            <TabsTrigger value="attendance" className="py-2">Attendance & Compliance</TabsTrigger>
            <TabsTrigger value="assessments" className="py-2">Assessment Outcomes</TabsTrigger>
            <TabsTrigger value="placements" className="py-2">Placement Funnel</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
            <TabsContent value="batch-performance" className="m-0">
                <Card>
                    <CardHeader className="px-6 py-4 border-b">
                        <CardTitle className="text-lg">Batch Cohort Performance</CardTitle>
                        <CardDescription>Overview of all active and completed batches for the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Batch ID</TableHead>
                                        <TableHead>Programme Name</TableHead>
                                        <TableHead>Trainer</TableHead>
                                        <TableHead className="text-right">Enrolled</TableHead>
                                        <TableHead className="text-center">Attendance</TableHead>
                                        <TableHead className="text-center">Pass %</TableHead>
                                        <TableHead className="text-center">Placed %</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {BATCH_DATA.map((batch) => (
                                        <TableRow key={batch.id}>
                                            <TableCell className="font-medium">{batch.id}</TableCell>
                                            <TableCell>{batch.programme}</TableCell>
                                            <TableCell>{batch.trainer}</TableCell>
                                            <TableCell className="text-right">{batch.enrolled}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-sm w-8">{batch.attendance}%</span>
                                                    <Progress value={batch.attendance} className="w-16 h-2" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">{batch.pass}%</TableCell>
                                            <TableCell className="text-center text-muted-foreground">{batch.placed}%</TableCell>
                                            <TableCell>
                                                <Badge variant={batch.status === "Completed" ? "secondary" : "default"} className={batch.status === "Completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                                    {batch.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-primary">View Details</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="attendance" className="m-0">
                <Card>
                    <CardHeader className="px-6 py-4 border-b">
                        <CardTitle className="text-lg">Attendance & Biometric Compliance</CardTitle>
                        <CardDescription>Monthly breakdown of attendance modes and leave summaries.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center gap-4">
                            <BarChart3 className="size-12 opacity-20" />
                            <div>
                                <p className="font-medium text-foreground">Attendance Chart Visualization</p>
                                <p className="text-sm">Detailed charts are available in the full release using Recharts.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="assessments" className="m-0">
                <Card>
                    <CardHeader className="px-6 py-4 border-b">
                        <CardTitle className="text-lg">Assessment Outcomes & Distinction</CardTitle>
                        <CardDescription>Average scores by module and pass/fail distributions.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="border rounded-lg p-4 bg-slate-50/50">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Distinction (≥85%)</h4>
                                <p className="text-3xl font-bold text-indigo-600">34%</p>
                            </div>
                            <div className="border rounded-lg p-4 bg-slate-50/50">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Pass (50-84%)</h4>
                                <p className="text-3xl font-bold text-emerald-600">62%</p>
                            </div>
                            <div className="border rounded-lg p-4 bg-slate-50/50">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Fail/Retake ({"<"}50%)</h4>
                                <p className="text-3xl font-bold text-rose-600">4%</p>
                            </div>
                        </div>
                        <p className="text-sm text-center text-muted-foreground">Module-wise breakdown requires extended data aggregation.</p>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="placements" className="m-0">
                <Card>
                    <CardHeader className="px-6 py-4 border-b">
                        <CardTitle className="text-lg">Cooperative Placement Funnel</CardTitle>
                        <CardDescription>Tracking trainees from certification to successful placement in societies.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Certified Trainees</span>
                                    <span>1,298</span>
                                </div>
                                <div className="h-10 bg-primary/20 rounded-md relative overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 bg-primary w-full flex items-center px-4">
                                        <span className="text-primary-foreground text-xs font-bold">100%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 w-[90%] mx-auto">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Interview Shortlisted</span>
                                    <span>1,180</span>
                                </div>
                                <div className="h-10 bg-primary/20 rounded-md relative overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 bg-primary/90 w-[91%] flex items-center px-4">
                                        <span className="text-primary-foreground text-xs font-bold">91%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 w-[80%] mx-auto">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Placed in Cooperatives</span>
                                    <span>1,093</span>
                                </div>
                                <div className="h-10 bg-primary/20 rounded-md relative overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 bg-primary/80 w-[84.2%] flex items-center px-4">
                                        <span className="text-primary-foreground text-xs font-bold">84.2%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
