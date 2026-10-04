import type { Metadata } from "next";
import { DemoHubView } from "./demo-hub-view";

export const metadata: Metadata = {
  title: "1-Click Demo Showcase | NURVEX",
  description: "Instant access to all 6 ecosystem personas for Smart India Hackathon evaluators and cooperative stakeholders.",
};

export default function DemoPage() {
  return <DemoHubView />;
}
