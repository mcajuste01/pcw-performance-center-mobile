/**
 * WidgetCustomizer — modal/panel that lets users add / remove widgets.
 */
import React from "react";
import { X, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WidgetCustomizer({ allWidgets, activeWidgets, onToggle, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Customize Dashboard
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Toggle widgets on or off. Drag to reorder.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Widget list */}
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {allWidgets.map((w) => {
            const active = activeWidgets.includes(w.id);
            return (
              <button
                key={w.id}
                onClick={() => onToggle(w.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
                style={{
                  background: active ? "rgba(139,61,255,0.1)" : "rgba(255,255,255,0.03)",
                  borderColor: active ? "rgba(139,61,255,0.4)" : "rgba(255,255,255,0.08)",
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: active ? "rgba(139,61,255,0.2)" : "rgba(255,255,255,0.06)" }}>
                  <w.icon className="w-4 h-4" style={{ color: active ? "#a78bfa" : "#6b7280" }} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium" style={{ color: active ? "#e5e7eb" : "#9ca3af" }}>{w.label}</p>
                  <p className="text-xs text-gray-600">{w.description}</p>
                </div>
                <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: active ? "#8b3dff" : "rgba(255,255,255,0.15)",
                    background: active ? "#8b3dff" : "transparent",
                  }}>
                  {active && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Button onClick={onClose} className="w-full" style={{ background: "#8b3dff" }}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}