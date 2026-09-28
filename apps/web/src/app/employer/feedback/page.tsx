import { Star } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employer Feedback"
        description="Provide feedback on hired candidates to help improve cooperative training programmes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Submit New Feedback</CardTitle>
            <CardDescription>Your feedback directly influences future curriculum.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Hired Trainee</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option>Ravindra Suresh Patil - Dairy Supervisor</option>
                <option>Sunita Devi Yadav - Accountant</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label>Skill Readiness Rating (1-5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className="p-2 hover:bg-muted rounded-full">
                    <Star className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Most Useful Skills Demonstrated</Label>
              <Input placeholder="e.g. Ledger maintenance, Tally software..." />
            </div>

            <div className="space-y-2">
              <Label>Missing or Weak Skills</Label>
              <Input placeholder="e.g. Digital payments, communication..." />
            </div>

            <div className="space-y-2">
              <Label>Overall Performance Comments</Label>
              <Textarea placeholder="How has the candidate performed in their role so far?" rows={4} />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Submit Feedback</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Past Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-b pb-4 last:border-0">
              <p className="font-medium text-sm">Vikram Solanki</p>
              <p className="text-xs text-muted-foreground">Cooperative Accountant • Sep 10, 2026</p>
              <div className="flex gap-1 mt-1">
                {[1,2,3,4].map(i => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                <Star className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
            <div className="border-b pb-4 last:border-0">
              <p className="font-medium text-sm">Priya Sharma</p>
              <p className="text-xs text-muted-foreground">MIS Analyst • Aug 22, 2026</p>
              <div className="flex gap-1 mt-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
