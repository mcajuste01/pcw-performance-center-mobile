import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getMealType } from "./nutritionConstants";

function formatDate(d) {
  const date = new Date(d + "T00:00:00");
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function CalorieTrends({ meals }) {
  // Group meals by date (last 7 days)
  const today = new Date().toISOString().slice(0, 10);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dStr = d.toISOString().slice(0, 10);
    const dayMeals = meals.filter((m) => m.meal_date === dStr);
    const calories = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
    const protein = dayMeals.reduce((s, m) => s + (m.protein_grams || 0), 0);
    days.push({ date: formatDate(dStr), calories, protein, isToday: dStr === today });
  }

  const tooltipStyle = { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 };
  const avgCalories = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.calories, 0) / days.length) : 0;

  // Protein breakdown by meal type today
  const todayMeals = meals.filter((m) => m.meal_date === today);
  const mealTypeBreakdown = {};
  todayMeals.forEach((m) => {
    const mt = getMealType(m.meal_type);
    if (!mealTypeBreakdown[mt.label]) mealTypeBreakdown[mt.label] = { calories: 0, color: mt.color };
    mealTypeBreakdown[mt.label].calories += m.calories || 0;
  });

  return (
    <div className="space-y-4">
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-sm font-semibold">Calorie Intake (7 days)</p>
            <span className="text-xs text-gray-500">Avg: <span className="text-blue-400 font-semibold">{avgCalories}</span> cal</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={days}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
              <Area type="monotone" dataKey="calories" stroke="#3b82f6" strokeWidth={2} fill="url(#calGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="p-4">
          <p className="text-white text-sm font-semibold mb-3">Today's Calorie Distribution</p>
          {Object.keys(mealTypeBreakdown).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(mealTypeBreakdown).map(([label, data]) => {
                const max = Math.max(...Object.values(mealTypeBreakdown).map((d) => d.calories), 1);
                const pct = (data.calories / max) * 100;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
                    <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "#0a0a0a" }}>
                      <div className="h-full rounded-md transition-all" style={{ width: `${pct}%`, background: data.color }} />
                    </div>
                    <span className="text-xs text-white font-medium w-12 text-right">{data.calories}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No meals logged today</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}