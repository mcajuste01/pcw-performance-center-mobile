import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LogOut,
  Settings,
  User,
  HelpCircle,
  Moon,
  Sun,
  ChevronUp,
} from "lucide-react";
import StatusSelector from "@/components/status/StatusSelector";
import PresenceIndicator from "@/components/chat/PresenceIndicator";
import { useTheme } from "@/components/theme/ThemeProvider";

export function UserPanel({ user, collapsed, onSignOut }) {
  const [open, setOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(user?.status || "online");
  const { theme, setTheme } = useTheme();
  
  const isDarkMode = theme !== "classic-white";
  
  const toggleDarkMode = () => {
    setTheme(isDarkMode ? "classic-white" : "pcw-dark");
  };

  return (
    <div className="relative border-t border-gray-800 p-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-gray-800 transition"
      >
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{
              background: "linear-gradient(135deg, #9b37ff 0%, #ff4f81 100%)",
            }}
          >
            {user?.wrestling_name?.charAt(0)?.toUpperCase() || 
             user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5">
            <PresenceIndicator status={currentStatus} size="sm" />
          </span>
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.wrestling_name || user?.full_name || "Wrestler"}
              </p>
              <p className="text-xs text-purple-400">Level {user?.level ?? 1}</p>
            </div>
            <ChevronUp 
              className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} 
            />
          </>
        )}
      </button>

      {/* DROPDOWN — opens upward */}
      {open && !collapsed && (
        <div className="absolute bottom-full left-0 right-0 mb-1 mx-3 bg-black border border-gray-800 rounded-xl overflow-hidden shadow-xl z-50">
          {/* Status Selector */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-500 mb-2">Set Status</p>
            <StatusSelector 
              currentStatus={currentStatus} 
              onStatusChange={setCurrentStatus}
            />
          </div>
          
          <SidebarItem
            label="Profile"
            icon={<User className="w-4 h-4" />}
            href={createPageUrl("Profile")}
          />
          <SidebarItem
            label="Notification Settings"
            icon={<Settings className="w-4 h-4" />}
            href={createPageUrl("NotificationSettings")}
          />
          <SidebarItem
            label={isDarkMode ? "Light Mode" : "Dark Mode"}
            icon={isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            onClick={toggleDarkMode}
          />
          <SidebarItem
            label="Help & Culture"
            icon={<HelpCircle className="w-4 h-4" />}
            href={createPageUrl("Culture")}
          />
          <SidebarItem
            label="Sign Out"
            icon={<LogOut className="w-4 h-4 text-red-400" />}
            danger
            onClick={onSignOut}
          />
        </div>
      )}
    </div>
  );
}

function SidebarItem({ label, icon, onClick, danger, href }) {
  const content = (
    <>
      {icon}
      <span className="text-sm">{label}</span>
    </>
  );

  const className = `flex items-center gap-3 px-4 py-3 text-left w-full hover:bg-gray-800 transition ${
    danger ? "text-red-400" : "text-gray-300"
  }`;

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}