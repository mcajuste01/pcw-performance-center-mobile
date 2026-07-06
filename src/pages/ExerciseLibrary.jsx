import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Heart,
  Filter,
  Plus,
  Dumbbell,
  Clock,
  Zap,
  ChevronRight,
  Edit2,
  Trash2,
} from "lucide-react";
import ExerciseDetailModal from "@/components/exercises/ExerciseDetailModal";
import ExerciseForm from "@/components/exercises/ExerciseForm";
import { CATEGORIES, MUSCLE_GROUPS, EQUIPMENT_TYPES, DIFFICULTIES, getCategoryStyle } from "@/components/exercises/exerciseConstants";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);



export default function ExerciseLibrary() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: exercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const res = await base44.entities.Exercise.list("-created_date", 100);
      return toArray(res);
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favoriteExercises", user?.id],
    queryFn: async () => {
      const res = await base44.entities.UserFavoriteExercise.filter({
        user_id: user.id,
      });
      return toArray(res);
    },
    enabled: !!user,
  });

  const isCoach = user?.role === "coach" || user?.role === "admin";

  const favoriteExerciseIds = new Set(favorites.map((f) => f.exercise_id));

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (exerciseId) => {
      const existing = favorites.find((f) => f.exercise_id === exerciseId);
      if (existing) {
        await base44.entities.UserFavoriteExercise.delete(existing.id);
      } else {
        await base44.entities.UserFavoriteExercise.create({
          user_id: user.id,
          exercise_id: exerciseId,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(["favoriteExercises"]),
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (id) => base44.entities.Exercise.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["exercises"]),
  });

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch =
        !searchQuery ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchMuscles =
        selectedMuscles.length === 0 ||
        selectedMuscles.some((m) => ex.muscle_groups?.includes(m));

      const matchEquipment =
        selectedEquipment.length === 0 ||
        selectedEquipment.some((e) => ex.equipment?.includes(e));

      const matchCategory =
        !selectedCategory || ex.category === selectedCategory;

      const matchDifficulty =
        !selectedDifficulty || ex.difficulty === selectedDifficulty;

      return matchSearch && matchMuscles && matchEquipment && matchCategory && matchDifficulty;
    });
  }, [exercises, searchQuery, selectedMuscles, selectedEquipment, selectedCategory, selectedDifficulty]);

  const canEdit = isCoach;

  return (
    <div className="min-h-full p-4 md:p-8 overflow-auto" style={{ background: "#0a0a0a" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5" style={{ color: "#8b3dff" }} />
              <span className="text-xs text-gray-500 uppercase tracking-widest">Exercise Library</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Exercise Database
            </h1>
            <p className="text-gray-500 text-sm mt-1">Search, learn, and save your favorite exercises</p>
          </div>
          {canEdit && (
            <Button
              onClick={() => {
                setEditingExercise(null);
                setShowForm(true);
              }}
              className="text-white font-semibold px-6"
              style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white min-h-12"
            />
          </div>

          {/* Filter Pills */}
          <div className="space-y-3">
            {/* Categories */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(selectedCategory === cat.key ? "" : cat.key)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                    style={
                      selectedCategory === cat.key
                        ? { background: `${cat.color}22`, borderColor: `${cat.color}55`, color: cat.color }
                        : { background: "#1a1a1a", borderColor: "#333", color: "#aaa" }
                    }
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Muscle Groups */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Muscle Groups</label>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((muscle) => (
                  <button
                    key={muscle}
                    onClick={() =>
                      setSelectedMuscles(
                        selectedMuscles.includes(muscle)
                          ? selectedMuscles.filter((m) => m !== muscle)
                          : [...selectedMuscles, muscle]
                      )
                    }
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                    style={
                      selectedMuscles.includes(muscle)
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
                    {muscle}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Equipment</label>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_TYPES.map((eq) => (
                  <button
                    key={eq}
                    onClick={() =>
                      setSelectedEquipment(
                        selectedEquipment.includes(eq)
                          ? selectedEquipment.filter((e) => e !== eq)
                          : [...selectedEquipment, eq]
                      )
                    }
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                    style={
                      selectedEquipment.includes(eq)
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
                    {eq}
                  </button>
                ))}
              </div>
            </div>
            {/* Difficulty */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? "" : diff)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border capitalize"
                    style={
                      selectedDifficulty === diff
                        ? { background: "rgba(139,61,255,0.2)", borderColor: "rgba(139,61,255,0.5)", color: "#8b3dff" }
                        : { background: "#1a1a1a", borderColor: "#333", color: "#aaa" }
                    }
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Exercise Grid */}
        {filteredExercises.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 cursor-pointer transition-all group"
                onClick={() => setSelectedExercise(exercise)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-white mb-2">{exercise.name}</CardTitle>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          className="text-xs border capitalize"
                          style={getCategoryStyle(exercise.category)}
                        >
                          {exercise.category}
                        </Badge>
                        {exercise.difficulty && (
                          <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                            {exercise.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteMutation.mutate(exercise.id);
                      }}
                      className="p-2 rounded-lg transition-all hover:bg-zinc-800"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favoriteExerciseIds.has(exercise.id)
                            ? "fill-red-500 text-red-500"
                            : "text-zinc-600 hover:text-red-400"
                        }`}
                      />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {exercise.description && (
                    <p className="text-sm text-gray-400">{exercise.description}</p>
                  )}
                  {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Muscles</p>
                      <div className="flex flex-wrap gap-1">
                        {exercise.muscle_groups.map((m) => (
                          <Badge key={m} variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {exercise.equipment && exercise.equipment.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Equipment</p>
                      <div className="flex flex-wrap gap-1">
                        {exercise.equipment.map((e) => (
                          <Badge key={e} variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
                      View details
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Dumbbell className="w-12 h-12 text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg font-medium">No exercises found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          isFavorited={favoriteExerciseIds.has(selectedExercise.id)}
          onToggleFavorite={() => toggleFavoriteMutation.mutate(selectedExercise.id)}
          canEdit={canEdit}
          onEdit={() => {
            setEditingExercise(selectedExercise);
            setShowForm(true);
            setSelectedExercise(null);
          }}
          onDelete={() => {
            deleteExerciseMutation.mutate(selectedExercise.id);
            setSelectedExercise(null);
          }}
        />
      )}

      {/* Exercise Form Modal */}
      {showForm && (
        <ExerciseForm
          exercise={editingExercise}
          onClose={() => {
            setShowForm(false);
            setEditingExercise(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(["exercises"]);
            setShowForm(false);
            setEditingExercise(null);
          }}
        />
      )}
    </div>
  );
}