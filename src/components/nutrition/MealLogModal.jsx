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
import { Loader2, Plus, Search } from "lucide-react";
import { MEAL_TYPES, COMMON_FOODS } from "./nutritionConstants";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function MealLogModal({ open, onClose, traineeId, traineeName, defaultMealType }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mealType, setMealType] = useState(defaultMealType || "breakfast");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [serving, setServing] = useState("");
  const [water, setWater] = useState("");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setMealType(defaultMealType || "breakfast");
      setFoodName(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
      setServing(""); setWater(""); setDate(todayStr()); setNotes(""); setSearch("");
    }
  }, [open, defaultMealType]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.MealLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition-meals", traineeId] });
      toast({ title: "Meal logged!" });
      onClose();
    },
    onError: (err) => toast({ title: "Failed to log", description: err.message, variant: "destructive" }),
  });

  const selectFood = (f) => {
    setFoodName(f.name);
    setCalories(String(f.calories));
    setProtein(String(f.protein));
    setCarbs(String(f.carbs));
    setFat(String(f.fat));
    setSearch("");
  };

  const handleSubmit = () => {
    if (!foodName.trim()) return toast({ title: "Food name required", variant: "destructive" });
    mutation.mutate({
      trainee_id: traineeId,
      trainee_name: traineeName,
      meal_date: date,
      meal_type: mealType,
      food_name: foodName.trim(),
      calories: Number(calories) || 0,
      protein_grams: Number(protein) || 0,
      carb_grams: Number(carbs) || 0,
      fat_grams: Number(fat) || 0,
      serving_size: serving,
      water_oz: Number(water) || 0,
      notes,
    });
  };

  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";
  const filteredFoods = COMMON_FOODS.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-500" /> Log Meal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Quick food picker */}
          <div>
            <Label className="text-gray-300 text-xs mb-1.5 block">Quick Add from Library</Label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search common foods..." className={`pl-9 ${inputCls} text-sm`} />
            </div>
            {search && filteredFoods.length > 0 && (
              <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto p-1 rounded-lg border border-gray-800" style={{ background: "#0a0a0a" }}>
                {filteredFoods.slice(0, 6).map((f) => (
                  <button key={f.name} onClick={() => selectFood(f)}
                    className="text-left p-2 rounded text-xs hover:bg-gray-900 transition">
                    <span className="text-white">{f.name}</span>
                    <span className="text-gray-500 ml-2">{f.calories} cal · {f.protein}p/{f.carbs}c/{f.fat}f</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Meal type */}
          <div>
            <Label className="text-gray-300 text-xs mb-1.5 block">Meal Type</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {MEAL_TYPES.map((m) => (
                <button key={m.key} onClick={() => setMealType(m.key)}
                  className="py-1.5 rounded-md text-xs border transition"
                  style={mealType === m.key
                    ? { background: `${m.color}22`, borderColor: `${m.color}66`, color: m.color }
                    : { background: "#0a0a0a", borderColor: "#2a2a2a", color: "#6b7280" }}
                >{m.label}</button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-300 text-xs">Food / Meal Name</Label>
            <Input value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="e.g. Chicken and rice" className={`mt-1 ${inputCls}`} />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-gray-300 text-xs">Cal</Label>
              <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Protein</Label>
              <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Carbs</Label>
              <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Fat</Label>
              <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} className={`mt-1 ${inputCls}`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs">Serving Size</Label>
              <Input value={serving} onChange={(e) => setServing(e.target.value)} placeholder="1 cup, 4oz..." className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Water (oz)</Label>
              <Input type="number" value={water} onChange={(e) => setWater(e.target.value)} placeholder="0" className={`mt-1 ${inputCls}`} />
            </div>
          </div>

          <div>
            <Label className="text-gray-300 text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" className={`mt-1 ${inputCls}`} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Log Meal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}