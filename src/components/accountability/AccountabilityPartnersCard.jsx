import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Users, UserPlus, Flame, Target, MessageSquare, Check, X, Loader2, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import InvitePartnerModal from "./InvitePartnerModal";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

export default function AccountabilityPartnersCard({ user }) {
  const queryClient = useQueryClient();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [consentModal, setConsentModal] = useState(null);

  // Pending invites
  const { data: invites = [], isLoading: invitesLoading } = useQuery({
    queryKey: ["accountabilityInvites", user?.id],
    queryFn: async () =>
      toArray(
        await base44.entities.AccountabilityMembership.filter({
          athlete_id: user.id,
          status: "invited",
        })
      ),
    enabled: !!user?.id,
    initialData: [],
  });

  // Active partner data
  const { data: partnerData, isLoading: partnersLoading } = useQuery({
    queryKey: ["accountabilityPartners", user?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAccountabilityPartnerData", {});
      return res?.data ?? res;
    },
    enabled: !!user?.id,
    initialData: { partners: [], groups: [] },
  });

  const respondInvite = useMutation({
    mutationFn: async ({ membershipId, action, guardianConsent }) => {
      const res = await base44.functions.invoke("respondToAccountabilityInvite", {
        membershipId,
        action,
        guardianConsent,
      });
      return res?.data ?? res;
    },
    onSuccess: (data, variables) => {
      if (variables.action === "accept") {
        toast.success("You've joined the accountability group!");
      } else {
        toast.info("Invitation declined.");
      }
      queryClient.invalidateQueries({ queryKey: ["accountabilityInvites"] });
      queryClient.invalidateQueries({ queryKey: ["accountabilityPartners"] });
      setConsentModal(null);
    },
    onError: (error) => {
      const errData = error?.response?.data || {};
      if (errData.requiresGuardianConsent) {
        setConsentModal(errData);
      } else {
        toast.error(errData?.error || error?.message || "Failed to respond to invite.");
      }
    },
  });

  const handleAccept = (membershipId) => {
    respondInvite.mutate({ membershipId, action: "accept" });
  };

  const handleDecline = (membershipId) => {
    respondInvite.mutate({ membershipId, action: "decline" });
  };

  const handleConsentAccept = () => {
    if (!consentModal?.membershipId) return;
    respondInvite.mutate({
      membershipId: consentModal.membershipId,
      action: "accept",
      guardianConsent: true,
    });
  };

  const partners = partnerData?.partners || [];
  const groups = partnerData?.groups || [];
  const isLoading = invitesLoading || partnersLoading;

  return (
    <div className="rounded-xl p-5" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: "#8b3dff" }} />
          <h2 className="font-semibold text-white text-base" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Accountability Partners
          </h2>
        </div>
        <Button
          size="sm"
          onClick={() => setInviteModalOpen(true)}
          className="text-xs"
          style={{ background: "#8b3dff" }}
        >
          <UserPlus className="w-3.5 h-3.5 mr-1" />
          Invite
        </Button>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Pending Invites</p>
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "rgba(139,61,255,0.08)", border: "1px solid rgba(139,61,255,0.2)" }}
            >
              <div>
                <p className="text-sm font-medium text-white">{inv.group_name}</p>
                <p className="text-xs text-gray-400">Invited to join</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(inv.id)}
                  disabled={respondInvite.isPending}
                  className="h-8 px-3 text-xs"
                  style={{ background: "#10b981" }}
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(inv.id)}
                  disabled={respondInvite.isPending}
                  className="h-8 px-3 text-xs border-gray-700 text-gray-300"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Partners */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
        </div>
      ) : partners.length > 0 ? (
        <div className="space-y-2">
          {partners.map((partner) => (
            <div
              key={partner.athlete_id}
              className="flex items-center gap-3 p-3 rounded-lg pcw-card-hover"
              style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
                {partner.avatar_url ? (
                  <img src={partner.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {partner.athlete_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{partner.athlete_name}</p>
                  {partner.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-orange-400 flex-shrink-0">
                      <Flame className="w-3 h-3" />
                      {partner.streak}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {partner.goals ? (
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {partner.goals.slice(0, 50)}
                      {partner.goals.length > 50 ? "…" : ""}
                    </span>
                  ) : (
                    <span>{partner.training_sessions_30d} sessions this month</span>
                  )}
                </p>
              </div>

              {/* Chat link */}
              <Link
                to={`${createPageUrl("Chat")}?partner=${partner.athlete_id}`}
                className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-colors"
                style={{ background: "rgba(139,61,255,0.1)", color: "#8b3dff" }}
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
            </div>
          ))}

          {/* Groups summary */}
          {groups.length > 0 && (
            <p className="text-xs text-gray-600 pt-1">
              {groups.length} active {groups.length === 1 ? "group" : "groups"} •{" "}
              {groups.map((g) => g.name).join(", ")}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-600">
          <Users className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm mb-1">No accountability partners yet</p>
          <p className="text-xs text-gray-700">Invite a training partner to stay motivated!</p>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <InvitePartnerModal
          user={user}
          onClose={() => setInviteModalOpen(false)}
          onInvited={() => {
            queryClient.invalidateQueries({ queryKey: ["accountabilityPartners"] });
            setInviteModalOpen(false);
          }}
        />
      )}

      {/* Guardian Consent Modal */}
      {consentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setConsentModal(null)} />
          <div className="relative w-full max-w-md rounded-2xl p-6" style={{ background: "#0f0f0f", border: "1px solid #333" }}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Guardian Consent Required</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              You appear to be under 18. A parent or guardian must consent before you can join an accountability group.
              Please confirm that you have discussed this with your guardian and they approve.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300"
                onClick={() => setConsentModal(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                style={{ background: "#10b981" }}
                onClick={handleConsentAccept}
                disabled={respondInvite.isPending}
              >
                {respondInvite.isPending ? "Joining…" : "Guardian Approves"}
              </Button>
            </div>
            {/* stash membershipId for the mutation */}
            <span className="hidden">{consentModal.membershipId}</span>
          </div>
        </div>
      )}
    </div>
  );
}