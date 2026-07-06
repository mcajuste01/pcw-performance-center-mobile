"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  CheckCheck,
  Search,
  X,
  Trash2,
  MoreVertical,
  Pin,
  Reply,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessageReactions, { QuickReactionBar } from "@/components/chat/MessageReactions";
import PinnedMessagesBanner from "@/components/chat/PinnedMessagesBanner";

const formatMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7) return formatDistanceToNow(date, { addSuffix: true });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function ChatThread({
  thread,
  me,
  profiles,
  typingUser,
  typingUsers = [],
  onDeleteMessage,
  onReaction,
  onPinMessage,
  onUnpinMessage,
  onReplyTo,
}) {
  const bottomRef = useRef(null);
  const messageRefs = useRef({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const getSender = (id) => {
    if (id === me?.id) return me;
    return profiles.find((p) => p.auth_user_id === id || p.id === id);
  };

  const messages = thread?.messages || [];
  const pinnedMessages = messages.filter((m) => m.pinned);

  const scrollToMessage = (msgId) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-purple-900/30");
      setTimeout(() => el.classList.remove("bg-purple-900/30"), 2000);
    }
  };

  const getReplyMessage = (replyToId) => {
    return messages.find((m) => m.id === replyToId);
  };

  const filteredMessages = searchQuery
    ? messages.filter((m) =>
        m.text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  useEffect(() => {
    if (!searchQuery) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, typingUser, searchQuery]);

  const otherId = thread?.participants?.find((p) => p !== me?.id);
  const otherUser = profiles.find((p) => p.auth_user_id === otherId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-800 p-4 bg-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.avatar_url} />
              <AvatarFallback className="bg-purple-900 text-white">
                {(otherUser?.wrestling_name || otherUser?.full_name || "?")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-white">
                {otherUser?.wrestling_name || otherUser?.full_name || "Unknown"}
              </h3>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="text-gray-400 hover:text-white"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {showSearch && (
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in conversation..."
              className="bg-gray-900 border-gray-700 text-white pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3 h-3 text-gray-500" />
              </Button>
            )}
            {searchQuery && (
              <p className="text-xs text-gray-500 mt-1">
                {filteredMessages.length} results
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pinned Messages Banner */}
      <PinnedMessagesBanner
        pinnedMessages={pinnedMessages}
        profiles={profiles}
        onUnpin={onUnpinMessage}
        onJumpToMessage={scrollToMessage}
        currentUserId={me?.id}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMessages.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        )}

        {filteredMessages.map((msg) => {
          const isSender = msg.sender_id === me?.id;
          const sender = getSender(msg.sender_id);
          const replyMessage = msg.reply_to_id ? getReplyMessage(msg.reply_to_id) : null;

          return (
            <div
              key={msg.id}
              ref={(el) => (messageRefs.current[msg.id] = el)}
              className={`flex ${isSender ? "justify-end" : "justify-start"} group transition-colors duration-500 rounded-lg`}
            >
              <div className="flex flex-col max-w-[75%]">
                {/* Reply Preview */}
                {replyMessage && (
                  <button
                    onClick={() => scrollToMessage(replyMessage.id)}
                    className={`flex items-center gap-2 text-xs mb-1 px-3 py-1 rounded-t-lg ${
                      isSender ? "bg-purple-900/50 self-end" : "bg-gray-700/50 self-start"
                    }`}
                  >
                    <Reply className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400 truncate max-w-[200px]">
                      {replyMessage.message}
                    </span>
                  </button>
                )}

                <div
                  className={`rounded-2xl px-4 py-2.5 relative ${
                    isSender
                      ? "bg-gradient-to-r from-purple-700 to-purple-600 text-white"
                      : "bg-gray-800 text-gray-100"
                  } ${msg.pinned ? "ring-1 ring-yellow-500/50" : ""}`}
                >
                  {/* Pinned indicator */}
                  {msg.pinned && (
                    <Pin className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
                  )}

                  {!isSender && (
                    <p className="text-xs text-purple-400 font-medium mb-1">
                      {sender?.wrestling_name || sender?.full_name || "Unknown"}
                    </p>
                  )}

                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.text || msg.message}
                  </p>

                  {/* Reactions */}
                  {(msg.reactions?.length > 0 || onReaction) && (
                    <div className="mt-2">
                      <MessageReactions
                        reactions={msg.reactions || []}
                        currentUserId={me?.id}
                        onAddReaction={(emoji) => onReaction?.(msg.id, emoji, "add")}
                        onRemoveReaction={(emoji) => onReaction?.(msg.id, emoji, "remove")}
                        compact
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1.5 mt-1.5">
                    <span
                      className="text-[10px] opacity-60"
                      title={msg.created_date ? new Date(msg.created_date).toLocaleString() : ""}
                    >
                      {formatMessageTime(msg.created_date)}
                    </span>

                    {isSender && (
                      <span title={msg.read ? "Read" : "Sent"}>
                        {msg.read ? (
                          <CheckCheck className="w-3 h-3 text-blue-300" />
                        ) : (
                          <Check className="w-3 h-3 opacity-60" />
                        )}
                      </span>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <MoreVertical className="w-3 h-3 opacity-60 hover:opacity-100" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => onReplyTo?.(msg)}
                        >
                          <Reply className="w-3 h-3 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => msg.pinned ? onUnpinMessage?.(msg.id) : onPinMessage?.(msg.id)}
                        >
                          <Pin className="w-3 h-3 mr-2" />
                          {msg.pinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        {isSender && onDeleteMessage && (
                          <>
                            <DropdownMenuSeparator className="bg-gray-700" />
                            <DropdownMenuItem
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                              onClick={() => onDeleteMessage(msg.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Quick Reactions on Hover */}
                <QuickReactionBar
                  onReact={(emoji) => onReaction?.(msg.id, emoji, "add")}
                  className={`mt-1 ${isSender ? "self-end" : "self-start"}`}
                />
              </div>
            </div>
          );
        })}

        {/* TYPING INDICATOR */}
        {(typingUser || typingUsers.length > 0) && (
          <div className="text-xs text-gray-500 px-2">
            Someone is typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}