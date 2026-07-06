import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Plus,
  X,
  Dumbbell,
  MessageSquare,
  ClipboardList,
  PenTool,
  CheckCircle,
} from "lucide-react";

const actions = [
  { 
    label: "Check In", 
    icon: CheckCircle, 
    page: "CheckIn",
    color: "bg-green-600 hover:bg-green-700" 
  },
  { 
    label: "Log Training", 
    icon: Dumbbell, 
    page: "Workouts",
    color: "bg-blue-600 hover:bg-blue-700" 
  },
  { 
    label: "New Note", 
    icon: PenTool, 
    page: "Notebook",
    color: "bg-purple-600 hover:bg-purple-700" 
  },
  { 
    label: "Message Coach", 
    icon: MessageSquare, 
    page: "DirectMessages",
    color: "bg-indigo-600 hover:bg-indigo-700" 
  },
  { 
    label: "Assignments", 
    icon: ClipboardList, 
    page: "Assignments",
    color: "bg-orange-600 hover:bg-orange-700" 
  },
];

export default function FloatingActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (page) => {
    setOpen(false);
    navigate(createPageUrl(page));
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-40 flex flex-col items-end gap-2">
      {/* Action buttons */}
      {open && (
        <div className="flex flex-col gap-2 mb-3 animate-in slide-in-from-bottom-4 fade-in duration-200">
          {actions.map((action, i) => (
            <button
              key={action.label}
              onClick={() => handleAction(action.page)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg transition-all min-h-12 ${action.color}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
          open 
            ? "bg-gray-800 rotate-45" 
            : "bg-gradient-to-br from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500"
        }`}
      >
        {open ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <Plus className="w-7 h-7 text-white" />
        )}
      </button>
    </div>
  );
}