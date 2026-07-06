import React from "react";
import { cn } from "@/lib/utils";

const statusConfig = {
  online: {
    color: "bg-green-500",
    ring: "ring-green-500/30",
    pulse: true,
  },
  away: {
    color: "bg-yellow-500",
    ring: "ring-yellow-500/30",
    pulse: false,
  },
  dnd: {
    color: "bg-red-500",
    ring: "ring-red-500/30",
    pulse: false,
  },
  offline: {
    color: "bg-gray-500",
    ring: "ring-gray-500/30",
    pulse: false,
  },
};

export default function PresenceIndicator({ 
  status = "offline", 
  size = "sm",
  showRing = true,
  className = "",
}) {
  const config = statusConfig[status] || statusConfig.offline;

  const sizeClasses = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <span className={cn("relative inline-block", className)}>
      <span
        className={cn(
          "block rounded-full",
          config.color,
          sizeClasses[size],
          showRing && "ring-2 ring-black",
        )}
      />
      {config.pulse && status === "online" && (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-75",
            config.color,
          )}
          style={{ animationDuration: "2s" }}
        />
      )}
    </span>
  );
}

// Avatar with presence indicator
export function AvatarWithPresence({
  name,
  avatarUrl,
  status = "offline",
  size = "md",
  className = "",
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const indicatorPosition = {
    sm: "-bottom-0.5 -right-0.5",
    md: "-bottom-0.5 -right-0.5",
    lg: "bottom-0 right-0",
    xl: "bottom-0.5 right-0.5",
  };

  const indicatorSize = {
    sm: "xs",
    md: "sm",
    lg: "md",
    xl: "lg",
  };

  const initial = (name || "?")[0]?.toUpperCase();

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold text-white bg-cover bg-center",
          sizeClasses[size],
        )}
        style={{
          background: avatarUrl
            ? `url(${avatarUrl}) center/cover`
            : "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)",
        }}
      >
        {!avatarUrl && initial}
      </div>
      <span className={cn("absolute", indicatorPosition[size])}>
        <PresenceIndicator status={status} size={indicatorSize[size]} />
      </span>
    </div>
  );
}

// Typing indicator component
export function TypingIndicator({ users = [], className = "" }) {
  if (users.length === 0) return null;

  const text = users.length === 1
    ? `${users[0].name} is typing...`
    : users.length === 2
    ? `${users[0].name} and ${users[1].name} are typing...`
    : `${users[0].name} and ${users.length - 1} others are typing...`;

  return (
    <div className={cn("flex items-center gap-2 text-xs text-gray-400", className)}>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{text}</span>
    </div>
  );
}