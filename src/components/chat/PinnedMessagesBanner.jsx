"use client";

import React, { useState } from "react";
import { Pin, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PinnedMessagesBanner({ 
  pinnedMessages = [], 
  profiles = [],
  onUnpin,
  onJumpToMessage,
  currentUserId,
}) {
  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pinnedMessages.length === 0) return null;

  const getSenderName = (senderId) => {
    const profile = profiles.find((p) => p.auth_user_id === senderId);
    return profile?.wrestling_name || profile?.full_name || "Unknown";
  };

  const currentPinned = pinnedMessages[currentIndex];

  const nextPinned = () => {
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const prevPinned = () => {
    setCurrentIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
  };

  return (
    <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-2">
      <div className="flex items-center gap-3">
        <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onJumpToMessage?.(currentPinned.id)}
            className="w-full text-left hover:bg-gray-800/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
          >
            <p className="text-xs text-gray-400">
              Pinned by {getSenderName(currentPinned.pinned_by)}
            </p>
            <p className="text-sm text-white truncate">
              {currentPinned.message}
            </p>
          </button>
        </div>

        {pinnedMessages.length > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">
              {currentIndex + 1}/{pinnedMessages.length}
            </span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={prevPinned}>
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={nextPinned}>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        )}

        {onUnpin && (currentPinned.pinned_by === currentUserId || currentPinned.sender_id === currentUserId) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-500 hover:text-white"
            onClick={() => onUnpin(currentPinned.id)}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}