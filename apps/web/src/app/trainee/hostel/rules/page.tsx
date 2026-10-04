"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  ShieldAlert, 
  Clock, 
  Zap, 
  Utensils, 
  Users, 
  PhoneCall, 
  FileDown, 
  Search,
  BookOpen,
  HeartPulse,
  Info
} from "lucide-react";
import { useT } from "@/i18n";

const MOCK_RULES_DATA = [
  {
    id: "timings",
    category: "Gate Timings & Curfew Regulations",
    icon: Clock,
    tags: ["Timings"],
    points: [
      "Main entrance gates close at 10:00 PM on weekdays and 10:30 PM on weekends.",
      "Biometric/QR attendance scan at the reception desk between 09:00 PM and 09:30 PM is mandatory.",
      "Night-out or weekend leaves require prior digital approval via the Hostel Portal 24 hours in advance.",
      "Unexcused late entry will be logged and reported to the batch trainer and hostel warden."
    ]
  },
  {
    id: "room",
    category: "Room Maintenance & Energy Conservation",
    icon: Zap,
    tags: ["Room Maintenance"],
    points: [
      "Trainees must maintain room cleanliness and study desk order. Daily waste must be deposited in corridor bins.",
      "High-wattage electrical appliances (electric heaters, induction cooktops, high-power irons) are strictly prohibited in rooms.",
      "Lights, fans, and study lamps must be switched off before leaving the room.",
      "Fortnightly cleanliness inspections are conducted by the Chief Warden and Hostel Committee."
    ]
  },
  {
    id: "mess",
    category: "Dining Hall & Mess Guidelines",
    icon: Utensils,
    tags: ["Mess"],
    points: [
      "Mess timings: Breakfast (07:30 - 09:00 AM), Lunch (12:30 - 02:00 PM), Dinner (07:30 - 09:30 PM).",
      "Mess utensils and food trays must not be taken into dorm rooms (except under medical prescription).",
      "Clean trays and cutlery must be deposited at the dish collection counter after dining.",
      "Special dietary requests (vegetarian, jain, allergies) can be registered with the Mess Caretaker."
    ]
  },
  {
    id: "discipline",
    category: "Zero-Tolerance Anti-Ragging & Code of Conduct",
    icon: ShieldAlert,
    tags: ["Discipline"],
    points: [
      "NCCT enforces a strict Zero-Tolerance Anti-Ragging Policy as per Supreme Court & UGC/Ministry guidelines.",
      "Possession or consumption of alcohol, tobacco, cigarettes, e-cigarettes, or narcotic substances is strictly forbidden and results in immediate expulsion.",
      "Maintain silence and decorum during designated study hours (10:00 PM – 06:00 AM).",
      "Trainees are responsible for any damage or defacement of hostel property and furniture."
    ]
  },
  {
    id: "visitors",
    category: "Visitor & Day Scholar Policy",
    icon: Users,
    tags: ["Discipline", "Safety"],
    points: [
      "External visitors and day scholars are permitted only in the ground-floor Visitor Lounge between 04:00 PM and 07:00 PM.",
      "Non-residents are strictly prohibited from entering trainee residential wings or dorm rooms.",
      "Overnight stay for parents/guardians requires written clearance from the Hostel Superintendent and carries guest room charges."
    ]
  },
  {
    id: "safety",
    category: "Safety, Health & Emergency Protocols",
    icon: HeartPulse,
    tags: ["Safety"],
    points: [
      "24/7 First Aid and medical assistance available at the Resident Warden's office (Room G-04).",
      "Campus Medical Officer and emergency ambulance service: Call Ext. 108 or +91 98765 43210.",
      "Fire extinguishers and emergency evacuation maps are posted on each floor staircase landing."
    ]
  }
];

const FILTER_CATEGORIES = [
  "All Rules",
  "Timings",
  "Room Maintenance",
  "Mess",
  "Discipline",
  "Safety"
];

export default function TraineeRulesPage() {
  const t = useT();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Rules");

  const filteredRules = MOCK_RULES_DATA.map((rule) => {
    // Filter by points containing search query
    const filteredPoints = rule.points.filter((point) =>
      point.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...rule, points: filteredPoints };
  }).filter((rule) => {
    // Filter out rules with no matching points
    const matchesSearch = rule.points.length > 0 || rule.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All Rules" || rule.tags.includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* HEADER BREADCRUMB */}
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2 font-medium">
          <Link href="/trainee/dashboard" className="hover:text-primary transition-colors">
            {t("trainee.common.home", "Home")}
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/trainee/hostel" className="hover:text-primary transition-colors">
            {t("trainee.hostel.management", "Hostel Management")}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-semibold">{t("trainee.hostelRules.breadcrumb", "Rules & Regulations")}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
              <BookOpen className="size-6 sm:size-8 text-primary" />
              Hostel Rules & Code of Conduct
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Comprehensive guide to campus residency regulations, dining policies, and safety protocols for all trainees.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2">
              <FileDown className="size-4" />
              Download Handbook (PDF)
            </button>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 py-2 shadow">
              Request Gate Pass
            </button>
          </div>
        </div>
      </div>

      {/* IMPORTANT BANNER */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm">
        <div className="flex gap-3">
          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
            <Info className="size-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-foreground">Important Contacts & Warden Info</h4>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="size-3.5" /> Resident Warden: Dr. K. S. Sharma (Room G-02)</span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5"><PhoneCall className="size-3.5" /> Security Desk: Ext: 101 (24/7)</span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5 font-medium text-destructive"><HeartPulse className="size-3.5" /> Medical: +91 98765 43210</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search rules, e.g., 'curfew', 'visitors', 'ragging'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                activeCategory === cat 
                  ? "bg-primary text-primary-foreground shadow hover:bg-primary/80" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* RULES LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule) => {
            const Icon = rule.icon;
            // Restore full points if matching by category but search query is empty
            const pointsToDisplay = searchQuery 
              ? rule.points 
              : MOCK_RULES_DATA.find(r => r.id === rule.id)?.points || [];

            return (
              <div key={rule.id} className="p-5 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col hover:border-primary/30 transition-colors">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2.5 pb-3 border-b mb-3">
                  <div className="bg-primary/10 p-1.5 rounded-md">
                    <Icon className="size-4 text-primary" />
                  </div>
                  {rule.category}
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground list-disc pl-5 leading-relaxed flex-1">
                  {pointsToDisplay.map((point, idx) => {
                    if (!searchQuery) {
                      return <li key={idx} className="marker:text-primary/50">{point}</li>;
                    }
                    
                    // Basic highlighting for search query
                    const parts = point.split(new RegExp(`(${searchQuery})`, 'gi'));
                    return (
                      <li key={idx} className="marker:text-primary/50">
                        {parts.map((part, i) => 
                          part.toLowerCase() === searchQuery.toLowerCase() ? (
                            <span key={i} className="bg-primary/20 text-foreground font-medium rounded-sm px-0.5">{part}</span>
                          ) : part
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/30">
            <Search className="size-8 text-muted-foreground/50 mb-3" />
            <h3 className="text-sm font-medium text-foreground">No rules found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search query or filter category.
            </p>
            <button 
              onClick={() => { setSearchQuery(""); setActiveCategory("All Rules"); }}
              className="mt-4 text-xs text-primary font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
