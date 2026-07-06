import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Dumbbell } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const tooltipStyle = { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 };

export default function ProgressCharts({ weeklyData, strengthData, conditioningData }) {
  return (
    <div className="space-y-4">
      <ChartCard title="Weekly Progress" icon={Activity} color="#8b3dff" data={weeklyData}>
        <BarChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
          <XAxis dataKey="label" stroke="#6b7280" fontSize={10} />
          <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#9ca3af" }} />
          <Bar dataKey="sessions" name="Sessions" fill="#8b3dff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Monthly Strength" icon={Dumbbell} color="#f59e0b" data={strengthData}>
        <LineChart data={strengthData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
          <XAxis dataKey="label" stroke="#6b7280" fontSize={10} />
          <YAxis stroke="#6b7280" fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#9ca3af" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="pushups" name="Push-ups" stroke="#8b3dff" strokeWidth={2} dot={{ r: 3, fill: "#8b3dff" }} />
          <Line type="monotone" dataKey="squats" name="Squats" stroke="#dc2626" strokeWidth={2} dot={{ r: 3, fill: "#dc2626" }} />
          <Line type="monotone" dataKey="burpees" name="Burpees" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Conditioning Progress" icon={TrendingUp} color="#10b981" data={conditioningData}>
        <LineChart data={conditioningData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
          <XAxis dataKey="label" stroke="#6b7280" fontSize={10} />
          <YAxis stroke="#6b7280" fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#9ca3af" }} />
          <Line type="monotone" dataKey="value" name="Score" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
        </LineChart>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, icon: Icon, color, data, children }) {
  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardHeader>
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            {children}
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-600 text-sm text-center py-8">Not enough data yet — keep logging sessions and tests.</p>
        )}
      </CardContent>
    </Card>
  );
}