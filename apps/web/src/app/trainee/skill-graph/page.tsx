"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Target, Briefcase, BookOpen, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { skillPassport } from "@/lib/mock-data/skills";
import { useT } from "@/i18n";

// Node definitions
type NodeType = "Skill" | "Course" | "Job" | "Certification";

interface Node {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
}

interface Edge {
  source: string;
  target: string;
}

const nodes: Node[] = [
  // Skills
  { id: "s1", label: "Cooperative Management", type: "Skill", x: 250, y: 150 },
  { id: "s2", label: "Data Analysis", type: "Skill", x: 150, y: 300 },
  { id: "s3", label: "Communication", type: "Skill", x: 350, y: 250 },
  { id: "s4", label: "Rural Development", type: "Skill", x: 550, y: 150 },
  { id: "s5", label: "Bookkeeping", type: "Skill", x: 450, y: 350 },
  { id: "s6", label: "Dairy Operations", type: "Skill", x: 140, y: 175 },
  { id: "s7", label: "Quality Testing", type: "Skill", x: 60, y: 95 },
  { id: "s8", label: "Statutory Compliance", type: "Skill", x: 660, y: 250 },
  { id: "s9", label: "Credit Appraisal", type: "Skill", x: 550, y: 430 },

  // Courses
  { id: "c1", label: "Leadership for Board Members", type: "Course", x: 100, y: 100 },
  { id: "c2", label: "Data Analytics for Coops", type: "Course", x: 50, y: 250 },
  { id: "c3", label: "Rural Entrepreneurship", type: "Course", x: 700, y: 100 },
  { id: "c4", label: "Cooperative Bookkeeping", type: "Course", x: 600, y: 400 },
  { id: "c5", label: "Dairy Cooperative Operations", type: "Course", x: 250, y: 40 },
  { id: "c6", label: "Agri Credit Appraisal & Risk", type: "Course", x: 690, y: 470 },
  { id: "c7", label: "Data Analysis for Decisions", type: "Course", x: 60, y: 400 },
  { id: "c8", label: "Governance & Ethics for Boards", type: "Course", x: 430, y: 60 },

  // Jobs
  { id: "j1", label: "Coop Development Officer", type: "Job", x: 300, y: 50 },
  { id: "j2", label: "MIS & Data Analyst", type: "Job", x: 250, y: 450 },
  { id: "j3", label: "Rural Dev Officer", type: "Job", x: 500, y: 50 },
  { id: "j4", label: "Society Accountant", type: "Job", x: 350, y: 450 },
  { id: "j5", label: "Dairy Procurement Supervisor", type: "Job", x: 120, y: 300 },
  { id: "j6", label: "Agricultural Credit Officer", type: "Job", x: 640, y: 340 },
  { id: "j7", label: "PACS Accounts Assistant", type: "Job", x: 460, y: 250 },
  { id: "j8", label: "Cold Chain Logistics Lead", type: "Job", x: 60, y: 210 },

  // Certifications
  { id: "cert1", label: "Cert in Coop Management", type: "Certification", x: 100, y: 200 },
  { id: "cert2", label: "Cert in Dairy Operations", type: "Certification", x: 180, y: 60 },
  { id: "cert3", label: "Cert in Bookkeeping & Tally", type: "Certification", x: 330, y: 350 },
  { id: "cert4", label: "Cert in Quality Testing", type: "Certification", x: 30, y: 150 },
];

