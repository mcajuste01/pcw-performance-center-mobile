import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Upload, CheckCircle, AlertCircle, Video, Sparkles, Clock } from "lucide-react";
import { BRAND_TYPES, ASSIGNMENT_STATUS, POSTING_STATUS, COMPLETION_STATUS, formatDate, daysUntil } from "./brandConstants";

function StatusBadge({ label, color }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
      {label}
    </span>
  );
}

export default function BrandAssignmentCard({ assignment, submission, onSubmit }) {
  const typeMeta = BRAND_TYPES[assignment.type] || BRAND_TYPES.other;
  const TypeIcon = typeMeta.icon;
  const statusMeta = ASSIGNMENT_STATUS[assignment.status] || ASSIGNMENT_STATUS.not_started;
  const days = daysUntil(assignment.due_date);
  const isOverdue = days !== null && days < 0 && assignment.status !== "approved";
  const isDueSoon = days !== null && days >= 0 && days <= 3 && assignment.status !== "approved";

  return (
    <div className="rounded-xl border p-4 transition" style={{
      background: "#0f0f0f", borderColor: isOverdue ? "rgba(220,38,38,0.3)" : "rgba(255,255,255,0.06)",
    }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${typeMeta.color}15` }}>
          <TypeIcon className="w-4 h-4" style={{ color: typeMeta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white font-semibold text-sm">{assignment.title}</p>
              <p className="text-[11px] text-gray-500">{typeMeta.label}</p>
            </div>
            <StatusBadge label={statusMeta.label} color={statusMeta.color} />
          </div>

          {assignment.description && (
            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{assignment.description}</p>
          )}

          {/* Due date */}
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400">{formatDate(assignment.due_date)}</span>
            {isOverdue && <span className="text-red-400 font-medium ml-1">Overdue</span>}
            {isDueSoon && <span className="text-yellow-400 font-medium ml-1">{days === 0 ? "Due today" : `${days}d left`}</span>}
          </div>

          {/* Two-flag status display */}
          {submission && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              <StatusBadge label={`Completion: ${COMPLETION_STATUS[submission.completion_status]?.label || "—"}`} color={COMPLETION_STATUS[submission.completion_status]?.color || "#6b7280"} />
              <StatusBadge label={`Posting: ${POSTING_STATUS[submission.posting_approval_status]?.label || "—"}`} color={POSTING_STATUS[submission.posting_approval_status]?.color || "#6b7280"} />
              {submission.posting_approval_status === "pending" && !submission.guardian_consent_given && (
                <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> Awaiting guardian consent
                </span>
              )}
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2 mt-3">
            {assignment.status !== "approved" && (
              <button onClick={() => onSubmit(assignment)} className="text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: "#8b3dff", color: "#fff" }}>
                <Upload className="w-3 h-3" />
                {submission ? "Resubmit" : "Submit"}
              </button>
            )}
            {assignment.status === "approved" && (
              <span className="text-xs flex items-center gap-1 text-green-400"><CheckCircle className="w-3 h-3" /> Approved</span>
            )}
            {/* Quick links to existing tools */}
            {assignment.type === "promo_video" && (
              <Link to={createPageUrl("VideoAnalysis")} className="text-xs text-gray-500 hover:text-purple-400 flex items-center gap-1 ml-auto">
                <Video className="w-3 h-3" /> Promo Recorder
              </Link>
            )}
            {(assignment.type === "gimmick_pitch" || assignment.type === "bio_writeup") && (
              <Link to={createPageUrl("CharacterBuilder")} className="text-xs text-gray-500 hover:text-purple-400 flex items-center gap-1 ml-auto">
                <Sparkles className="w-3 h-3" /> Character Builder
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}