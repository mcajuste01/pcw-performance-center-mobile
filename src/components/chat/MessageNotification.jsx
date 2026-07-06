import React, { useEffect, useState } from "react";
import { X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessageNotification({ 
  notification, 
  onDismiss, 
  onView,
  autoDismissMs = 5000 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [notification, autoDismissMs, onDismiss]);

  if (!notification) return null;

  return (
    <div 
      className={`fixed top-20 right-4 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
      style={{ zIndex: 9999 }}
    >
      <div 
        className="p-4 rounded-lg border border-gray-700 shadow-xl max-w-sm"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}
      >
        <div className="flex items-start gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)" }}
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">
              {notification.senderName}
            </p>
            <p className="text-gray-400 text-sm truncate mt-0.5">
              {notification.message}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-500 hover:text-white"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            className="flex-1"
            style={{ background: "#8b3dff" }}
            onClick={() => {
              onView?.(notification);
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            style={{ borderColor: "#666", color: "#999" }}
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}