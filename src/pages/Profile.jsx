import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  HeartPulse,
  ShieldAlert,
  Save,
  Edit2,
  Target,
  Award,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const FOCUS_OPTIONS = [
  "Wrestler",
  "Referee",
  "Manager/Valet",
  "Commentary",
  "Announcer",
  "Photographer/Videographer",
];

export const COACH_FOCUS_OPTIONS = [
  "Wrestler",
  "Referee",
  "Manager/Valet",
  "Commentary",
  "Announcer",
  "Photographer/Videographer",
  "Strength & Conditioning",
  "Promos",
  "Match Psychology",
  "Character Work",
  "Technical Wrestling",
  "Aerial/High Flying",
  "Striking",
  "Submission Wrestling",
  "Ring Generalship",
];
import ProfileStats from "@/components/profile/ProfileStats";
import AthleteVitalsCard from "@/components/profile/AthleteVitalsCard";
import ActivityFeed from "@/components/profile/ActivityFeed";
import ProfileBanner from "@/components/profile/ProfileBanner";
import AchievementBadges from "@/components/badges/AchievementBadges";
import AttendanceHeatmap from "@/components/calendar/AttendanceHeatmap";
import PerformanceMetrics from "@/components/charts/PerformanceMetrics";
import { toast } from "sonner";
import AccountabilityPartnersCard from "@/components/accountability/AccountabilityPartnersCard";
import HealthConnectStatus from "@/components/profile/HealthConnectStatus";

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

const REQUIRED_FIELDS = [
  "full_name",
  "wrestling_name",
  "phone",
  "height",
  "weight",
  "goals",
  "emergency_contact_name",
  "emergency_contact_phone",
  "emergency_contact_relationship",
  "specialist_focus",
];

