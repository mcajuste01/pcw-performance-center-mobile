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
import { Loader2, Plus, X, Dumbbell } from "lucide-react";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);
const FOCUS_OPTIONS = [
  "Strength",
  "Hypertrophy",
  "Conditioning",
  "Power",
  "Mobility",
  "Weight Loss",
  "Core",
];

export default function WorkoutPlanModal({
  open,
  onClose,
  coachId,
  traineeId,
  traineeName,
  trainees,
  onSaved,
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    frequency: "3x per week",
    duration_weeks: 4,
    start_date: new Date().toISOString().slice(0, 10),
  });
  const [focusAreas, setFocusAreas] = useState([]);
  const [exercises, setExercises] = useState([
    { name: "", sets: 3, reps: "8-12", notes: "" },
  ]);
  const [selectedTrainee, setSelectedTrainee] = useState(traineeId || "");

  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        description: "",
        frequency: "3x per week",
        duration_weeks: 4,
        start_date: new Date().toISOString().slice(0, 10),
      });
      setFocusAreas([]);
      setExercises([{ name: "", sets: 3, reps: "8-12", notes: "" }]);
      setSelectedTrainee(traineeId || "");
    }
  }, [open, traineeId]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sc-coach-plans"] });
      queryClient.invalidateQueries({ queryKey: ["sc-trainee-plans"] });
      toast({ title: "Workout plan assigned!" });
      onSaved?.();
      onClose();
    },
    onError: (err) =>
      toast({
        title: "Failed to assign plan",
        description: err.message,
        variant: "destructive",
      }),
  });

  const toggleFocus = (area) =>
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );

  const updateExercise = (idx, field, value) =>
    setExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex))
    );

  const addExercise = () =>
    setExercises((prev) => [...prev, { name: "", sets: 3, reps: "8-12", notes: "" }]);
  const removeExercise = (idx) =>
    setExercises((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (!form.title.trim())
      return toast({ title: "Title is required", variant: "destructive" });
    const targetTrainee = traineeId || selectedTrainee;
    if (!targetTrainee)
      return toast({ title: "Select a trainee", variant: "destructive" });
    const cleanExercises = exercises
      .filter((e) => e.name.trim())
      .map((e) => ({
        name: e.name,
        sets: Number(e.sets) || 3,
        reps: e.reps,
        notes: e.notes,
      }));
    mutation.mutate({
      trainee_id: targetTrainee,
      coach_id: coachId,
      title: form.title,
      description: form.description,
      focus_areas: focusAreas,
      exercises: cleanExercises,
      frequency: form.frequency,
      duration_weeks: Number(form.duration_weeks) || 4,
      start_date: form.start_date,
      status: "active",
    });
  };

  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-lg max-h-[85vh] overflow-y-auto"
        style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5" style={{ color: "#8b3dff" }} />
            Assign Workout Routine
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-300 text-xs">Trainee</Label>
            {traineeId ? (
              <p className="text-white text-sm mt-1 font-medium">
                {traineeName}
              </p>
            ) : (
              <select
                value={selectedTrainee}
                onChange={(e) => setSelectedTrainee(e.target.value)}
                className={`w-full mt-1 rounded-md border border-gray-800 ${inputCls} px-3 py-2 text-sm`}
              >
                <option value="">Select a trainee...</option>
                {toArray(trainees).map((t) => (
                  <option key={t.id} value={t.auth_user_id}>
                    {t.wrestling_name || t.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Plan Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Off-Season Strength Block"
              className={`mt-1 ${inputCls}`}
            />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Description & Goals</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="What's the goal of this program?"
              className={`mt-1 ${inputCls}`}
              rows={2}
            />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Focus Areas</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {FOCUS_OPTIONS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleFocus(area)}
                  className="px-3 py-1 rounded-full text-xs border transition"
                  style={
                    focusAreas.includes(area)
                      ? {
                          background: "rgba(139,61,255,0.2)",
                          color: "#8b3dff",
                          borderColor: "rgba(139,61,255,0.5)",
                        }
                      : {
                          background: "#0a0a0a",
                          color: "#6b7280",
                          borderColor: "#2a2a2a",
                        }
                  }
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-300 text-xs">Frequency</Label>
              <Input
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
                placeholder="3x/week"
                className={`mt-1 ${inputCls}`}
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Weeks</Label>
              <Input
                type="number"
                value={form.duration_weeks}
                onChange={(e) =>
                  setForm({ ...form, duration_weeks: e.target.value })
                }
                className={`mt-1 ${inputCls}`}
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
                className={`mt-1 ${inputCls}`}
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Exercises</Label>
            <div className="space-y-2 mt-2">
              {exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-gray-800 space-y-2"
                  style={{ background: "#0a0a0a" }}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={ex.name}
                      onChange={(e) =>
                        updateExercise(idx, "name", e.target.value)
                      }
                      placeholder="Exercise name"
                      className={`${inputCls} text-sm`}
                    />
                    {exercises.length > 1 && (
                      <button
                        onClick={() => removeExercise(idx)}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={ex.sets}
                      onChange={(e) =>
                        updateExercise(idx, "sets", e.target.value)
                      }
                      placeholder="Sets"
                      className={`${inputCls} text-sm`}
                    />
                    <Input
                      value={ex.reps}
                      onChange={(e) =>
                        updateExercise(idx, "reps", e.target.value)
                      }
                      placeholder="Reps (e.g. 8-12)"
                      className={`${inputCls} text-sm`}
                    />
                  </div>
                  <Input
                    value={ex.notes}
                    onChange={(e) =>
                      updateExercise(idx, "notes", e.target.value)
                    }
                    placeholder="Notes (optional)"
                    className={`${inputCls} text-sm`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addExercise}
              className="mt-2 flex items-center gap-1 text-sm"
              style={{ color: "#8b3dff" }}
            >
              <Plus className="w-4 h-4" /> Add Exercise
            </button>
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
            Assign Routine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}