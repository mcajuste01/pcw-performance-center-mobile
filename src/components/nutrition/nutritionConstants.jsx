import { Coffee, Sun, Moon, Apple, Zap, Dumbbell, Droplet } from "lucide-react";

export const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, color: "#f59e0b" },
  { key: "lunch", label: "Lunch", icon: Sun, color: "#3b82f6" },
  { key: "dinner", label: "Dinner", icon: Moon, color: "#8b3dff" },
  { key: "snack", label: "Snack", icon: Apple, color: "#10b981" },
  { key: "pre_workout", label: "Pre-Workout", icon: Zap, color: "#dc2626" },
  { key: "post_workout", label: "Post-Workout", icon: Dumbbell, color: "#ec4899" },
];

export const COMMON_FOODS = [
  { name: "Chicken Breast (4oz)", calories: 187, protein: 35, carbs: 0, fat: 4 },
  { name: "Brown Rice (1 cup)", calories: 216, protein: 5, carbs: 45, fat: 2 },
  { name: "Salmon (4oz)", calories: 233, protein: 25, carbs: 0, fat: 14 },
  { name: "Sweet Potato (medium)", calories: 103, protein: 2, carbs: 24, fat: 0 },
  { name: "Greek Yogurt (1 cup)", calories: 100, protein: 17, carbs: 6, fat: 0 },
  { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: "Eggs (2 large)", calories: 156, protein: 12, carbs: 1, fat: 11 },
  { name: "Oatmeal (1 cup cooked)", calories: 154, protein: 6, carbs: 27, fat: 3 },
  { name: "Protein Shake", calories: 120, protein: 24, carbs: 3, fat: 1 },
  { name: "Almonds (1 oz)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: "Avocado (1/2)", calories: 161, protein: 2, carbs: 9, fat: 15 },
  { name: "Spinach (1 cup)", calories: 7, protein: 1, carbs: 1, fat: 0 },
  { name: "Lean Beef (4oz)", calories: 217, protein: 31, carbs: 0, fat: 9 },
  { name: "Quinoa (1 cup)", calories: 222, protein: 8, carbs: 39, fat: 4 },
  { name: "Peanut Butter (2 tbsp)", calories: 188, protein: 8, carbs: 6, fat: 16 },
  { name: "Apple", calories: 95, protein: 0, carbs: 25, fat: 0 },
  { name: "Cottage Cheese (1/2 cup)", calories: 90, protein: 12, carbs: 5, fat: 2 },
  { name: "Tuna (4oz)", calories: 132, protein: 28, carbs: 0, fat: 1 },
];

// PCW wrestling weight classes (lbs) with associated macro targets
// Based on typical independent wrestling weight class ranges
export const WEIGHT_CLASSES = [
  { key: "flyweight", label: "Flyweight", max: 160, calories: 2200, protein: 150, carbs: 250, fat: 70, water_oz: 80 },
  { key: "lightweight", label: "Lightweight", max: 180, calories: 2500, protein: 170, carbs: 280, fat: 80, water_oz: 90 },
  { key: "middleweight", label: "Middleweight", max: 200, calories: 2800, protein: 190, carbs: 310, fat: 90, water_oz: 100 },
  { key: "heavyweight", label: "Heavyweight", max: 220, calories: 3100, protein: 210, carbs: 340, fat: 100, water_oz: 110 },
  { key: "super_heavyweight", label: "Super Heavyweight", max: 999, calories: 3500, protein: 230, carbs: 380, fat: 110, water_oz: 120 },
];

export const getMealType = (key) => MEAL_TYPES.find((m) => m.key === key) || MEAL_TYPES[0];

export function getWeightClass(weightLbs) {
  if (!weightLbs) return null;
  return WEIGHT_CLASSES.find((wc) => weightLbs <= wc.max) || WEIGHT_CLASSES[WEIGHT_CLASSES.length - 1];
}

// Calculate recommended daily targets based on body weight + activity level
export function calculateTargets(weightLbs, goal = "maintain") {
  if (!weightLbs) return null;
  // Base formula: protein 1g/lb, fat 0.4g/lb, remaining calories from carbs
  const protein = Math.round(weightLbs * 1.0);
  const fat = Math.round(weightLbs * 0.4);
  let calories;
  switch (goal) {
    case "cut": calories = Math.round(weightLbs * 13); break;
    case "bulk": calories = Math.round(weightLbs * 18); break;
    default: calories = Math.round(weightLbs * 15.5); break;
  }
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbCals = Math.max(0, calories - proteinCals - fatCals);
  const carbs = Math.round(carbCals / 4);
  const water = Math.round(weightLbs * 0.6); // oz
  return { calories, protein, carbs, fat, water };
}

export const GOALS = [
  { key: "cut", label: "Cut Weight", color: "#dc2626" },
  { key: "maintain", label: "Maintain", color: "#3b82f6" },
  { key: "bulk", label: "Build Mass", color: "#10b981" },
];