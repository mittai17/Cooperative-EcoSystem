"use client";

import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Users,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Settings,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EmployerProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employer Profile"
        description="Public organization profile, recruitment coordinators, and cooperative credentials."
        action={
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href="/employer/settings" />}>
              <Settings className="mr-2 size-4" />
              Settings
            </Button>
            <Button render={<Link href="/employer/company" />}>
              <Pencil className="mr-2 size-4" />
              Edit Company Details
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Organization Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-xl font-bold text-red-600 border border-rose-200">
              <Building2 className="size-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">Amul Dairy Cooperative Union</CardTitle>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="mr-1 size-3" /> NCCT Verified Employer
                </Badge>
              </div>
              <CardDescription className="text-sm">
                Gujarat Co-operative Milk Marketing Federation Ltd. (GCMMF)
              </CardDescription>
              <p className="mt-1 text-xs text-muted-foreground">Society Reg: COOP-GJ-1946-APEX</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">HR Recruitment Email</p>
                  <p className="text-sm font-medium">hr@amul.coopsetu.ai</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Phone className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Contact Helpline</p>
                  <p className="text-sm font-medium">+91 2692 258506</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <MapPin className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Headquarters</p>
                  <p className="text-sm font-medium">Anand, Gujarat - 388001</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Globe className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Web Portal</p>
                  <p className="text-sm font-medium">www.amul.com</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Industry Sector & Category</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Dairy & Agri-Food Processing</Badge>
                <Badge variant="secondary">Apex Cooperative Federation</Badge>
                <Badge variant="secondary">Cold-Chain Logistics</Badge>
                <Badge variant="secondary">Rural FMCG Distribution</Badge>
                <Badge variant="secondary">PACS Milk Procurement</Badge>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">About Organisation</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Amul is India&apos;s apex cooperative body uniting over 3.6 million milk producers across Gujarat. Through CoopSetu AI,
                Amul actively recruits certified trainees specializing in PACS inventory management, dairy cooperative accounting,
                cold chain logistics, and quality assurance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recruitment Overview</CardTitle>
              <CardDescription>Live stats on CoopSetu AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Active Job Openings</span>
                <span className="font-bold text-foreground">12</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Applications Received</span>
                <span className="font-bold text-foreground">184</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Trainees Hired</span>
                <span className="font-bold text-foreground">45</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verified Society</span>
                <span className="font-bold text-emerald-600">Active ✓</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" render={<Link href="/employer/jobs/new" />} className="justify-start">
                <Briefcase className="mr-2 size-4" />
                Post a New Job
              </Button>
              <Button variant="outline" render={<Link href="/employer/candidates" />} className="justify-start">
                <Users className="mr-2 size-4" />
                View Candidates
              </Button>
              <Button variant="outline" render={<Link href="/employer/company" />} className="justify-start">
                <Building2 className="mr-2 size-4" />
                Manage Team & Org
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
