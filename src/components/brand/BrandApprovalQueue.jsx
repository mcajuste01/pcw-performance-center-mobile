import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, MessageSquare, Loader2, ShieldAlert, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { BRAND_TYPES, POSTING_STATUS, toArray, formatDate } from "./brandConstants";

export default function BrandApprovalQueue({ user }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(null);

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["brand-pending-submissions"],
    queryFn: async () => {
      const res = await base44.entities.BrandSubmission.filter({ posting_approval_status: "pending" }, "-submitted_at", 50);
      return toArray(res);
    },
  });

  const handleReview = async (submission, status) => {
    setActionLoading(submission.id + status);
    try {
      await base44.functions.invoke("reviewBrandSubmission", {
        submission_id: submission.id,
        posting_approval_status: status,
      });
      toast.success(status === "approved_for_posting" ? "Approved for posting!" : "Marked as needs revision");
      queryClient.invalidateQueries({ queryKey: ["brand-pending-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["brand-assignments"] });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.awaiting_guardian_consent) {
        toast.error("Cannot approve — awaiting guardian consent for minor");
      } else {
        toast.error(data?.error || "Review failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessage = (submission) => {
    navigate(createPageUrl("DirectMessages"));
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-purple-400 animate-spin" /></div>;
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 p-8 text-center" style={{ background: "#0f0f0f" }}>
        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">No submissions pending review</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map(s => {
        const typeMeta = BRAND_TYPES.other;
        const submittedDate = s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
        return (
          <div key={s.id} className="rounded-xl border border-gray-800 p-4" style={{ background: "#0f0f0f" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{s.assignment_title || "Untitled Assignment"}</p>
                <p className="text-xs text-gray-500">{s.athlete_name} • Submitted {submittedDate}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${POSTING_STATUS.pending.color}20`, color: POSTING_STATUS.pending.color }}>
                <Clock className="w-2.5 h-2.5 inline mr-0.5" /> Pending
              </span>
            </div>

            {/* Content preview */}
            <div className="mt-2.5 space-y-1.5">
              {s.content_url && (
                <a href={s.content_url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> View uploaded content
                </a>
              )}
              {s.content_text && (
                <p className="text-xs text-gray-400 bg-black/30 rounded p-2 line-clamp-3">{s.content_text}</p>
              )}
            </div>

            {/* Guardian consent warning */}
            {!s.guardian_consent_given && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Minor athlete — guardian consent required before posting approval</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={() => handleReview(s, "approved_for_posting")} disabled={!!actionLoading}
                style={{ background: "#10b981" }}>
                {actionLoading === s.id + "approved_for_posting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReview(s, "rejected")} disabled={!!actionLoading}
                style={{ borderColor: "#dc2626", color: "#dc2626" }}>
                {actionLoading === s.id + "rejected" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Needs Revision
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleMessage(s)} className="ml-auto text-gray-400">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}