"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Target, Briefcase, BookOpen, Award } from "lucide-react";
import { cn } from "@/lib/utils";
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
  
  // Courses
  { id: "c1", label: "Leadership for Board Members", type: "Course", x: 100, y: 100 },
  { id: "c2", label: "Data Analytics for Coops", type: "Course", x: 50, y: 250 },
  { id: "c3", label: "Rural Entrepreneurship", type: "Course", x: 700, y: 100 },
  { id: "c4", label: "Cooperative Bookkeeping", type: "Course", x: 600, y: 400 },
  
  // Jobs
  { id: "j1", label: "Coop Development Officer", type: "Job", x: 300, y: 50 },
  { id: "j2", label: "MIS & Data Analyst", type: "Job", x: 250, y: 450 },
  { id: "j3", label: "Rural Dev Officer", type: "Job", x: 500, y: 50 },
  { id: "j4", label: "Society Accountant", type: "Job", x: 350, y: 450 },
  
  // Certifications
  { id: "cert1", label: "Cert in Coop Management", type: "Certification", x: 100, y: 200 },
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
  { source: "s1", target: "s3" }, // Skill synergy
];

const colorMap = {
  Skill: { fill: "hsl(var(--primary))", text: "text-primary", bg: "bg-primary/10", icon: Target },
  Course: { fill: "hsl(var(--success))", text: "text-success", bg: "bg-success/10", icon: BookOpen },
  Job: { fill: "hsl(var(--warning, 35 100% 50%))", text: "text-amber-600", bg: "bg-amber-100", icon: Briefcase },
  Certification: { fill: "hsl(var(--destructive, 280 100% 60%))", text: "text-purple-600", bg: "bg-purple-100", icon: Award },
};

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
                      <span className="font-bold text-primary">85%</span>
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
                      <div>
                        <p className="text-sm font-medium">{t("trainee.skillGraph.completedAssessment")}</p>
                        <p className="text-xs text-muted-foreground">{t("trainee.skillGraph.assessmentDetail")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t("trainee.skillGraph.projectSubmission")}</p>
                        <p className="text-xs text-muted-foreground">{t("trainee.skillGraph.projectDetail")}</p>
                      </div>
                    </div>
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
