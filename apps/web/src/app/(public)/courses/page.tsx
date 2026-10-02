"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Search, Star, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { courses } from "@/lib/mock-data/courses";
import type { Course } from "@/lib/types";

const categories = ["All categories", ...Array.from(new Set(courses.map((c) => c.category)))];

function thumbnailFor(course: Course) {
  return `https://picsum.photos/seed/coopsetu-${course.id}/640/420`;
}

export default function CoursesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesQuery =
        query.trim().length === 0 ||
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()));
      const matchesCategory = category === "All categories" || c.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold text-foreground">Self-paced & instructor-led courses</h1>
        <p className="max-w-2xl text-muted-foreground">
          Shorter, skill-focused courses that feed directly into your AI Skill Passport as verified
          evidence.
        </p>
        <span className="demo-data-tag w-fit">Sample course catalogue for demo purposes</span>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses or skills…"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(value) => setCategory(value ?? "All categories")}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {filtered.length} course{filtered.length === 1 ? "" : "s"} found
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <Card key={course.id} className="flex flex-col overflow-hidden py-0">
            <div className="relative h-40 w-full">
              <Image src={thumbnailFor(course)} alt="" fill className="object-cover" />
              <Badge className="absolute top-3 left-3 bg-card/90 text-foreground shadow-sm">{course.level}</Badge>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {course.category}
                </Badge>
                <h2 className="font-heading text-base font-semibold leading-snug text-foreground">
                  {course.title}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">by {course.instructor}</p>
              </div>
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {course.skills.slice(0, 2).map((skill) => (
                  <Badge key={skill} variant="outline" className="font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" /> {course.durationHours} hours
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" /> {course.enrolled.toLocaleString("en-IN")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="size-3.5 fill-tint-amber-fg text-tint-amber-fg" /> {course.rating.toFixed(1)}
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <Link className="contents" href={`/courses/${course.id}`}><Button className="flex-1"   nativeButton={false}>View Course</Button></Link>
                <Link className="contents" href="/skill-passport"><Button variant="outline" className="flex-1"   nativeButton={false}>Skill impact</Button></Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
