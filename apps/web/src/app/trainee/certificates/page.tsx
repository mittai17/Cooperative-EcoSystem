import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { certificates } from "@/lib/mock-data/certificates";
import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";

export default function CertificatesPage() {
  const certList = Object.values(certificates);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Certificates"
        description="View and download your verified certificates."
      />

      {certList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <p className="text-base font-semibold">No certificates issued yet</p>
          <p className="text-sm mt-1">Complete your enrolled programmes and assessments to receive certified credentials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certList.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <Link href={`/trainee/certificates/${c.id}`} className="hover:underline">
                  <CardTitle className="text-lg leading-tight text-foreground">{c.programmeTitle}</CardTitle>
                </Link>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">Issued by: {c.issuer}</p>
                <div className="flex justify-between items-center text-sm">
                  <span>Issue Date:</span>
                  <span className="font-medium">{c.issueDate}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>ID:</span>
                  <span className="font-mono text-xs">{c.id}</span>
                </div>
                <div className="mt-2">
                  <Badge variant={c.status === "Valid" ? "default" : "secondary"}>
                    {c.status}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button render={<Link href={`/trainee/certificates/${c.id}`} />} variant="outline" className="flex-1 min-w-[90px]" size="sm">
                  Details
                </Button>
                <Button render={<Link href={`/verify-certificate/${c.id}?print=1`} />} variant="outline" className="flex-1 min-w-[90px]" size="sm">
                  <Download className="mr-1.5 size-3.5" /> Download
                </Button>
                <Button render={<Link href={`/verify-certificate/${c.id}`} />} variant="secondary" className="flex-1 min-w-[90px]" size="sm">
                  <ShieldCheck className="mr-1.5 size-3.5" /> Verify
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