const edges: Edge[] = [
  { source: "s1", target: "c1" },
  { source: "s1", target: "j1" },
  { source: "s1", target: "cert1" },
  { source: "s2", target: "c2" },
  { source: "s2", target: "j2" },
  { source: "s3", target: "j1" },
  { source: "s3", target: "j3" },
  { source: "s3", target: "j4" },
  { source: "s4", target: "c3" },
  { source: "s4", target: "j3" },
  { source: "s5", target: "c4" },
  { source: "s5", target: "j4" },
  { source: "s1", target: "s3" },
  { source: "s6", target: "c5" },
  { source: "s6", target: "j5" },
  { source: "s6", target: "cert2" },
  { source: "s7", target: "cert4" },
  { source: "s7", target: "c5" },
  { source: "s7", target: "j5" },
  { source: "s6", target: "s7" },
  { source: "s8", target: "c8" },
  { source: "s8", target: "j4" },
  { source: "s8", target: "j7" },
  { source: "s5", target: "s8" },
  { source: "s5", target: "cert3" },
  { source: "s2", target: "c7" },
  { source: "s2", target: "s5" },
  { source: "s9", target: "c6" },
  { source: "s9", target: "j6" },
  { source: "s9", target: "j7" },
  { source: "s9", target: "c2" },
  { source: "s6", target: "j8" },
  { source: "s7", target: "j8" },
  { source: "s8", target: "j6" },
];

const colorMap = {
  Skill: { fill: "hsl(var(--primary))", text: "text-primary", bg: "bg-primary/10", icon: Target },
  Course: { fill: "hsl(var(--success))", text: "text-success", bg: "bg-success/10", icon: BookOpen },
  Job: { fill: "hsl(var(--warning, 35 100% 50%))", text: "text-amber-600", bg: "bg-amber-100", icon: Briefcase },
  Certification: { fill: "hsl(var(--destructive, 280 100% 60%))", text: "text-purple-600", bg: "bg-purple-100", icon: Award },
};

const NODE_NOTE_LABEL: Record<NodeType, string> = {
  Skill: "Evidence",
  Course: "Why this course",
  Job: "Why this role",
  Certification: "Credential",
};

const NODE_NOTE: Record<NodeType, string> = {
  Skill: "",
  Course: "Contributes to the connected skills above. Open it from My Learning to continue where you left off.",
  Job: "Sourced from verified cooperative employers. Your skill match on this role is the average of the connected skills you have already verified.",
  Certification: "Issued by a NCCT Sector Skill Council after assessment and field evidence were verified.",
};

const skillByName = new Map(skillPassport.map((entry) => [entry.name, entry]));

const averageConfidence =
  skillPassport.length === 0
    ? 0
    : Math.round(skillPassport.reduce((total, entry) => total + entry.confidence, 0) / skillPassport.length);

const FALLBACK_EVIDENCE: { type: string; title: string; date: string }[] = [
  { type: "Project", title: "Field placement report under verification", date: "2026-09-30" },
];

function nodeConfidence(label: string): number {
  return skillByName.get(label)?.confidence ?? averageConfidence;
}

function nodeEvidence(label: string): { type: string; title: string; date: string }[] {
  const entry = skillByName.get(label);
  return entry ? entry.evidence : FALLBACK_EVIDENCE;
}

function formatEvidenceDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SkillGraphPage() {
  const t = useT();
  const typeLabel = (type: string) => t(`trainee.skillGraph.type${type}`);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("s1");

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const relatedEdges = edges.filter(e => e.source === selectedNodeId || e.target === selectedNodeId);
  const relatedNodeIds = relatedEdges.map(e => e.source === selectedNodeId ? e.target : e.source);
  const relatedNodes = nodes.filter(n => relatedNodeIds.includes(n.id));

  const getNodeStyle = (node: Node) => {
    const isSelected = node.id === selectedNodeId;
    const isRelated = relatedNodeIds.includes(node.id);
    const opacity = selectedNodeId ? (isSelected || isRelated ? 1 : 0.3) : 1;
    const strokeWidth = isSelected ? 3 : 1;
    const strokeColor = isSelected ? "hsl(var(--foreground))" : "transparent";
    
    return {
      fill: colorMap[node.type].fill,
      opacity,
      stroke: strokeColor,
      strokeWidth,
    };
  };

  const getLineStyle = (edge: Edge) => {
    const isRelated = selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);
    return {
      stroke: isRelated ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
      strokeWidth: isRelated ? 2 : 1,
      opacity: selectedNodeId ? (isRelated ? 0.8 : 0.1) : 0.3,
    };
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={t("trainee.skillGraph.title")}
        description={t("trainee.skillGraph.description")}
      />

      <div className="flex gap-4 mb-2">
        {Object.entries(colorMap).map(([type, colors]) => (
          <Badge key={type} variant="outline" className={cn("flex items-center gap-1", colors.text, colors.bg, "border-transparent")}>
            <div className="size-2 rounded-full" style={{ backgroundColor: colors.fill }} />
            {typeLabel(type)}
          </Badge>
        ))}
        <span className="text-sm text-muted-foreground ml-auto">{nodes.length} {t("trainee.skillGraph.totalNodes")}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {t("trainee.skillGraph.interactiveGraph")} <Info className="size-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative">
            {/* SVG Graph rendering */}
            <svg className="w-full h-full min-h-[500px]" viewBox="0 0 800 500">
              {/* Edges */}
              {edges.map((e, i) => {
                const source = nodes.find(n => n.id === e.source)!;
                const target = nodes.find(n => n.id === e.target)!;
                return (
                  <line 
                    key={i} 
                    x1={source.x} 
                    y1={source.y} 
                    x2={target.x} 
                    y2={target.y} 
                    className="transition-all duration-300"
                    {...getLineStyle(e)}
                  />
                );
              })}
              
              {/* Nodes */}
              {nodes.map(node => (
                <g 
                  key={node.id} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedNodeId(node.id)}
                  transform={`translate(${node.x}, ${node.y})`}
                >
                  <circle 
                    r={24} 
                    className="transition-all duration-300 group-hover:brightness-110"
                    {...getNodeStyle(node)}
                  />
                  <text 
                    y={36} 
                    textAnchor="middle" 
                    className={cn(
                      "text-xs font-medium pointer-events-none transition-opacity duration-300",
                      selectedNodeId && selectedNodeId !== node.id && !relatedNodeIds.includes(node.id) ? "opacity-30" : "opacity-100"
                    )}
                    fill="currentColor"
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-y-auto">
          {selectedNode ? (
            <>
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className={cn("size-10 rounded-full flex items-center justify-center shrink-0", colorMap[selectedNode.type].bg, colorMap[selectedNode.type].text)}>
                    {(() => {
                      const Icon = colorMap[selectedNode.type].icon;
                      return <Icon className="size-5" />;
                    })()}
                  </div>
                  <div>
                    <CardTitle className="leading-tight">{selectedNode.label}</CardTitle>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{typeLabel(selectedNode.type)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col gap-6">
                
                {selectedNode.type === "Skill" && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{t("trainee.skillGraph.proficiency")}</h4>
                    <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                      <span className="font-medium text-sm">{t("trainee.skillGraph.confidence")}</span>
                      <span className="font-bold text-primary">{nodeConfidence(selectedNode.label)}%</span>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{t("trainee.skillGraph.connections")}</h4>
                  <div className="flex flex-col gap-2">
                    {relatedNodes.length > 0 ? (
                      relatedNodes.map(n => (
                        <div key={n.id} className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedNodeId(n.id)}>
                          <div className={cn("size-2 rounded-full", colorMap[n.type].bg)} style={{ backgroundColor: colorMap[n.type].fill }} />
                          <span className="text-sm font-medium">{n.label}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground uppercase">{typeLabel(n.type)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("trainee.skillGraph.noConnections")}</p>
                    )}
                  </div>
                </div>

                {selectedNode.type === "Skill" && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{t("trainee.skillGraph.evidence")}</h4>
                    <div className="border-l-2 border-primary/20 pl-4 py-1 flex flex-col gap-3">
                      {nodeEvidence(selectedNode.label).map((item) => (
                        <div key={item.title}>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.type} &middot; {formatEvidenceDate(item.date)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNode.type !== "Skill" && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{NODE_NOTE_LABEL[selectedNode.type]}</h4>
                    <p className="text-sm text-muted-foreground">{NODE_NOTE[selectedNode.type]}</p>
                  </div>
                )}
                
              </CardContent>
            </>
          ) : (
            <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full text-muted-foreground">
              <Target className="size-12 mb-4 opacity-20" />
              <p>{t("trainee.skillGraph.selectNode")}</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
