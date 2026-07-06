import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Star, MessageSquare, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const toArray = (v) => (Array.isArray(v) ? v : v?.items && Array.isArray(v.items) ? v.items : []);

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className="w-7 h-7"
            style={{
              color: star <= (hover || value) ? "#f59e0b" : "#444",
              fill: star <= (hover || value) ? "#f59e0b" : "transparent",
            }}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-gray-400 self-center">
          {["", "Poor", "Fair", "Good", "Great", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

export default function EventFeedbackForm({ event, user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const isShowcase = event.event_type === "showcase";

  const [form, setForm] = useState({
    trainee_name: "",
    tier: "",
    training_duration: "",
    session_rating: 0,
    highlight: "",
    what_learned: "",
    felt_prepared: "",
    improvement_areas: "",
    coach_feedback: "",
    additional_notes: "",
  });

  // Check if this user already submitted
  const { data: existing } = useQuery({
    queryKey: ["eventFeedback", event.id, user?.id],
    queryFn: async () => {
      const res = await base44.entities.EventFeedback.filter({
        event_id: event.id,
        trainee_id: user.id,
      });
      const arr = toArray(res);
      return arr[0] || null;
    },
    enabled: !!user && open,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.EventFeedback.create({
        event_id: event.id,
        event_name: event.event_name,
        trainee_id: user.id,
        feedback_type: isShowcase ? "showcase" : "session",
        ...form,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventFeedback", event.id, user?.id] });
      toast.success("Feedback submitted! Thank you.");
    },
    onError: () => toast.error("Failed to submit feedback"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.session_rating) {
      toast.error("Please provide a session rating");
      return;
    }
    submitMutation.mutate();
  };

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="mt-3 border-t border-gray-800 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        {isShowcase ? "Showcase Feedback" : "Session Feedback"}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-4">
          {existing ? (
            <div className="flex items-center gap-2 p-3 rounded-lg"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-300 text-sm font-medium">Feedback already submitted</p>
                <p className="text-green-500 text-xs">Rating: {"⭐".repeat(existing.session_rating)}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-lg"
              style={{ background: "#0a0a0a", border: "1px solid #222" }}>
              <p className="text-xs text-gray-500 italic">
                This is a judgment-free zone. Honest feedback helps us build better talent, better shows, and better opportunities for you. Private notes are only visible to coaching staff.
              </p>

              {/* Name + Tier + Duration */}
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-gray-300 text-xs">Name (Optional)</Label>
                  <Input
                    value={form.trainee_name}
                    onChange={(e) => set("trainee_name", e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label className="text-gray-300 text-xs">Your Tier</Label>
                  <Select value={form.tier} onValueChange={(v) => set("tier", v)}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white text-sm">
                      <SelectValue placeholder="Select tier…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T1">T1 – Fundamentals</SelectItem>
                      <SelectItem value="T2">T2 – Intermediate</SelectItem>
                      <SelectItem value="T3">T3 – Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs">Training with PCW</Label>
                  <Select value={form.training_duration} onValueChange={(v) => set("training_duration", v)}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white text-sm">
                      <SelectValue placeholder="How long?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Less than 1 month">Less than 1 month</SelectItem>
                      <SelectItem value="1–3 months">1–3 months</SelectItem>
                      <SelectItem value="3–6 months">3–6 months</SelectItem>
                      <SelectItem value="6+ months">6+ months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <Label className="text-gray-300 text-xs mb-2 block">
                  Overall {isShowcase ? "Showcase" : "Session"} Rating *
                </Label>
                <StarRating value={form.session_rating} onChange={(v) => set("session_rating", v)} />
              </div>

              {/* Did you feel prepared */}
              <div>
                <Label className="text-gray-300 text-xs">Did you feel prepared for this {isShowcase ? "show" : "session"}?</Label>
                <Select value={form.felt_prepared} onValueChange={(v) => set("felt_prepared", v)}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white text-sm">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="Somewhat">Somewhat</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Highlight */}
              <div>
                <Label className="text-gray-300 text-xs">
                  What was the highlight of this {isShowcase ? "showcase" : "session"}?
                </Label>
                <Textarea
                  value={form.highlight}
                  onChange={(e) => set("highlight", e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white text-sm h-20"
                  placeholder="Best moment or thing that went well…"
                />
              </div>

              {/* What learned */}
              <div>
                <Label className="text-gray-300 text-xs">What did you learn or work on?</Label>
                <Textarea
                  value={form.what_learned}
                  onChange={(e) => set("what_learned", e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white text-sm h-20"
                  placeholder="Skills, concepts, drills you focused on…"
                />
              </div>

              {/* Improvement areas */}
              <div>
                <Label className="text-gray-300 text-xs">What areas do you want to improve?</Label>
                <Textarea
                  value={form.improvement_areas}
                  onChange={(e) => set("improvement_areas", e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white text-sm h-20"
                  placeholder="Areas you feel you need more work on…"
                />
              </div>

              {/* Private coach feedback */}
              <div className="rounded-lg p-3" style={{ background: "rgba(139,61,255,0.05)", border: "1px solid rgba(139,61,255,0.2)" }}>
                <Label className="text-purple-300 text-xs mb-1 block">
                  🔒 Private Feedback for Coaches (only coaching staff can see this)
                </Label>
                <Textarea
                  value={form.coach_feedback}
                  onChange={(e) => set("coach_feedback", e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white text-sm h-24"
                  placeholder="Feedback on coaching, class structure, anything you'd like staff to know privately…"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-xs">Additional Notes (private)</Label>
                <Textarea
                  value={form.additional_notes}
                  onChange={(e) => set("additional_notes", e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white text-sm h-16"
                  placeholder="Anything else you'd like to share…"
                />
              </div>

              <Button
                type="submit"
                disabled={submitMutation.isPending || !form.session_rating}
                className="w-full"
                style={{ background: "#f59e0b", color: "#000" }}
              >
                {submitMutation.isPending ? "Submitting…" : "Submit Feedback"}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}