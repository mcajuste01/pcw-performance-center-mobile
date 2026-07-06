"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smile, ThumbsUp, Heart, Laugh, Angry, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = [
  { emoji: "👍", label: "thumbs up" },
  { emoji: "❤️", label: "heart" },
  { emoji: "😂", label: "laugh" },
  { emoji: "😮", label: "wow" },
  { emoji: "😢", label: "sad" },
  { emoji: "🔥", label: "fire" },
];

export default function MessageReactions({
  reactions = [],
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  compact = false,
}) {
  const [open, setOpen] = useState(false);

  const handleReactionClick = (emoji) => {
    const existingReaction = reactions.find((r) => r.emoji === emoji);
    if (existingReaction?.user_ids?.includes(currentUserId)) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setOpen(false);
  };

  const hasUserReacted = (emoji) => {
    const reaction = reactions.find((r) => r.emoji === emoji);
    return reaction?.user_ids?.includes(currentUserId);
  };

  const getReactionCount = (emoji) => {
    const reaction = reactions.find((r) => r.emoji === emoji);
    return reaction?.user_ids?.length || 0;
  };

  // Only show reactions that have been used
  const activeReactions = reactions.filter((r) => r.user_ids?.length > 0);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Show existing reactions */}
      {activeReactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction.emoji)}
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all",
            hasUserReacted(reaction.emoji)
              ? "bg-purple-600/30 border border-purple-500"
              : "bg-gray-800 border border-gray-700 hover:border-gray-600"
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="text-gray-300">{reaction.user_ids?.length}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center justify-center rounded-full transition-all",
              compact ? "w-5 h-5" : "w-6 h-6",
              "bg-gray-800/50 hover:bg-gray-700 border border-transparent hover:border-gray-600"
            )}
          >
            <Smile className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5", "text-gray-400")} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2 bg-gray-900 border-gray-700"
          align="start"
          side="top"
        >
          <div className="flex gap-1">
            {REACTION_EMOJIS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800 transition-all text-lg",
                  hasUserReacted(emoji) && "bg-purple-600/30"
                )}
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function QuickReactionBar({ onReact, className }) {
  return (
    <div className={cn("flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", className)}>
      {REACTION_EMOJIS.slice(0, 3).map(({ emoji }) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700/50 transition-all text-sm hover:scale-125"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}