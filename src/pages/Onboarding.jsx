import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ChevronRight, ChevronLeft, CheckCircle2, User, Swords, BookOpen,
  Map, LayoutDashboard, MessageSquare, ClipboardList, Calendar,
  Trophy, Shield, Flame, Star, Heart, AlertTriangle, Video,
  UserPlus, Award, Settings, Target, Zap
} from "lucide-react";

const TOTAL_STEPS = 6;
const COACH_STEPS = 5; // coach skips character builder
const ADMIN_STEPS = 4; // admin: welcome, profile, tour, checklist

const ARCHETYPES = ["Powerhouse", "Technician", "High Flyer", "Striker", "Hybrid"];
const ALIGNMENTS = ["Face", "Heel", "Tweener"];
const TRAITS = ["Aggressive", "Calculated", "Flashy", "Ruthless", "Underdog", "Explosive", "Arrogant", "Relentless", "Smooth", "Disciplined", "Showman"];

const CULTURE_RULES = [
  { icon: Heart, color: "#8b3dff", title: "Respect the Art", body: "Pro wrestling is a craft built on trust. Every person in that ring is putting their body and reputation in your hands. Treat every session like it matters — because it does." },
  { icon: Shield, color: "#dc2626", title: "Safety First, Always", body: "There is no spot, bump, or sequence worth risking your partner's health. If something feels wrong, speak up. We tap out, we reset, we protect each other." },
  { icon: Star, color: "#f59e0b", title: "Be a Good Hand", body: "Show up on time, wipe your feet, clean up after yourself, and be ready to work. Your attitude in the building is part of your character." },
  { icon: Flame, color: "#10b981", title: "Leave Your Ego at the Door", body: "Everyone starts somewhere. Coaches were trainees. Champions were beginners. Stay coachable, stay humble, and never stop learning." },
  { icon: AlertTriangle, color: "#c0c0c0", title: "What Happens Here, Stays Here", body: "Ring business stays in the ring. We do not leak spots, sequences, or internal school matters publicly. Protect the business." },
  { icon: CheckCircle2, color: "#8b3dff", title: "Earn Your Stripes", body: "Tiers exist for a reason. Don't rush. The fundamentals you build in T1 are what carry you through the biggest moments of your career." },
];

const APP_TOUR_TRAINEE = [
  { icon: LayoutDashboard, color: "#8b3dff", label: "Dashboard", desc: "Your home base. See upcoming sessions, your training stats, XP progress, and quick actions all in one place." },
  { icon: ClipboardList, color: "#dc2626", label: "Assignments", desc: "Coaches assign drills, match studies, promos, and conditioning here. Submit your work and get graded." },
  { icon: Calendar, color: "#10b981", label: "Events", desc: "The full PCW calendar. Training sessions, shows, and showcases. Sign up for events directly from here." },
  { icon: Swords, color: "#f59e0b", label: "Skill Tracker", desc: "Track your progress through the PCW curriculum. Self-assess, then get verified by your coach level by level." },
  { icon: MessageSquare, color: "#c0c0c0", label: "Chat", desc: "Connect with your coaches and fellow trainees. Get announcements, ask questions, and stay in the loop." },
  { icon: Video, color: "#8b3dff", label: "Video Analysis", desc: "Upload match footage for AI-powered feedback and coach review to accelerate your development." },
];

const APP_TOUR_COACH = [
  { icon: LayoutDashboard, color: "#8b3dff", label: "Dashboard", desc: "Your coaching hub. See at-a-glance trainee activity, pending reviews, and today's attendance." },
  { icon: ClipboardList, color: "#dc2626", label: "Assignments", desc: "Create and grade assignments for your trainees. Track submissions and give detailed feedback." },
  { icon: Calendar, color: "#10b981", label: "Events", desc: "Schedule training sessions and shows. Manage attendance and session types." },
  { icon: Swords, color: "#f59e0b", label: "Skill Tracker", desc: "Verify trainee skills and sign off on curriculum milestones as they progress." },
  { icon: MessageSquare, color: "#c0c0c0", label: "Chat", desc: "Broadcast announcements, answer questions, and message trainees directly." },
  { icon: Video, color: "#8b3dff", label: "Video Review", desc: "Review trainee-submitted footage and provide timestamped coaching notes." },
];

