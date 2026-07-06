import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, MUSCLE_GROUPS, EQUIPMENT_TYPES, DIFFICULTIES } from "@/components/exercises/exerciseConstants";



export default function ExerciseForm({ exercise, onClose, onSuccess }) {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: exercise?.name || "",
    description: exercise?.description || "",
    muscle_groups: exercise?.muscle_groups || [],
    equipment: exercise?.equipment || [],
    difficulty: exercise?.difficulty || "intermediate",
    category: exercise?.category || "strength",
    instructions: exercise?.instructions || "",
    tips: exercise?.tips || "",
    video_url: exercise?.video_url || "",
    image_url: exercise?.image_url || "",
    sets: exercise?.sets || "",
    reps: exercise?.reps || "",
    rest_seconds: exercise?.rest_seconds || 60,
  });

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const toggleMuscle = (muscle) => {
    setForm((f) => ({
      ...f,
      muscle_groups: f.muscle_groups.includes(muscle)
        ? f.muscle_groups.filter((m) => m !== muscle)
        : [...f.muscle_groups, muscle],
    }));
  };

  const toggleEquipment = (eq) => {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(eq)
        ? f.equipment.filter((e) => e !== eq)
        : [...f.equipment, eq],
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        rest_seconds: parseInt(form.rest_seconds),
        created_by: user?.id,
      };

      if (exercise) {
        await base44.entities.Exercise.update(exercise.id, payload);
      } else {
        await base44.entities.Exercise.create(payload);
      }
    },
    onSuccess: () => {
      toast.success(exercise ? "Exercise updated" : "Exercise created");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to save exercise");
    },
  });

  const isValid = form.name && form.muscle_groups.length > 0 && form.instructions;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exercise ? "Edit Exercise" : "Add New Exercise"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Exercise Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="e.g., Barbell Bench Press"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Description</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="Brief description of the exercise"
              />
            </div>
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Difficulty</label>
              <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Muscle Groups */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Muscle Groups *</label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMuscle(m)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                  style={
                    form.muscle_groups.includes(m)
                      ? {
                          background: "rgba(220,38,38,0.2)",
                          borderColor: "rgba(220,38,38,0.5)",
                          color: "#dc2626",
                        }
                      : {
                          background: "#1a1a1a",
                          borderColor: "#333",
                          color: "#aaa",
                        }
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_TYPES.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleEquipment(e)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                  style={
                    form.equipment.includes(e)
                      ? {
                          background: "rgba(16,185,129,0.2)",
                          borderColor: "rgba(16,185,129,0.5)",
                          color: "#10b981",
                        }
                      : {
                          background: "#1a1a1a",
                          borderColor: "#333",
                          color: "#aaa",
                        }
                  }
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Instructions *</label>
            <Textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white h-24"
              placeholder="Step-by-step instructions..."
            />
          </div>

          {/* Tips */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Form Tips</label>
            <Textarea
              value={form.tips}
              onChange={(e) => setForm({ ...form, tips: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white h-20"
              placeholder="Common mistakes and form cues..."
            />
          </div>

          {/* Sets, Reps, Rest */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Sets</label>
              <Input
                value={form.sets}
                onChange={(e) => setForm({ ...form, sets: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="e.g., 3-4"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Reps</label>
              <Input
                value={form.reps}
                onChange={(e) => setForm({ ...form, reps: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="e.g., 8-12"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Rest (sec)</label>
              <Input
                type="number"
                value={form.rest_seconds}
                onChange={(e) => setForm({ ...form, rest_seconds: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Video URL</label>
            <Input
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="YouTube or Vimeo link"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Image URL</label>
            <Input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Image URL for exercise reference photo"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
            <Button variant="outline" onClick={onClose} className="border-zinc-700 text-gray-400">
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!isValid || saveMutation.isPending}
              className="text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}
            >
              {saveMutation.isPending ? "Saving..." : exercise ? "Update Exercise" : "Create Exercise"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}