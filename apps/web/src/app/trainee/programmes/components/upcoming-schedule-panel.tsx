"use client";

import { CalendarDays, Clock, MapPin, ExternalLink, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpcomingEvents } from "@/lib/store/programme-store";
import { useT } from "@/i18n";

export function UpcomingSchedulePanel() {
  const t = useT();
  const { events } = useUpcomingEvents();

  return (
    <Card className="rounded-2xl border border-border shadow-sm">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="font-heading text-sm font-bold flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          {t("trainee.programmes.upcomingSchedule")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <Calendar className="size-8 opacity-20" />
            <p className="text-xs">{t("trainee.programmes.noUpcoming")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="relative pl-3 border-l-2 border-primary/30">
                <div className="absolute -left-1.5 top-1 size-3 rounded-full bg-background border-2 border-primary" />
                <p className="font-medium text-sm text-foreground leading-tight">
                  {event.title}
                </p>
                <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3 shrink-0" />
                    <span>
                      {new Date(event.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      • {event.time}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="size-3 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-snug">
                      {event.venue} ({event.mode})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
