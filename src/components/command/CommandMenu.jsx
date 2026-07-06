import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useRole } from "@/hooks/useRole";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  User,
  Users,
  MessageSquare,
  ClipboardList,
  Dumbbell,
  Calendar,
  FileText,
  Plus,
  Settings,
  Trophy,
  BookOpen,
  Shield,
  Bell,
  Home,
  CheckCircle,
  TrendingUp,
  UserPlus,
  Send,
  PenTool,
} from "lucide-react";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

export default function CommandMenu({ open, onOpenChange, user }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [channels, setChannels] = useState([]);
  const { isAdmin, isCoach } = useRole(user);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      loadData();
      setQuery("");
    }
  }, [open]);

  const loadData = async () => {
    try {
      const promises = [
        base44.entities.Assignment.list("-created_date", 20),
        base44.entities.ChatChannel.list(),
      ];
      // Only coaches/admins can see all user profiles in search
      if (isCoach) promises.unshift(base44.entities.UserProfile.list());
      const results = await Promise.all(promises);
      if (isCoach) {
        setUsers(toArray(results[0]));
        setAssignments(toArray(results[1]));
        setChannels(toArray(results[2]));
      } else {
        setAssignments(toArray(results[0]));
        setChannels(toArray(results[1]));
      }
    } catch (e) {
      console.error("Failed to load command data", e);
    }
  };

  // Role-gated pages list
  const pages = useMemo(() => {
    const base = [
      { name: "Dashboard",            icon: Home,          page: "Dashboard" },
      { name: "Check In",             icon: CheckCircle,   page: "CheckIn" },
      { name: "Messages",             icon: MessageSquare, page: "DirectMessages" },
      { name: "Chat",                 icon: Users,         page: "Chat" },
      { name: "Profile",              icon: User,          page: "Profile" },
      { name: "Leaderboard",          icon: Trophy,        page: "Leaderboard" },
      { name: "Analytics",            icon: TrendingUp,    page: "Analytics" },
      { name: "Notebook",             icon: BookOpen,      page: "Notebook" },
      { name: "Workouts",             icon: Dumbbell,      page: "Workouts" },
      { name: "Events",               icon: Calendar,      page: "Events" },
      { name: "Culture",              icon: Shield,        page: "Culture" },
      { name: "Notification Settings",icon: Bell,          page: "NotificationSettings" },
    ];
    if (isCoach) {
      base.push(
        { name: "Assignments",          icon: ClipboardList, page: "Assignments" },
        { name: "Coach Dashboard",      icon: Shield,        page: "CoachDashboard" },
        { name: "Trainee Roster",       icon: Users,         page: "TraineeRoster" },
        { name: "Tier Management",      icon: Trophy,        page: "TierManagement" },
        { name: "Lesson Planning",      icon: BookOpen,      page: "Curriculum" },
      );
    }
    if (isAdmin) {
      base.push(
        { name: "Admin Center",         icon: Shield,        page: "AdminDashboard" },
        { name: "Role Management",      icon: UserPlus,      page: "RoleManagement" },
        { name: "Payments",             icon: Settings,      page: "Payments" },
      );
    }
    return base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoach, isAdmin]);

  const actions = useMemo(() => {
    const base = [
      { name: "New Training Log",   icon: Plus,         action: () => navigate(createPageUrl("CheckIn")) },
      { name: "New Note",           icon: PenTool,      action: () => navigate(createPageUrl("Notebook")) },
      { name: "Send Message",       icon: Send,         action: () => navigate(createPageUrl("DirectMessages")) },
      { name: "My Assignments",     icon: ClipboardList,action: () => navigate(createPageUrl("MyTasks")) },
    ];
    if (isCoach) {
      base.push({ name: "Create Assignment", icon: Plus, action: () => navigate(createPageUrl("CreateAssignment")) });
    }
    return base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoach]);

  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { pages: pages.slice(0, 5), users: [], assignments: [], channels: [], actions: actions.slice(0, 3) };
    return {
      pages:       pages.filter(p => p.name.toLowerCase().includes(q)),
      users:       users.filter(u => (u.wrestling_name || u.full_name || "").toLowerCase().includes(q)).slice(0, 5),
      assignments: assignments.filter(a => (a.title || "").toLowerCase().includes(q)).slice(0, 5),
      channels:    channels.filter(c => (c.display_name || c.name || "").toLowerCase().includes(q)).slice(0, 5),
      actions:     actions.filter(a => a.name.toLowerCase().includes(q)),
    };
  }, [query, users, assignments, channels, pages, actions]);

  const handleSelect = (type, item) => {
    onOpenChange(false);
    switch (type) {
      case "page":
        navigate(createPageUrl(item.page));
        break;
      case "user":
        navigate(createPageUrl("DirectMessages") + `?user=${item.auth_user_id || item.id}`);
        break;
      case "assignment":
        navigate(createPageUrl("Assignments") + `?id=${item.id}`);
        break;
      case "channel":
        navigate(createPageUrl("Chat") + `?channel=${item.id}`);
        break;
      case "action":
        item.action();
        break;
    }
  };

  const ResultSection = ({ title, items, type, icon: Icon }) => {
    if (!items?.length) return null;
    return (
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">{title}</p>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => handleSelect(type, item)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-900/30 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-purple-800/50 transition-colors">
              {item.icon ? <item.icon className="w-4 h-4 text-purple-400" /> : <Icon className="w-4 h-4 text-purple-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">
                {item.name || item.wrestling_name || item.full_name || item.title || item.display_name}
              </p>
              {item.email && <p className="text-xs text-gray-500 truncate">{item.email}</p>}
              {item.page && <p className="text-xs text-gray-500">Page</p>}
            </div>
            <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100">↵</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-[#0a0a0a] border-gray-800 overflow-hidden">
        <div className="border-b border-gray-800 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search wrestlers, pages, assignments..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white text-lg h-12"
              autoFocus
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-500 bg-gray-800 rounded">
              ESC
            </kbd>
          </div>
        </div>

        <ScrollArea className="max-h-[400px] p-4">
          <ResultSection title="Pages" items={filteredResults.pages} type="page" icon={FileText} />
          <ResultSection title="Actions" items={filteredResults.actions} type="action" icon={Plus} />
          <ResultSection title="Wrestlers" items={filteredResults.users} type="user" icon={User} />
          <ResultSection title="Assignments" items={filteredResults.assignments} type="assignment" icon={ClipboardList} />
          <ResultSection title="Channels" items={filteredResults.channels} type="channel" icon={MessageSquare} />
          
          {!query && (
            <div className="text-center py-4 text-gray-500 text-sm">
              <p>Type to search or use shortcuts</p>
              <p className="mt-1 text-xs">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded mr-1">⌘K</kbd> to open anytime
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}