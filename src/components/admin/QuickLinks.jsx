import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users, Calendar, ClipboardList, Award, DollarSign,
  BookOpen, MessageSquare, BarChart3, Shield, UserPlus
} from "lucide-react";

const LINKS = [
  { label: "Role Management", page: "RoleManagement", icon: Shield, color: "#dc2626" },
  { label: "Tier Management", page: "TierManagement", icon: Award, color: "#8b3dff" },
  { label: "Events", page: "Events", icon: Calendar, color: "#f59e0b" },
  { label: "Assignments", page: "Assignments", icon: ClipboardList, color: "#10b981" },
  { label: "Payments", page: "Payments", icon: DollarSign, color: "#10b981" },
  { label: "Curriculum", page: "Curriculum", icon: BookOpen, color: "#c0c0c0" },
  { label: "Trainee Roster", page: "TraineeRoster", icon: Users, color: "#8b3dff" },
  { label: "Chat", page: "Chat", icon: MessageSquare, color: "#8b3dff" },
  { label: "Analytics", page: "Analytics", icon: BarChart3, color: "#dc2626" },
  { label: "Invite User", page: "RoleManagement", icon: UserPlus, color: "#8b3dff" },
];

export default function QuickLinks() {
  return (
    <div className="rounded-xl p-5" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-semibold">Quick Navigation</p>
      <div className="grid grid-cols-2 gap-2">
        {LINKS.map(({ label, page, icon: Icon, color }) => (
          <Link key={label} to={createPageUrl(page)}>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg group transition-all hover:scale-[1.01]"
              style={{ background: `${color}0d`, border: `1px solid ${color}25` }}>
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
              <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors truncate">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}