// Convert input -> number, or return undefined (so we can OMIT from payload)
function toNumberOrUndefined(value) {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // holds user edits while editing
  const [formState, setFormState] = useState({});

  const parseHeightParts = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return { feet: "", inches: "" };

    const match = raw.match(/^(\d+)'\s*(\d+)$/);
    if (match) {
      return { feet: match[1], inches: match[2] };
    }

    return { feet: "", inches: raw };
  };

  // 1) AUTH USER
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const myRoles = useMemo(() => me?.roles || (me?.role ? [me.role] : []), [me]);
  const isAdmin = myRoles.includes("admin") || me?.role === "admin";
  const isTrainee = myRoles.includes("trainee") && !myRoles.includes("coach") && !isAdmin;

  // 2) USER PROFILE ENTITY (editable fields)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["myProfile"],
    enabled: !!me?.id,
    queryFn: async () => {
      if (!me?.id) return null;
      const res = await base44.entities.UserProfile.filter({ auth_user_id: me.id });
      const items = toArray(res);
      return items[0] || null;
    },
    initialData: null,
  });

  // 3) TRAINING / CHECKINS / ASSIGNMENTS
  const { data: trainingLogs = [] } = useQuery({
    queryKey: ["myTrainingLogs"],
    enabled: !!me?.id,
    queryFn: async () => {
      const res = await base44.entities.TrainingLog.filter({ trainee_id: me.id }, "-date");
      return toArray(res);
    },
    initialData: [],
  });

  const { data: myCheckIns = [] } = useQuery({
    queryKey: ["myCheckIns"],
    enabled: !!me?.id,
    queryFn: async () => {
      const res = await base44.entities.CheckIn.filter({ trainee_id: me.id }, "-check_in_time");
      return toArray(res);
    },
    initialData: [],
  });

  const { data: myAssignments = [] } = useQuery({
    queryKey: ["myAssignments"],
    enabled: !!me?.id,
    queryFn: async () => {
      const res = await base44.entities.Assignment.filter({ trainee_id: me.id }, "-due_date");
      return toArray(res);
    },
    initialData: [],
  });

  // Merge view model: auth user + profile fields
  const info = useMemo(() => {
    return {
      // auth-derived
      email: me?.email || "",

      // profile-derived
      id: profile?.id,
      full_name: profile?.full_name ?? me?.full_name ?? "",
      wrestling_name: profile?.wrestling_name ?? "",
      tier: profile?.tier ?? me?.tier ?? "T1",

      phone: profile?.phone ?? "",
      height: profile?.height ?? "",
      weight: profile?.weight ?? "",
      years_training: profile?.years_training ?? "",

      goals: profile?.goals ?? "",
      specialist_focus: profile?.specialist_focus ?? profile?.specialties ?? "",
      focus_areas: profile?.focus_areas ?? [],

      emergency_contact_name: profile?.emergency_contact_name ?? "",
      emergency_contact_phone: profile?.emergency_contact_phone ?? "",
      emergency_contact_relationship: profile?.emergency_contact_relationship ?? "",

      medical_notes: profile?.medical_notes ?? "",
      bio: profile?.bio ?? "",
      pronouns: profile?.pronouns ?? "",
      start_date: profile?.start_date ?? "",
      banner_url: profile?.banner_url,
      avatar_url: profile?.avatar_url,
      coach_focus: profile?.coach_focus ?? "",
    };
  }, [me, profile]);

  // Keep a simple completion status (trainees only)
  const missingRequired = useMemo(() => {
    if (!isTrainee) return [];
    const source = isEditing ? { ...info, ...formState } : info;

    return REQUIRED_FIELDS.filter((key) => isBlank(source[key]));
  }, [info, formState, isEditing, isTrainee]);

  const isComplete = missingRequired.length === 0;

  useEffect(() => {
    // prompt if incomplete (trainees only)
    if (!meLoading && !profileLoading && isTrainee && !isComplete) {
      toast.warning("Profile incomplete", {
        description: "Please complete your required profile fields to continue training.",
        duration: 6000,
      });
    }
  }, [meLoading, profileLoading, isTrainee, isComplete]);

  const updateProfile = useMutation({
    mutationFn: async (payload) => {
      if (!profile?.id) throw new Error("Profile record not found.");
      return base44.entities.UserProfile.update(profile.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      toast.success("Profile saved!");
      setIsEditing(false);
      setFormState({});
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      const detail =
        error?.response?.data ? JSON.stringify(error.response.data) : error?.message || String(error);
      toast.error("Profile update failed: " + detail);
    },
  });

  const handleChange = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const startEdit = () => {
    setFormState({
      full_name: info.full_name,
      wrestling_name: info.wrestling_name,
      phone: info.phone,
      height_feet: parseHeightParts(info.height).feet,
      height_inches: parseHeightParts(info.height).inches,
      weight: info.weight,
      years_training: info.years_training,
      goals: info.goals,
      specialist_focus: info.specialist_focus,
      emergency_contact_name: info.emergency_contact_name,
      emergency_contact_phone: info.emergency_contact_phone,
      emergency_contact_relationship: info.emergency_contact_relationship,
      medical_notes: info.medical_notes,
      // optional extras
      pronouns: info.pronouns,
      start_date: info.start_date,
      bio: info.bio,
      coach_focus: info.coach_focus,
    });
    setIsEditing(true);
  };

  const saveProfile = () => {
    const merged = {
      ...info,
      ...formState,
      height: [formState.height_feet, formState.height_inches].filter(Boolean).join("'")
    };

    // Required validation (trainees only)
    if (isTrainee) {
      const missing = REQUIRED_FIELDS.filter((k) => isBlank(merged[k]));
      if (missing.length > 0) {
        toast.error("Missing required fields", {
          description: missing.join(", "),
          duration: 8000,
        });
        return;
      }
    }

    // Validate numeric-only fields while preserving schema types
    const yearsNum = toNumberOrUndefined(merged.years_training);

    const feetString = String(formState.height_feet ?? "").trim();
    const inchesString = String(formState.height_inches ?? "").trim();

    if (feetString && toNumberOrUndefined(feetString) === undefined) {
      toast.error("Height feet must be a number", { description: `You entered: "${feetString}"` });
      return;
    }

    if (inchesString && toNumberOrUndefined(inchesString) === undefined) {
      toast.error("Height inches must be a number", { description: `You entered: "${inchesString}"` });
      return;
    }

    const weightString = String(merged.weight ?? "").trim();
    if (weightString && toNumberOrUndefined(weightString) === undefined) {
      toast.error("Weight must be a number", { description: `You entered: "${weightString}"` });
      return;
    }

    const yearsString = String(merged.years_training ?? "").trim();
    if (yearsString && yearsNum === undefined) {
      toast.error("Years Training must be a number", { description: `You entered: "${yearsString}"` });
      return;
    }

    // Build update payload:
    // - never send email (auth-controlled)
    // - keep height/weight as strings to match schema
    const payload = {
      full_name: merged.full_name?.trim() || "",
      wrestling_name: merged.wrestling_name?.trim() || "",
      phone: merged.phone?.trim() || "",
      height: String(merged.height ?? "").trim(),
      weight: String(merged.weight ?? "").trim(),

      goals: merged.goals || "",
      specialist_focus: merged.specialist_focus || "",
      focus_areas: merged.focus_areas || [],

      emergency_contact_name: merged.emergency_contact_name || "",
      emergency_contact_phone: merged.emergency_contact_phone || "",
      emergency_contact_relationship: merged.emergency_contact_relationship || "",

      medical_notes: merged.medical_notes || "",

      // optional extras
      pronouns: merged.pronouns || "",
      start_date: merged.start_date || "",
      bio: merged.bio || "",
      coach_focus: merged.coach_focus || "",
    };

    if (yearsNum !== undefined) {
      payload.years_training = yearsNum;
    } else {
      // Explicitly unset if blank so the API doesn't receive an invalid empty string
      payload.years_training = null;
    }

    updateProfile.mutate(payload);
  };

  const streak = useMemo(() => {
    // keep whatever your streak logic is elsewhere; placeholder
    return 0;
  }, []);

  const badgeStats = useMemo(() => {
    return {};
  }, []);

  if (meLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        Loading profile…
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(circle at top, #111 0%, #000 60%)" }}
    >
      <ProfileBanner
        bannerUrl={profile?.banner_url}
        avatarUrl={profile?.avatar_url}
        name={info.full_name}
        wrestlingName={info.wrestling_name}
        tier={info.tier || "T1"}
        editable={true}
        onBannerChange={async (url) => {
          if (profile?.id) {
            await base44.entities.UserProfile.update(profile.id, { banner_url: url });
            await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
          }
        }}
        onAvatarChange={async (url) => {
          if (profile?.id) {
            await base44.entities.UserProfile.update(profile.id, { avatar_url: url });
            await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
          }
        }}
      />

      <div className="max-w-6xl mx-auto space-y-6 p-6 md:p-8">
        {/* Completion banner */}
        {isTrainee && !isComplete && (
          <div className="rounded-lg border border-yellow-700/40 bg-yellow-900/10 p-4 text-yellow-200 text-sm">
            <b>Profile incomplete.</b> Required: {missingRequired.join(", ")}
          </div>
        )}

        <div className="flex items-center justify-end gap-4 flex-wrap">
          {!isEditing ? (
            <Button
              variant="outline"
              className="border-purple-500 text-purple-300 hover:bg-purple-500/10"
              onClick={startEdit}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300"
                onClick={() => {
                  setIsEditing(false);
                  setFormState({});
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={saveProfile}
                disabled={updateProfile.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfile.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          )}
        </div>

        {!isAdmin && (
          <ProfileStats
            trainingLogs={toArray(trainingLogs)}
            checkIns={toArray(myCheckIns)}
            assignments={toArray(myAssignments)}
            streak={streak}
            level={me?.level || 1}
            xp={me?.xp || 0}
          />
        )}

        {!isAdmin && (
          <AthleteVitalsCard userId={me?.id} userName={info.full_name} />
        )}

        {!isAdmin && (
          <HealthConnectStatus userId={me?.id} />
        )}

        {/* Basic Info */}
        <Card className="border-gray-800 bg-[#050505]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Full Name"
                value={isEditing ? formState.full_name : info.full_name}
                editable={isEditing}
                onChange={(v) => handleChange("full_name", v)}
              />
              <Field label="Email" value={info.email} editable={false} />
              {!isAdmin && (
                <Field
                  label="Wrestling Name *"
                  value={isEditing ? formState.wrestling_name : info.wrestling_name}
                  editable={isEditing}
                  onChange={(v) => handleChange("wrestling_name", v)}
                />
              )}
              <Field
                label="Phone Number"
                value={isEditing ? formState.phone : info.phone}
                editable={isEditing}
                onChange={(v) => handleChange("phone", v)}
              />
              {!isAdmin && (
                <Field label="Tier" value={info.tier || "T1"} editable={false} helper="Tier is set by Admin/Coaches." />
              )}
              {!isAdmin && (
                <Field
                  label="Pronouns"
                  value={isEditing ? formState.pronouns : info.pronouns}
                  editable={isEditing}
                  onChange={(v) => handleChange("pronouns", v)}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Physical Stats + Training Goals — trainees/coaches only */}
        {!isAdmin && <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-gray-800 bg-[#050505]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-red-400" />
                Physical Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400">Height *</p>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      className="bg-black/40 border-gray-700 text-sm text-white"
                      value={formState.height_feet ?? ""}
                      placeholder="Feet"
                      onChange={(e) => handleChange("height_feet", e.target.value)}
                    />
                    <Input
                      className="bg-black/40 border-gray-700 text-sm text-white"
                      value={formState.height_inches ?? ""}
                      placeholder="Inches"
                      onChange={(e) => handleChange("height_inches", e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="w-full rounded-md border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-100 min-h-[38px] flex items-center">
                    {info.height ? `${parseHeightParts(info.height).feet || 0}' ${parseHeightParts(info.height).inches || 0}\"` : "—"}
                  </div>
                )}
              </div>
              <Field
                label="Weight (lbs) *"
                value={isEditing ? formState.weight : info.weight}
                editable={isEditing}
                onChange={(v) => handleChange("weight", v)}
                placeholder="Number (ex: 220)"
              />
              <Field
                label="Years Training"
                value={isEditing ? formState.years_training : info.years_training}
                editable={isEditing}
                onChange={(v) => handleChange("years_training", v)}
                placeholder="Number (ex: 1.5)"
              />
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-[#050505]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Training Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Field
                label="Goals *"
                value={isEditing ? formState.goals : info.goals}
                editable={isEditing}
                multiline
                placeholder="What do you want to improve?"
                onChange={(v) => handleChange("goals", v)}
              />
            </CardContent>
          </Card>
        </div>}

        {/* Coach Focus — only shown for coaches/admins */}
        {!isTrainee && (
          <Card className="border-gray-800 bg-[#050505]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                Coaching Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400">Your Coaching Specialty</p>
                {isEditing ? (
                  <Select
                    value={formState.coach_focus ?? info.coach_focus ?? ""}
                    onValueChange={(v) => handleChange("coach_focus", v)}
                  >
                    <SelectTrigger className="bg-black/40 border-gray-700 text-white">
                      <SelectValue placeholder="Select your specialty..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COACH_FOCUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="w-full rounded-md border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-100 min-h-[38px] flex items-center">
                    {info.coach_focus || "—"}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">This is visible to trainees and used to direct them to the right coach.</p>
            </CardContent>
          </Card>
        )}

        {/* Specialist + Emergency — trainees/coaches only */}
        {!isAdmin && <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-gray-800 bg-[#050505]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Wrestling Specialist Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Specialist Focus"
                value={isEditing ? formState.specialist_focus : info.specialist_focus}
                editable={isEditing}
                multiline
                placeholder="Free text (ex: technical, power, high-flyer, striker...)"
                onChange={(v) => handleChange("specialist_focus", v)}
              />
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400">Focus Area(s) *</p>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_OPTIONS.map((opt) => {
                    const current = isEditing ? (formState.focus_areas ?? info.focus_areas ?? []) : (info.focus_areas ?? []);
                    const checked = current.includes(opt);
                    return (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={checked}
                          disabled={!isEditing}
                          onCheckedChange={(v) => {
                            const prev = formState.focus_areas ?? info.focus_areas ?? [];
                            const next = v ? [...prev, opt] : prev.filter((o) => o !== opt);
                            handleChange("focus_areas", next);
                          }}
                          className="border-gray-600"
                        />
                        <span className="text-sm text-gray-300">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-[#050505]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                Emergency Contact & Medical
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Emergency Contact Name *"
                value={isEditing ? formState.emergency_contact_name : info.emergency_contact_name}
                editable={isEditing}
                onChange={(v) => handleChange("emergency_contact_name", v)}
              />
              <Field
                label="Emergency Contact Phone *"
                value={isEditing ? formState.emergency_contact_phone : info.emergency_contact_phone}
                editable={isEditing}
                onChange={(v) => handleChange("emergency_contact_phone", v)}
              />
              <Field
                label="Emergency Contact Relationship *"
                value={isEditing ? formState.emergency_contact_relationship : info.emergency_contact_relationship}
                editable={isEditing}
                onChange={(v) => handleChange("emergency_contact_relationship", v)}
              />
              <Field
                label="Medical Notes (Optional)"
                value={isEditing ? formState.medical_notes : info.medical_notes}
                editable={isEditing}
                multiline
                placeholder="Allergies, injuries, conditions coaches should know about."
                onChange={(v) => handleChange("medical_notes", v)}
              />
            </CardContent>
          </Card>
        </div>}

        {!isAdmin && <AttendanceHeatmap checkIns={toArray(myCheckIns)} />}

        {!isAdmin && (
          <PerformanceMetrics
            trainingLogs={toArray(trainingLogs)}
            checkIns={toArray(myCheckIns)}
            assignments={toArray(myAssignments)}
          />
        )}

        {!isAdmin && <AchievementBadges stats={badgeStats} />}

        {/* Accountability Partners */}
        {!isAdmin && (
          <AccountabilityPartnersCard user={me} />
        )}

        {/* Delete Account */}
        <div className="rounded-xl border border-red-900/40 p-5" style={{ background: "rgba(220,38,38,0.05)" }}>
          <h3 className="text-red-400 font-semibold mb-1 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Danger Zone
          </h3>
          <p className="text-sm text-gray-500 mb-4">Deleting your account is permanent and cannot be undone. All your data will be removed.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-800 hover:bg-red-900/20 transition-colors">
                Delete My Account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent style={{ background: "#0f0f0f", border: "1px solid #333" }}>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  This action is <strong className="text-red-400">permanent and irreversible</strong>. Your profile, training logs, assignments, videos, and all associated data will be permanently deleted. There is no way to recover your account after this.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel style={{ borderColor: "#555", color: "#999" }}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  style={{ background: "#dc2626" }}
                  onClick={async () => {
                    try {
                      if (profile?.id) await base44.entities.UserProfile.delete(profile.id);
                      await base44.auth.logout("/");
                    } catch (e) {
                      console.error("Delete account error:", e);
                    }
                  }}>
                  Yes, Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {!isAdmin && (
          <ActivityFeed
            trainingLogs={toArray(trainingLogs)}
            checkIns={toArray(myCheckIns)}
            assignments={toArray(myAssignments)}
          />
        )}
      </div>
    </div>
  );
}

function Field({ label, value, editable, onChange, helper, placeholder, multiline }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-400">{label}</p>

      {editable ? (
        multiline ? (
          <textarea
            className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            rows={3}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(e) => onChange && onChange(e.target.value)}
          />
        ) : (
          <Input
            className="bg-black/40 border-gray-700 text-sm text-white"
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(e) => onChange && onChange(e.target.value)}
          />
        )
      ) : (
        <div className="w-full rounded-md border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-100 min-h-[38px] flex items-center">
          {value && String(value).length > 0 ? String(value) : placeholder || "—"}
        </div>
      )}

      {helper && <p className="text-[10px] text-gray-500">{helper}</p>}
    </div>
  );
}