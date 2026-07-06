import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Swords, User, Shield, Flame, Sparkles, Trophy, ChevronDown, ChevronUp, Send } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

const STATUS_COLORS = {
  draft: "bg-zinc-700 text-zinc-300",
  submitted: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  reviewed: "bg-green-500/20 text-green-300 border border-green-500/30",
};

function SheetSection({ title, icon: Icon, fields }) {
  const entries = Object.entries(fields).filter(([, v]) => v && v !== "" && !(Array.isArray(v) && v.length === 0));
  if (!entries.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        <Icon className="w-4 h-4" />
        {title}
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {entries.map(([key, val]) => (
          <div key={key} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
            <p className="text-[11px] text-zinc-500 capitalize mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
            <p className="text-sm text-zinc-200">{Array.isArray(val) ? val.join(", ") : String(val)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CharacterReview() {
  const [user, setUser] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [critiques, setCritiques] = useState({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      const isCoach = u?.role === "admin" || u?.roles?.includes("coach") || u?.roles?.includes("admin");
      if (!isCoach) navigate(createPageUrl("Dashboard"));
    });
  }, []);

  const { data: sheets = [] } = useQuery({
    queryKey: ["characterSheets"],
    queryFn: async () => {
      const res = await base44.entities.CharacterSheet.list("-created_date", 200);
      return toArray(res);
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["userProfilesForReview"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.list();
      return toArray(res);
    },
  });

  const getRealName = (sheet) => {
    const profile = profiles.find(p => p.auth_user_id === sheet.trainee_id);
    return profile?.full_name || sheet.trainee_name || "Unknown";
  };

  const submitCritique = useMutation({
    mutationFn: async ({ sheet, critique }) => {
      await base44.entities.CharacterSheet.update(sheet.id, {
        coach_critique: critique,
        coach_id: user?.id,
        status: "reviewed",
        reviewed_at: new Date().toISOString(),
      });
    },
    onSuccess: (_, { sheet }) => {
      queryClient.invalidateQueries({ queryKey: ["characterSheets"] });
      toast.success("Critique submitted!");
      setCritiques(prev => ({ ...prev, [sheet.id]: "" }));
    },
    onError: () => toast.error("Failed to submit critique"),
  });

  const submitted = sheets.filter(s => s.status === "submitted");
  const reviewed = sheets.filter(s => s.status === "reviewed");
  const drafts = sheets.filter(s => s.status === "draft");

  const renderSheet = (sheet) => {
    const f = sheet.form_data || {};
    const ms = f.moveSet || {};
    const isExpanded = expandedId === sheet.id;

    return (
      <div key={sheet.id} className="rounded-xl border border-zinc-800 overflow-hidden" style={{ background: "#0f0f0f" }}>
        <button
          className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-900/50 transition-colors"
          onClick={() => setExpandedId(isExpanded ? null : sheet.id)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
              style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
              {(f.ringName || sheet.trainee_name || "?")[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{f.ringName || "Unnamed Character"}</p>
              <p className="text-xs text-zinc-400">
                <span className="text-purple-400 font-medium">{getRealName(sheet)}</span>
                {f.archetype ? ` · ${f.archetype}` : ""}
                {f.alignment ? ` · ${f.alignment}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`text-xs ${STATUS_COLORS[sheet.status]}`}>{sheet.status}</Badge>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-5 space-y-5 border-t border-zinc-800 pt-4">
            <SheetSection title="Identity" icon={User} fields={{
              ringName: f.ringName, realName: f.realName, alignment: f.alignment,
              archetype: f.archetype, hometown: f.hometown,
              height: f.billedHeight, weight: f.billedWeight, traits: f.traits,
            }} />
            <SheetSection title="Strategy" icon={Shield} fields={{
              objective: f.objective, notes: f.objectiveNotes,
            }} />
            <SheetSection title="Move Set" icon={Swords} fields={{
              lightStrike: ms.standingStrike, heavyStrike: ms.standingBigStrike,
              holdControl: ms.standingHold, primaryMove: ms.standingMove,
              runningStrike: ms.runningStrike, runningMove: ms.runningMove,
              groundStrike: ms.groundStrike, submission: ms.groundHold,
              cornerMove: ms.cornerMove, ropeMove: ms.ropeMove,
            }} />
            <SheetSection title="Specials" icon={Trophy} fields={{
              comeback: ms.comeback, comebackEmotion: ms.comebackEmotion,
              signature: ms.signature, signatureSetup: ms.signatureSetup,
              finisher: ms.finisher, finisherType: ms.finisherType,
              protected: ms.finisherProtected,
            }} />
            <SheetSection title="Psychology" icon={Flame} fields={{
              openingStrategy: f.openingStrategy, heatPlan: f.heatPlan,
              comebackStyle: f.comebackStyle, finishLogic: f.finishLogic,
            }} />
            <SheetSection title="Presentation" icon={Sparkles} fields={{
              entranceStyle: f.entranceStyle, crowdInteraction: f.crowdInteraction,
              mannerisms: f.mannerisms, taunt1: f.taunt1, taunt2: f.taunt2, taunt3: f.taunt3,
            }} />

            {/* Existing critique */}
            {sheet.coach_critique && (
              <div className="p-4 rounded-xl border border-purple-500/30" style={{ background: "rgba(139,61,255,0.08)" }}>
                <p className="text-xs text-purple-400 font-semibold mb-2">COACH CRITIQUE</p>
                <p className="text-sm text-zinc-200 whitespace-pre-wrap">{sheet.coach_critique}</p>
              </div>
            )}

            {/* Critique form */}
            {sheet.status !== "draft" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-zinc-300">
                  {sheet.coach_critique ? "Update Critique" : "Leave Critique"}
                </p>
                <Textarea
                  value={critiques[sheet.id] ?? (sheet.coach_critique || "")}
                  onChange={(e) => setCritiques(prev => ({ ...prev, [sheet.id]: e.target.value }))}
                  placeholder="What's working? What needs refinement? Be specific about psychology, move logic, and character consistency..."
                  className="min-h-[140px] border-zinc-700 bg-zinc-900 text-zinc-200"
                />
                <Button
                  onClick={() => submitCritique.mutate({ sheet, critique: critiques[sheet.id] ?? sheet.coach_critique })}
                  disabled={submitCritique.isPending}
                  style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}
                  className="text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Critique
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "#0a0a0a" }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Character Sheet Review
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Review and critique trainee character submissions.</p>
        </div>

        {submitted.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Awaiting Review ({submitted.length})
            </h2>
            {submitted.map(renderSheet)}
          </section>
        )}

        {reviewed.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-green-400">
              Reviewed ({reviewed.length})
            </h2>
            {reviewed.map(renderSheet)}
          </section>
        )}

        {drafts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-600">
              Drafts ({drafts.length})
            </h2>
            {drafts.map(renderSheet)}
          </section>
        )}

        {sheets.length === 0 && (
          <div className="text-center py-20 text-zinc-600">
            <Swords className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No character sheets submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}