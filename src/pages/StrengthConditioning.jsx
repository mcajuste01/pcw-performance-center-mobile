import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dumbbell } from "lucide-react";
import CoachSCDashboard from "@/components/sc/CoachSCDashboard";
import TraineeSCDashboard from "@/components/sc/TraineeSCDashboard";

export default function StrengthConditioning() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }} />
      </div>
    );
  }

  const hasRole = (role) => user?.roles?.includes(role) || (role === "admin" && user?.role === "admin");
  const isCoachOrAdmin = hasRole("coach") || hasRole("admin");

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Dumbbell className="w-7 h-7" style={{ color: "#8b3dff" }} />
            Strength & Conditioning
          </h1>
          <p className="text-gray-400 text-sm">
            {isCoachOrAdmin ? "Track trainee progress, workout plans, and session volume across the roster." : "Your training programs, session logs, and progress trends."}
          </p>
        </div>

        {isCoachOrAdmin ? <CoachSCDashboard user={user} /> : <TraineeSCDashboard user={user} />}
      </div>
    </div>
  );
}