import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Smartphone, Globe, RefreshCw } from "lucide-react";
import { normalizeHealthConnectDay } from "./healthConnectPayload";

// Detect whether we're running inside a Capacitor native shell
const isNativePlatform = () => {
  try {
    return typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

const isNative = isNativePlatform();
const CONNECTED_KEY = "pcw_healthconnect_connected";
const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const EMPTY_METRICS = {
  steps: "",
  sleep_hours: "",
  average_heart_rate: "",
  active_calories: "",
};

export default function HealthConnectSection() {
  const alreadyConnected = isNative && localStorage.getItem(CONNECTED_KEY) === "true";
  const [state, setState] = useState(alreadyConnected ? "connected" : "idle");
  const [message, setMessage] = useState(
    isNative
      ? alreadyConnected
        ? "Auto-sync active — readiness summary updated."
        : "Connect Android Health Connect to share a daily readiness summary."
      : "Enter today's health metrics manually to generate a readiness summary."
  );
  const [steps, setSteps] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [manualMetrics, setManualMetrics] = useState(EMPTY_METRICS);
  const [syncHistory, setSyncHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const syncingRef = useRef(false);
  const isMounted = useRef(true);

  // ---- Fetch daily sync history (WearableReadinessSummary records) ----
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const me = await base44.auth.me();
      if (!me?.id) return;
      const res = await base44.entities.WearableReadinessSummary.filter(
        { trainee_id: me.id },
        "-summary_date",
        14
      );
      if (!isMounted.current) return;
      const list = Array.isArray(res) ? res : res?.items || [];
      setSyncHistory(list);
    } catch {
      // Non-fatal — history is informational
    } finally {
      if (isMounted.current) setHistoryLoading(false);
    }
  }, []);

  // ---- Shared submit to backend function ----
  const submitMetrics = useCallback(async (metrics) => {
    const res = await base44.functions.invoke("ingestHealthConnect", {
      provider: "health_connect",
      consent: true,
      metrics,
    });
    const result = res?.data ?? res;
    if (!isMounted.current) return;
    setSteps(result?.recorded?.steps ?? metrics.steps);
    setLastSynced(new Date());
    setState("connected");
    setMessage("Auto-sync active — readiness summary updated.");
    fetchHistory();
    return result;
  }, [fetchHistory]);

  // ---- Native: read from Health Connect and sync ----
  const syncNative = useCallback(async (silent = false) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const { Health } = await import("@capgo/capacitor-health");

      const endDate = new Date().toISOString();
      const startDate = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const [stepsResult, heartResult, sleepResult, caloriesResult] = await Promise.all([
        Health.readSamples({ dataType: "steps", startDate, endDate, limit: 500 }),
        Health.readSamples({ dataType: "heartRate", startDate, endDate, limit: 500 }),
        Health.readSamples({ dataType: "sleep", startDate, endDate, limit: 100 }),
        Health.readSamples({ dataType: "calories", startDate, endDate, limit: 500 }),
      ]);

      const metrics = normalizeHealthConnectDay({
        steps: stepsResult.samples,
        heartRate: heartResult.samples,
        sleep: sleepResult.samples,
        calories: caloriesResult.samples,
      });

      await submitMetrics(metrics);
    } catch (error) {
      if (!isMounted.current) return;
      if (!silent) {
        setState("error");
        setMessage(error?.message || "Health Connect sync failed.");
      }
    } finally {
      syncingRef.current = false;
    }
  }, [submitMetrics]);

  // ---- Native: first-time connect (request authorization) ----
  const connectNative = async () => {
    try {
      setState("working");
      const { Health } = await import("@capgo/capacitor-health");

      const availability = await Health.isAvailable();
      if (!availability.available) {
        setState("error");
        setMessage(availability.reason || "Health Connect is not available on this device.");
        return;
      }

      const access = await Health.requestAuthorization({
        read: ["steps", "heartRate", "sleep", "calories"],
      });
      if (!access.readAuthorized?.includes("steps")) {
        setState("error");
        setMessage("Step permission is required to connect Health Connect.");
        return;
      }

      // Mark as connected so auto-sync runs on future launches
      localStorage.setItem(CONNECTED_KEY, "true");
      await syncNative();
    } catch (error) {
      setState("error");
      setMessage(error?.message || "Health Connect connection failed.");
    }
  };

  // ---- Auto-sync on mount + periodic interval (native only) ----
  useEffect(() => {
    isMounted.current = true;
    fetchHistory();
    if (!isNative) return;

    const alreadyConnected = localStorage.getItem(CONNECTED_KEY) === "true";
    if (!alreadyConnected) return;

    // Initial sync on mount
    syncNative(true);

    // Periodic re-sync while app is in the foreground
    const intervalId = setInterval(() => syncNative(true), SYNC_INTERVAL_MS);

    // Also re-sync when the tab/app regains focus
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncNative(true);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncNative]);

  // ---- Browser manual entry flow ----
  const submitManual = async (e) => {
    e.preventDefault();
    try {
      setState("working");
      const metrics = {
        steps: Number(manualMetrics.steps) || 0,
        sleep_hours: Number(manualMetrics.sleep_hours) || 0,
        average_heart_rate: Number(manualMetrics.average_heart_rate) || 0,
        active_calories: Number(manualMetrics.active_calories) || 0,
      };
      await submitMetrics(metrics);
      setManualMetrics(EMPTY_METRICS);
    } catch (error) {
      setState("error");
      setMessage(error?.message || "Submission failed.");
    }
  };

  const formatSyncTime = (date) => {
    if (!date) return null;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isAutoSyncing = isNative && localStorage.getItem(CONNECTED_KEY) === "true" && state === "connected";

  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Health Connect
              {isNative ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Smartphone className="w-3 h-3" /> Native
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-sky-400">
                  <Globe className="w-3 h-3" /> Web
                </span>
              )}
              {isAutoSyncing && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: "2s" }} />
                  Auto-sync
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              {isNative
                ? isAutoSyncing
                  ? "Continuously syncing steps, heart rate, sleep, and calories every 10 minutes while the app is open. Coaches receive only an opt-in readiness summary."
                  : "Connect once to enable automatic daily syncing of steps, heart rate, sleep, and calories. Coaches receive only an opt-in readiness summary."
                : "Enter today's steps, sleep, heart rate, and active calories to generate a readiness summary for your coach."}
            </p>
          </div>
          {isNative && (
            <Button onClick={connectNative} disabled={state === "working"} style={{ background: "#10b981" }}>
              {state === "working"
                ? "Connecting…"
                : isAutoSyncing
                ? "Sync Now"
                : "Connect Health Connect"}
            </Button>
          )}
        </div>

        {/* Browser manual entry form */}
        {!isNative && (
          <form onSubmit={submitManual} className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Steps</Label>
              <Input
                type="number"
                min="0"
                placeholder="8500"
                value={manualMetrics.steps}
                onChange={(e) => setManualMetrics((m) => ({ ...m, steps: e.target.value }))}
                required
                style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#fff" }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Sleep (hours)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="7.5"
                value={manualMetrics.sleep_hours}
                onChange={(e) => setManualMetrics((m) => ({ ...m, sleep_hours: e.target.value }))}
                required
                style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#fff" }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Avg Heart Rate (bpm)</Label>
              <Input
                type="number"
                min="0"
                placeholder="62"
                value={manualMetrics.average_heart_rate}
                onChange={(e) => setManualMetrics((m) => ({ ...m, average_heart_rate: e.target.value }))}
                required
                style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#fff" }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Active Calories</Label>
              <Input
                type="number"
                min="0"
                placeholder="450"
                value={manualMetrics.active_calories}
                onChange={(e) => setManualMetrics((m) => ({ ...m, active_calories: e.target.value }))}
                required
                style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#fff" }}
              />
            </div>
            <div className="col-span-2">
              <Button type="submit" disabled={state === "working"} className="w-full" style={{ background: "#10b981" }}>
                {state === "working" ? "Syncing…" : "Submit & Sync Readiness"}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-1">
          <p className={state === "error" ? "text-sm text-red-400" : "text-gray-300"}>{message}</p>
          {steps !== null && (
            <p className="text-sm text-emerald-400">Today's synced steps: {steps.toLocaleString()}</p>
          )}
          {lastSynced && (
            <p className="text-xs text-gray-500">Last synced: {formatSyncTime(lastSynced)}</p>
          )}
        </div>

        {/* Auto-Sync Log — last 10 syncs */}
        <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2">Auto-Sync Log</p>
          {historyLoading && syncHistory.length === 0 ? (
            <p className="text-xs text-gray-600">Loading…</p>
          ) : syncHistory.length === 0 ? (
            <p className="text-xs text-gray-600">No sync events recorded yet.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {syncHistory.slice(0, 10).map((rec) => {
                const ts = rec.synced_at || rec.created_date;
                const timeStr = ts
                  ? new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                  : rec.summary_date || "—";
                const status = rec.readiness_status?.replace(/_/g, " ") || "synced";
                const isReady = rec.readiness_status === "ready";
                const isMonitor = rec.readiness_status === "monitor";
                const isRecovery = rec.readiness_status === "recovery_suggested";
                const dotColor = isReady ? "#10b981" : isMonitor ? "#f59e0b" : isRecovery ? "#dc2626" : "#6b7280";
                return (
                  <div key={rec.id} className="flex items-center gap-2 text-xs py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                    <span className="text-gray-300 flex-1 truncate">{timeStr}</span>
                    <span className="text-gray-500 capitalize flex-shrink-0">{status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily Sync History */}
        <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2">Sync History</p>
          {historyLoading && syncHistory.length === 0 ? (
            <p className="text-xs text-gray-600">Loading records…</p>
          ) : syncHistory.length === 0 ? (
            <p className="text-xs text-gray-600">No sync records yet. Sync to see your daily readiness history.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {syncHistory.map((rec) => {
                const score = rec.readiness_score;
                const scoreColor = score >= 75 ? "#10b981" : score >= 55 ? "#f59e0b" : "#dc2626";
                return (
                  <div key={rec.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${scoreColor}15` }}>
                      <span className="text-sm font-bold" style={{ color: scoreColor }}>
                        {score ?? "—"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">{rec.summary_date}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {rec.steps != null && `${rec.steps.toLocaleString()} steps`}
                        {rec.sleep_hours != null && ` • ${rec.sleep_hours}h sleep`}
                        {rec.average_heart_rate != null && ` • ${rec.average_heart_rate} bpm`}
                      </p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0" style={{ background: `${scoreColor}20`, color: scoreColor }}>
                      {rec.readiness_status?.replace("_", " ") || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}