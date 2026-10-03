"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import {
  AppearancePanel,
  GeneralPanel,
  NotificationsPanel,
  SecurityPanel,
  type SaveResult,
} from "@/components/admin/settings/settings-panels";
import { DEMO_SETTINGS, SETTINGS_TABS, type SettingsTab } from "@/components/admin/settings/settings-data";
import { getSettings, updateSettings, type PlatformSettings, type SettingsPatch } from "@/lib/admin/admin-api";

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getSettings();
        if (cancelled) return;
        setSettings(data);
        setUsingDemo(false);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setSettings(DEMO_SETTINGS);
        setUsingDemo(true);
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  /** Saves one section through PATCH /admin/settings and keeps the returned document. */
  function saveSection<K extends keyof PlatformSettings>(section: K) {
    return async (value: PlatformSettings[K]): Promise<SaveResult> => {
      try {
        const patch = { [section]: value } as SettingsPatch;
        const updated = await updateSettings(patch);
        setSettings(updated);
        return { ok: true };
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
      }
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Settings}
        title="System Settings"
        description="Manage system configuration."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div role="tablist" aria-label="Settings sections" className="flex flex-wrap gap-6 border-b border-slate-200">
          {SETTINGS_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {usingDemo && <DemoBanner message="Showing default values because the live settings could not be loaded. Saves will report an error until the API responds." />}
            <span className="text-xs text-slate-500">Live settings unavailable: {error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mt-6 max-w-3xl">
          {loading || !settings ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading settings">
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : (
            <>
              {tab === "general" && (
                <GeneralPanel key={`general-${reloadKey}`} initial={settings.general} onSave={saveSection("general")} />
              )}
              {tab === "appearance" && (
                <AppearancePanel
                  key={`appearance-${reloadKey}`}
                  initial={settings.appearance}
                  onSave={saveSection("appearance")}
                />
              )}
              {tab === "notifications" && (
                <NotificationsPanel
                  key={`notifications-${reloadKey}`}
                  initial={settings.notifications}
                  onSave={saveSection("notifications")}
                />
              )}
              {tab === "security" && (
                <SecurityPanel
                  key={`security-${reloadKey}`}
                  initial={settings.security}
                  onSave={saveSection("security")}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
