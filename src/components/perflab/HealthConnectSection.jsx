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
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState(
    isNative
      ? "Connect Android Health Connect to share a daily readiness summary."
      : "Enter today's health metrics manually to generate a readiness summary."
  );
  const [steps, setSteps] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [manualMetrics, setManualMetrics] = useState(EMPTY_METRICS);

  const syncingRef = useRef(false);
  const isMounted = useRef(true);

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
    return result;
  }, []);

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
                  ? "Continuously syncing steps, heart rate, sleep, and calories every 15 minutes while the app is open. Coaches receive only an opt-in readiness summary."
                  : "Connect once to enable automatic daily syncing of steps, heart rate, sleep, and calories. Coaches receive only an opt-in readiness summary."
                : "Enter today's steps, sleep, heart rate, and active calories to generate a readiness summary for your coach."}
            </p>
          </div>
          {isNative && (
            <Button onClick={connectNative} disabled={state === "working"} style={{ background: "#10b981" }}>
              {state === "working"
                ? "Connecting…"
                : isAutoSyncing
                ? "Reconnect"
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
      </CardContent>
    </Card>
  );
}