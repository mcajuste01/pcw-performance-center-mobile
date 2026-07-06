import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MessageSquare, Clock, Plus, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

function TimestampRow({ ts, onRemove }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-mono px-1.5 py-1 rounded flex-shrink-0 mt-0.5"
        style={{ background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.3)" }}>
        {ts.time}
      </span>
      <span className="text-sm text-gray-300 flex-1">{ts.note}</span>
      <button onClick={onRemove} className="text-gray-600 hover:text-red-400 transition-colors mt-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function FeedbackModal({ trainee, recentLogs = [], onSendFeedback }) {
  const [open, setOpen]               = useState(false);
  const [feedback, setFeedback]       = useState("");
  const [timestamps, setTimestamps]   = useState([]);
  const [newTime, setNewTime]         = useState("");
  const [newNote, setNewNote]         = useState("");
  const [activeTab, setActiveTab]     = useState("general"); // "general" | "video"

  const addTimestamp = () => {
    if (!newTime.match(/^\d+:\d{2}$/)) { toast.error("Use format M:SS (e.g. 1:23)"); return; }
    if (!newNote.trim()) { toast.error("Add a note for this timestamp"); return; }
    setTimestamps(prev => [...prev, { time: newTime, note: newNote.trim() }]
      .sort((a, b) => {
        const toSec = t => { const [m, s] = t.split(":"); return +m * 60 + +s; };
        return toSec(a.time) - toSec(b.time);
      }));
    setNewTime(""); setNewNote("");
  };

  const generateSuggestion = () => {
    const avg = recentLogs.length > 0
      ? recentLogs.reduce((s, l) => s + (l.self_grade || 0), 0) / recentLogs.length : 0;
    const drills = [...new Set(recentLogs.map(l => l.drill_type).filter(Boolean))];
    const name = trainee.wrestling_name || trainee.full_name;

    let msg = `Hey ${name},\n\n`;
    if (avg >= 8) msg += "You've been performing exceptionally well lately — I can see the consistency paying off. ";
    else if (avg >= 6) msg += "Good progress this week. You're building solid habits. ";
    else msg += "I want to check in and make sure you have what you need to push forward. ";
    if (drills.length > 0) msg += `I see you've been working on ${drills.slice(0, 2).join(" and ")}. `;
    msg += "\n\nKeep putting in the work. See you on the mat!";
    setFeedback(msg);
  };

  const handleSubmit = () => {
    if (!feedback.trim() && timestamps.length === 0) {
      toast.error("Add feedback or at least one timestamp note");
      return;
    }

    // Build the final feedback string — general text + timestamped notes
    let finalFeedback = feedback.trim();
    if (timestamps.length > 0) {
      if (finalFeedback) finalFeedback += "\n\n";
      finalFeedback += timestamps.map(ts => `[${ts.time}] ${ts.note}`).join("\n");
    }

    onSendFeedback({ trainee_id: trainee.id, feedback: finalFeedback });
    setOpen(false);
    setFeedback(""); setTimestamps([]);
  };

  const avgScore = recentLogs.length > 0
    ? (recentLogs.reduce((s, l) => s + (l.self_grade || 0), 0) / recentLogs.length).toFixed(1) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" style={{ borderColor: "#dc2626", color: "#dc2626" }}>
          <MessageSquare className="w-4 h-4 mr-1.5" /> Feedback
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)" }}>
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-400" />
            Feedback for {trainee.wrestling_name || trainee.full_name}
          </DialogTitle>
        </DialogHeader>

        {/* Recent activity summary */}
        {recentLogs.length > 0 && (
          <div className="flex items-center gap-4 px-3 py-2 rounded-lg text-xs"
            style={{ background: "rgba(139,61,255,0.08)", border: "1px solid rgba(139,61,255,0.15)" }}>
            <span className="text-gray-400">{recentLogs.length} sessions</span>
            {avgScore && <span className="text-gray-400">Avg: <span className="text-purple-300 font-medium">{avgScore}/10</span></span>}
            <span className="text-gray-400 truncate">
              Focus: {[...new Set(recentLogs.map(l => l.drill_type).filter(Boolean))].slice(0,2).join(", ") || "—"}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
          {[["general","General Feedback"],["video","Video Timestamps"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: activeTab === key ? "#1a1a1a" : "transparent",
                color: activeTab === key ? "#fff" : "#6b7280",
                border: activeTab === key ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
              }}>
              {key === "video" && <Clock className="w-3 h-3 inline mr-1" />}
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTab === "general" ? (
            <>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Label className="text-gray-300 text-xs uppercase tracking-wider">Message</Label>
                  <button onClick={generateSuggestion}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
                    style={{ background: "rgba(139,61,255,0.12)", color: "#a78bfa", border: "1px solid rgba(139,61,255,0.2)" }}>
                    <Sparkles className="w-3 h-3" /> Suggest
                  </button>
                </div>
                <Textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Write personalized feedback based on their recent performance..."
                  className="bg-gray-900 border-gray-700 text-white resize-none"
                  rows={6}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-gray-300 text-xs uppercase tracking-wider">Add Timestamp Note</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    placeholder="1:23"
                    className="bg-gray-900 border-gray-700 text-white w-20 text-sm font-mono"
                  />
                  <Input
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTimestamp()}
                    placeholder="Note for this moment in the video..."
                    className="bg-gray-900 border-gray-700 text-white flex-1 text-sm"
                  />
                  <Button size="sm" onClick={addTimestamp}
                    style={{ background: "rgba(220,38,38,0.2)", borderColor: "#dc2626", color: "#dc2626" }}
                    variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600">Format: M:SS — e.g. 0:45, 1:23, 2:10</p>
              </div>

              {timestamps.length > 0 ? (
                <div className="space-y-2 p-3 rounded-lg" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {timestamps.map((ts, i) => (
                    <TimestampRow key={i} ts={ts} onRemove={() => setTimestamps(prev => prev.filter((_, j) => j !== i))} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-600">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No timestamps yet. Add specific moments from their video.</p>
                </div>
              )}

              {/* Optional general note alongside timestamps */}
              <div>
                <Label className="text-gray-300 text-xs uppercase tracking-wider mb-1.5 block">
                  Overall Note (optional)
                </Label>
                <Textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Any overall comments to accompany the timestamps..."
                  className="bg-gray-900 border-gray-700 text-white resize-none"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} style={{ borderColor: "#444", color: "#888" }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}
            disabled={!feedback.trim() && timestamps.length === 0}
            style={{ background: "linear-gradient(135deg, #dc2626, #8b3dff)" }}>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            Send Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
