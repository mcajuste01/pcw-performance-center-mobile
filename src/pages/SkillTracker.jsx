import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Circle, Shield, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

// ── Full PCW Curriculum ─────────────────────────────────────────────────────
const CURRICULUM = [
  {
    level: 1,
    title: "Level 1 — Fundamentals",
    tier: "T1",
    color: "#8b3dff",
    test: "3-Minute Competent Chain; Rate performance.",
    categories: [
      { id: "L1_bumps", label: "Bumps", skills: ["Back", "Front", "Butt", "Flip", "Corner"] },
      { id: "L1_ropes", label: "Running Ropes", skills: ["Running Ropes"] },
      { id: "L1_tumbling", label: "Tumbling", skills: ["Front", "Quarter", "Back", "Tiger"] },
      { id: "L1_lockup", label: "Lock-Up", skills: ["Lock-Up"] },
      { id: "L1_stomping", label: "Stomping", skills: ["General Rule"] },
      { id: "L1_chaining", label: "Basic Chaining", skills: ["Headlock", "Hammerlock", "Arm Wringer", "Top Wristlock", "Bottom Wristlock", "Go Behind", "Single Leg", "Double Leg"] },
      { id: "L1_movement", label: "Movement", skills: ["Circle Sell", "Feed Up", "On/Off the Line", "Out of the Ring", "Dropdown", "Leapfrog"] },
      { id: "L1_whips", label: "Irish Whips & Reversals", skills: ["Irish Whips & Reversals"] },
      { id: "L1_etiquette", label: "Etiquette", skills: ["Handshakes", "Greetings", "Wiping Feet", "Cleaning the Space"] },
      { id: "L1_moves", label: "Basic Moves", skills: ["Shoulder Blocks", "Clotheslines", "Drop Toe Hold", "Cutter", "Neck Breaker", "Scoop Slam", "Vertical Suplex"] },
      { id: "L1_drops", label: "Drops", skills: ["Leg Drop", "Elbow Drop", "Knee Drop"] },
      { id: "L1_pins", label: "Pins", skills: ["School Boy"] },
    ],
  },
  {
    level: 2,
    title: "Level 2 — Intermediate",
    tier: "T2",
    color: "#dc2626",
    test: "Be a Warhorse, Take the Ring Apart, Put the Ring Up.",
    categories: [
      { id: "L2_basics", label: "Basics", skills: ["Selling", "Psychology", "Character", "Promos", "Match Structure"] },
      { id: "L2_moves", label: "Basic Moves", skills: ["Snapmares", "Arm Drags", "Hip Toss", "Biels", "Headlock Takeover", "Fireman's Carry"] },
      { id: "L2_corner", label: "Corner Offense", skills: ["Corner Elbows", "Corner Boots"] },
      { id: "L2_suplexes", label: "Advanced Suplexes", skills: ["Belly-to-Belly", "Belly-to-Back", "Fisherman", "Northern Lights"] },
      { id: "L2_strikes", label: "Strikes", skills: ["Strikes", "Drop Kicks"] },
      { id: "L2_pins", label: "Advanced Pins", skills: ["Sunset Flip", "Backslide", "Crucifix", "Majistral", "Oklahoma Roll"] },
      { id: "L2_ground", label: "Ground Holds", skills: ["Chin Lock", "Armbar", "Chokes"] },
      { id: "L2_imoves", label: "Intermediate Moves", skills: ["Atomic Drop", "DDT", "Russian Leg Sweep", "Back Breaker", "Bulldog", "STO", "Fallaway Slam"] },
      { id: "L2_addmoves", label: "Additional Moves", skills: ["Lou Thesz Press", "Flapjack", "Sidewalk Slam", "Samoan Drop", "Dragon Screw"] },
      { id: "L2_tumbling", label: "Advanced Tumbling", skills: ["Rope Dives/Tiger Rolls", "Handstand Rolls", "Tabled Handstands"] },
      { id: "L2_movement", label: "Advanced Movement", skills: ["Trail-Lines", "Cutbacks", "Shit Cans", "Banderas", "Up & Overs", "Booker T's"] },
      { id: "L2_tag", label: "Tag Team Basics", skills: ["Tag Psychology", "Double Teams"] },
    ],
  },
  {
    level: 3,
    title: "Level 3 — Advanced",
    tier: "T3",
    color: "#c0c0c0",
    test: "Referee a Match, Squash a Warhorse.",
    categories: [
      { id: "L3_aerial", label: "Aerial Maneuvers", skills: ["Aerial Maneuvers", "Catching Aerials"] },
      { id: "L3_toprope", label: "Top Rope", skills: ["Top Rope Bumps"] },
      { id: "L3_concepts", label: "Advanced Concepts", skills: ["Psychology", "Promos", "Character", "Match Structure"] },
      { id: "L3_bigbumps", label: "Big Bumps", skills: ["Powerbombs", "Spinebusters", "Back Body Drops"] },
      { id: "L3_production", label: "Production Training", skills: ["Lights", "Equipment"] },
      { id: "L3_weapons", label: "Weapon Spots", skills: ["Chair Shots", "Falls Count Anywhere (Outside Work)"] },
    ],
  },
  {
    level: 4,
    title: "Level 4 — Pro",
    tier: "T3+",
    color: "#f59e0b",
    test: "Ongoing professional development.",
    categories: [
      { id: "L4_tv", label: "TV Training", skills: ["TV Training"] },
      { id: "L4_brand", label: "Branding & Marketing", skills: ["Branding", "Marketing"] },
      { id: "L4_character", label: "Advanced Character Work", skills: ["Advanced Character Work"] },
    ],
  },
];

