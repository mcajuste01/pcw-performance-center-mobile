import React, { useState } from "react";
import { Health } from "@capgo/capacitor-health";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { normalizeHealthConnectDay } from "./healthConnectPayload";

export default function HealthConnectSection() {
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("Connect Android Health Connect to share a daily readiness summary.");
  const [steps, setSteps] = useState(null);

  const connect = async () => {
    try {
      setState("working");
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

      const result = await base44.functions.ingestHealthConnect({
        provider: "health_connect",
        consent: true,
        metrics,
      });

      setSteps(result?.recorded?.steps ?? metrics.steps);
      setState("connected");
      setMessage("Health Connect is connected and today's readiness summary was saved.");
    } catch (error) {
      setState("error");
      setMessage(error?.message || "Health Connect connection failed.");
    }
  };

  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Health Connect
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              Reads today's steps, heart rate, sleep, and active calories on Android. Coaches receive only an
              opt-in readiness summary.
            </p>
          </div>
          <Button onClick={connect} disabled={state === "working"} style={{ background: "#10b981" }}>
            {state === "working"
              ? "Connecting…"
              : state === "connected"
              ? "Sync again"
              : "Connect Health Connect"}
          </Button>
        </div>
        <p className={state === "error" ? "text-sm text-red-400" : "text-gray-300"}>{message}</p>
        {steps !== null && (
          <p className="text-sm text-emerald-400">Today's synced steps: {steps.toLocaleString()}</p>
        )}
      </CardContent>
    </Card>
  );
}