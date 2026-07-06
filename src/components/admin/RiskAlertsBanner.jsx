import React, { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RiskAlertsBanner({ inactiveTrainees = [], overdueTrainees = [] }) {
  const [open, setOpen] = useState(true);
  const total = inactiveTrainees.length + overdueTrainees.length;

  if (total === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.07)" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          <span className="font-semibold text-white">
            {total} Risk Alert{total > 1 ? "s" : ""} — Immediate Attention Required
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#dc2626", color: "#fff" }}>
            {total}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {inactiveTrainees.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <div>
                <p className="text-sm font-medium text-white">{t.wrestling_name || t.full_name}</p>
                <p className="text-xs text-red-400">Inactive 10+ days</p>
              </div>
              <Link to={createPageUrl("UserDetail") + `?id=${t.id}`}>
                <span className="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-red-900/30" style={{ color: "#dc2626", border: "1px solid rgba(220,38,38,0.3)" }}>
                  View
                </span>
              </Link>
            </div>
          ))}
          {overdueTrainees.slice(0, 3).map(t => (
            <div key={t.id + "od"} className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div>
                <p className="text-sm font-medium text-white">{t.wrestling_name || t.full_name}</p>
                <p className="text-xs text-yellow-400">3+ overdue assignments</p>
              </div>
              <Link to={createPageUrl("UserDetail") + `?id=${t.id}`}>
                <span className="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-yellow-900/30" style={{ color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                  View
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}