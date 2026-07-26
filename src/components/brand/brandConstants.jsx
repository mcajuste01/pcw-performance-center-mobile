import { Video, FileText, Sparkles, Camera, Shield, ClipboardList } from "lucide-react";

export const BRAND_TYPES = {
  promo_video: { label: "Promo Video", icon: Video, color: "#8b3dff" },
  bio_writeup: { label: "Bio Write-up", icon: FileText, color: "#06b6d4" },
  gimmick_pitch: { label: "Gimmick Pitch", icon: Sparkles, color: "#f59e0b" },
  photo_submission: { label: "Photo Submission", icon: Camera, color: "#10b981" },
  safety_module: { label: "Safety Module", icon: Shield, color: "#dc2626" },
  other: { label: "Other", icon: ClipboardList, color: "#6b7280" },
};

export const ASSIGNMENT_STATUS = {
  not_started: { label: "Not Started", color: "#6b7280" },
  submitted: { label: "Submitted", color: "#06b6d4" },
  needs_revision: { label: "Needs Revision", color: "#f59e0b" },
  approved: { label: "Approved", color: "#10b981" },
};

export const POSTING_STATUS = {
  pending: { label: "Pending Review", color: "#f59e0b" },
  approved_for_posting: { label: "Approved for Posting", color: "#10b981" },
  rejected: { label: "Rejected", color: "#dc2626" },
};

export const COMPLETION_STATUS = {
  complete: { label: "Complete", color: "#10b981" },
  incomplete: { label: "Incomplete", color: "#6b7280" },
};

export const PLATFORMS = {
  instagram: { label: "Instagram", color: "#e1306c" },
  tiktok: { label: "TikTok", color: "#69c9d0" },
  x: { label: "X (Twitter)", color: "#1da1f2" },
  facebook: { label: "Facebook", color: "#1877f2" },
  other: { label: "Other", color: "#6b7280" },
};

export const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

export function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(d) {
  if (!d) return null;
  const due = new Date(d + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((due - now) / 86400000);
}