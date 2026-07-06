import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";

function MacroRing({ label, value, target, color, unit }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const remaining = Math.max(0, target - value);
  const size = 92, radius = (size - 14) / 2, circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1a1a1a" strokeWidth="7" fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth="7" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">{value}</span>
          <span className="text-[9px] text-gray-600">/ {target}{unit}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-1 font-medium">{label}</span>
      {remaining > 0 && <span className="text-[10px] text-gray-600">{remaining}{unit} left</span>}
      {remaining === 0 && value > 0 && <span className="text-[10px] text-green-500">✓ Goal hit</span>}
    </div>
  );
}

export default function MacroTracker({ totals, targets }) {
  const { calories, protein, carbs, fat, water } = totals;
  const t = targets || { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };

  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardContent className="p-5">
        <p className="text-white text-sm font-semibold mb-4">Today's Macros</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 justify-items-center">
          <MacroRing label="Calories" value={calories} target={t.calories} color="#3b82f6" unit="" />
          <MacroRing label="Protein" value={protein} target={t.protein} color="#dc2626" unit="g" />
          <MacroRing label="Carbs" value={carbs} target={t.carbs} color="#f59e0b" unit="g" />
          <MacroRing label="Fat" value={fat} target={t.fat} color="#8b3dff" unit="g" />
          <MacroRing label="Water" value={water} target={t.water} color="#06b6d4" unit="oz" />
        </div>
        {calories > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between text-xs">
            <span className="text-gray-500">Macros: <span className="text-red-400">{protein}g</span> / <span className="text-yellow-400">{carbs}g</span> / <span className="text-purple-400">{fat}g</span></span>
            <span className="text-gray-500">
              {calories > t.calories ? (
                <span className="text-yellow-400">+{calories - t.calories} over goal</span>
              ) : (
                <span className="text-green-400">{Math.round((calories / Math.max(1, t.calories)) * 100)}% of goal</span>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}