const ALL_SKILL_KEYS = CURRICULUM.flatMap(lvl =>
  lvl.categories.flatMap(cat =>
    cat.skills.map(skill => `${cat.id}__${skill}`)
  )
);

const levelSkillKeys = (levelNum) => {
  const lvl = CURRICULUM.find(l => l.level === levelNum);
  if (!lvl) return [];
  return lvl.categories.flatMap(cat => cat.skills.map(s => `${cat.id}__${s}`));
};

export default function SkillTracker() {
  const [user, setUser] = useState(null);
  const [selectedTraineeId, setSelectedTraineeId] = useState(null);
  const [openLevels, setOpenLevels] = useState({ 1: true, 2: false, 3: false, 4: false });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // default to viewing self if trainee
      const isCoach = u?.role === "admin" || u?.roles?.includes("coach") || u?.roles?.includes("admin");
      if (!isCoach) setSelectedTraineeId(u?.id);
    }).catch(console.error);
  }, []);

  const isCoachOrAdmin = user?.role === "admin" || user?.roles?.includes("coach") || user?.roles?.includes("admin");

  const { data: trainees = [] } = useQuery({
    queryKey: ["skillTrackerTrainees"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.filter({ role: "trainee" }, "full_name", 500);
      return toArray(res);
    },
    enabled: !!isCoachOrAdmin,
  });

  const viewingId = isCoachOrAdmin ? selectedTraineeId : user?.id;

  const { data: progress } = useQuery({
    queryKey: ["skillProgress", viewingId],
    queryFn: async () => {
      const res = await base44.entities.SkillProgress.filter({ trainee_id: viewingId });
      const arr = toArray(res);
      return arr[0] || null;
    },
    enabled: !!viewingId,
  });

  const selfCompleted = useMemo(() => new Set(progress?.self_completed || []), [progress]);
  const coachVerified = useMemo(() => new Set(progress?.coach_verified || []), [progress]);

  const saveMutation = useMutation({
    mutationFn: async ({ self_completed, coach_verified }) => {
      const trainee = isCoachOrAdmin
        ? trainees.find(t => t.auth_user_id === viewingId)
        : null;
      const trainee_name = trainee ? (trainee.wrestling_name || trainee.full_name) : (user?.wrestling_name || user?.full_name);

      if (progress?.id) {
        await base44.entities.SkillProgress.update(progress.id, {
          self_completed: [...self_completed],
          coach_verified: [...coach_verified],
          verified_by: isCoachOrAdmin ? user?.id : progress?.verified_by,
          last_updated: new Date().toISOString().split("T")[0],
        });
      } else {
        await base44.entities.SkillProgress.create({
          trainee_id: viewingId,
          trainee_name,
          self_completed: [...self_completed],
          coach_verified: [...coach_verified],
          verified_by: isCoachOrAdmin ? user?.id : undefined,
          last_updated: new Date().toISOString().split("T")[0],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skillProgress", viewingId] });
      toast.success("Progress saved!");
    },
    onError: () => toast.error("Failed to save"),
  });

  const toggleSelf = (key) => {
    const next = new Set(selfCompleted);
    if (next.has(key)) next.delete(key); else next.add(key);
    saveMutation.mutate({ self_completed: next, coach_verified: coachVerified });
  };

  const toggleVerify = (key) => {
    const next = new Set(coachVerified);
    if (next.has(key)) next.delete(key); else next.add(key);
    saveMutation.mutate({ self_completed: selfCompleted, coach_verified: next });
  };

  const levelProgress = (levelNum) => {
    const keys = levelSkillKeys(levelNum);
    const done = keys.filter(k => coachVerified.has(k)).length;
    return { done, total: keys.length, pct: keys.length ? Math.round((done / keys.length) * 100) : 0 };
  };

  const viewingTrainee = trainees.find(t => t.auth_user_id === viewingId);
  const traineeName = viewingTrainee ? (viewingTrainee.wrestling_name || viewingTrainee.full_name) : (user?.wrestling_name || user?.full_name);

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: "#0a0a0a" }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Skill Tracker
            </h1>
            <p className="text-gray-500 text-sm mt-1">PCW Training Curriculum — Track your progress through every level</p>
          </div>

          {isCoachOrAdmin && (
            <div className="w-64">
              <Select value={selectedTraineeId || ""} onValueChange={setSelectedTraineeId}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Select a trainee…" />
                </SelectTrigger>
                <SelectContent>
                  {trainees.map(t => (
                    <SelectItem key={t.auth_user_id} value={t.auth_user_id}>
                      {t.wrestling_name || t.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Trainee name + overall */}
        {viewingId && (
          <div className="rounded-xl p-5" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-gray-400 text-sm mb-3">
              Viewing: <span className="text-white font-semibold">{traineeName || "—"}</span>
              {isCoachOrAdmin && <span className="ml-2 text-xs text-purple-400 flex items-center gap-1 inline-flex"><Shield className="w-3 h-3" /> Coach mode — you can verify skills</span>}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CURRICULUM.map(lvl => {
                const { done, total, pct } = levelProgress(lvl.level);
                return (
                  <div key={lvl.level} className="rounded-lg p-3" style={{ background: "#0a0a0a", border: `1px solid ${lvl.color}30` }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: lvl.color }}>Level {lvl.level}</p>
                    <p className="text-lg font-bold text-white">{pct}%</p>
                    <p className="text-xs text-gray-500">{done}/{total} verified</p>
                    <div className="mt-2 h-1.5 rounded-full" style={{ background: "#1a1a1a" }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: lvl.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No trainee selected */}
        {!viewingId && isCoachOrAdmin && (
          <div className="text-center py-16 text-gray-600">
            <p>Select a trainee above to view their skill progress.</p>
          </div>
        )}

        {/* Levels */}
        {viewingId && CURRICULUM.map(lvl => {
          const { done, total, pct } = levelProgress(lvl.level);
          const isOpen = openLevels[lvl.level];

          return (
            <div key={lvl.level} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${lvl.color}25`, background: "#0f0f0f" }}>
              {/* Level Header */}
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setOpenLevels(prev => ({ ...prev, [lvl.level]: !prev[lvl.level] }))}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: lvl.color }}>
                    {lvl.level}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{lvl.title}</p>
                    <p className="text-xs text-gray-500">Tier: {lvl.tier} • {done}/{total} skills verified</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-32 h-1.5 rounded-full" style={{ background: "#1a1a1a" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: lvl.color }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: lvl.color }}>{pct}%</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4">
                  {/* Column headers */}
                  <div className="flex items-center justify-between text-xs text-gray-600 px-2 pb-1 border-b border-gray-800">
                    <span>Skill</span>
                    <div className="flex gap-6">
                      <span>Self</span>
                      {isCoachOrAdmin && <span className="text-purple-400">Verified</span>}
                    </div>
                  </div>

                  {lvl.categories.map(cat => (
                    <div key={cat.id}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat.label}</p>
                      <div className="space-y-1">
                        {cat.skills.map(skill => {
                          const key = `${cat.id}__${skill}`;
                          const selfDone = selfCompleted.has(key);
                          const verified = coachVerified.has(key);

                          return (
                            <div key={key}
                              className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors"
                              style={{
                                background: verified ? `${lvl.color}12` : selfDone ? "rgba(255,255,255,0.03)" : "transparent",
                                border: verified ? `1px solid ${lvl.color}30` : "1px solid transparent",
                              }}>
                              <span className="text-sm" style={{ color: verified ? "#fff" : selfDone ? "#d1d5db" : "#6b7280" }}>
                                {skill}
                              </span>
                              <div className="flex items-center gap-6">
                                {/* Self-assess toggle (trainees only, or coach can see) */}
                                <button
                                  onClick={() => !isCoachOrAdmin && toggleSelf(key)}
                                  disabled={isCoachOrAdmin}
                                  className="transition-transform hover:scale-110 disabled:cursor-default"
                                  title={selfDone ? "Mark incomplete" : "Mark complete"}
                                >
                                  {selfDone
                                    ? <CheckCircle className="w-5 h-5" style={{ color: lvl.color }} />
                                    : <Circle className="w-5 h-5 text-gray-700" />
                                  }
                                </button>

                                {/* Coach verify toggle */}
                                {isCoachOrAdmin && (
                                  <button
                                    onClick={() => toggleVerify(key)}
                                    className="transition-transform hover:scale-110"
                                    title={verified ? "Unverify" : "Verify skill"}
                                  >
                                    {verified
                                      ? <Shield className="w-5 h-5 text-purple-400" />
                                      : <Shield className="w-5 h-5 text-gray-700 hover:text-purple-600" />
                                    }
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Test requirement */}
                  <div className="mt-4 p-3 rounded-lg" style={{ background: `${lvl.color}10`, border: `1px solid ${lvl.color}25` }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: lvl.color }}>Level Test</p>
                    <p className="text-sm text-gray-300">{lvl.test}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}