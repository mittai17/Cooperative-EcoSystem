"use client";

import { Award, Search, Users, Calendar, MapPin, Clock, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_EXAMS } from "@/lib/mock-data/programmes-data";
import { useExamRegistrations } from "@/lib/store/programme-store";
import type { Programme } from "@/types/programme";
import { useT } from "@/i18n";

export function ExamsSection({ onApply }: { onApply: (p: Programme) => void }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const { getByTrainee } = useExamRegistrations();
  const myExams = getByTrainee("trainee-ravindra");

  const filteredExams = MOCK_EXAMS.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.shortName.toLowerCase().includes(query.toLowerCase()) ||
    e.skillsAssessed.some((s) => s.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-base font-bold">{t("trainee.programmes.examsTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("trainee.programmes.examsDesc")}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("trainee.programmes.searchExams")}
            className="h-9 pl-9 pr-9"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExams.map((exam) => {
          const registration = myExams.find((r) => r.examId === exam.id && r.status !== "withdrawn");
          const isFull = exam.availableSlots - exam.filledSlots <= 0;

          return (
            <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <div className="flex gap-1.5 mb-1.5">
                      <Badge variant="secondary" className="text-[10px]">{exam.issuer}</Badge>
                      <Badge variant="outline" className="text-[10px]">{exam.mode}</Badge>
                    </div>
                    <h3 className="font-heading font-bold text-base leading-tight group-hover:text-primary transition-colors">
                      {exam.name}
                    </h3>
                  </div>
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="size-5 text-primary" />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {exam.description}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {new Date(exam.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {exam.duration} {exam.durationUnit}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {exam.mode}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    {exam.availableSlots - exam.filledSlots} {t("trainee.programmes.slotsLeft")}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-5">
                  {exam.skillsAssessed.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px] py-0">{s}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <span className="font-bold text-sm">
                    {exam.isFree ? <span className="text-green-600">{t("trainee.programmes.free")}</span> : `₹${exam.fee}`}
                  </span>
                  {registration ? (
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      {t("trainee.programmes.registered")}
                    </Button>
                  ) : isFull ? (
                    <Button size="sm" disabled>{t("trainee.programmes.slotsFull")}</Button>
                  ) : (
                    <Button size="sm" onClick={() => alert(t("trainee.programmes.examAlert"))}>
                      {t("trainee.programmes.registerNow")}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
