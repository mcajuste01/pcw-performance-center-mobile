import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Gauge, Plus, TrendingUp } from "lucide-react";
import { toArray } from "./constants";

const METRIC_CATEGORIES = [
  {
    key: "conditioning",
    label: "Conditioning",
    color: "#dc2626",
    metrics: ["Rope runs in 60s", "Bump recovery speed", "Match endurance", "Sprint intervals", "Heart-rate recovery"],
  },
  {
    key: "strength",
    label: "Strength",
    color: "#8b3dff",
    metrics: ["Grip endurance", "Carry strength", "Neck endurance", "Core stability", "Pulling strength"],
  },
  {
    key: "agility",
    label: "Agility",
    color: "#f59e0b",
    metrics: ["Lateral movement", "Footwork speed", "Corner-to-corner movement", "Reaction drills"],
  },
];

export default function WrestlingMetricsSection({ traineeId, traineeName }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    test_date: new Date().toISOString().slice(0, 10),
    category: "conditioning",
    metric_name: "",
    value: "",
    unit: "reps",
  });

  const { data: metrics = [], refetch } = useQuery({
    queryKey: ["wrestling-metrics", traineeId],
    queryFn: () =>
      base44.entities.WrestlingMetric.filter(
        { trainee_id: traineeId },
        "-test_date",
        50
      ),
    enabled: !!traineeId,
  });
  const metricList = toArray(metrics);

  const mutation = useMutation({
    mutationFn: (data) =>
      base44.entities.WrestlingMetric.create({
        ...data,
        trainee_id: traineeId,
        trainee_name: traineeName,
        value: parseFloat(data.value),
      }),
    onSuccess: () => {
      toast({ title: "Metric logged!" });
      setOpen(false);
      setForm({ ...form, metric_name: "", value: "" });
      refetch();
    },
    onError: (e) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const activeCategory = METRIC_CATEGORIES.find((c) => c.key === form.category);
  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Gauge className="w-5 h-5" style={{ color: "#3b82f6" }} />
          Wrestling Performance Metrics
        </h3>
        <Button onClick={() => setOpen(!open)} size="sm" style={{ background: "#8b3dff" }}>
          <Plus className="w-4 h-4 mr-1" /> {open ? "Close" : "Log Metric"}
        </Button>
      </div>

      {open && (
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs">Date</Label>
                <Input
                  type="date"
                  value={form.test_date}
                  onChange={(e) => setForm({ ...form, test_date: e.target.value })}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Category</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value, metric_name: "" })}
                  className={`w-full mt-1 rounded-md border border-gray-800 ${inputCls} px-3 py-2 text-sm`}
                >
                  {METRIC_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Metric</Label>
              <select
                value={form.metric_name}
                onChange={(e) => setForm({ ...form, metric_name: e.target.value })}
                className={`w-full mt-1 rounded-md border border-gray-800 ${inputCls} px-3 py-2 text-sm`}
              >
                <option value="">Select a metric...</option>
                {activeCategory?.metrics.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs">Value</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 25"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Unit</Label>
                <Input
                  placeholder="reps, seconds..."
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
            </div>
            <Button
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending || !form.metric_name || !form.value}
              style={{ background: "#8b3dff" }}
            >
              {mutation.isPending ? "Saving..." : "Save Metric"}
            </Button>
          </CardContent>
        </Card>
      )}

      {METRIC_CATEGORIES.map((cat) => {
        const catMetrics = metricList.filter((m) => m.category === cat.key);
        if (catMetrics.length === 0) return null;
        return (
          <Card key={cat.key} className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: cat.color }}>
                {cat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {catMetrics.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ background: "#0a0a0a" }}
                >
                  <div>
                    <span className="text-white text-sm font-medium">{m.metric_name}</span>
                    <p className="text-[10px] text-gray-500">
                      {new Date(m.test_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-bold text-white">
                    {m.value} <span className="text-xs text-gray-500">{m.unit}</span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
      {metricList.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-6">
          No metrics logged yet. Start tracking wrestling-specific performance.
        </p>
      )}
    </div>
  );
}