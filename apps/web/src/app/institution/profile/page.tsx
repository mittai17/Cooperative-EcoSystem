"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Award,
  Users,
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  Pencil,
  ShieldCheck,
  GraduationCap,
  Calendar,
  BedDouble,
  Monitor,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface InstitutionProfileData {
  name: string;
  code: string;
  established: string;
  category: string;
  affiliation: string;
  website: string;
  about: string;
  directorName: string;
  directorEmail: string;
  directorPhone: string;
  registrarName: string;
  registrarEmail: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  ncctRef: string;
  isoStandard: string;
  aisheCode: string;
}

const DEFAULT_PROFILE: InstitutionProfileData = {
  name: "Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM)",
  code: "INST-VAM-PUN-01",
  established: "1967",
  category: "Apex National Cooperative Training Institute",
  affiliation: "National Council for Cooperative Training (NCCT) / Ministry of Cooperation, Govt. of India",
  website: "https://vamnicom.gov.in",
  about: "VAMNICOM is a premier national institute catering to management education, training, research, and consultancy for cooperative enterprises and agricultural banking institutions across India and SAARC nations.",
  directorName: "Dr. Hema Yadav",
  directorEmail: "director@vamnicom.gov.in",
  directorPhone: "+91 20 25701100",
  registrarName: "Sh. Rajeev Ranjan",
  registrarEmail: "registrar@vamnicom.gov.in",
  addressLine: "University Road, Ganeshkhind",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411007",
  phone: "+91 20 25701000",
  email: "info@vamnicom.gov.in",
  ncctRef: "NCCT/APEX/2024/091",
  isoStandard: "ISO 9001:2015 Certified",
  aisheCode: "C-44129",
};

