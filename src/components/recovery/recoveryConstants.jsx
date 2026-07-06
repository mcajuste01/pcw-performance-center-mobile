import { HeartPulse, Snowflake, Footprints, Dumbbell, Brain } from "lucide-react";

export const RECOVERY_CATEGORIES = [
  { key: "soft_tissue", name: "Soft Tissue", color: "#8b3dff", icon: HeartPulse },
  { key: "mobility", name: "Mobility", color: "#10b981", icon: Footprints },
  { key: "temperature", name: "Temperature", color: "#3b82f6", icon: Snowflake },
  { key: "movement", name: "Active Recovery", color: "#f59e0b", icon: Dumbbell },
  { key: "mental", name: "Mental Recovery", color: "#ec4899", icon: Brain },
];

export const RECOVERY_ACTIVITIES = [
  { key: "foam_rolling", name: "Foam Rolling", category: "soft_tissue", default_minutes: 10, description: "Self-myofascial release to reduce muscle tightness." },
  { key: "massage", name: "Massage", category: "soft_tissue", default_minutes: 30, description: "Professional or self-massage for tissue recovery." },
  { key: "static_stretching", name: "Static Stretching", category: "mobility", default_minutes: 15, description: "Hold-and-stretch to improve flexibility." },
  { key: "dynamic_stretching", name: "Dynamic Stretching", category: "mobility", default_minutes: 10, description: "Movement-based stretching through full range." },
  { key: "mobility_work", name: "Mobility Work", category: "mobility", default_minutes: 15, description: "Joint-specific mobility drills." },
  { key: "ice_bath", name: "Ice Bath", category: "temperature", default_minutes: 10, description: "Cold water immersion to reduce inflammation." },
  { key: "contrast_shower", name: "Contrast Shower", category: "temperature", default_minutes: 10, description: "Alternating hot/cold for circulation." },
  { key: "sauna", name: "Sauna", category: "temperature", default_minutes: 15, description: "Heat therapy for recovery and relaxation." },
  { key: "active_recovery", name: "Active Recovery", category: "movement", default_minutes: 20, description: "Light movement like walking, swimming, or easy jog." },
  { key: "compression", name: "Compression", category: "movement", default_minutes: 20, description: "Compression garments or boots for circulation." },
  { key: "breathwork", name: "Breathwork", category: "mental", default_minutes: 10, description: "Structured breathing to regulate the nervous system." },
  { key: "meditation", name: "Meditation", category: "mental", default_minutes: 10, description: "Mental recovery and stress reduction." },
  { key: "sleep_hygiene", name: "Sleep Hygiene", category: "mental", default_minutes: 0, description: "Pre-sleep routine for better recovery." },
];

export const INTENSITY_OPTIONS = [
  { key: "light", label: "Light", color: "#10b981" },
  { key: "moderate", label: "Moderate", color: "#f59e0b" },
  { key: "intense", label: "Intense", color: "#dc2626" },
];

export const EFFECT_OPTIONS = [
  { key: "poor", label: "Poor", color: "#dc2626" },
  { key: "fair", label: "Fair", color: "#f59e0b" },
  { key: "good", label: "Good", color: "#3b82f6" },
  { key: "excellent", label: "Excellent", color: "#10b981" },
];

export const getActivity = (key) => RECOVERY_ACTIVITIES.find((a) => a.key === key);
export const getCategory = (key) => RECOVERY_CATEGORIES.find((c) => c.key === key) || RECOVERY_CATEGORIES[0];
export const getIntensity = (key) => INTENSITY_OPTIONS.find((i) => i.key === key) || INTENSITY_OPTIONS[0];
export const getEffect = (key) => EFFECT_OPTIONS.find((e) => e.key === key) || EFFECT_OPTIONS[0];

export function getRecoveryRecommendations({ readinessScore, sleep, soreness, stress, pain, activeInjuries }) {
  const recs = [];
  if (readinessScore < 50) {
    recs.push({ priority: "high", title: "Prioritize Rest", message: "Your readiness is low. Consider a full rest day or light active recovery only.", activities: ["sleep_hygiene", "breathwork", "active_recovery"] });
  }
  if (pain >= 7) {
    recs.push({ priority: "high", title: "Address Pain", message: "Pain levels are high. Ice the affected area and consult your coach before training.", activities: ["ice_bath", "foam_rolling"] });
  }
  if (soreness >= 4) {
    recs.push({ priority: "medium", title: "Reduce Soreness", message: "You're carrying significant soreness. Foam rolling and light stretching will help.", activities: ["foam_rolling", "static_stretching", "contrast_shower"] });
  }
  if (stress >= 4) {
    recs.push({ priority: "medium", title: "Manage Stress", message: "Stress is elevated. Breathwork or meditation can help you reset.", activities: ["breathwork", "meditation"] });
  }
  if (sleep <= 2) {
    recs.push({ priority: "medium", title: "Improve Sleep", message: "Poor sleep quality is dragging your recovery. Focus on sleep hygiene tonight.", activities: ["sleep_hygiene", "breathwork"] });
  }
  if (activeInjuries > 0) {
    recs.push({ priority: "high", title: "Active Injury", message: `You have ${activeInjuries} active injur${activeInjuries > 1 ? "ies" : "y"}. Mobility work and ice can support healing.`, activities: ["mobility_work", "ice_bath"] });
  }
  if (readinessScore >= 75 && recs.length === 0) {
    recs.push({ priority: "low", title: "Stay Sharp", message: "Recovery is on track. Maintain with light mobility and hydration.", activities: ["static_stretching", "active_recovery"] });
  }
  if (recs.length === 0) {
    recs.push({ priority: "low", title: "Check In Daily", message: "Log a readiness check-in each morning to track your recovery trends.", activities: [] });
  }
  return recs;
}