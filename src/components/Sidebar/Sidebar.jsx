import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, MessageSquare, Users, ClipboardList, Dumbbell, Activity,
  CheckCircle, Trophy, TrendingUp, BookOpen, Calendar, Shield,
  UserCog, ChevronLeft, ChevronRight, Folder, Video, Star, Sparkles,
  CalendarDays, Flame, HeartPulse, Apple, BarChart3, CreditCard,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { UserPanel } from "./UserPanel";
import AnimatedLogo from "@/components/logo/AnimatedLogo";
import XPProgressRing from "@/components/gamification/XPProgressRing";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

function NavItem({ item, collapsed, isActive }) {
  const Icon = item.icon;
  return (
    <Link
      to={createPageUrl(item.page)}
      title={collapsed ? item.label : undefined}
      className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group"
      style={{
        background: isActive ? "rgba(139,61,255,0.15)" : "transparent",
        color: isActive ? "#fff" : "#6b7280",
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          e.currentTarget.style.color = "#d1d5db";
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#6b7280";
        }
      }}
    >
      {/* Active bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
          style={{ background: "linear-gradient(180deg, #8b3dff, #dc2626)" }} />
      )}

      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-purple-400" : ""}`} />

      {!collapsed && (
        <span className="truncate text-sm font-medium">{item.label}</span>
      )}

      {/* Badge */}
      {item.badge > 0 && (
        <span className={`${collapsed ? "absolute top-1 right-1" : "ml-auto"} 
          min-w-[18px] h-[18px] flex items-center justify-center 
          text-[10px] font-bold text-white bg-red-600 rounded-full px-1`}>
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div className="h-px mx-3 my-2" style={{ background: "rgba(255,255,255,0.06)" }} />;
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">{label}</p>
  );
}

export function Sidebar({ user }) {
  const { collapsed, toggle } = useSidebar();
  const location = useLocation();

  const { data: unreadDMs = 0 } = useQuery({
    queryKey: ["unreadDMCount", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const messages = await base44.entities.DirectMessage.filter({ recipient_id: user.id, read: false });
      return toArray(messages).length;
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const hasRole = (role) => user?.roles?.includes(role) || (role === "admin" && user?.role === "admin");
  const isCoach = hasRole("coach") || hasRole("admin");
  const isAdmin = hasRole("admin");

  const traineeCore = [
    { page: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { page: "CheckIn", label: "Check In", icon: CheckCircle },
    { page: "Profile", label: "Profile", icon: Users },
  ];

  const traineeActivity = [
    { page: "Assignments", label: "Assignments", icon: ClipboardList },
    { page: "SkillTracking", label: "Skill Tracking", icon: TrendingUp },
    { page: "SkillTracker", label: "Level Tracker", icon: Trophy },
    { page: "PerformanceLab", label: "Performance Lab", icon: Activity },
    { page: "Workouts", label: "Workouts", icon: Dumbbell },
    { page: "Notebook", label: "Notebook", icon: BookOpen },
    { page: "VideoAnalysis", label: "Video Analysis", icon: Video },
  ];

  const traineeComm = [
    { page: "DirectMessages", label: "Messages", icon: MessageSquare, badge: unreadDMs },
    { page: "Chat", label: "Chat", icon: Users },
    { page: "Community", label: "Community", icon: Star },
  ];

  const traineeMore = [
    { page: "Leaderboard", label: "Leaderboard", icon: Trophy },
    { page: "Events", label: "Events", icon: Calendar },
    { page: "ExerciseLibrary", label: "Exercise Library", icon: Dumbbell },
    { page: "ResourceCenter", label: "Resources", icon: Folder },
    { page: "Culture", label: "Culture", icon: Shield },
    { page: "Analytics", label: "Analytics", icon: TrendingUp },
    { page: "ShowcaseFeedback", label: "Showcase", icon: Trophy },
    { page: "CharacterBuilder", label: "Character Builder", icon: Sparkles },
  ];

  const coachSections = [
    {
      label: "Management",
      items: [
        { page: "CoachDashboard", label: "Coach Dashboard", icon: Shield },
        { page: "PerformanceLab", label: "Performance Lab", icon: Activity },
        { page: "TraineeRoster", label: "Trainee Roster", icon: Users },
        { page: "AdminDashboard", label: "Admin Center", icon: Shield, adminOnly: true },
        { page: "RoleManagement", label: "Role Management", icon: UserCog, adminOnly: true },
        { page: "TierManagement", label: "Tier Management", icon: Trophy },
        { page: "Curriculum", label: "Lesson Planning", icon: BookOpen },
        { page: "SkillTracker", label: "Skill Tracker", icon: Trophy },
        { page: "Payments", label: "Payments", icon: Shield },
        { page: "DuesManagement", label: "Dues Management", icon: CreditCard, adminOnly: true },
      ],
    },
    {
      label: "Communication",
      items: [
        { page: "DirectMessages", label: "Messages", icon: MessageSquare, badge: unreadDMs },
        { page: "Chat", label: "Chat", icon: Users },
        { page: "Assignments", label: "Assignment Management", icon: ClipboardList },
        { page: "ShowcaseFeedback", label: "Showcase Feedback", icon: Trophy },
        { page: "CharacterReview", label: "Character Review", icon: Sparkles },
      ],
    },
    {
      label: "Resources",
      items: [
        { page: "Events", label: "Events", icon: Calendar },
        { page: "ExerciseLibrary", label: "Exercise Library", icon: Dumbbell },
        { page: "Workouts", label: "Workouts", icon: Dumbbell },
        { page: "ResourceCenter", label: "Resources", icon: Folder },
        { page: "Profile", label: "Profile", icon: Users },
      ],
    },
  ];

  const handleSignOut = async () => {
    await base44.auth.logout("/login");
  };

  const isActivePath = (page) => location.pathname === createPageUrl(page);

  return (
    <aside
      className={`h-full min-h-0 flex flex-col flex-shrink-0 transition-all duration-300 ${collapsed ? "w-[68px]" : "w-64"}`}
      style={{
        background: "radial-gradient(ellipse at top left, rgba(60,10,100,0.35) 0%, #080808 55%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo + toggle */}
      <div className="flex items-center justify-between px-3 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <AnimatedLogo collapsed={collapsed} />
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 transition-colors hover:bg-gray-800/50"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* XP Ring */}
      {!collapsed && (
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <XPProgressRing xp={user?.xp || 0} level={user?.level || 1} size={44} showLabel={false} />
            <div>
              <p className="text-xs font-medium text-gray-300">Level {user?.level || 1}</p>
              <p className="text-[10px] text-gray-600">
                {(user?.xp || 0) % ((user?.level || 1) * 500)} / {(user?.level || 1) * 500} XP
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-0.5">
        {isAdmin || isCoach ? (
          <>
            {coachSections.map((section) => {
              const filtered = section.items.filter(item => !item.adminOnly || isAdmin);
              return (
                <div key={section.label}>
                  <SectionLabel label={section.label} collapsed={collapsed} />
                  {filtered.map((item) => (
                    <NavItem key={item.page} item={item} collapsed={collapsed} isActive={isActivePath(item.page)} />
                  ))}
                </div>
              );
            })}
          </>
        ) : (
          <>
            <SectionLabel label="Home" collapsed={collapsed} />
            {traineeCore.map((item) => (
              <NavItem key={item.page} item={item} collapsed={collapsed} isActive={isActivePath(item.page)} />
            ))}
            <SectionLabel label="Training" collapsed={collapsed} />
            {traineeActivity.map((item) => (
              <NavItem key={item.page} item={item} collapsed={collapsed} isActive={isActivePath(item.page)} />
            ))}
            <SectionLabel label="Community" collapsed={collapsed} />
            {traineeComm.map((item) => (
              <NavItem key={item.page} item={item} collapsed={collapsed} isActive={isActivePath(item.page)} />
            ))}
            <SectionLabel label="More" collapsed={collapsed} />
            {traineeMore.map((item) => (
              <NavItem key={item.page} item={item} collapsed={collapsed} isActive={isActivePath(item.page)} />
            ))}
          </>
        )}
      </nav>

      {/* User Panel */}
      <UserPanel user={user} collapsed={collapsed} onSignOut={handleSignOut} />
    </aside>
  );
}