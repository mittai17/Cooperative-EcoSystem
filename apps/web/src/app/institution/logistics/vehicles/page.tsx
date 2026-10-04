"use client";

/**
 * Vehicles & Drivers registry page.
 * Shows all vehicles (with maintenance/permit/insurance status) and all drivers.
 * Expiry warnings are highlighted. Never shows driver phone numbers to non-coordinators
 * (in this demo, the institution coordinator view shows abbreviated info only).
 */

import { useEffect, useState } from "react";
import {
  Truck, UserCheck, AlertTriangle, CheckCircle2, Wrench, Search,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logisticsService } from "@/lib/logistics/logistics-service";
import type { Vehicle, Driver } from "@/lib/logistics/types";

const DEMO_TODAY = new Date("2026-10-03");
const NINETY_DAYS = new Date(DEMO_TODAY);
NINETY_DAYS.setDate(DEMO_TODAY.getDate() + 90);

function expiryClass(date: string): "ok" | "warn" | "expired" {
  const d = new Date(date);
  if (d < DEMO_TODAY) return "expired";
  if (d < NINETY_DAYS) return "warn";
  return "ok";
}

function ExpiryBadge({ date }: { date: string }) {
  const cls = expiryClass(date);
  return (
    <span className={cn(
      "flex items-center gap-1 font-mono text-xs",
      cls === "expired" ? "text-destructive font-semibold" :
      cls === "warn" ? "text-warning font-semibold" :
      "text-muted-foreground",
    )}>
      {cls === "expired" && <AlertTriangle className="size-3 shrink-0" />}
      {cls === "warn" && <AlertTriangle className="size-3 shrink-0" />}
      {date}
    </span>
  );
}

