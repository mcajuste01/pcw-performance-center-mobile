export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Glutes",
  "Full Body",
];

export const EQUIPMENT_TYPES = [
  "Barbell",
  "Dumbbell",
  "Cable",
  "Bodyweight",
  "Machine",
  "Band",
  "Kettlebell",
  "Medicine Ball",
  "Rope",
  "Ring/Ropes",
];

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

export const CATEGORIES = [
  { key: "strength", label: "Strength", color: "#8b3dff" },
  { key: "conditioning", label: "Conditioning", color: "#dc2626" },
  { key: "mobility", label: "Mobility", color: "#10b981" },
  { key: "technique", label: "Technique", color: "#3b82f6" },
  { key: "ring_movement", label: "Ring Movement", color: "#f59e0b" },
  { key: "power", label: "Power", color: "#ec4899" },
  { key: "plyometrics", label: "Plyometrics", color: "#f97316" },
  { key: "core", label: "Core", color: "#06b6d4" },
  { key: "recovery", label: "Recovery", color: "#22c55e" },
  { key: "warmup", label: "Warmup", color: "#eab308" },
];

export const getCategoryMeta = (key) =>
  CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];

export const getCategoryStyle = (key) => {
  const cat = getCategoryMeta(key);
  return {
    background: `${cat.color}22`,
    color: cat.color,
    borderColor: `${cat.color}55`,
  };
};