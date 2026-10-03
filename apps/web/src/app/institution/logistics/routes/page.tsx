"use client";

import { useEffect, useState } from "react";
import { Map, MapPin, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logisticsService } from "@/lib/logistics/logistics-service";
import type { Route } from "@/lib/logistics/types";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function refresh() {
    setRoutes(logisticsService.getRoutes());
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const unsub = logisticsService.subscribe(refresh);
    return unsub;
  }, []);

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const totalStops = routes.reduce((s, r) => s + r.stops.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Routes & Pickup Points"
        description="Define transport routes and ordered pickup stops with time windows."
        action={
          <Button size="sm" disabled aria-label="Add route (coming in next iteration)">
            <Plus className="size-4 mr-1.5" />
            New Route
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="icon-tile-blue size-10"><Map className="size-5" /></span>
          <div>
            <p className="font-heading text-xl font-bold">{routes.length}</p>
            <p className="text-xs text-muted-foreground">Routes defined</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="icon-tile-violet size-10"><MapPin className="size-5" /></span>
          <div>
            <p className="font-heading text-xl font-bold">{totalStops}</p>
            <p className="text-xs text-muted-foreground">Total stops</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="icon-tile-green size-10"><MapPin className="size-5" /></span>
          <div>
            <p className="font-heading text-xl font-bold">
              {routes.flatMap((r) => r.stops).filter((s) => s.accessiblePickup).length}
            </p>
            <p className="text-xs text-muted-foreground">Accessible stops</p>
          </div>
        </div>
      </div>

      {!ready ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {routes.map((route) => (
            <Card key={route.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="icon-tile-red size-9 shrink-0"><Map className="size-4" /></span>
                    <div className="min-w-0">
                      <CardTitle className="font-heading text-sm truncate">{route.name}</CardTitle>
                      <CardDescription className="text-xs">{route.stops.length} stops · {route.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggle(route.id)}
                    aria-expanded={!!expanded[route.id]}
                    aria-label={`${expanded[route.id] ? "Collapse" : "Expand"} ${route.name}`}
                    id={`route-toggle-${route.id}`}
                  >
                    {expanded[route.id] ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </Button>
                </div>
              </CardHeader>

              {expanded[route.id] && (
                <CardContent>
                  <ol className="relative flex flex-col gap-0 pl-4">
                    {route.stops.map((stop, idx) => (
                      <li
                        key={stop.id}
                        className={cn(
                          "relative pb-4 pl-6 text-sm",
                          idx < route.stops.length - 1 &&
                            "before:absolute before:left-0 before:top-5 before:h-full before:w-px before:bg-border",
                        )}
                      >
                        {/* Sequence dot */}
                        <span
                          className={cn(
                            "absolute left-0 top-1 flex size-5 -translate-x-1/2 items-center justify-center rounded-full text-[10px] font-bold",
                            idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {stop.sequence}
                        </span>

                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{stop.locationName}</p>
                            {stop.accessiblePickup && (
                              <Badge variant="secondary" className="text-xs py-0 bg-success/10 text-success">
                                Accessible
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{stop.address}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            Pickup window: {stop.pickupWindowStart} – {stop.pickupWindowEnd}
                          </p>
                          {stop.instructions && (
                            <p className="text-xs text-muted-foreground italic">{stop.instructions}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
