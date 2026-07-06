import { Zap, Flame, Dumbbell, Footprints, Activity } from "lucide-react";

export const DRILL_CATEGORIES = [
  {
    key: "explosive_power",
    name: "Explosive Power",
    color: "#dc2626",
    icon: Zap,
    description: "Short, max-effort bursts that build the fast-twitch fire you need for shots and sprawls.",
  },
  {
    key: "ring_endurance",
    name: "Ring Endurance",
    color: "#f59e0b",
    icon: Flame,
    description: "Sustained output that keeps you working through full-length matches.",
  },
  {
    key: "functional_strength",
    name: "Functional Strength",
    color: "#8b3dff",
    icon: Dumbbell,
    description: "Bodyweight strength that translates directly to controlling your opponent.",
  },
  {
    key: "agility_footwork",
    name: "Agility & Footwork",
    color: "#10b981",
    icon: Footprints,
    description: "Quick direction changes, level changes, and ring positioning.",
  },
  {
    key: "match_simulation",
    name: "Match Simulation",
    color: "#3b82f6",
    icon: Activity,
    description: "Chain-of-events circuits that mimic real match pacing and recovery.",
  },
];

export const WRESTLING_DRILLS = [
  // Explosive Power
  { name: "Sprawls", category: "explosive_power", work_seconds: 30, rest_seconds: 15, rounds: 1, description: "Drop hips and sprawl to the mat, recover to stance.", tips: "Shoot hips back, not knees down." },
  { name: "Double Leg Shots", category: "explosive_power", work_seconds: 30, rest_seconds: 20, rounds: 1, description: "Penetration step into a double leg, finish standing.", tips: "Keep back straight, head up." },
  { name: "Single Leg Shots", category: "explosive_power", work_seconds: 30, rest_seconds: 20, rounds: 1, description: "Penetration step to single leg, lift and finish.", tips: "Drive through the leg, don't reach." },
  { name: "Penetration Steps", category: "explosive_power", work_seconds: 45, rest_seconds: 15, rounds: 1, description: "Repeated drop-step penetration without finishing the shot.", tips: "Low level change, quick recovery." },

  // Ring Endurance
  { name: "Rope Runs", category: "ring_endurance", work_seconds: 60, rest_seconds: 30, rounds: 1, description: "Run the ropes side to side, hitting proper turn and bounce.", tips: "Snap off the ropes, don't lean." },
  { name: "Shadow Wrestling", category: "ring_endurance", work_seconds: 90, rest_seconds: 30, rounds: 1, description: "Chain moves, shots, and sprawls at match pace with no opponent.", tips: "Stay low, keep moving between spots." },
  { name: "Bump Circuits", category: "ring_endurance", work_seconds: 60, rest_seconds: 30, rounds: 1, description: "Front and back bumps in sequence, recover to feet each rep.", tips: "Tuck chin, land flat." },
  { name: "Corner Sprints", category: "ring_endurance", work_seconds: 45, rest_seconds: 20, rounds: 1, description: "Sprint corner to corner, touch and go.", tips: "Decelerate under control." },

  // Functional Strength
  { name: "Bear Crawls", category: "functional_strength", work_seconds: 40, rest_seconds: 20, rounds: 1, description: "Forward and reverse bear crawls across the mat.", tips: "Keep hips low, knees off the ground." },
  { name: "Neck Bridges", category: "functional_strength", work_seconds: 30, rest_seconds: 20, rounds: 1, description: "Wrestler's bridge holds, roll to forehead and back.", tips: "Hands off the mat if you can." },
  { name: "Turkish Get-ups", category: "functional_strength", work_seconds: 45, rest_seconds: 20, rounds: 1, description: "From ground to standing and back down, each side.", tips: "Slow and controlled." },
  { name: "Shrimp Drills", category: "functional_strength", work_seconds: 40, rest_seconds: 15, rounds: 1, description: "Hip escape shrimps down the mat, both directions.", tips: "Explode the hips, not the arms." },

  // Agility & Footwork
  { name: "Ladder Drills", category: "agility_footwork", work_seconds: 45, rest_seconds: 15, rounds: 1, description: "Agility ladder: high knees, icky shuffle, in-and-out.", tips: "Stay on the balls of your feet." },
  { name: "Cone Weave", category: "agility_footwork", work_seconds: 30, rest_seconds: 15, rounds: 1, description: "Weave through cones with quick direction changes.", tips: "Plant and drive, no false steps." },
  { name: "Shadow Footwork", category: "agility_footwork", work_seconds: 60, rest_seconds: 20, rounds: 1, description: "Stance work: circling, pivoting, level changes.", tips: "Maintain athletic base throughout." },
  { name: "Drop Step Turns", category: "agility_footwork", work_seconds: 40, rest_seconds: 15, rounds: 1, description: "Repeated drop-step pivots for ring positioning.", tips: "Quick hips, eyes forward." },

  // Match Simulation
  { name: "Spot Chain", category: "match_simulation", work_seconds: 120, rest_seconds: 30, rounds: 1, description: "Chain 4-6 moves together at match pace with recovery.", tips: "Sell between spots, breathe." },
  { name: "Iron Man Rounds", category: "match_simulation", work_seconds: 180, rest_seconds: 60, rounds: 1, description: "Continuous wrestling movement for a full round.", tips: "Pace yourself, don't gas early." },
  { name: "Sprawl & Shoot", category: "match_simulation", work_seconds: 60, rest_seconds: 20, rounds: 1, description: "Alternate sprawls and shots on cue.", tips: "Explode into the shot off the sprawl recovery." },
  { name: "Match Finish Burnout", category: "match_simulation", work_seconds: 90, rest_seconds: 30, rounds: 1, description: "Final 90 seconds: max-effort chain to close a match.", tips: "Leave it all on the mat." },
];

export const getDrillCategory = (key) =>
  DRILL_CATEGORIES.find((c) => c.key === key) || DRILL_CATEGORIES[0];

export const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);