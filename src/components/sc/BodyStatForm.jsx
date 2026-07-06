import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const FIELDS = [
  { key: "weight", label: "Weight (lbs)", placeholder: "185" },
  { key: "body_fat_percent", label: "Body Fat (%)", placeholder: "15.5" },
  { key: "chest", label: "Chest (in)", placeholder: "42" },
  { key: "waist", label: "Waist (in)", placeholder: "32" },
  { key: "hips", label: "Hips (in)", placeholder: "40" },
  { key: "arm", label: "Arm (in)", placeholder: "15" },
  { key: "thigh", label: "Thigh (in)", placeholder: "24" },
];

export default function BodyStatForm({
  open,
  onClose,
  traineeId,
  traineeName,
  onSaved,
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
      setValues({});
      setNotes("");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.BodyStat.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["body-stats"] });
      toast({ title: "Body stats logged" });
      onSaved?.();
      onClose();
    },
    onError: (err) =>
      toast({
        title: "Failed to log stats",
        description: err.message,
        variant: "destructive",
      }),
  });

  const handleSubmit = () => {
    const payload = {
      trainee_id: traineeId,
      date,
      notes,
      trainee_name: traineeName,
    };
    for (const f of FIELDS) {
      const v = parseFloat(values[f.key]);
      if (!isNaN(v)) payload[f.key] = v;
    }
    mutation.mutate(payload);
  };

  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md"
        style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">Log Body Stats</DialogTitle>
          {traineeName && (
            <p className="text-sm text-gray-400">For {traineeName}</p>
          )}
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-300 text-xs">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <Label className="text-gray-300 text-xs">{f.label}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={f.placeholder}
                  value={values[f.key] || ""}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.value })
                  }
                  className={`mt-1 ${inputCls}`}
                />
              </div>
            ))}
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Notes</Label>
            <Textarea
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`mt-1 ${inputCls}`}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            style={{ background: "#8b3dff" }}
          >
            {mutation.isPending && (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            )}
            Save Stats
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}