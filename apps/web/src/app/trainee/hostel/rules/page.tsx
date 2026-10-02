"use client";

import Link from "next/link";
import { ChevronRight, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default function TraineeRulesPage() {
  const rules = [
    {
      category: "Night Curfew & Gate Timings",
      points: [
        "Perimeter gates strictly close at 10:00 PM every night. No entry or exit is permitted after this hour without prior written approval from the Chief Warden.",
        "Night roll-call attendance is recorded daily via biometric checkpoints between 09:30 PM and 10:15 PM.",
      ],
    },
    {
      category: "Dining Hall & Mess Etiquette",
      points: [
        "Dining timings: Breakfast (07:30 AM - 09:00 AM), Lunch (12:30 PM - 01:30 PM), Dinner (07:30 PM - 09:30 PM).",
        "Food or mess utensils must not be taken into dorm rooms. Maintaining hygiene is mandatory.",
      ],
    },
    {
      category: "Room Safety & Cleanliness",
      points: [
        "Use of high-voltage heating coils, immersion rods, and cooking appliances inside rooms is strictly prohibited due to electrical safety standards.",
        "Keep corridors and balconies free of clutter. Room inventory (furniture, fans, fixtures) must be handed over in original condition at checkout.",
      ],
    },
    {
      category: "Visitor & Guest Policy",
      points: [
        "Day visitors are permitted only in the central reception and common visitor lounge between 04:00 PM and 07:00 PM.",
        "Unauthorized overnight stay of non-registered guests will lead to immediate disciplinary reporting to the sponsoring cooperative federation.",
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
          <span>Home</span>
          <ChevronRight className="size-3" />
          <Link href="/trainee/hostel" className="hover:text-primary">
            Hostel Management
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-semibold">Hostel Rules</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
          Hostel Rules & Code of Conduct
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          General regulations, safety directives, and disciplinary guidelines governing VAMNICOM residential campus.
        </p>
      </div>

      <div className="space-y-4">
        {rules.map((r) => (
          <div key={r.category} className="p-5 rounded-2xl border bg-card shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b">
              <ShieldAlert className="size-4 text-primary" /> {r.category}
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-5 leading-relaxed">
              {r.points.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
