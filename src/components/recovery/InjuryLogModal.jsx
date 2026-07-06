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
import { Loader2, AlertTriangle } from "lucide-react";

const todayStr = () => new Date().toISOString().slice(0, 10);
const BODY_AREAS = ["Neck", "Shoulder", "Elbow", "Wrist", "Lower Back", "Hip", "Knee", "Ankle", "Hamstring", "Quad", "Groin", "Calf", "Other"];

export default function InjuryLogModal({ open, onClose, traineeId, traineeName }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bodyArea, setBodyArea] = useState("Lower Back");
  const [injuryType, setInjuryType] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayStr());

  useEffect(() => {
    if (open) {
      setBodyArea("Lower Back"); setInjuryType(""); setSeverity("mild");
      setDescription(""); setDate(todayStr());
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.InjuryCheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery-injuries", traineeId] });
      toast({ title: "Injury logged" });
      onClose();
    },
    onError: (err) => toast({ title: "Failed to log", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!bodyArea) return toast({ title: "Select a body area", variant: "destructive" });
    mutation.mutate({
      trainee_id: traineeId,
      trainee_name: traineeName,
      check_in_date: date,
      body_area: bodyArea,
      injury_type: injuryType || "General soreness",
      severity,
      description,
      status: "active",
    });
  };

  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";
  const sevOptions = [
    { key: "mild", label: "Mild", color: "#10b981" },
    { key: "moderate", label: "Moderate", color: "#f59e0b" },
    { key: "severe", label: "Severe", color: "#dc2626" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Log Injury
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs">Body Area</Label>
              <select value={bodyArea} onChange={(e) => setBodyArea(e.target.value)}
                className={`w-full mt-1 rounded-md border border-gray-800 ${inputCls} px-3 py-2 text-sm`}>
                {BODY_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`mt-1 ${inputCls}`} />
            </div>
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Injury Type</Label>
            <Input value={injuryType} onChange={(e) => setInjuryType(e.target.value)} placeholder="e.g. Strain, sprain, bruise" className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <Label className="text-gray-300 text-xs mb-1 block">Severity</Label>
            <div className="flex gap-1.5">
              {sevOptions.map((o) => (
                <button key={o.key} onClick={() => setSeverity(o.key)}
                  className="flex-1 py-1.5 rounded-md text-xs border transition"
                  style={severity === o.key
                    ? { background: `${o.color}22`, borderColor: `${o.color}66`, color: o.color }
                    : { background: "#0a0a0a", borderColor: "#2a2a2a", color: "#6b7280" }}
                >{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened? When did it start?" className={`mt-1 ${inputCls}`} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Log Injury
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}