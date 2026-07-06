import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import { X, Copy, Check, CalendarPlus, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function CalendarSyncModal({ open, onClose, user }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!open) return null;

  const userId = user?.id || "";
  const base = (appParams.serverUrl || "").replace(/\/$/, "");
  const feedUrl = `${base}/api/apps/${appParams.appId}/functions/generateCalendarFeed?user_id=${encodeURIComponent(userId)}`;
  const googleUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Calendar link copied!");
    } catch {
      toast.error("Couldn't copy — select and copy the link manually.");
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await base44.functions.invoke("generateCalendarFeed", { user_id: userId });
      const ics = res.data?.ics || (typeof res.data === "string" ? res.data : "");
      if (!ics) throw new Error("No calendar data returned");
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pcw-schedule.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Calendar file downloaded!");
    } catch (e) {
      toast.error("Couldn't generate the calendar file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border max-h-[90vh] overflow-y-auto"
        style={{ background: "#0f0f0f", borderColor: "rgba(139,61,255,0.3)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0" style={{ background: "#0f0f0f" }}>
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" style={{ color: "#8b3dff" }} />
            <h2 className="text-white font-semibold" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Sync to Your Calendar
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-400">
            Subscribe to the PCW schedule and upcoming training sessions, shows, and showcases
            will appear in your personal calendar automatically — kept in sync as new events are added.
          </p>

          {/* Subscription URL */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Subscription Link
            </label>
            <div className="flex gap-2 mt-1.5">
              <input readOnly value={feedUrl}
                className="flex-1 bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 font-mono truncate" />
              <button onClick={handleCopy}
                className="px-3 rounded-lg border transition-colors hover:opacity-80"
                style={{ borderColor: "rgba(139,61,255,0.4)", color: copied ? "#10b981" : "#8b3dff", background: "rgba(139,61,255,0.08)" }}
                title="Copy link">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <a href={googleUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "#8b3dff", color: "#fff" }}>
              <ExternalLink className="w-4 h-4" /> Google Calendar
            </a>
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 hover:bg-gray-800"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: "#e5e7eb", background: "rgba(255,255,255,0.04)" }}>
              <Download className="w-4 h-4" /> {downloading ? "Generating..." : "Download .ics"}
            </button>
          </div>

          {/* Instructions */}
          <div className="rounded-lg border border-gray-800 p-4 space-y-2" style={{ background: "#0a0a0a" }}>
            <p className="text-xs font-semibold text-gray-300">How to subscribe:</p>
            <p className="text-xs text-gray-500">
              <span className="text-gray-400 font-medium">Apple Calendar:</span> File → New Calendar
              Subscription → paste the link above.
            </p>
            <p className="text-xs text-gray-500">
              <span className="text-gray-400 font-medium">Outlook:</span> Calendar → Add calendar →
              Subscribe from web → paste the link.
            </p>
            <p className="text-xs text-gray-500">
              <span className="text-gray-400 font-medium">Google:</span> Tap "Google Calendar" above,
              or paste the link under "Add by URL".
            </p>
            <p className="text-xs text-gray-600 pt-1 border-t border-gray-800 mt-2">
              Downloading a .ics file gives a one-time snapshot — subscribe with the link for automatic updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}