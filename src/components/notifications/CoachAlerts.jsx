import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Video, X } from "lucide-react";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

const ALERT_TYPES = {
  assignment_submitted: {
    icon: ClipboardList,
    color: "#8b3dff",
    label: "Assignment Submitted",
    cta: "Review",
  },
  video_uploaded: {
    icon: Video,
    color: "#ec4899",
    label: "New Video",
    cta: "Watch",
  },
};

const AUTO_DISMISS_MS = 7000;

export default function CoachAlerts({ user }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const seenIds = useRef(new Set());

  useEffect(() => {
    if (!user?.id) return;
    let unsub = null;

    (async () => {
      // Seed seen IDs so we don't toast notifications that existed before mount
      try {
        const res = await base44.entities.Notification.filter(
          { user_id: user.id },
          "-created_date",
          50
        );
        toArray(res).forEach((n) => seenIds.current.add(n.id));
      } catch {
        /* ignore — proceed with empty seed */
      }

      // Real-time subscription: toast only brand-new notifications
      try {
        unsub = base44.entities.Notification.subscribe((event) => {
          if (event.type !== "create") return;
          const n = event.data;
          if (!n || n.user_id !== user.id) return;
          if (!ALERT_TYPES[n.type]) return;
          if (seenIds.current.has(n.id)) return;
          seenIds.current.add(n.id);

          const toastId = `${n.id}-${Date.now()}`;
          setAlerts((prev) => [...prev, { toastId, notification: n }]);

          setTimeout(() => {
            setAlerts((prev) => prev.filter((a) => a.toastId !== toastId));
          }, AUTO_DISMISS_MS);
        });
      } catch {
        /* subscription unavailable — silent */
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [user?.id]);

  const dismiss = (toastId) =>
    setAlerts((prev) => prev.filter((a) => a.toastId !== toastId));

  const handleClick = (alert) => {
    if (alert.notification.action_url) {
      navigate(alert.notification.action_url);
    }
    dismiss(alert.toastId);
  };

  return (
    <div className="fixed top-16 right-3 md:top-4 md:right-4 z-[300] flex flex-col gap-2 w-[calc(100vw-1.5rem)] max-w-sm pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => {
          const config = ALERT_TYPES[alert.notification.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={alert.toastId}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="rounded-xl border shadow-2xl overflow-hidden pointer-events-auto"
              style={{
                background: "#131313",
                borderColor: `${config.color}55`,
                boxShadow: `0 8px 32px ${config.color}22`,
              }}
            >
              <div
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleClick(alert)}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${config.color}22` }}
                >
                  <Icon className="w-4 h-4" style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </p>
                  <p className="text-sm font-semibold text-white mt-0.5 leading-snug">
                    {alert.notification.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-snug">
                    {alert.notification.message}
                  </p>
                  <span
                    className="inline-block mt-1.5 text-xs font-medium"
                    style={{ color: config.color }}
                  >
                    {config.cta} →
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss(alert.toastId);
                  }}
                  className="text-gray-600 hover:text-white transition-colors flex-shrink-0 p-0.5"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Progress bar */}
              <div
                className="h-0.5 w-full overflow-hidden"
                style={{ background: `${config.color}1a` }}
              >
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
                  style={{ background: config.color }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}