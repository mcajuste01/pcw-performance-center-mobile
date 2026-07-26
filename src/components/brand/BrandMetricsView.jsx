import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Plus, Loader2, Globe, User } from "lucide-react";
import { toast } from "sonner";
import { PLATFORMS, toArray } from "./brandConstants";

export default function BrandMetricsView({ user, traineeId, traineeName }) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState(traineeId ? "trainee" : "account");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: "instagram", follower_count: "", engagement_note: "" });
  const [logging, setLogging] = useState(false);

  const queryKey = scope === "account"
    ? ["brand-metrics-account"]
    : ["brand-metrics-trainee", traineeId];

  const { data: metrics = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      if (scope === "account") {
        const res = await base44.entities.BrandMetric.filter({ account_wide: true }, "-logged_at", 50);
        return toArray(res);
      } else {
        const res = await base44.entities.BrandMetric.filter({ athlete_id: traineeId }, "-logged_at", 50);
        return toArray(res);
      }
    },
    enabled: scope === "account" || !!traineeId,
  });

  // Group by platform for trend charts
  const byPlatform = {};
  metrics.forEach(m => {
    if (!byPlatform[m.platform]) byPlatform[m.platform] = [];
    byPlatform[m.platform].push(m);
  });

  const chartData = {};
  Object.entries(byPlatform).forEach(([platform, items]) => {
    chartData[platform] = [...items].reverse().map(m => ({
      date: new Date(m.logged_at || m.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      followers: m.follower_count || 0,
    }));
  });

  const handleLog = async () => {
    if (!form.follower_count) { toast.error("Enter a follower count"); return; }
    setLogging(true);
    try {
      await base44.functions.invoke("logBrandMetric", {
        athlete_id: scope === "trainee" ? traineeId : null,
        account_wide: scope === "account",
        platform: form.platform,
        follower_count: parseInt(form.follower_count) || 0,
        engagement_note: form.engagement_note,
        logged_by_name: user?.full_name || "",
      });
      toast.success("Metric logged!");
      queryClient.invalidateQueries({ queryKey });
      setShowForm(false);
      setForm({ platform: "instagram", follower_count: "", engagement_note: "" });
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to log metric");
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: "#8b3dff" }} />
          <h3 className="text-white font-semibold text-sm">Metrics</h3>
          {traineeId && (
            <div className="flex gap-1 ml-2">
              <button onClick={() => setScope("trainee")} className="text-xs px-2 py-0.5 rounded flex items-center gap-1" style={{ background: scope === "trainee" ? "rgba(139,61,255,0.15)" : "transparent", color: scope === "trainee" ? "#8b3dff" : "#6b7280" }}>
                <User className="w-3 h-3" /> {traineeName}
              </button>
              <button onClick={() => setScope("account")} className="text-xs px-2 py-0.5 rounded flex items-center gap-1" style={{ background: scope === "account" ? "rgba(139,61,255,0.15)" : "transparent", color: scope === "account" ? "#8b3dff" : "#6b7280" }}>
                <Globe className="w-3 h-3" /> Account-wide
              </button>
            </div>
          )}
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} style={{ background: "#8b3dff" }}>
          <Plus className="w-3.5 h-3.5" /> Log Metric
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-800 p-4 space-y-3" style={{ background: "#0f0f0f" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs">Platform</Label>
              <Select value={form.platform} onValueChange={v => setForm({ ...form, platform: v })}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORMS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Follower Count</Label>
              <Input type="number" value={form.follower_count} onChange={e => setForm({ ...form, follower_count: e.target.value })} placeholder="0" className="bg-gray-900 border-gray-700 text-white mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Engagement Notes</Label>
            <Input value={form.engagement_note} onChange={e => setForm({ ...form, engagement_note: e.target.value })} placeholder="e.g., High engagement on promo reel" className="bg-gray-900 border-gray-700 text-white mt-1" />
          </div>
          <Button size="sm" onClick={handleLog} disabled={logging} style={{ background: "#10b981" }}>
            {logging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Metric"}
          </Button>
        </div>
      )}

      {/* Trend charts per platform */}
      {metrics.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">No metrics logged yet</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(chartData).map(([platform, data]) => {
            const meta = PLATFORMS[platform] || PLATFORMS.other;
            const latest = data[data.length - 1]?.followers || 0;
            return (
              <div key={platform} className="rounded-xl border border-gray-800 p-3" style={{ background: "#0f0f0f" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-300">{meta.label}</span>
                  <span className="text-lg font-bold text-white">{latest.toLocaleString()}</span>
                </div>
                {data.length > 1 ? (
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={data}>
                      <Line type="monotone" dataKey="followers" stroke={meta.color} strokeWidth={2} dot={false} />
                      <XAxis dataKey="date" stroke="#444" fontSize={9} interval="preserveStartEnd" />
                      <YAxis stroke="#444" fontSize={9} width={30} />
                      <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #333", fontSize: 11 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-600 text-center py-4">Single data point</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}