import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronUp,
  Moon,
  Sun,
  Bell,
  Shield,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

export default function UserMenu({ user, isCoach, isAdmin }) {
  const [darkMode, setDarkMode] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await base44.auth.logout("/login");
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    // Optionally persist to user preferences
    try {
      await base44.auth.updateMe({ dark_mode: newMode });
    } catch (e) {
      // Preference saving is optional
    }
  };

  const displayName = user?.wrestling_name || user?.full_name || "Wrestler";
  const initials = displayName.charAt(0).toUpperCase();
  const level = user?.level || 1;
  const tier = user?.tier || "T1";
  const xp = user?.xp || 0;
  const xpToNext = (level * 100); // Simple XP calculation
  const xpProgress = Math.min((xp % 100) / 100 * 100, 100);

  const getRoleBadge = () => {
    if (isAdmin) return { label: "Admin", color: "text-red-400", bg: "bg-red-500/20" };
    if (isCoach) return { label: "Coach", color: "text-purple-400", bg: "bg-purple-500/20" };
    return { label: tier, color: "text-blue-400", bg: "bg-blue-500/20" };
  };

  const roleBadge = getRoleBadge();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="w-full p-3 hover:bg-gray-800/50 rounded-lg transition-all duration-200 group">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)" }}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{initials}</span>
              )}
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-white text-sm truncate">
                {displayName}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
                {!isAdmin && !isCoach && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      Lv {level}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Chevron */}
            <ChevronUp 
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`} 
            />
          </div>

          {/* XP Progress Bar (for trainees) */}
          {!isAdmin && !isCoach && (
            <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${xpProgress}%`,
                  background: "linear-gradient(90deg, #8b3dff 0%, #dc2626 100%)"
                }}
              />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        side="top" 
        align="start"
        className="w-64 bg-[#0f0f0f] border-gray-800 text-white mb-2"
        sideOffset={8}
      >
        {/* User Header */}
        <DropdownMenuLabel className="px-3 py-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)" }}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={displayName} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white font-bold">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge.bg} ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
                {user?.streak_count > 0 && (
                  <span className="text-xs text-orange-400">🔥 {user.streak_count}</span>
                )}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-800" />

        {/* Menu Items */}
        <Link to={createPageUrl("Profile")}>
          <DropdownMenuItem className="px-3 py-2.5 cursor-pointer hover:bg-gray-800 focus:bg-gray-800">
            <User className="w-4 h-4 mr-3 text-gray-400" />
            <span>My Profile</span>
          </DropdownMenuItem>
        </Link>

        <Link to={createPageUrl("NotificationSettings")}>
          <DropdownMenuItem className="px-3 py-2.5 cursor-pointer hover:bg-gray-800 focus:bg-gray-800">
            <Bell className="w-4 h-4 mr-3 text-gray-400" />
            <span>Notification Settings</span>
          </DropdownMenuItem>
        </Link>

        {isAdmin && (
          <Link to={createPageUrl("AdminDashboard")}>
            <DropdownMenuItem className="px-3 py-2.5 cursor-pointer hover:bg-gray-800 focus:bg-gray-800">
              <Shield className="w-4 h-4 mr-3 text-red-400" />
              <span>Admin Dashboard</span>
            </DropdownMenuItem>
          </Link>
        )}

        <DropdownMenuSeparator className="bg-gray-800" />

        {/* Dark Mode Toggle */}
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="w-4 h-4 text-gray-400" />
            ) : (
              <Sun className="w-4 h-4 text-yellow-400" />
            )}
            <span className="text-sm">Dark Mode</span>
          </div>
          <Switch 
            checked={darkMode} 
            onCheckedChange={toggleDarkMode}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>

        <DropdownMenuSeparator className="bg-gray-800" />

        <Link to={createPageUrl("Culture")}>
          <DropdownMenuItem className="px-3 py-2.5 cursor-pointer hover:bg-gray-800 focus:bg-gray-800">
            <HelpCircle className="w-4 h-4 mr-3 text-gray-400" />
            <span>Help & Guidelines</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuItem 
          className="px-3 py-2.5 cursor-pointer hover:bg-red-900/30 focus:bg-red-900/30 text-red-400"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}