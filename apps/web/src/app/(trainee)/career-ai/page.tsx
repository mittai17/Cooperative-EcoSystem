"use client";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Sparkles, Send, Bot, User } from "lucide-react";

export default function CareerAiPage() {
  const [tab, setTab] = useState("Chat");
  const [input, setInput] = useState("");
  
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <PageHeader 
        title="AI Career Navigator"
        description="Plan your cooperative career with AI-driven insights."
      />

      <div className="flex items-center gap-2 border-b border-border pb-2">
        {["Chat", "My Career Plan"].map((t) => (
          <Button 
            key={t} 
            variant={t === tab ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setTab(t)}
          >
            {t === "Chat" && <Sparkles className="mr-2 size-4" />}
            {t}
          </Button>
        ))}
      </div>

      {tab === "Chat" && (
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="flex gap-3 max-w-[80%]">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm">
                Hello Ravindra! Based on your recent certification in Dairy Operations, I recommend exploring roles in Dairy Procurement. What kind of cooperative role are you aiming for in the next 2 years?
              </div>
            </div>
            
            <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse">
              <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="size-4 text-primary-foreground" />
              </div>
              <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm text-sm">
                I want to become a Dairy Cooperative Manager in Gujarat.
              </div>
            </div>

            <div className="flex gap-3 max-w-[80%]">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm flex flex-col gap-2">
                <p>Great goal! To become a Dairy Cooperative Manager in Gujarat (e.g., at Amul or local unions), you need strong financial and supply chain skills to complement your dairy operations knowledge.</p>
                <p>I have updated your &ldquo;My Career Plan&rdquo; tab with a 12-month roadmap. Would you like me to suggest some immediate courses?</p>
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t bg-card flex gap-2">
            <input 
              type="text" 
              placeholder="Ask about career paths, skills, or job markets..."
              className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button size="icon"><Send className="size-4" /></Button>
          </div>
        </Card>
      )}

      {tab === "My Career Plan" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Goal Overview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Role</p>
                  <p className="font-medium mt-1">Dairy Supervisor Trainee</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Target Role</p>
                  <p className="font-medium mt-1 text-primary">Dairy Cooperative Manager</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Estimated Timeline</p>
                  <p className="font-medium mt-1">12-18 Months</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l border-muted-foreground/30 ml-3 md:ml-4 flex flex-col gap-8 pb-4">
                  <div className="relative pl-6">
                    <div className="absolute left-[-5px] top-1.5 size-2.5 rounded-full bg-success"></div>
                    <h4 className="font-semibold text-sm">Step 1: Core Certifications</h4>
                    <p className="text-xs text-muted-foreground mt-1">Complete Dairy Operations fundamentals.</p>
                    <Badge className="mt-2 bg-success/20 text-success">Completed</Badge>
                  </div>
                  
                  <div className="relative pl-6">
                    <div className="absolute left-[-5px] top-1.5 size-2.5 rounded-full bg-primary"></div>
                    <h4 className="font-semibold text-sm">Step 2: Bridge Financial Skill Gap</h4>
                    <p className="text-xs text-muted-foreground mt-1">Enrol in &ldquo;Advanced Cooperative Financials&rdquo; to handle society accounts.</p>
                    <Button variant="outline" size="sm" className="mt-2">View Course</Button>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute left-[-5px] top-1.5 size-2.5 rounded-full bg-muted-foreground"></div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Step 3: Leadership Experience</h4>
                    <p className="text-xs text-muted-foreground mt-1">Complete a 2-month internship managing a micro-society.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
