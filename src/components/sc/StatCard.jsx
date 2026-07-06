import React from "react";
import { Card } from "@/components/ui/card";

export default function StatCard({ icon: Icon, label, value, sub, color = "#8b3dff" }) {
  return (
    <Card className="border-gray-800 pcw-card-hover" style={{ background: "#0f0f0f" }}>
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}22`, color }}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-white leading-none">{value}</p>
          <p className="text-xs text-gray-500 mt-1 truncate">{label}</p>
          {sub && <p className="text-[10px] text-gray-600 mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}