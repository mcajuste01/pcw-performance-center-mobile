"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Smile, X, Reply } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { notifyDirectMessage } from "@/components/notifications/useNotifications";

export default function ChatComposer({
  thread,
  me,
  onSent,
  replyingTo,
  onCancelReply,
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef(null);

  const send = async () => {
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      // For DM threads, create a DirectMessage
      const recipientId = thread.participants?.find((p) => p !== me?.id);
      
      await base44.entities.DirectMessage.create({
        sender_id: me.id,
        recipient_id: recipientId,
        message: text.trim(),
        thread_id: thread.id,
        reply_to_id: replyingTo?.id || null,
      });

      // Send notification to recipient
      if (recipientId) {
        notifyDirectMessage({
          senderId: me.id,
          recipientId,
          senderName: me.wrestling_name || me.full_name || "Someone",
          messagePreview: text.trim(),
        }).catch(() => {});
      }

      setText("");
      onSent?.();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value) => {
    setText(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-t border-gray-800 bg-[#0a0a0a]">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-2 border-b border-gray-800/50">
          <Reply className="w-4 h-4 text-purple-400" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-purple-400">Replying to</p>
            <p className="text-sm text-gray-300 truncate">{replyingTo.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onCancelReply}
          >
            <X className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
      )}

      <div className="p-4 flex gap-2 items-center">
        <div className="flex-1 relative">
          <Input
            className="bg-gray-900 text-white border-gray-700 pr-10 rounded-full px-4"
            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <Button
          onClick={send}
          disabled={!text.trim() || sending}
          className="bg-purple-600 hover:bg-purple-700 rounded-full w-10 h-10 p-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}