export default function InstitutionProfilePage() {
  const [profile, setProfile] = useState<InstitutionProfileData>(DEFAULT_PROFILE);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<InstitutionProfileData>(DEFAULT_PROFILE);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("coopsetu_institution_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile({ ...DEFAULT_PROFILE, ...parsed });
      }
    } catch {}
  }, []);

  const openEditDialog = () => {
    setEditForm({ ...profile });
    setEditOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editForm);
    try {
      localStorage.setItem("coopsetu_institution_profile", JSON.stringify(editForm));
    } catch {}
    setEditOpen(false);
    setSavedNotice("Institution profile updated successfully.");
    setTimeout(() => setSavedNotice(null), 3500);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Institution Profile"
        description="Official institutional credentials, accredited status, campus infrastructure, and administrative contacts."
        action={
          <Button onClick={openEditDialog} className="gap-2">
            <Pencil className="size-4" /> Edit Profile
          </Button>
        }
      />

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0" />
          {savedNotice}
        </div>
      )}

      {/* Hero Card */}
      <Card className="border-border bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-heading text-2xl font-bold shadow-sm">
                V
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground">
                    {profile.name}
                  </h2>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    <ShieldCheck className="size-3 mr-1" /> Grade A++
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{profile.category}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Building2 className="size-3.5 text-primary" /> {profile.code}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" /> {profile.city}, {profile.state}
                  </span>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="size-3.5" /> {profile.website.replace("https://", "")}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Award}
          label="Accreditation"
          value="Grade A++"
          trend="NCCT / Ministry of Coop"
        />
        <StatCard
          icon={Users}
          label="Annual Capacity"
          value="1,200 Seats"
          trend="18 Cohorts / Year"
        />
        <StatCard
          icon={BedDouble}
          label="Hostel Facilities"
          value="180 Beds"
          trend="3 Residential Blocks"
        />
        <StatCard
          icon={Monitor}
          label="ICT Infrastructure"
          value="4 Labs"
          trend="160 Terminals & ERP"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="contact">Campus & Contact</TabsTrigger>
          <TabsTrigger value="statutory">Accreditation & Legal</TabsTrigger>
        </TabsList>

        {/* General Info */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">About the Institution</CardTitle>
              <CardDescription>Mandate, governance framework, and institutional history.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="leading-relaxed text-foreground/90">{profile.about}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Affiliated Governing Body</span>
                  <span className="font-semibold text-foreground">{profile.affiliation}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Year Established</span>
                  <span className="font-semibold text-foreground">{profile.established} (59+ years of service)</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Institutional Classification</span>
                  <span className="font-semibold text-foreground">{profile.category}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Portal Registered Code</span>
                  <span className="font-semibold font-mono text-primary">{profile.code}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leadership */}
        <TabsContent value="leadership" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    HY
                  </div>
                  <div>
                    <CardTitle className="text-base">{profile.directorName}</CardTitle>
                    <CardDescription>Director, VAMNICOM</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 text-primary" />
                  <span className="text-foreground">{profile.directorEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 text-primary" />
                  <span className="text-foreground">{profile.directorPhone}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    RR
                  </div>
                  <div>
                    <CardTitle className="text-base">{profile.registrarName}</CardTitle>
                    <CardDescription>Registrar & Administrative Head</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 text-primary" />
                  <span className="text-foreground">{profile.registrarEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 text-primary" />
                  <span className="text-foreground">+91 20 25701102</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Campus Location & Communication</CardTitle>
              <CardDescription>Primary communication channels for trainees and nominating societies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Campus Address</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {profile.addressLine}, {profile.city}, {profile.state} - {profile.pincode}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Main Exchange Telephone</span>
                  <p className="font-semibold text-foreground mt-0.5">{profile.phone}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">General Inquiries Email</span>
                  <p className="font-semibold text-foreground mt-0.5">{profile.email}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Nearest Transit Point</span>
                  <p className="font-semibold text-foreground mt-0.5">Pune Railway Station (6.5 km) / Airport (14 km)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statutory */}
        <TabsContent value="statutory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Accreditation & Statutory Identifiers</CardTitle>
              <CardDescription>Regulatory approvals and quality compliance certifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <span className="text-xs text-muted-foreground block">NCCT Accreditation Ref</span>
                  <span className="font-bold text-foreground font-mono mt-1 block">{profile.ncctRef}</span>
                  <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-[10px]">Valid thru 2029</Badge>
                </div>

                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <span className="text-xs text-muted-foreground block">Quality Management Standard</span>
                  <span className="font-bold text-foreground font-mono mt-1 block">{profile.isoStandard}</span>
                  <Badge className="mt-2 bg-blue-100 text-blue-800 text-[10px]">Certified Body</Badge>
                </div>

                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <span className="text-xs text-muted-foreground block">Ministry AISHE Code</span>
                  <span className="font-bold text-foreground font-mono mt-1 block">{profile.aisheCode}</span>
                  <Badge className="mt-2 bg-purple-100 text-purple-800 text-[10px]">Higher Education Portal</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Institution Profile</DialogTitle>
            <DialogDescription>
              Update institutional contact coordinates, leadership contacts, and address.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Institution Official Name</Label>
              <Input
                className="mt-1"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Institution Code</Label>
                <Input
                  className="mt-1 font-mono text-xs"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Website URL</Label>
                <Input
                  className="mt-1"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">About / Mission Statement</Label>
              <Textarea
                className="mt-1 text-xs"
                rows={3}
                value={editForm.about}
                onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Director Name</Label>
                <Input
                  className="mt-1"
                  value={editForm.directorName}
                  onChange={(e) => setEditForm({ ...editForm, directorName: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Director Email</Label>
                <Input
                  className="mt-1"
                  type="email"
                  value={editForm.directorEmail}
                  onChange={(e) => setEditForm({ ...editForm, directorEmail: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Director Phone</Label>
                <Input
                  className="mt-1"
                  value={editForm.directorPhone}
                  onChange={(e) => setEditForm({ ...editForm, directorPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Address Line</Label>
                <Input
                  className="mt-1"
                  value={editForm.addressLine}
                  onChange={(e) => setEditForm({ ...editForm, addressLine: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Input
                  className="mt-1"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Pincode</Label>
                <Input
                  className="mt-1"
                  value={editForm.pincode}
                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