const APP_TOUR_ADMIN = [
  { icon: Shield, color: "#dc2626", label: "Admin Dashboard", desc: "Full operational oversight — attendance, assignments, payments, and risk flags all in one place." },
  { icon: UserPlus, color: "#8b3dff", label: "Role Management", desc: "Invite users, assign roles, approve coach requests, and manage the full PCW roster." },
  { icon: Award, color: "#f59e0b", label: "Tier Management", desc: "Promote trainees through T1→T2→T3→Graduated. Assign coaches to tiers." },
  { icon: Calendar, color: "#10b981", label: "Events", desc: "Create and manage training sessions, shows, and showcases across the calendar." },
  { icon: ClipboardList, color: "#c0c0c0", label: "Assignments", desc: "Create org-wide or individual assignments. Monitor completion and grade submissions." },
  { icon: Settings, color: "#8b3dff", label: "Full Control", desc: "Everything coaches can do, plus billing, reporting, and platform-wide settings." },
];

const CHECKLIST_TRAINEE = [
  { icon: User, color: "#8b3dff", label: "Complete your profile", desc: "Add your height, weight, emergency contact, and training goals.", page: "Profile" },
  { icon: Swords, color: "#dc2626", label: "Check in to your first session", desc: "Use the Check-In page to log attendance after your first training.", page: "CheckIn" },
  { icon: BookOpen, color: "#f59e0b", label: "Explore your Character Builder", desc: "Develop your in-ring persona in the Character Builder.", page: "CharacterBuilder" },
  { icon: Swords, color: "#10b981", label: "Review the Skill Tracker", desc: "See what skills you'll be working toward in T1.", page: "SkillTracker" },
  { icon: ClipboardList, color: "#c0c0c0", label: "Check for assignments", desc: "See if any assignments have been given to your tier.", page: "Assignments" },
];

const CHECKLIST_COACH = [
  { icon: User, color: "#8b3dff", label: "Complete your coach profile", desc: "Add your specialty, coaching focus, and bio so trainees know who you are.", page: "Profile" },
  { icon: ClipboardList, color: "#dc2626", label: "Create your first assignment", desc: "Assign a drill or promo task to your tier to get started.", page: "CreateAssignment" },
  { icon: Calendar, color: "#10b981", label: "Review upcoming events", desc: "See what sessions are scheduled and mark your attendance.", page: "Events" },
  { icon: MessageSquare, color: "#f59e0b", label: "Send a welcome message", desc: "Introduce yourself to your trainees in the Chat.", page: "Chat" },
  { icon: Swords, color: "#c0c0c0", label: "Review the Skill Tracker", desc: "Familiarize yourself with the curriculum you'll be verifying.", page: "SkillTracker" },
];

const CHECKLIST_ADMIN = [
  { icon: UserPlus, color: "#8b3dff", label: "Invite your first users", desc: "Head to Role Management to invite trainees and coaches.", page: "RoleManagement" },
  { icon: Award, color: "#dc2626", label: "Set up tiers", desc: "Assign trainees to T1/T2/T3 and assign coaches to tiers.", page: "TierManagement" },
  { icon: Calendar, color: "#10b981", label: "Create your first event", desc: "Schedule a training session on the Events page.", page: "Events" },
  { icon: Shield, color: "#f59e0b", label: "Review the Admin Dashboard", desc: "Get familiar with the command center for full operational oversight.", page: "AdminDashboard" },
  { icon: MessageSquare, color: "#c0c0c0", label: "Post an announcement", desc: "Welcome your team in the Chat's announcements channel.", page: "Chat" },
];

function StepIndicator({ step, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="transition-all duration-300 rounded-full"
          style={{
            width: i === step ? 24 : 8,
            height: 8,
            background: i <= step ? "linear-gradient(135deg, #8b3dff, #dc2626)" : "#1f1f1f",
          }}
        />
      ))}
    </div>
  );
}

