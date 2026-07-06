import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Apple, Plus, Trash2, Droplet, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import MealLogModal from "@/components/nutrition/MealLogModal";
import MacroTracker from "@/components/nutrition/MacroTracker";
import CalorieTrends from "@/components/nutrition/CalorieTrends";
import { toArray } from "@/components/perflab/constants";
import { MEAL_TYPES, getMealType, calculateTargets, GOALS, getWeightClass } from "@/components/nutrition/nutritionConstants";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function NutritionCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [activeTab, setActiveTab] = useState("today");
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultMealType, setDefaultMealType] = useState("");
  const [goal, setGoal] = useState("maintain");

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const isCoach = user?.role === "coach" || user?.role === "admin";
  const traineeId = isCoach ? null : user?.id;

  const { data: trainees = [] } = useQuery({
    queryKey: ["nutrition-trainees"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.filter({ role: "trainee" });
      return toArray(res);
    },
    enabled: isCoach,
  });
  const [coachTraineeId, setCoachTraineeId] = useState("");
  useEffect(() => {
    if (isCoach && !coachTraineeId && trainees.length > 0) {
      setCoachTraineeId(trainees[0].auth_user_id);
    }
  }, [isCoach, coachTraineeId, trainees]);
  const activeTraineeId = isCoach ? coachTraineeId : traineeId;
  const traineeName = isCoach
    ? trainees.find((t) => t.auth_user_id === coachTraineeId)?.wrestling_name || ""
    : user?.full_name || "";

  // Latest body weight for target calculation
  const { data: bodyStats = [] } = useQuery({
    queryKey: ["nutrition-body-stats", activeTraineeId],
    queryFn: async () => {
      const res = await base44.entities.BodyStat.filter({ trainee_id: activeTraineeId }, "-date", 10);
      return toArray(res);
    },
    enabled: !!activeTraineeId,
  });
  const currentWeight = bodyStats.find((b) => b.weight)?.weight || null;
  const targets = useMemo(() => calculateTargets(currentWeight, goal), [currentWeight, goal]);
  const weightClass = getWeightClass(currentWeight);

  // Meals for selected date
  const { data: meals = [] } = useQuery({
    queryKey: ["nutrition-meals", activeTraineeId],
    queryFn: async () => {
      const res = await base44.entities.MealLog.filter({ trainee_id: activeTraineeId }, "-meal_date", 100);
      return toArray(res);
    },
    enabled: !!activeTraineeId,
  });

  // Delete meal
  const deleteMeal = async (id) => {
    try {
      await base44.entities.MealLog.delete(id);
      queryClient.invalidateQueries({ queryKey: ["nutrition-meals", activeTraineeId] });
      toast({ title: "Meal deleted" });
    } catch (err) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const dayMeals = meals.filter((m) => m.meal_date === selectedDate);
  const totals = useMemo(() => {
    return dayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein_grams || 0),
        carbs: acc.carbs + (m.carb_grams || 0),
        fat: acc.fat + (m.fat_grams || 0),
        water: acc.water + (m.water_oz || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
    );
  }, [dayMeals]);

  // Group day's meals by meal type
  const mealsByType = MEAL_TYPES.map((mt) => ({
    ...mt,
    meals: dayMeals.filter((m) => m.meal_type === mt.key),
  })).filter((mt) => mt.meals.length > 0);

  const shiftDate = (days) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const isToday = selectedDate === todayStr();
  const isFuture = selectedDate > todayStr();

  if (!user) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <Apple className="w-8 h-8 text-green-500 animate-pulse" />
      </div>
    );
  }

  if (!activeTraineeId) {
    return (
      <div className="min-h-full flex items-center justify-center p-4" style={{ background: "#0a0a0a" }}>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const TABS = [
    { key: "today", label: "Daily Log", icon: Apple },
    { key: "trends", label: "Trends", icon: TrendingUp },
  ];

  return (
    <div className="min-h-full p-4 md:p-8 overflow-auto" style={{ background: "#0a0a0a" }}>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Apple className="w-5 h-5 text-green-500" />
              <span className="text-xs text-gray-500 uppercase tracking-widest">Nutrition</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Fueling Center
            </h1>
            <p className="text-gray-500 text-sm mt-1">Track macros, hydration, and weight-class goals</p>
          </div>
          <Button onClick={() => { setDefaultMealType(""); setModalOpen(true); }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 self-start">
            <Plus className="w-4 h-4 mr-2" /> Log Meal
          </Button>
        </div>

        {/* Coach trainee selector */}
        {isCoach && (
          <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-xs text-gray-500 uppercase">Viewing:</span>
              <select value={coachTraineeId} onChange={(e) => setCoachTraineeId(e.target.value)}
                className="flex-1 rounded-md border border-gray-800 bg-[#0a0a0a] text-white px-3 py-1.5 text-sm">
                {trainees.map((t) => (
                  <option key={t.id} value={t.auth_user_id}>{t.wrestling_name || t.full_name}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {/* Goal + weight context */}
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                <Droplet className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {currentWeight ? `${currentWeight} lbs` : "No weight logged"}
                  {weightClass && <span className="text-gray-500 ml-2">· {weightClass.label}</span>}
                </p>
                <p className="text-[10px] text-gray-500">Targets based on weight & goal</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {GOALS.map((g) => (
                <button key={g.key} onClick={() => setGoal(g.key)}
                  className="px-3 py-1.5 rounded-md text-xs border transition"
                  style={goal === g.key
                    ? { background: `${g.color}22`, borderColor: `${g.color}66`, color: g.color }
                    : { background: "#0a0a0a", borderColor: "#2a2a2a", color: "#6b7280" }}
                >{g.label}</button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition border"
                style={activeTab === tab.key
                  ? { background: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.4)", color: "#10b981" }
                  : { background: "#1a1a1a", borderColor: "#2a2a2a", color: "#9ca3af" }}
              >
                <TabIcon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "today" && (
          <>
            {/* Date navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => shiftDate(-1)} className="p-1.5 rounded-md hover:bg-gray-900 text-gray-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white text-sm font-semibold">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                {isToday && <span className="text-green-400 ml-2 text-xs">(Today)</span>}
              </span>
              <button onClick={() => shiftDate(1)} disabled={isFuture} className="p-1.5 rounded-md hover:bg-gray-900 text-gray-400 disabled:opacity-30">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Macro tracker */}
            {targets ? (
              <MacroTracker totals={totals} targets={targets} />
            ) : (
              <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
                <CardContent className="py-6 text-center">
                  <p className="text-gray-400 text-sm">Log your body weight in the S&C dashboard to get personalized macro targets</p>
                </CardContent>
              </Card>
            )}

            {/* Meals grouped by type */}
            {mealsByType.length === 0 ? (
              <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
                <CardContent className="py-10 text-center">
                  <Apple className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No meals logged for this day</p>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white mt-3" onClick={() => { setDefaultMealType(""); setModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Log First Meal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {mealsByType.map((mt) => {
                  const MealIcon = mt.icon;
                  const typeCalories = mt.meals.reduce((s, m) => s + (m.calories || 0), 0);
                  return (
                    <div key={mt.key}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <MealIcon className="w-4 h-4" style={{ color: mt.color }} />
                        <span className="text-white text-sm font-semibold">{mt.label}</span>
                        <span className="text-xs text-gray-500">{typeCalories} cal</span>
                        <button onClick={() => { setDefaultMealType(mt.key); setModalOpen(true); }}
                          className="ml-auto text-gray-500 hover:text-white p-1 rounded">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {mt.meals.map((m) => (
                          <Card key={m.id} className="border-gray-800" style={{ background: "#0a0a0a" }}>
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className="w-1 h-8 rounded-full shrink-0" style={{ background: mt.color }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{m.food_name}</p>
                                <p className="text-xs text-gray-500">
                                  {m.calories} cal
                                  {m.protein_grams > 0 && <span className="text-red-400 ml-2">{m.protein_grams}p</span>}
                                  {m.carb_grams > 0 && <span className="text-yellow-400 ml-1">{m.carb_grams}c</span>}
                                  {m.fat_grams > 0 && <span className="text-purple-400 ml-1">{m.fat_grams}f</span>}
                                  {m.serving_size && <span className="text-gray-600 ml-2">· {m.serving_size}</span>}
                                </p>
                              </div>
                              {m.water_oz > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-cyan-400 shrink-0">
                                  <Droplet className="w-3 h-3" />{m.water_oz}oz
                                </span>
                              )}
                              <button onClick={() => deleteMeal(m.id)} className="text-gray-600 hover:text-red-400 p-1 shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "trends" && (
          <CalorieTrends meals={meals} />
        )}
      </div>

      {modalOpen && (
        <MealLogModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          traineeId={activeTraineeId}
          traineeName={traineeName}
          defaultMealType={defaultMealType}
        />
      )}
    </div>
  );
}