export default function VehiclesDriversPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => logisticsService.getVehicles());
  const [drivers, setDrivers] = useState<Driver[]>(() => logisticsService.getDrivers());
  const [vendors] = useState(() => logisticsService.getVendors());
  const [ready] = useState(true);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [driverQuery, setDriverQuery] = useState("");

  function refresh() {
    setVehicles(logisticsService.getVehicles());
    setDrivers(logisticsService.getDrivers());
  }

  useEffect(() => {
    const unsub = logisticsService.subscribe(refresh);
    return unsub;
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const n = vehicleQuery.trim().toLowerCase();
    return !n || v.assetCode.toLowerCase().includes(n) || v.registrationNumber.toLowerCase().includes(n) || v.type.toLowerCase().includes(n);
  });

  const filteredDrivers = drivers.filter((d) => {
    const n = driverQuery.trim().toLowerCase();
    return !n || d.name.toLowerCase().includes(n) || d.licenceRef.toLowerCase().includes(n);
  });

  const vehicleStats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.active && v.maintenanceStatus === "Available").length,
    maintenance: vehicles.filter((v) => v.maintenanceStatus === "Maintenance").length,
    expiring: vehicles.filter((v) => expiryClass(v.permitExpiry) !== "ok" || expiryClass(v.insuranceExpiry) !== "ok").length,
  };

  const driverStats = {
    total: drivers.length,
    available: drivers.filter((d) => d.active && d.availability === "Available").length,
    onLeave: drivers.filter((d) => d.availability === "On Leave").length,
    licenceExpiring: drivers.filter((d) => expiryClass(d.licenceExpiry) !== "ok").length,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vehicles & Drivers"
        description="Registry of all vehicles and drivers with compliance, availability and vendor information."
      />

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Vehicles Available", value: vehicleStats.available, icon: Truck, tint: "icon-tile-blue" },
          { label: "In Maintenance", value: vehicleStats.maintenance, icon: Wrench, tint: vehicleStats.maintenance > 0 ? "icon-tile-amber" : "icon-tile-green" },
          { label: "Drivers Available", value: driverStats.available, icon: UserCheck, tint: "icon-tile-violet" },
          { label: "Compliance Alerts", value: vehicleStats.expiring + driverStats.licenceExpiring, icon: AlertTriangle, tint: (vehicleStats.expiring + driverStats.licenceExpiring) > 0 ? "icon-tile-red" : "icon-tile-green" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className={cn("size-11 flex items-center justify-center rounded-2xl shrink-0", item.tint)}>
              <item.icon className="size-5" strokeWidth={2} />
            </span>
            <div>
              <p className="font-heading text-2xl font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles" id="tab-vehicles">
            Vehicles <span className="ml-1.5 font-mono text-xs">({filteredVehicles.length})</span>
          </TabsTrigger>
          <TabsTrigger value="drivers" id="tab-drivers">
            Drivers <span className="ml-1.5 font-mono text-xs">({filteredDrivers.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Vehicles tab */}
        <TabsContent value="vehicles">
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-heading text-base">Vehicle Fleet</CardTitle>
                  <CardDescription>{vehicles.length} vehicles · {vehicleStats.maintenance} in maintenance</CardDescription>
                </div>
                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={vehicleQuery}
                    onChange={(e) => setVehicleQuery(e.target.value)}
                    placeholder="Search vehicles…"
                    className="pl-9 h-9"
                    aria-label="Search vehicles"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!ready ? (
                <div className="p-4 flex flex-col gap-2">
                  {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[860px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Code</TableHead>
                        <TableHead>Registration</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Permit Expiry</TableHead>
                        <TableHead>Insurance Expiry</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicles.map((v) => {
                        const vendor = vendors.find((vn) => vn.id === v.vendorId);
                        return (
                          <TableRow
                            key={v.id}
                            className={cn(
                              v.maintenanceStatus === "Maintenance" && "bg-muted/40",
                              !v.active && "opacity-50",
                            )}
                          >
                            <TableCell className="font-mono text-sm font-semibold">{v.assetCode}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{v.registrationNumber}</TableCell>
                            <TableCell className="text-sm">{v.type}</TableCell>
                            <TableCell className="font-mono text-sm">{v.seatingCapacity}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{vendor?.name ?? "Owned"}</TableCell>
                            <TableCell><ExpiryBadge date={v.permitExpiry} /></TableCell>
                            <TableCell><ExpiryBadge date={v.insuranceExpiry} /></TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  v.maintenanceStatus === "Available" ? "bg-success/10 text-success" :
                                  v.maintenanceStatus === "Maintenance" ? "bg-warning/15 text-warning" :
                                  "bg-muted text-muted-foreground",
                                )}
                              >
                                {v.maintenanceStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers tab */}
        <TabsContent value="drivers">
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-heading text-base">Driver Registry</CardTitle>
                  <CardDescription>{drivers.length} drivers · {driverStats.onLeave} on leave</CardDescription>
                </div>
                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={driverQuery}
                    onChange={(e) => setDriverQuery(e.target.value)}
                    placeholder="Search drivers…"
                    className="pl-9 h-9"
                    aria-label="Search drivers"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!ready ? (
                <div className="p-4 flex flex-col gap-2">
                  {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Licence Ref</TableHead>
                        <TableHead>Licence Expiry</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Availability</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDrivers.map((d) => {
                        const vendor = vendors.find((v) => v.id === d.vendorId);
                        return (
                          <TableRow
                            key={d.id}
                            className={cn(!d.active && "opacity-50")}
                          >
                            <TableCell className="font-medium text-sm">{d.name}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{d.licenceRef}</TableCell>
                            <TableCell><ExpiryBadge date={d.licenceExpiry} /></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{vendor?.name ?? "Employed directly"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  d.availability === "Available" ? "bg-success/10 text-success" :
                                  d.availability === "Assigned" ? "bg-tint-blue-bg text-tint-blue-fg" :
                                  d.availability === "On Leave" ? "bg-tint-amber-bg text-tint-amber-fg" :
                                  "bg-muted text-muted-foreground",
                                )}
                              >
                                {d.availability}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
