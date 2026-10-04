import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Lightbulb, Users, LineChart, Info } from "lucide-react";

export default function EntrepreneurshipPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Entrepreneurship Pathway"
        description="Explore paths to start your own cooperative or agribusiness."
      />

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 text-sm text-primary-foreground/80">
        <Info className="size-5 text-primary shrink-0" />
        <p className="text-primary font-medium">
          Note: This is a training and mentorship pathway to help you build skills. It does not guarantee government funding or immediate registration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h3 className="font-heading font-semibold text-lg">Business Idea Discovery</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">Dairy Processing Cooperative</CardTitle>
                  <Lightbulb className="size-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Start a local value-added dairy cooperative focusing on cheese and yogurt production.</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Capital: High</Badge>
                  <Badge variant="outline">Demand: High</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button render={<Link href="/trainee/programmes" />} className="w-full" variant="secondary">Explore Model</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">Agri-Input Supply Society</CardTitle>
                  <LineChart className="size-5 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Form a society to procure seeds and fertilizers in bulk for local farmers.</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Capital: Medium</Badge>
                  <Badge variant="outline">Demand: Very High</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button render={<Link href="/trainee/programmes" />} className="w-full" variant="secondary">Explore Model</Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Required Business Skills Gap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Business Planning & Strategy</span>
                  <Badge variant="destructive">Missing</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cooperative Registration & Law</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">Foundational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Financial Modeling</span>
                  <Badge variant="destructive">Missing</Badge>
                </div>
                <Button render={<Link href="/trainee/my-learning" />} className="w-fit mt-2" size="sm">View Learning Path</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" /> Mentor Discovery
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">VK</div>
                <div>
                  <p className="text-sm font-medium">Vijay Kumar</p>
                  <p className="text-xs text-muted-foreground">Founder, Surat Agri-Coop</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">SM</div>
                <div>
                  <p className="text-sm font-medium">Sunita Menon</p>
                  <p className="text-xs text-muted-foreground">NCCT Startup Advisor</p>
                </div>
              </div>
              <Button render={<Link href="/trainee/career-ai" />} variant="outline" className="w-full mt-2">Request Mentorship</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
