import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { certificates } from "@/lib/mock-data/certificates";
import { Download, ShieldCheck } from "lucide-react";

export default function CertificatesPage() {
  const certList = Object.values(certificates);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Certificates"
        description="View and download your verified certificates."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certList.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="text-lg leading-tight">{c.programmeTitle}</CardTitle>
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
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1" size="sm">
                <Download className="mr-2 size-4" /> Download
              </Button>
              <Button variant="secondary" className="flex-1" size="sm">
                <ShieldCheck className="mr-2 size-4" /> Verify
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
