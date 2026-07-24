import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import ErrorBoundary from "@/components/ui/error-boundary";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { SidebarProvider } from "@/components/Sidebar/SidebarContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import CommandMenu from "@/components/command/CommandMenu";
import FloatingActions from "@/components/quick-actions/FloatingActions";
import InstallBanner from "@/components/pwa/InstallBanner";
import { LayoutDashboard, MessageSquare, ClipboardList, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import GlobalHeader from "@/components/layout/GlobalHeader";
import CoachAlerts from "@/components/notifications/CoachAlerts";
import DashboardPage from "@/pages/Dashboard";
import ChatPage from "@/pages/Chat";
import AssignmentsPage from "@/pages/MyTasks";
import ProfilePage from "@/pages/Profile";
import MonthlyDuesModal from "@/components/dues/MonthlyDuesModal";
import PaymentReminder from "@/components/dues/PaymentReminder";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [duesBlocked, setDuesBlocked] = useState(false);
  const [showDuesModal, setShowDuesModal] = useState(false);
  const duesCheckedRef = useRef(false);
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const TAB_ROUTES = [
    { name: 'Dashboard', Component: DashboardPage, paths: ['/', '/Dashboard'] },
    { name: 'Chat', Component: ChatPage, paths: ['/Chat'] },
    { name: 'Assignments', Component: AssignmentsPage, paths: ['/MyTasks'] },
    { name: 'Profile', Component: ProfilePage, paths: ['/Profile'] },
  ];

  const activeTabName = (() => {
    const p = location.pathname;
    for (const tab of TAB_ROUTES) {
      if (tab.paths.includes(p)) return tab.name;
    }
    return null;
  })();
  const isTabRoute = !!activeTabName;

  const [visitedTabs, setVisitedTabs] = useState(() =>
    activeTabName ? new Set([activeTabName]) : new Set()
  );

  useEffect(() => {
    if (activeTabName) {
      setVisitedTabs(prev => {
        if (prev.has(activeTabName)) return prev;
        return new Set([...prev, activeTabName]);
      });
    }
  }, [activeTabName]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (currentUser?.id) {
          try {
            const existingProfiles = await base44.entities.UserProfile.filter({
              auth_user_id: currentUser.id,
            });
            const profiles = Array.isArray(existingProfiles)
              ? existingProfiles
              : existingProfiles?.items || [];

            if (profiles.length === 0) {
              // New user — send to onboarding
              await base44.entities.UserProfile.create({
                auth_user_id: currentUser.id,
                full_name: currentUser.full_name || "",
                email: currentUser.email || "",
                role: currentUser.role === "admin" ? "admin" : "trainee",
                tier: currentUser.role === "admin" ? undefined : "T1",
                onboarding_completed: false,
              });
              if (window.location.pathname !== "/Onboarding") {
                window.location.href = "/Onboarding";
              }
            } else if (!profiles[0].onboarding_completed && currentUser.role !== "admin") {
              if (window.location.pathname !== "/Onboarding") {
                window.location.href = "/Onboarding";
              }
            } else if (!duesCheckedRef.current) {
              duesCheckedRef.current = true;
              const isStaff =
                currentUser?.roles?.includes("coach") ||
                currentUser?.roles?.includes("admin") ||
                currentUser?.role === "admin";
              if (!isStaff && profiles[0].tier !== "PCW Wrestler") {
                try {
                  const now = new Date();
                  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                  const duesRes = await base44.entities.MonthlyDues.filter({
                    trainee_id: currentUser.id,
                    month: monthStr,
                  });
                  const duesList = Array.isArray(duesRes) ? duesRes : duesRes?.items || [];
                  const dues = duesList[0];
                  if (dues?.blocked) {
                    setDuesBlocked(true);
                  } else if (now.getDate() >= 5 && !dues?.paid) {
                    setShowDuesModal(true);
                  }
                } catch (duesErr) {
                  console.log("Dues check failed:", duesErr);
                }
              }
            }
            // onboarding handled above
          } catch (profileError) {
            console.log("Could not check/create UserProfile:", profileError);
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut for command menu
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandMenuOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-xl animate-pulse"
              style={{ background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)" }} />
            <div className="absolute inset-[3px] rounded-[10px] flex items-center justify-center"
              style={{ background: "#0a0a0a" }}>
              <span className="text-2xl font-bold gradient-text">P</span>
            </div>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-500"
                style={{ animation: `fadeInUp 0.6s ease-out ${i * 0.15}s infinite alternate` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (duesBlocked) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <PaymentReminder user={user} />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SidebarProvider user={user}>
          <div className="min-h-screen flex w-full" style={{ background: "#0a0a0a", color: "#fff" }}>
            {/* Desktop Sidebar */}
            <div className="hidden md:block h-screen sticky top-0 z-30">
              <Sidebar user={user} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-[100] md:hidden">
                <div
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto slide-in-left" style={{ background: "#0a0a0a" }}>
                  <Sidebar user={user} />
                </div>
              </div>
            )}

            <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
              <GlobalHeader
                user={user}
                onMenuOpen={() => setMobileMenuOpen(true)}
                onSearchOpen={() => setCommandMenuOpen(true)}
              />

              {/* Page Content */}
              <div className="flex-1 relative overflow-hidden">
                  {/* Tab pages - lazy keep-alive with display:none */}
                  {TAB_ROUTES.map(({ name, Component }) =>
                    visitedTabs.has(name) && (
                      <div
                        key={name}
                        className="absolute inset-0"
                        style={{
                          display: activeTabName === name ? 'flex' : 'none',
                          flexDirection: 'column',
                          overflow: name === 'Chat' ? 'hidden' : 'auto',
                          paddingBottom: name !== 'Chat' ? 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' : 0,
                        }}
                      >
                        {/* Mobile top padding for safe area */}
                        <div className="md:hidden h-1" />
                        <Component />
                      </div>
                    )
                  )}
                {/* Non-tab pages with slide transition */}
                {!isTabRoute && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={location.pathname}
                      initial={{ x: '100%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '-100%', opacity: 0 }}
                      transition={{ type: 'tween', duration: 0.2 }}
                      className="absolute inset-0 overflow-auto pb-24 md:pb-0"
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </main>

            <CoachAlerts user={user} />
            <FloatingActions />
            <InstallBanner />

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom" id="mobile-bottom-nav"
              style={{ background: "rgba(10,10,10,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
              <div className="flex items-center justify-around px-1 py-1">
                {[
                  { to: "Dashboard", icon: LayoutDashboard, label: "Home" },
                  { to: "Chat", icon: MessageSquare, label: "Chat" },
                  { to: user?.role === "admin" || user?.roles?.includes("coach") || user?.roles?.includes("admin") ? "Assignments" : "MyTasks", icon: ClipboardList, label: "Assignments" },
                  { to: "Profile", icon: User, label: "Profile" },
                ].map(({ to, icon: Icon, label }) => {
                  const href = createPageUrl(to);
                  const active = location.pathname === href;
                  return (
                    <Link key={to} to={href}
                      className="flex flex-col items-center justify-center gap-0.5 px-4 py-3 rounded-xl transition-all min-h-14 flex-1"
                      style={{ color: active ? "#8b3dff" : "#6b7280" }}>
                      <Icon className="w-6 h-6" />
                      <span className="text-[9px] font-medium">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <CommandMenu
              open={commandMenuOpen}
              onOpenChange={setCommandMenuOpen}
              user={user}
            />

            {showDuesModal && (
              <MonthlyDuesModal
                user={user}
                month={currentMonth}
                onClose={() => setShowDuesModal(false)}
              />
            )}
          </div>
        </SidebarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}