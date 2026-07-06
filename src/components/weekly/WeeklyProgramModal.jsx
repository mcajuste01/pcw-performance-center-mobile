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
import { Loader2, Plus, X, Dumbbell, Moon } from "lucide-react";
import { PROGRESS_LEVELS, getLevelInfo } from "@/components/perflab/constants";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FOCUS_OPTIONS = ["Strength", "Hypertrophy", "Conditioning", "Power", "Mobility", "Core", "Recovery"];

const blankDay = (day) => ({ day, focus: "", is_rest_day: false, exercises: [] });
const blankExercise = () => ({ name: "", sets: 3, reps: "8-12", notes: "" });

export default function WeeklyProgramModal({ open, onClose, coachId, trainees, level, onSaved, preselectedTrainee }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    frequency: "5x per week",
    duration_weeks: 4,
    start_date: new Date().toISOString().slice(0, 10),
  });
  const [selectedLevel, setSelectedLevel] = useState(level || "foundation");
  const [selectedTrainee, setSelectedTrainee] = useState("");
  const [schedule, setSchedule] = useState(DAYS.map(blankDay));

  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        description: "",
        frequency: "5x per week",
        duration_weeks: 4,
        start_date: new Date().toISOString().slice(0, 10),
      });
      setSelectedLevel(level || "foundation");
      setSelectedTrainee(preselectedTrainee || "");
      setSchedule(DAYS.map(blankDay));
    }
  }, [open, level, preselectedTrainee]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-programs"] });
      toast({ title: "Weekly program assigned!" });
      onSaved?.();
      onClose();
    },
    onError: (err) =>
      toast({ title: "Failed to assign program", description: err.message, variant: "destructive" }),
  });

  const updateDay = (idx, patch) =>
    setSchedule((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));

  const toggleRest = (idx) =>
    updateDay(idx, { is_rest_day: !schedule[idx].is_rest_day, exercises: schedule[idx].is_rest_day ? schedule[idx].exercises : [] });

  const addExercise = (idx) =>
    updateDay(idx, { exercises: [...schedule[idx].exercises, blankExercise()] });

  const updateExercise = (dayIdx, exIdx, field, value) =>
    setSchedule((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, exercises: d.exercises.map((ex, j) => (j === exIdx ? { ...ex, [field]: value } : ex)) }
          : d
      )
    );

  const removeExercise = (dayIdx, exIdx) =>
    setSchedule((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d
      )
    );

  const handleSubmit = () => {
    if (!form.title.trim()) return toast({ title: "Title is required", variant: "destructive" });
    if (!selectedTrainee) return toast({ title: "Select a trainee", variant: "destructive" });
    const cleanSchedule = schedule.map((d) => ({
      day: d.day,
      focus: d.is_rest_day ? "" : d.focus,
      is_rest_day: d.is_rest_day,
      exercises: d.is_rest_day
        ? []
        : d.exercises
            .filter((e) => e.name.trim())
            .map((e) => ({
              name: e.name,
              sets: Number(e.sets) || 3,
              reps: e.reps,
              notes: e.notes,
            })),
    }));
    mutation.mutate({
      trainee_id: selectedTrainee,
      coach_id: coachId,
      title: form.title,
      description: form.description,
      level: selectedLevel,
      weekly_schedule: cleanSchedule,
      frequency: form.frequency,
      duration_weeks: Number(form.duration_weeks) || 4,
      start_date: form.start_date,
      status: "active",
    });
  };

  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";
  const lvl = getLevelInfo(selectedLevel);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[88vh] overflow-y-auto"
        style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5" style={{ color: lvl.color }} />
            Build Weekly Program
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Trainee + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs">Trainee</Label>
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
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Target Level</Label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className={`w-full mt-1 rounded-md border border-gray-800 ${inputCls} px-3 py-2 text-sm`}
              >
                {PROGRESS_LEVELS.map((l) => (
                  <option key={l.key} value={l.key}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-gray-300 text-xs">Program Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Foundation Week 1 - Base Building"
              className={`mt-1 ${inputCls}`}
            />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Description & Goals</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's the goal of this weekly block?"
              className={`mt-1 ${inputCls}`}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-300 text-xs">Frequency</Label>
              <Input
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className={`mt-1 ${inputCls}`}
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Weeks</Label>
              <Input
                type="number"
                value={form.duration_weeks}
                onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })}
                className={`mt-1 ${inputCls}`}
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className={`mt-1 ${inputCls}`}
              />
            </div>
          </div>

          {/* Day-by-day builder */}
          <div>
            <Label className="text-gray-300 text-xs mb-2 block">Weekly Schedule</Label>
            <div className="space-y-2">
              {schedule.map((day, idx) => (
                <div
                  key={day.day}
                  className="rounded-lg border p-3"
                  style={{
                    background: "#0a0a0a",
                    borderColor: day.is_rest_day ? "#1f1f1f" : `${lvl.color}33`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-semibold">{day.day}</span>
                    <button
                      type="button"
                      onClick={() => toggleRest(idx)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition"
                      style={
                        day.is_rest_day
                          ? { background: "rgba(96,165,250,0.15)", borderColor: "rgba(96,165,250,0.4)", color: "#60a5fa" }
                          : { background: "transparent", borderColor: "#2a2a2a", color: "#6b7280" }
                      }
                    >
                      <Moon className="w-3 h-3" /> {day.is_rest_day ? "Rest Day" : "Training"}
                    </button>
                  </div>

                  {day.is_rest_day ? (
                    <p className="text-xs text-gray-600 italic">Active recovery / rest</p>
                  ) : (
                    <>
                      <Input
                        value={day.focus}
                        onChange={(e) => updateDay(idx, { focus: e.target.value })}
                        placeholder="Session focus (e.g. Upper Body Strength)"
                        list="focus-options"
                        className={`mb-2 ${inputCls} text-sm`}
                      />
                      <datalist id="focus-options">
                        {FOCUS_OPTIONS.map((f) => <option key={f} value={f} />)}
                      </datalist>

                      <div className="space-y-1.5">
                        {day.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="flex items-center gap-2">
                            <Input
                              value={ex.name}
                              onChange={(e) => updateExercise(idx, exIdx, "name", e.target.value)}
                              placeholder="Exercise"
                              className={`${inputCls} text-xs flex-1`}
                            />
                            <Input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateExercise(idx, exIdx, "sets", e.target.value)}
                              placeholder="Sets"
                              className={`${inputCls} text-xs w-16`}
                            />
                            <Input
                              value={ex.reps}
                              onChange={(e) => updateExercise(idx, exIdx, "reps", e.target.value)}
                              placeholder="Reps"
                              className={`${inputCls} text-xs w-20`}
                            />
                            <button
                              type="button"
                              onClick={() => removeExercise(idx, exIdx)}
                              className="text-gray-500 hover:text-red-400 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addExercise(idx)}
                        className="mt-1.5 flex items-center gap-1 text-xs"
                        style={{ color: lvl.color }}
                      >
                        <Plus className="w-3 h-3" /> Add Exercise
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending} style={{ background: lvl.color }}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Assign Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}