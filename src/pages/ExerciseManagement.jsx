import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

const MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "legs", "quads", "hamstrings", "glutes", "calves", "core", "abs", "lower_back", "cardio"
];

const EQUIPMENT = [
  "dumbbells", "barbell", "kettlebell", "resistance_band", "medicine_ball",
  "cable_machine", "bodyweight", "rope", "sandbag", "plate", "machine", "none"
];

export default function ExerciseManagement() {
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    muscle_groups: [],
    equipment: [],
    difficulty: "intermediate",
    category: "strength",
    instructions: "",
    video_url: "",
    sets: "",
    reps: "",
    rest_seconds: "",
    notes: "",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      // Check if user is coach or admin
      if (u.role !== "admin" && u.role !== "coach") {
        navigate("/Dashboard");
        toast.error("Only coaches can manage exercises.");
      }
    });
  }, []);

  const { data: exercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const res = await base44.entities.Exercise.list("-created_date", 200);
      return toArray(res);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Exercise.create({
        ...data,
        created_by: user.id,
        sets: data.sets ? parseInt(data.sets) : undefined,
        rest_seconds: data.rest_seconds ? parseInt(data.rest_seconds) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["exercises"]);
      resetForm();
      toast.success("Exercise created!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Exercise.update(editingId, {
        ...data,
        sets: data.sets ? parseInt(data.sets) : undefined,
        rest_seconds: data.rest_seconds ? parseInt(data.rest_seconds) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["exercises"]);
      resetForm();
      toast.success("Exercise updated!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Exercise.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["exercises"]);
      toast.success("Exercise deleted!");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      muscle_groups: [],
      equipment: [],
      difficulty: "intermediate",
      category: "strength",
      instructions: "",
      video_url: "",
      sets: "",
      reps: "",
      rest_seconds: "",
      notes: "",
    });
    setEditingId(null);
  };

  const handleEdit = (exercise) => {
    setFormData({
      name: exercise.name,
      description: exercise.description || "",
      muscle_groups: exercise.muscle_groups || [],
      equipment: exercise.equipment || [],
      difficulty: exercise.difficulty,
      category: exercise.category,
      instructions: exercise.instructions || "",
      video_url: exercise.video_url || "",
      sets: exercise.sets?.toString() || "",
      reps: exercise.reps || "",
      rest_seconds: exercise.rest_seconds?.toString() || "",
      notes: exercise.notes || "",
    });
    setEditingId(exercise.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Exercise name is required");
      return;
    }
    if (formData.muscle_groups.length === 0) {
      toast.error("Select at least one muscle group");
      return;
    }

    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleMuscle = (muscle) => {
    setFormData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.includes(muscle)
        ? prev.muscle_groups.filter(m => m !== muscle)
        : [...prev.muscle_groups, muscle]
    }));
  };

  const toggleEquipment = (equip) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equip)
        ? prev.equipment.filter(e => e !== equip)
        : [...prev.equipment, equip]
    }));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: "#0a0a0a" }}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Exercise Management
          </h1>
          <p className="text-gray-400">Create and manage exercises in the library.</p>
        </div>

        {/* Form */}
        <Card style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Exercise" : "Add New Exercise"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Exercise Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="e.g., Barbell Bench Press"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="Brief description of the exercise"
                  />
                </div>

                {/* Difficulty & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Difficulty</label>
                    <Select value={formData.difficulty} onValueChange={(v) => setFormData(p => ({ ...p, difficulty: v }))}>
                      <SelectTrigger className="bg-gray-900 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Category</label>
                    <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                      <SelectTrigger className="bg-gray-900 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="conditioning">Conditioning</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                        <SelectItem value="plyometrics">Plyometrics</SelectItem>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="recovery">Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Muscle Groups */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Muscle Groups *</label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map(muscle => (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => toggleMuscle(muscle)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        formData.muscle_groups.includes(muscle)
                          ? "bg-purple-900/40 border-purple-600 text-purple-300"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {muscle.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Equipment</label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT.map(equip => (
                    <button
                      key={equip}
                      type="button"
                      onClick={() => toggleEquipment(equip)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        formData.equipment.includes(equip)
                          ? "bg-blue-900/40 border-blue-600 text-blue-300"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {equip.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Reps/Sets */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Sets</label>
                  <Input
                    type="number"
                    value={formData.sets}
                    onChange={(e) => setFormData(p => ({ ...p, sets: e.target.value }))}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="e.g., 4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Reps</label>
                  <Input
                    value={formData.reps}
                    onChange={(e) => setFormData(p => ({ ...p, reps: e.target.value }))}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="e.g., 8-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Rest (sec)</label>
                  <Input
                    type="number"
                    value={formData.rest_seconds}
                    onChange={(e) => setFormData(p => ({ ...p, rest_seconds: e.target.value }))}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="e.g., 90"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Instructions *</label>
                <Textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData(p => ({ ...p, instructions: e.target.value }))}
                  className="bg-gray-900 border-gray-700 text-white h-32"
                  placeholder="Step-by-step instructions..."
                />
              </div>

              {/* Notes & Video */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Form Tips</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="bg-gray-900 border-gray-700 text-white h-20"
                    placeholder="Additional tips or form notes..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Video URL</label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData(p => ({ ...p, video_url: e.target.value }))}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex items-center gap-2 text-white"
                  style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="w-4 h-4" />
                  {editingId ? "Update Exercise" : "Create Exercise"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="text-gray-400 border-gray-700"
                  >
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Exercises List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Exercise Library ({exercises.length})
          </h2>
          <div className="space-y-3">
            {exercises.map(exercise => (
              <Card
                key={exercise.id}
                style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-1">{exercise.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {exercise.muscle_groups?.map(m => (
                          <Badge key={m} variant="outline" className="text-xs text-gray-300 border-gray-700">
                            {m}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{exercise.category} • {exercise.difficulty}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(exercise)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(exercise.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}