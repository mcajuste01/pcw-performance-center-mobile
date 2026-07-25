import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { HeartPulse, Plus, AlertTriangle, Activity } from "lucide-react";
import { calculateDailyReadiness, shouldFlag } from "./readinessScore";
import { toArray } from "./constants";
import HealthConnectSection from "./HealthConnectSection";

export default function ReadinessCheckInSection({ traineeId, traineeName }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  const { data: checkIns = [], refetch } = useQuery({
    queryKey: ["readiness-checkins", traineeId],
    queryFn: () =>
      base44.entities.ReadinessCheckIn.filter(
        { trainee_id: traineeId },
        "-check_in_date",
        20
      ),
    enabled: !!traineeId,
  });
  const checkInList = toArray(checkIns);
  const today = new Date().toISOString().slice(0, 10);
  const hasToday = checkInList.some((c) => c.check_in_date === today);

  useEffect(() => {
    if (open) {
      setForm({
        check_in_date: today,
        sleep: 3,
        energy: 3,
        soreness: 3,
        stress: 3,
        pain: 0,
        water_intake: "",
        nutrition: "good",
      });
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ReadinessCheckIn.create({
        ...data,
        trainee_id: traineeId,
        trainee_name: traineeName,
      }),
    onSuccess: () => {
      toast({ title: "Check-in saved!" });
      setOpen(false);
      refetch();
    },
    onError: (e) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    const score = calculateDailyReadiness(form);
    const flagged = shouldFlag(score, form.pain);
    mutation.mutate({ ...form, readiness_score: score, flagged });
  };

  const score = calculateDailyReadiness(form);
  const flagged = shouldFlag(score, form.pain);
  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";

  const SLIDERS = [
    { key: "sleep", label: "Sleep Quality", min: 1, max: 5, icon: "😴" },
    { key: "energy", label: "Energy Level", min: 1, max: 5, icon: "⚡" },
    { key: "soreness", label: "Muscle Soreness", min: 1, max: 5, icon: "💪" },
    { key: "stress", label: "Stress Level", min: 1, max: 5, icon: "🧠" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <HeartPulse className="w-5 h-5" style={{ color: "#10b981" }} />
          Readiness Check-In
        </h3>
        {!hasToday && (
          <Button onClick={() => setOpen(!open)} size="sm" style={{ background: "#8b3dff" }}>
            <Plus className="w-4 h-4 mr-1" /> {open ? "Close" : "Check In"}
          </Button>
        )}
      </div>

      {hasToday && (
        <Card className="border-green-800/30" style={{ background: "rgba(16,185,129,0.05)" }}>
          <CardContent className="py-3">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" /> You've checked in today. Readiness:{" "}
              <span className="font-bold">{checkInList.find((c) => c.check_in_date === today)?.readiness_score}/100</span>
              {checkInList.find((c) => c.check_in_date === today)?.flagged && (
                <Badge variant="destructive" className="ml-2 text-xs">Flagged for lighter session</Badge>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {open && (
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="space-y-4 pt-4">
            {SLIDERS.map((s) => (
              <div key={s.key}>
                <div className="flex justify-between items-center">
                  <Label className="text-gray-300 text-xs">
                    {s.icon} {s.label}: <span className="text-white font-bold">{form[s.key]}/{s.max}</span>
                  </Label>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  value={form[s.key]}
                  onChange={(e) => setForm({ ...form, [s.key]: parseInt(e.target.value) })}
                  className="w-full mt-1"
                />
              </div>
            ))}
            <div>
              <Label className="text-gray-300 text-xs">
                Pain Level: <span className="text-white font-bold">{form.pain}/10</span>
              </Label>
              <input
                type="range"
                min={0}
                max={10}
                value={form.pain}
                onChange={(e) => setForm({ ...form, pain: parseInt(e.target.value) })}
                className="w-full mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs">Water Intake</Label>
                <Input
                  placeholder="e.g. 8 glasses"
                  value={form.water_intake || ""}
                  onChange={(e) => setForm({ ...form, water_intake: e.target.value })}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Nutrition</Label>
                <select
                  value={form.nutrition}
                  onChange={(e) => setForm({ ...form, nutrition: e.target.value })}
                  className={`w-full mt-1 rounded-md border border-gray-800 ${inputCls} px-3 py-2 text-sm`}
                >
                  <option value="poor">Poor</option>
                  <option value="fair">Fair</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: "#0a0a0a" }}>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: flagged ? "#dc2626" : score >= 70 ? "#10b981" : "#f59e0b" }}>
                  {score}
                </p>
                <p className="text-[10px] text-gray-500">Readiness Score</p>
              </div>
              {flagged && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Consider a lighter session today.
                </p>
              )}
            </div>
            <Button onClick={handleSubmit} disabled={mutation.isPending} style={{ background: "#8b3dff" }}>
              {mutation.isPending ? "Saving..." : "Submit Check-In"}
            </Button>
          </CardContent>
        </Card>
      )}

      <HealthConnectSection />

      {checkInList.length > 0 && (
        <div>
          <p className="text-gray-400 text-sm mb-2">Recent Check-Ins</p>
          <div className="space-y-1.5">
            {checkInList.slice(0, 7).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-gray-800"
                style={{ background: "#0a0a0a" }}
              >
                <span className="text-gray-400 text-sm">
                  {new Date(c.check_in_date).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  {c.flagged && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  <span
                    className="font-bold text-sm"
                    style={{ color: c.flagged ? "#dc2626" : c.readiness_score >= 70 ? "#10b981" : "#f59e0b" }}
                  >
                    {c.readiness_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}