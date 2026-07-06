import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, Save, BookOpen } from "lucide-react";
import { COACH_FOCUS_OPTIONS } from "@/pages/Profile";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};

const TIERS = ["T1", "T2", "T3", "Graduated", "PCW Wrestler"];
const TIER_COLORS = { T1: "#8b3dff", T2: "#dc2626", T3: "#c0c0c0", Graduated: "#10b981", "PCW Wrestler": "#f59e0b" };

export default function TierManagement() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("assign"); // "assign" | "classroom"
  const [classroomFilter, setClassroomFilter] = useState("all"); // "all" | tier
  const [pendingTierChanges, setPendingTierChanges] = useState({}); // trainee tier changes
  const [pendingCoachTiers, setPendingCoachTiers] = useState({}); // coach teaching_tiers changes
  const [pendingCoachFocus, setPendingCoachFocus] = useState({}); // coach focus changes
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const roles = currentUser?.roles ?? [];
        const hasCoachRole = roles.includes("coach") || roles.includes("admin") || currentUser?.role === "admin";
        if (!hasCoachRole) navigate(createPageUrl("Dashboard"));
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, [navigate]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const [profilesRes, authUsersRes] = await Promise.all([
        base44.entities.UserProfile.list("-updated_date", 500),
        base44.entities.User.list("full_name", 500),
      ]);
      const profiles = toArray(profilesRes);
      const authUsers = toArray(authUsersRes);

      // Build profile lookup by auth_user_id
      const profileByAuthId = {};
      profiles.forEach((p) => {
        if (p.auth_user_id) profileByAuthId[p.auth_user_id] = p;
      });

      // Merge all auth users, attach profile data if available
      const merged = authUsers.map((authUser) => {
        const profile = profileByAuthId[authUser.id];
        if (profile) {
          // Always respect the auth user's role if it's admin/coach — profile role may lag behind
          const effectiveRole = authUser.role === "admin" ? "admin"
            : authUser.role === "coach" && profile.role !== "admin" ? "coach"
            : profile.role;
          return { ...profile, auth_user_id: authUser.id, role: effectiveRole };
        }
        return {
          id: `profile_${authUser.id}`,
          auth_user_id: authUser.id,
          full_name: authUser.full_name || authUser.email,
          email: authUser.email,
          role: authUser.role || "trainee",
          _no_profile: true,
        };
      });

      return merged.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    },
    initialData: [],
    refetchInterval: 15000,
  });

  // Real-time: refetch when a UserProfile is created or updated
  useEffect(() => {
    const unsubscribe = base44.entities.UserProfile.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const isAdminProfile = (u) => u.role === "admin" || u.roles?.includes("admin");
  const isCoachProfile = (u) => !isAdminProfile(u) && (u.role === "coach" || u.roles?.includes("coach"));

  const trainees = allUsers.filter((u) => !isCoachProfile(u) && !isAdminProfile(u));
  const coaches = allUsers.filter((u) => isCoachProfile(u));

  // Current coach's teaching tiers (for classroom filter default)
  const myProfile = allUsers.find((u) => u.auth_user_id === user?.id);
  const myTeachingTiers = myProfile?.teaching_tiers || [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const ops = [];

      for (const [id, tier] of Object.entries(pendingTierChanges)) {
        const user = allUsers.find(u => u.id === id);
        if (!user) continue;

        if (id.startsWith("profile_")) {
          // No UserProfile exists yet — create one
          ops.push(base44.entities.UserProfile.create({
            auth_user_id: user.auth_user_id,
            full_name: user.full_name || "",
            email: user.email || "",
            role: user.role || "trainee",
            tier,
          }));
        } else {
          ops.push(base44.entities.UserProfile.update(id, { tier }));
        }
      }

      for (const [id, tiers] of Object.entries(pendingCoachTiers)) {
        if (id.startsWith("profile_")) continue; // can't update coaches without a profile
        ops.push(base44.entities.UserProfile.update(id, { teaching_tiers: tiers }));
      }

      for (const [id, focus] of Object.entries(pendingCoachFocus)) {
        if (id.startsWith("profile_")) continue;
        ops.push(base44.entities.UserProfile.update(id, { coach_focus: focus }));
      }

      return Promise.all(ops);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      setPendingTierChanges({});
      setPendingCoachTiers({});
      setPendingCoachFocus({});
      toast.success("Changes saved!");
    },
    onError: () => toast.error("Failed to save changes"),
  });

  const handleTraineeTier = (userId, tier) => {
    setPendingTierChanges((prev) => ({ ...prev, [userId]: tier }));
  };

  const handleCoachTierToggle = (coachId, tier, currentTiers) => {
    const base = pendingCoachTiers[coachId] ?? currentTiers ?? [];
    const updated = base.includes(tier) ? base.filter((t) => t !== tier) : [...base, tier];
    setPendingCoachTiers((prev) => ({ ...prev, [coachId]: updated }));
  };

  const getTierColor = (tier) => TIER_COLORS[tier] || "#666";
  const hasChanges = Object.keys(pendingTierChanges).length > 0 || Object.keys(pendingCoachTiers).length > 0 || Object.keys(pendingCoachFocus).length > 0;

  // Classroom: trainees grouped by tier
  const classroomTiers = TIERS.filter((t) => classroomFilter === "all" || classroomFilter === t);

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Shield className="w-8 h-8" style={{ color: "#8b3dff" }} />
              Tier Management
            </h1>
            <p className="text-gray-400">Assign tiers to trainees and manage teaching assignments</p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
            style={{ background: "#8b3dff" }}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : `Save Changes${hasChanges ? ` (${Object.keys(pendingTierChanges).length + Object.keys(pendingCoachTiers).length})` : ""}`}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "assign", label: "Assign Tiers", icon: Users },
            { key: "classroom", label: "Classroom View", icon: BookOpen },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={
                activeTab === key
                  ? { background: "rgba(139,61,255,0.2)", border: "1px solid #8b3dff", color: "#8b3dff" }
                  : { background: "#0f0f0f", border: "1px solid #333", color: "#999" }
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── ASSIGN TIERS TAB ── */}
        {activeTab === "assign" && (
          <div className="space-y-6">
            {/* Trainees */}
            <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Trainees ({trainees.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trainees.map((trainee) => (
                    <div key={trainee.id} className="p-4 rounded-lg border border-gray-800" style={{ background: "#0a0a0a" }}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)" }}>
                            <span className="text-white font-bold">
                              {trainee.wrestling_name?.[0]?.toUpperCase() || trainee.full_name?.[0]?.toUpperCase() || "T"}
                            </span>
                          </div>
                          <div className="flex-1">
                           <h3 className="font-semibold text-white">{trainee.wrestling_name || trainee.full_name}</h3>
                           {trainee.wrestling_name && trainee.wrestling_name !== trainee.full_name && (
                             <p className="text-xs text-gray-400">{trainee.full_name}</p>
                           )}
                           <p className="text-sm text-gray-400">{trainee.email}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs px-2 py-1 rounded"
                                style={{ background: `${getTierColor(trainee.tier)}20`, color: getTierColor(trainee.tier) }}>
                                Current: {trainee.tier || "Not Set"}
                              </span>
                              {trainee.focus_areas?.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400">
                                  {trainee.focus_areas.join(", ")}
                                </span>
                              )}
                              {pendingTierChanges[trainee.id] && (
                                <span className="text-xs px-2 py-1 rounded bg-yellow-900 text-yellow-300">
                                  → {pendingTierChanges[trainee.id]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-52">
                          <Select
                            value={pendingTierChanges[trainee.id] || trainee.tier || undefined}
                            onValueChange={(value) => handleTraineeTier(trainee.id, value)}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                              <SelectValue placeholder="Select tier..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="T1">T1 — Fundamentals</SelectItem>
                              <SelectItem value="T2">T2 — Intermediate</SelectItem>
                              <SelectItem value="T3">T3 — Advanced</SelectItem>
                              <SelectItem value="Graduated">Graduated</SelectItem>
                              <SelectItem value="PCW Wrestler">PCW Wrestler</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {trainees.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-500">No trainees found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Coaches */}
            {coaches.length > 0 && (
              <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" style={{ color: "#8b3dff" }} />
                    Coaches — Teaching Tiers ({coaches.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">Select which tier(s) each coach teaches. Coaches can teach multiple tiers.</p>
                  <div className="space-y-4">
                    {coaches.map((coach) => {
                      const currentTiers = pendingCoachTiers[coach.id] ?? coach.teaching_tiers ?? [];
                      return (
                        <div key={coach.id} className="p-4 rounded-lg border border-gray-800" style={{ background: "#0a0a0a" }}>
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ background: "linear-gradient(135deg, #8b3dff 0%, #6d28d9 100%)" }}>
                              <span className="text-white font-bold">
                                {coach.wrestling_name?.[0]?.toUpperCase() || coach.full_name?.[0]?.toUpperCase() || "C"}
                              </span>
                            </div>
                            <div className="flex-1">
                             <h3 className="font-semibold text-white">{coach.wrestling_name || coach.full_name}</h3>
                             {coach.wrestling_name && coach.wrestling_name !== coach.full_name && (
                               <p className="text-xs text-gray-400">{coach.full_name}</p>
                             )}
                             <p className="text-sm text-gray-400">{coach.email}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500 whitespace-nowrap">Focus:</span>
                                <Select
                                  value={pendingCoachFocus[coach.id] ?? coach.coach_focus ?? ""}
                                  onValueChange={(v) => setPendingCoachFocus((prev) => ({ ...prev, [coach.id]: v }))}
                                >
                                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white text-xs h-8 flex-1">
                                    <SelectValue placeholder="Select specialty..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {COACH_FOCUS_OPTIONS.map((opt) => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {["T1", "T2", "T3"].map((tier) => (
                                <label key={tier} className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={currentTiers.includes(tier)}
                                    onCheckedChange={() => handleCoachTierToggle(coach.id, tier, coach.teaching_tiers ?? [])}
                                    className="border-gray-600"
                                  />
                                  <span className="text-sm font-medium" style={{ color: getTierColor(tier) }}>{tier}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── CLASSROOM VIEW TAB ── */}
        {activeTab === "classroom" && (
          <div className="space-y-6">
            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-400">Filter by tier:</span>
              <button
                onClick={() => setClassroomFilter("all")}
                className="px-3 py-1.5 rounded-lg text-sm transition-all"
                style={classroomFilter === "all"
                  ? { background: "rgba(139,61,255,0.2)", border: "1px solid #8b3dff", color: "#8b3dff" }
                  : { background: "#0f0f0f", border: "1px solid #333", color: "#999" }}
              >
                All Tiers
              </button>
              {TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setClassroomFilter(classroomFilter === tier ? "all" : tier)}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all"
                  style={classroomFilter === tier
                    ? { background: `${getTierColor(tier)}20`, border: `1px solid ${getTierColor(tier)}`, color: getTierColor(tier) }
                    : { background: "#0f0f0f", border: "1px solid #333", color: "#999" }}
                >
                  {tier}
                </button>
              ))}
              {myTeachingTiers.length > 0 && (
                <button
                  onClick={() => setClassroomFilter(myTeachingTiers[0])}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all ml-auto"
                  style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981" }}
                >
                  My Class ({myTeachingTiers.join(", ")})
                </button>
              )}
            </div>

            {classroomTiers.map((tier) => {
              const tierTrainees = trainees.filter((t) => t.tier === tier);
              const tierCoaches = ["T1","T2","T3"].includes(tier)
                ? coaches.filter((c) => (c.teaching_tiers ?? []).includes(tier))
                : [];
              const tierLabel = tier === "Graduated"
                ? "Graduated — Main Show"
                : tier === "PCW Wrestler"
                ? "PCW Wrestlers"
                : tier;
              return (
                <Card key={tier} className="border-gray-800" style={{ background: "#0f0f0f" }}>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3">
                      <span className="text-lg font-bold px-3 py-1 rounded-lg"
                        style={{ background: `${getTierColor(tier)}20`, color: getTierColor(tier) }}>
                        {tierLabel}
                      </span>
                      <span>{tierTrainees.length} member{tierTrainees.length !== 1 ? "s" : ""}</span>
                      {tierCoaches.length > 0 && (
                        <span className="text-sm text-gray-500 font-normal ml-auto">
                          Coaches: {tierCoaches.map((c) => c.wrestling_name || c.full_name).join(", ")}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tierTrainees.length === 0 ? (
                      <p className="text-gray-600 text-sm py-2">No trainees in this tier</p>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tierTrainees.map((trainee) => (
                          <div key={trainee.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800"
                            style={{ background: "#0a0a0a" }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: `${getTierColor(tier)}30`, color: getTierColor(tier) }}>
                              <span className="font-bold text-sm">
                                {(trainee.wrestling_name || trainee.full_name || "?")[0]?.toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                             <p className="text-sm font-medium text-white truncate">
                               {trainee.wrestling_name || trainee.full_name}
                             </p>
                             {trainee.wrestling_name && trainee.wrestling_name !== trainee.full_name && (
                               <p className="text-xs text-gray-400 truncate">{trainee.full_name}</p>
                             )}
                             {trainee.focus_areas?.length > 0 && (
                               <p className="text-xs text-gray-500 truncate">{trainee.focus_areas.join(", ")}</p>
                             )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}