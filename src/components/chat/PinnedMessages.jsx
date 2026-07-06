"use client";

import React from "react";
import { Pin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PinnedMessages({
  messages,
  pinnedIds,
  profiles,
  currentUser,
  isAdmin,
  onUnpin,
  onJumpToMessage,
}) {
  const pinnedMessages = messages.filter((m) => pinnedIds?.includes(m.id));

  if (pinnedMessages.length === 0) return null;

  const getSender = (senderId) => {
    if (senderId === currentUser?.id) return currentUser;
    return profiles.find((p) => p.auth_user_id === senderId);
  };

  return (
    <div className="border-b border-gray-800 bg-yellow-900/10 px-4 py-2">
      <div className="flex items-center gap-2 mb-2">
        <Pin className="w-4 h-4 text-yellow-500" />
        <span className="text-xs font-medium text-yellow-500 uppercase tracking-wide">
          Pinned Messages ({pinnedMessages.length})
        </span>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {pinnedMessages.map((msg) => {
          const sender = getSender(msg.author_id || msg.sender_id);
          return (
            <div
              key={msg.id}
              className="flex items-start gap-2 p-2 rounded bg-gray-800/50 group cursor-pointer hover:bg-gray-800"
              onClick={() => onJumpToMessage?.(msg.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-400 font-medium">
                  {sender?.wrestling_name || sender?.full_name || "Unknown"}
                </p>
                <p className="text-sm text-gray-300 truncate">
                  {msg.content || msg.text || msg.message}
                </p>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnpin(msg.id);
                  }}
                >
                  <X className="w-3 h-3 text-gray-400" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}