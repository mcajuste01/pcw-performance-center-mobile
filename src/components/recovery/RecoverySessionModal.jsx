import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, HeartPulse } from "lucide-react";
import { RECOVERY_ACTIVITIES, RECOVERY_CATEGORIES, INTENSITY_OPTIONS, EFFECT_OPTIONS, getActivity } from "./recoveryConstants";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function RecoverySessionModal({ open, onClose, traineeId, traineeName }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activity, setActivity] = useState("");
  const [duration, setDuration] = useState(10);
  const [intensity, setIntensity] = useState("light");
  const [effect, setEffect] = useState("good");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setActivity(""); setDuration(10); setIntensity("light");
      setEffect("good"); setDate(todayStr()); setNotes("");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.RecoverySession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery-sessions", traineeId] });
      toast({ title: "Recovery session logged!" });
      onClose();
    },
    onError: (err) => toast({ title: "Failed to log", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!activity) return toast({ title: "Select an activity", variant: "destructive" });
    const act = getActivity(activity);
    mutation.mutate({
      trainee_id: traineeId,
      trainee_name: traineeName,
      activity,
      activity_name: act?.name || activity,
      category: act?.category || "mobility",
      duration_minutes: Number(duration) || 0,
      intensity,
      perceived_effect: effect,
      session_date: date,
      notes,
    });
  };

  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-green-500" /> Log Recovery Session
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-300 text-xs mb-2 block">Activity</Label>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {RECOVERY_CATEGORIES.map((cat) => {
                const acts = RECOVERY_ACTIVITIES.filter((a) => a.category === cat.key);
                if (acts.length === 0) return null;
                return (
                  <div key={cat.key}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">{cat.name}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {acts.map((a) => (
                        <button
                          key={a.key}
                          onClick={() => { setActivity(a.key); setDuration(a.default_minutes); }}
                          className="text-left p-2 rounded-lg border transition text-xs"
                          style={activity === a.key
                            ? { background: `${cat.color}22`, borderColor: `${cat.color}66`, color: "#fff" }
                            : { background: "#0a0a0a", borderColor: "#2a2a2a", color: "#9ca3af" }}
                        >{a.name}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs">Duration (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`mt-1 ${inputCls}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Intensity</Label>
              <div className="flex gap-1.5">
                {INTENSITY_OPTIONS.map((o) => (
                  <button key={o.key} onClick={() => setIntensity(o.key)}
                    className="flex-1 py-1.5 rounded-md text-xs border transition"
                    style={intensity === o.key
                      ? { background: `${o.color}22`, borderColor: `${o.color}66`, color: o.color }
                      : { background: "#0a0a0a", borderColor: "#2a2a2a", color: "#6b7280" }}
                  >{o.label}</button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-xs mb-1 block">Perceived Effect</Label>
              <div className="flex gap-1.5">
                {EFFECT_OPTIONS.map((o) => (
                  <button key={o.key} onClick={() => setEffect(o.key)}
                    className="flex-1 py-1.5 rounded-md text-xs border transition"
                    style={effect === o.key
                      ? { background: `${o.color}22`, borderColor: `${o.color}66`, color: o.color }
                      : { background: "#0a0a0a", borderColor: "#2a2a2a", color: "#6b7280" }}
                  >{o.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel?" className={`mt-1 ${inputCls}`} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Log Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}