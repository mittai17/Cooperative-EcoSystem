"use client";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { useT } from "@/i18n";

export default function CareerAiPage() {
  const [tab, setTab] = useState("Chat");
  const [input, setInput] = useState("");
  const t = useT();
  const tabs = [
    { id: "Chat", label: t("trainee.careerAi.tabChat") },
    { id: "My Career Plan", label: t("trainee.careerAi.tabPlan") },
  ];
  
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <PageHeader 
        title={t("trainee.careerAi.title")}
        description={t("trainee.careerAi.description")}
      />

      <div className="flex items-center gap-2 border-b border-border pb-2">
        {tabs.map(({ id, label }) => (
          <Button 
            key={id} 
            variant={id === tab ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setTab(id)}
          >
            {id === "Chat" && <Sparkles className="mr-2 size-4" />}
            {label}
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
                {t("trainee.careerAi.greeting").replace("{name}", "Ravindra")}
              </div>
            </div>
            
            <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse">
              <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="size-4 text-primary-foreground" />
              </div>
              <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm text-sm">
                {t("trainee.careerAi.userGoal")}
              </div>
            </div>

            <div className="flex gap-3 max-w-[80%]">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm flex flex-col gap-2">
                <p>{t("trainee.careerAi.reply1")}</p>
                <p>{t("trainee.careerAi.reply2")}</p>
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t bg-card flex gap-2">
            <input 
              type="text" 
              placeholder={t("trainee.careerAi.inputPlaceholder")}
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
                <CardTitle>{t("trainee.careerAi.goalOverview")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("trainee.careerAi.currentRole")}</p>
                  <p className="font-medium mt-1">{t("trainee.careerAi.currentRoleValue")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("trainee.careerAi.targetRole")}</p>
                  <p className="font-medium mt-1 text-primary">{t("trainee.careerAi.targetRoleValue")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("trainee.careerAi.timeline")}</p>
                  <p className="font-medium mt-1">{t("trainee.careerAi.timelineValue")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("trainee.careerAi.roadmap")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l border-muted-foreground/30 ml-3 md:ml-4 flex flex-col gap-8 pb-4">
                  <div className="relative pl-6">
                    <div className="absolute left-[-5px] top-1.5 size-2.5 rounded-full bg-success"></div>
                    <h4 className="font-semibold text-sm">{t("trainee.careerAi.step1Title")}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{t("trainee.careerAi.step1Desc")}</p>
                    <Badge className="mt-2 bg-success/20 text-success">{t("trainee.careerAi.completed")}</Badge>
                  </div>
                  
                  <div className="relative pl-6">
                    <div className="absolute left-[-5px] top-1.5 size-2.5 rounded-full bg-primary"></div>
                    <h4 className="font-semibold text-sm">{t("trainee.careerAi.step2Title")}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{t("trainee.careerAi.step2Desc")}</p>
                    <Button variant="outline" size="sm" className="mt-2">{t("trainee.careerAi.viewCourse")}</Button>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute left-[-5px] top-1.5 size-2.5 rounded-full bg-muted-foreground"></div>
                    <h4 className="font-semibold text-sm text-muted-foreground">{t("trainee.careerAi.step3Title")}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{t("trainee.careerAi.step3Desc")}</p>
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