function TogglePill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border px-3 py-2 text-sm transition"
      style={active
        ? { borderColor: "#8b3dff", background: "rgba(139,61,255,0.2)", color: "#fff" }
        : { borderColor: "#333", background: "#111", color: "#aaa" }}
    >
      {children}
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [joiningAs, setJoiningAs] = useState(null); // "trainee" | "coach"

  const [profile, setProfile] = useState({
    full_name: "", wrestling_name: "", hometown: "", height: "",
    weight: "", bio: "", goals: "", focus_areas: [],
  });

  const [character, setCharacter] = useState({
    ringName: "", alignment: "", archetype: "", traits: [], objective: "",
    signature: "", finisher: "",
  });

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      setProfile(prev => ({ ...prev, full_name: u.full_name || "" }));
      // admins don't need to pick a role
      // Check if already onboarded
      const res = await base44.entities.UserProfile.filter({ auth_user_id: u.id });
      const arr = Array.isArray(res) ? res : (res?.items || []);
      if (arr.length > 0) {
        setProfileId(arr[0].id);
        if (arr[0].onboarding_completed) {
          navigate(createPageUrl("Dashboard"));
        }
      }
    });
  }, []);

  const toggleFocus = (area) => {
    setProfile(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area],
    }));
  };

  const toggleTrait = (t) => {
    setCharacter(prev => {
      if (prev.traits.includes(t)) return { ...prev, traits: prev.traits.filter(x => x !== t) };
      if (prev.traits.length >= 3) return prev;
      return { ...prev, traits: [...prev.traits, t] };
    });
  };

  const isAdmin = user?.role === "admin";
  const isCoach = joiningAs === "coach" && !isAdmin;
  const totalSteps = isAdmin ? ADMIN_STEPS : isCoach ? COACH_STEPS : TOTAL_STEPS;

  const appTour = isAdmin ? APP_TOUR_ADMIN : isCoach ? APP_TOUR_COACH : APP_TOUR_TRAINEE;
  const checklist = isAdmin ? CHECKLIST_ADMIN : isCoach ? CHECKLIST_COACH : CHECKLIST_TRAINEE;

  // Map logical step index accounting for skipped steps
  // Trainee: 0=Welcome, 1=Profile, 2=Character, 3=Culture, 4=Tour, 5=Checklist
  // Coach:   0=Welcome, 1=Profile, 2=Culture, 3=Tour, 4=Checklist (skip character)
  // Admin:   0=Welcome, 1=Profile, 2=Tour, 3=Checklist (skip character+culture)
  const getActualStepIndex = (s) => {
    if (isAdmin) {
      if (s === 0) return 0;
      if (s === 1) return 1;
      if (s >= 2) return s + 2; // skip character(2) + culture(3)
    }
    if (isCoach) {
      if (s >= 2) return s + 1; // skip character builder (step 2)
    }
    return s;
  };

  const saveAndContinue = async () => {
    // Step 0: must pick a role before continuing (non-admins)
    if (step === 0 && !joiningAs && !isAdmin) {
      toast.error("Please select how you're joining PCW.");
      return;
    }

    setSaving(true);
    try {
      const actualStep = getActualStepIndex(step);

      // Step 1: Save profile
      if (actualStep === 1) {
        const payload = {
          auth_user_id: user.id,
          full_name: profile.full_name || user.full_name,
          email: user.email,
          role: isAdmin ? "admin" : isCoach ? "trainee" : "trainee",
          tier: isAdmin ? undefined : "T1",
          wrestling_name: profile.wrestling_name,
          hometown: profile.hometown,
          height: profile.height,
          weight: profile.weight,
          bio: profile.bio,
          goals: profile.goals,
          focus_areas: profile.focus_areas,
          ...(isCoach && { coach_request: true }),
        };
        if (profileId) {
          await base44.entities.UserProfile.update(profileId, payload);
        } else {
          const created = await base44.entities.UserProfile.create(payload);
          setProfileId(created.id);
        }
      }

      // Step 2: Save character (trainees only)
      if (!isCoach && actualStep === 2) {
        const existing = await base44.entities.CharacterSheet.filter({ trainee_id: user.id });
        const arr = Array.isArray(existing) ? existing : (existing?.items || []);
        const payload = {
          trainee_id: user.id,
          trainee_name: profile.wrestling_name || profile.full_name || user.full_name,
          form_data: { ...character, ringName: character.ringName || profile.wrestling_name },
          status: "draft",
        };
        if (arr.length > 0) {
          await base44.entities.CharacterSheet.update(arr[0].id, payload);
        } else {
          await base44.entities.CharacterSheet.create(payload);
        }
      }

      // Final step: mark onboarding complete
      if (step === totalSteps - 1) {
        if (profileId) {
          await base44.entities.UserProfile.update(profileId, { onboarding_completed: true });
        }
        if (isCoach) {
          toast.success("Welcome to PCW! Your coach request is pending admin approval.");
        } else {
          toast.success("Welcome to PCW! Let's get to work.");
        }
        navigate(createPageUrl("Dashboard"));
        return;
      }

      setStep(s => s + 1);
    } catch (e) {
      toast.error("Something went wrong, please try again.");
    }
    setSaving(false);
  };

  const variants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const allSteps = [
    // Step 0: Welcome + Role Selection
    <div key="welcome" className="text-center space-y-8 max-w-lg mx-auto">
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
          <span className="text-4xl font-black text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>PCW</span>
        </div>
      </div>
      <div>
        <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "Rajdhani, sans-serif" }}>
          {isAdmin ? `Welcome, ${user?.full_name?.split(" ")[0] || "Admin"}!` : "Welcome to PCW Academy"}
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          {isAdmin
            ? "You have full admin access to PCW Academy. Let's get your account set up so you can start managing the platform."
            : "Before we get started, let us know how you're joining PCW."}
        </p>
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          {[
            { icon: Shield, color: "#dc2626", label: "Full Platform Access" },
            { icon: UserPlus, color: "#8b3dff", label: "Manage All Users" },
            { icon: Settings, color: "#c0c0c0", label: "Configure Everything" },
          ].map(({ icon: Icon, color, label }) => (
            <div key={label} className="rounded-xl border border-zinc-800 p-4 flex flex-col items-center gap-2" style={{ background: "#0f0f0f" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="text-xs text-zinc-300 font-medium text-center">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => setJoiningAs("trainee")}
              className="rounded-2xl border-2 p-5 flex flex-col items-center gap-3 transition-all"
              style={joiningAs === "trainee"
                ? { borderColor: "#8b3dff", background: "rgba(139,61,255,0.15)" }
                : { borderColor: "#333", background: "#0f0f0f" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: joiningAs === "trainee" ? "rgba(139,61,255,0.3)" : "#1a1a1a" }}>
                <Swords className="w-6 h-6" style={{ color: joiningAs === "trainee" ? "#8b3dff" : "#666" }} />
              </div>
              <div>
                <p className="font-bold text-white text-sm">I'm a Trainee</p>
                <p className="text-xs text-zinc-500 mt-0.5">Here to learn & compete</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setJoiningAs("coach")}
              className="rounded-2xl border-2 p-5 flex flex-col items-center gap-3 transition-all"
              style={joiningAs === "coach"
                ? { borderColor: "#dc2626", background: "rgba(220,38,38,0.12)" }
                : { borderColor: "#333", background: "#0f0f0f" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: joiningAs === "coach" ? "rgba(220,38,38,0.25)" : "#1a1a1a" }}>
                <Shield className="w-6 h-6" style={{ color: joiningAs === "coach" ? "#dc2626" : "#666" }} />
              </div>
              <div>
                <p className="font-bold text-white text-sm">I'm a Coach</p>
                <p className="text-xs text-zinc-500 mt-0.5">Pending admin approval</p>
              </div>
            </button>
          </div>

          {joiningAs === "coach" && (
            <div className="rounded-xl border border-yellow-700/40 bg-yellow-900/10 p-4 text-left max-w-sm mx-auto">
              <p className="text-yellow-300 text-sm font-semibold mb-1">⚠ Coach Verification Required</p>
              <p className="text-yellow-200/70 text-xs leading-relaxed">
                You'll be set up as a trainee until an admin verifies and upgrades your account to coach. You'll see a notice on your dashboard once approved.
              </p>
            </div>
          )}

          <p className="text-zinc-600 text-sm">Takes about {joiningAs === "coach" ? "3" : "5"} minutes</p>
        </>
      )}

      {isAdmin && <p className="text-zinc-600 text-sm">Quick 3-minute admin setup</p>}
    </div>,

    // Step 1: Profile
    <div key="profile" className="max-w-xl mx-auto space-y-5">
      <div>
        <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>Build Your Profile</h2>
        <p className="text-zinc-500 text-sm">Tell us who you are — both as a person and as a performer.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <label className="text-sm text-zinc-400">Legal Name</label>
          <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
            className="bg-zinc-900 border-zinc-700 text-white" placeholder="Your real name" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Ring Name</label>
          <Input value={profile.wrestling_name} onChange={e => setProfile(p => ({ ...p, wrestling_name: e.target.value }))}
            className="bg-zinc-900 border-zinc-700 text-white" placeholder="Your wrestling name" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Hometown</label>
          <Input value={profile.hometown} onChange={e => setProfile(p => ({ ...p, hometown: e.target.value }))}
            className="bg-zinc-900 border-zinc-700 text-white" placeholder="City, State" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Height</label>
          <Input value={profile.height} onChange={e => setProfile(p => ({ ...p, height: e.target.value }))}
            className="bg-zinc-900 border-zinc-700 text-white" placeholder='6&apos;1"' />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Weight</label>
          <Input value={profile.weight} onChange={e => setProfile(p => ({ ...p, weight: e.target.value }))}
            className="bg-zinc-900 border-zinc-700 text-white" placeholder="225 lbs" />
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-sm text-zinc-400">About You</label>
          <Textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
            className="bg-zinc-900 border-zinc-700 text-white h-20" placeholder="Background, experience, why you're here..." />
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-sm text-zinc-400">Focus Area</label>
          <div className="flex flex-wrap gap-2">
            {["Wrestler", "Referee", "Manager/Valet", "Commentary", "Announcer"].map(a => (
              <TogglePill key={a} active={profile.focus_areas.includes(a)} onClick={() => toggleFocus(a)}>{a}</TogglePill>
            ))}
          </div>
        </div>
      </div>
    </div>,

    // Step 2: Character Builder (lite)
    <div key="character" className="max-w-xl mx-auto space-y-5">
      <div>
        <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>Your Character</h2>
        <p className="text-zinc-500 text-sm">Every great wrestler needs a character. Start sketching yours — you can refine it later in the Character Builder.</p>
      </div>
      <div className="grid gap-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Ring Name</label>
          <Input value={character.ringName || profile.wrestling_name} onChange={e => setCharacter(p => ({ ...p, ringName: e.target.value }))}
            className="bg-zinc-900 border-zinc-700 text-white" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Alignment</label>
          <div className="flex gap-2">
            {ALIGNMENTS.map(a => (
              <TogglePill key={a} active={character.alignment === a} onClick={() => setCharacter(p => ({ ...p, alignment: a }))}>{a}</TogglePill>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Archetype</label>
          <div className="flex flex-wrap gap-2">
            {ARCHETYPES.map(a => (
              <TogglePill key={a} active={character.archetype === a} onClick={() => setCharacter(p => ({ ...p, archetype: a }))}>{a}</TogglePill>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Personality Traits <span className="text-zinc-600">(pick 3)</span></label>
          <div className="flex flex-wrap gap-2">
            {TRAITS.map(t => (
              <TogglePill key={t} active={character.traits.includes(t)} onClick={() => toggleTrait(t)}>{t}</TogglePill>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-400">Signature Move</label>
            <Input value={character.signature} onChange={e => setCharacter(p => ({ ...p, signature: e.target.value }))}
              className="bg-zinc-900 border-zinc-700 text-white" placeholder="e.g. Superkick" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-400">Finisher</label>
            <Input value={character.finisher} onChange={e => setCharacter(p => ({ ...p, finisher: e.target.value }))}
              className="bg-zinc-900 border-zinc-700 text-white" placeholder="e.g. RKO" />
          </div>
        </div>
      </div>
    </div>,

    // Step 3: Culture & Rules
    <div key="culture" className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>Culture & Rules</h2>
        <p className="text-zinc-500 text-sm">Before you step foot in the ring, understand what PCW stands for.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {CULTURE_RULES.map(({ icon: Icon, color, title, body }) => (
          <div key={title} className="rounded-xl p-4 border border-zinc-800" style={{ background: "#0f0f0f" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="font-semibold text-white text-sm">{title}</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>,

    // App Tour step
    <div key="tour" className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>
          {isAdmin ? "Your Command Center" : "Your App Tour"}
        </h2>
        <p className="text-zinc-500 text-sm">
          {isAdmin
            ? "Here's what you have access to as an admin."
            : isCoach
            ? "Here's your coaching toolkit. Get familiar — you'll use all of these."
            : "Here's where everything lives. Get familiar — you'll use all of these."}
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {appTour.map(({ icon: Icon, color, label, desc }) => (
          <div key={label} className="flex gap-3 p-4 rounded-xl border border-zinc-800 items-start" style={{ background: "#0f0f0f" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-0.5">{label}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // Checklist step (final)
    <div key="checklist" className="max-w-xl mx-auto space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Rajdhani, sans-serif" }}>
          {isAdmin ? "Admin Quick Start" : isCoach ? "Coach Quick Start" : "Your First Steps"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {isAdmin
            ? "Here's what to do first to get PCW Academy running smoothly."
            : isCoach
            ? "Here's how to hit the ground running as a coach."
            : "Your journey starts now. Here's what to do first."}
        </p>
      </div>

      <div className="space-y-3">
        {checklist.map(({ icon: Icon, color, label, desc, page }, i) => (
          <div key={label} className="flex items-start gap-4 p-4 rounded-xl border border-zinc-800 group"
            style={{ background: "#0f0f0f" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ background: `${color}20`, color }}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                <p className="font-semibold text-white text-sm">{label}</p>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 border border-purple-500/30 text-center" style={{ background: "rgba(139,61,255,0.08)" }}>
        <Zap className="w-5 h-5 mx-auto mb-2" style={{ color: "#8b3dff" }} />
        {isAdmin
          ? <p className="text-sm text-zinc-300">You're all set, admin. The platform is yours to configure and grow.</p>
          : isCoach
          ? <p className="text-sm text-zinc-300">Your account is set up. An admin will verify your coach status shortly.</p>
          : <p className="text-sm text-zinc-300">You're all set! Your coaches will guide your path. Now let's get to work. 🔥</p>
        }
      </div>
    </div>,
  ];

  // Filter steps based on role
  // allSteps: 0=welcome, 1=profile, 2=character, 3=culture, 4=tour, 5=checklist
  const steps = isAdmin
    ? allSteps.filter((_, i) => [0, 1, 4, 5].includes(i))
    : isCoach
    ? allSteps.filter((_, i) => i !== 2)  // skip character builder
    : allSteps;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "radial-gradient(circle at top, #1a0a2e 0%, #0a0a0f 50%, #050507 100%)" }}>
      <div className="w-full max-w-3xl">
        <StepIndicator step={step} total={totalSteps} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 max-w-xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="text-zinc-500 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <span className="text-xs text-zinc-600">{step + 1} of {totalSteps}</span>

          <Button
            onClick={saveAndContinue}
            disabled={saving}
            className="text-white font-semibold px-6"
            style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}
          >
            {saving ? "Saving..." : step === totalSteps - 1 ? "Enter PCW" : "Continue"}
            {!saving && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}