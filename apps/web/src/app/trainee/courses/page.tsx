"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AlertCircle, BookOpen, Clock, RefreshCw, Star, Users, Search, Filter, PlayCircle, Book } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getCatalogueCategories,
  getCatalogueLevels,
  getTraineeCourses,
  type TraineeCourse,
} from "@/lib/trainee/course-catalog";

export default function TraineeCoursesPage() {
  const t = useT();
  const [courses, setCourses] = useState<TraineeCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  const [reloadKey, setReloadKey] = useState(0);

  const categories = useMemo(() => getCatalogueCategories(), []);
  const levels = useMemo(() => getCatalogueLevels(), []);

  const refresh = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      try {
        setCourses(getTraineeCourses());
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [reloadKey]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = (course.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
                            (course.instructor?.toLowerCase().includes(searchQuery.toLowerCase())) || 
                            (course.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
      const matchesLevel = selectedLevel === "All" || course.level === selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("trainee.courses.title", "Courses")}
        description={t("trainee.courses.subtitle", "Explore self-paced & instructor-led cooperative courses to build verified skills for your AI Skill Passport.")}
        action={
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
            <span className="ml-2">{t("trainee.common.refresh", "Refresh")}</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
                placeholder="Search by title, instructor, skill..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 max-w-md w-full"
            />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <Select value={selectedLevel} onValueChange={(val) => val && setSelectedLevel(val)}>
                <SelectTrigger className="w-[140px] shrink-0">
                    <Filter className="size-4 mr-2" />
                    <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                    {levels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map(category => (
            <Badge 
                key={category} 
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap px-3 py-1 text-sm font-medium transition-colors"
                onClick={() => setSelectedCategory(category)}
            >
                {category}
            </Badge>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && error !== null && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Failed to load courses</AlertTitle>
          <AlertDescription>
            {error} Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {!loading && error === null && filteredCourses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
                <BookOpen className="size-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg text-foreground">No courses found</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Try adjusting your search or filter criteria to find what you are looking for.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSelectedLevel("All"); }}>
                Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && error === null && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-32 w-full bg-gradient-to-br ${course.thumbnailGradient || 'from-slate-200 to-slate-400'} flex items-center justify-center relative`}>
                <Book className="size-12 text-white/80" />
                <div className="absolute top-3 left-3 flex gap-2">
                    {course.category && <Badge variant="secondary" className="bg-white/90 hover:bg-white text-black border-none shadow-sm">{course.category}</Badge>}
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                    {course.level && <Badge variant="secondary" className="bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-sm">{course.level}</Badge>}
                </div>
              </div>
              <CardHeader className="flex-none pb-3">
                <CardTitle className="text-xl leading-tight line-clamp-2" title={course.title}>{course.title}</CardTitle>
                {course.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{course.description}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  {course.instructor && (
                      <span className="font-medium text-foreground">By {course.instructor}</span>
                  )}
                  {course.durationHours != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {course.durationHours}h
                    </span>
                  )}
                  {course.rating != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" /> {course.rating.toFixed(1)}
                    </span>
                  )}
                  {course.enrolled != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" /> {course.enrolled.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {course.skills && course.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                        {course.skills.map(skill => (
                            <span key={skill} className="px-2 py-0.5 bg-muted rounded-md text-[11px] font-medium text-muted-foreground">
                                {skill}
                            </span>
                        ))}
                    </div>
                )}
                
                {course.progress !== undefined && (
                    <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span className={course.progress === 100 ? "text-green-600" : "text-primary"}>
                                {course.progress === 100 ? "Completed" : "In Progress"}
                            </span>
                            <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5" />
                    </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 pb-5">
                <Link className="w-full contents" href={`/courses/${course.id}`}>
                  <Button variant={course.progress !== undefined ? "default" : "outline"} className="w-full gap-2" nativeButton={false}>
                    {course.progress !== undefined ? (
                        <>
                            {course.progress === 100 ? <RefreshCw className="size-4" /> : <PlayCircle className="size-4" />}
                            {course.progress === 100 ? "Review Course" : "Continue Course"}
                        </>
                    ) : (
                        "View Course"
                    )}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
