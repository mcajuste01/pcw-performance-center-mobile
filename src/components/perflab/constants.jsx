import {
  Dumbbell, Flame, Footprints, HeartPulse, ClipboardCheck,
} from "lucide-react";

export const PROGRESS_LEVELS = [
  {
    key: "foundation",
    name: "Foundation",
    order: 1,
    color: "#8b3dff",
    description: "Building base strength, mobility, and fundamental movement patterns.",
    focus: ["Bodyweight strength", "Core stability", "Joint preparation", "Basic conditioning"],
  },
  {
    key: "ring_ready",
    name: "Ring Ready",
    order: 2,
    color: "#dc2626",
    description: "Prepared for basic ring work, bumping, and rope running.",
    focus: ["Bump technique", "Rope running basics", "Intermediate strength", "Sprawl mechanics"],
  },
  {
    key: "match_conditioning",
    name: "Match Conditioning",
    order: 3,
    color: "#f59e0b",
    description: "Conditioned for full-length matches with recovery between spots.",
    focus: ["Match-paced circuits", "Sprawl drills", "Recovery between spots", "Ring endurance"],
  },
  {
    key: "performance_athlete",
    name: "Performance Athlete",
    order: 4,
    color: "#10b981",
    description: "Elite athletic performance with power and peak strength.",
    focus: ["Power development", "Advanced conditioning", "Peak strength", "Explosive movement"],
  },
  {
    key: "showcase_ready",
    name: "Showcase Ready",
    order: 5,
    color: "#c0c0c0",
    description: "Peak condition, showcase-prepared and match-tough.",
    focus: ["Peaking", "Match endurance", "Showcase prep", "Mental toughness"],
  },
];

export const CATEGORIES = [
  {
    key: "strength",
    name: "Strength",
    icon: Dumbbell,
    color: "#8b3dff",
    description: "Bodyweight strength, core, grip, neck, legs, upper body.",
  },
  {
    key: "conditioning",
    name: "Conditioning",
    icon: Flame,
    color: "#dc2626",
    description: "Circuits, intervals, rope runs, sprawls, match rounds.",
  },
  {
    key: "ring_movement",
    name: "Ring Movement",
    icon: Footprints,
    color: "#f59e0b",
    description: "Rolls, bumps, footwork, rope running, recoveries.",
  },
  {
    key: "mobility",
    name: "Mobility & Recovery",
    icon: HeartPulse,
    color: "#10b981",
    description: "Warmups, stretching, joint prep, cooldowns.",
  },
  {
    key: "testing",
    name: "Testing",
    icon: ClipboardCheck,
    color: "#3b82f6",
    description: "Baseline test, monthly retest, coach approval.",
  },
];

export const TEST_FIELDS = [
  { key: "pushups", label: "Push-ups (60s)", placeholder: "30" },
  { key: "squats", label: "Squats (60s)", placeholder: "40" },
  { key: "plank_seconds", label: "Plank (seconds)", placeholder: "90" },
  { key: "wall_sit_seconds", label: "Wall Sit (seconds)", placeholder: "60" },
  { key: "burpees", label: "Burpees (60s)", placeholder: "20" },
  { key: "grip_strength", label: "Grip Strength (kg)", placeholder: "40" },
  { key: "rope_runs", label: "Rope Runs (60s)", placeholder: "18" },
  { key: "sprint_time_seconds", label: "Sprint Time (seconds)", placeholder: "5.0" },
  { key: "mile_run_seconds", label: "One Mile Run (seconds)", placeholder: "420" },
  { key: "mobility_score", label: "Mobility Score (0-100)", placeholder: "70" },
  { key: "flexibility_score", label: "Flexibility Score (0-100)", placeholder: "70" },
  { key: "recovery_hr", label: "Recovery Heart Rate (bpm)", placeholder: "120" },
];

export const getLevelInfo = (key) =>
  PROGRESS_LEVELS.find((l) => l.key === key) || PROGRESS_LEVELS[0];

export const getCategoryInfo = (key) =>
  CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];

export const toArray = (v) =>
  Array.isArray(v) ? v : v?.items || [];