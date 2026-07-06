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
import { User, Target, AlertTriangle, Shield } from "lucide-react";
import { PROGRESS_LEVELS, getLevelInfo, toArray } from "./constants";

export default function FitnessProfileSection({ traineeId, traineeName, isCoach }) {
  const { toast } = useToast();
  const [form, setForm] = useState(null);

  const { data: profile } = useQuery({
    queryKey: ["fitness-profile", traineeId],
    queryFn: () =>
      base44.entities.FitnessProfile.filter({ trainee_id: traineeId }),
    enabled: !!traineeId,
  });

  const existing = toArray(profile)[0];

  useEffect(() => {
    if (existing) {
      setForm({
        experience_level: existing.experience_level || "beginner",
        goals: existing.goals || "",
        injuries: existing.injuries || "",
        restrictions: existing.restrictions || "",
        notes: existing.notes || "",
        current_level: existing.current_level || "foundation",
      });
    } else {
      setForm({
        experience_level: "beginner",
        goals: "",
        injuries: "",
        restrictions: "",
        notes: "",
        current_level: "foundation",
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (data) =>
      existing
        ? base44.entities.FitnessProfile.update(existing.id, data)
        : base44.entities.FitnessProfile.create({
            ...data,
            trainee_id: traineeId,
            trainee_name: traineeName,
          }),
    onSuccess: () => toast({ title: "Profile saved" }),
    onError: (e) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  if (!form) return null;
  const levelInfo = getLevelInfo(form.current_level);
  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";

  return (
    <div className="space-y-4">
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <User className="w-5 h-5" style={{ color: "#8b3dff" }} />
            Trainee Fitness Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300 text-xs">Current Progress Level</Label>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {PROGRESS_LEVELS.map((lvl) => (
                <button
                  key={lvl.key}
                  type="button"
                  disabled={!isCoach}
                  onClick={() => setForm({ ...form, current_level: lvl.key })}
                  className="px-3 py-1 rounded-full text-xs border transition disabled:opacity-50"
                  style={
                    form.current_level === lvl.key
                      ? { background: `${lvl.color}25`, color: lvl.color, borderColor: lvl.color }
                      : { background: "#0a0a0a", color: "#6b7280", borderColor: "#2a2a2a" }
                  }
                >
                  {lvl.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{levelInfo.description}</p>
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Experience Level</Label>
            <div className="flex gap-2 mt-2">
              {["beginner", "intermediate", "advanced"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setForm({ ...form, experience_level: lvl })}
                  className="px-3 py-1 rounded-full text-xs border transition capitalize"
                  style={
                    form.experience_level === lvl
                      ? { background: "rgba(139,61,255,0.2)", color: "#8b3dff", borderColor: "rgba(139,61,255,0.5)" }
                      : { background: "#0a0a0a", color: "#6b7280", borderColor: "#2a2a2a" }
                  }
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-gray-300 text-xs flex items-center gap-1">
              <Target className="w-3 h-3" /> Goals
            </Label>
            <Textarea
              value={form.goals}
              onChange={(e) => setForm({ ...form, goals: e.target.value })}
              placeholder="e.g. Build strength, improve cardio, prepare for first match..."
              className={`mt-1 ${inputCls}`}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Injuries
              </Label>
              <Textarea
                value={form.injuries}
                onChange={(e) => setForm({ ...form, injuries: e.target.value })}
                placeholder="Current or past injuries..."
                className={`mt-1 ${inputCls}`}
                rows={2}
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs flex items-center gap-1">
                <Shield className="w-3 h-3" /> Restrictions
              </Label>
              <Textarea
                value={form.restrictions}
                onChange={(e) => setForm({ ...form, restrictions: e.target.value })}
                placeholder="Movement or medical restrictions..."
                className={`mt-1 ${inputCls}`}
                rows={2}
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Additional Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Coach or personal notes..."
              className={`mt-1 ${inputCls}`}
              rows={2}
            />
          </div>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            style={{ background: "#8b3dff" }}
          >
            {mutation.isPending ? "Saving..." : existing ? "Update Profile" : "Create Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}