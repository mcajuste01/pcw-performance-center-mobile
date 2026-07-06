import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Menu } from "lucide-react";
import NotificationCenter from "@/components/notifications/NotificationCenter";

const TAB_PATHS = ['/', '/Dashboard', '/Chat', '/Assignments', '/Profile'];

export default function GlobalHeader({ user, onMenuOpen, onSearchOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isTabRoute = TAB_PATHS.includes(location.pathname);

  return (
    <header
      className="sticky top-0 z-40 px-3 md:px-6 py-4 md:py-3 safe-top"
      style={{
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile: always show hamburger, plus back arrow on sub-pages */}
        <div className="md:hidden flex items-center gap-0.5">
          <button
            aria-label="Open navigation menu"
            className="p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors min-h-12 min-w-12 flex items-center justify-center"
            onClick={onMenuOpen}
          >
            <Menu className="w-6 h-6" />
          </button>
          {!isTabRoute && (
            <button
              aria-label="Go back"
              className="p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors min-h-12 min-w-12 flex items-center justify-center"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Desktop: always hamburger */}
        <button
          aria-label="Open navigation menu"
          className="hidden md:block p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          onClick={onMenuOpen}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* PCW logo on tab routes, "Back" label on sub-pages */}
        {isTabRoute ? (
          <div className="flex items-center gap-1.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)" }}
            >
              <span className="text-white font-black text-[9px] tracking-tight">PCW</span>
            </div>
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-300 md:hidden">Back</span>
        )}

        {/* Search bar */}
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2.5 px-3 py-3 rounded-xl flex-1 max-w-sm text-left transition-all min-h-12"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(139,61,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(139,61,255,0.25)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-500 flex-1">Search anything...</span>
          <kbd
            className="hidden md:flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-gray-600 rounded"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto">
          <NotificationCenter userId={user?.id} />
        </div>
      </div>
    </header>
  );
}