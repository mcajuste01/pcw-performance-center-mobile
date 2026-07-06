"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, X } from "lucide-react";

export default function MessageSearch({
  threads = [],
  messages = [],
  profiles = [],
  onSelectThread,
  onSelectMessage,
  placeholder = "Search messages...",
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return { threads: [], messages: [] };

    const searchTerm = query.toLowerCase();

    // Search in threads by participant names
    const matchedThreads = threads
      .filter((t) => {
        const participantNames = (t.participants || [])
          .map((pId) => {
            const profile = profiles.find((p) => p.auth_user_id === pId);
            return (profile?.full_name || profile?.wrestling_name || "").toLowerCase();
          })
          .join(" ");
        return participantNames.includes(searchTerm) || (t.title || "").toLowerCase().includes(searchTerm);
      })
      .slice(0, 5);

    // Search in messages
    const matchedMessages = messages
      .filter((m) => (m.text || m.message || "").toLowerCase().includes(searchTerm))
      .slice(0, 5)
      .map((m) => {
        const sender = profiles.find((p) => p.auth_user_id === m.sender_id);
        return { ...m, senderName: sender?.wrestling_name || sender?.full_name || "Unknown" };
      });

    return { threads: matchedThreads, messages: matchedMessages };
  }, [query, threads, messages, profiles]);

  const hasResults = results.threads.length > 0 || results.messages.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="bg-gray-900 border-gray-700 text-white pl-10 pr-10"
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
          >
            <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-800 overflow-hidden z-50 max-h-80 overflow-y-auto"
          style={{ background: "#0a0a0a" }}
        >
          {!hasResults ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No results found</p>
            </div>
          ) : (
            <>
              {results.threads.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase px-3 py-2 border-b border-gray-800">
                    Conversations
                  </p>
                  {results.threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => {
                        onSelectThread?.(thread);
                        setQuery("");
                        setIsOpen(false);
                      }}
                      className="w-full p-3 text-left hover:bg-gray-800 flex items-center gap-3"
                    >
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-white">{thread.title || "Conversation"}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.messages.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase px-3 py-2 border-b border-gray-800">
                    Messages
                  </p>
                  {results.messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        onSelectMessage?.(msg);
                        setQuery("");
                        setIsOpen(false);
                      }}
                      className="w-full p-3 text-left hover:bg-gray-800"
                    >
                      <p className="text-xs text-purple-400 mb-1">{msg.senderName}</p>
                      <p className="text-sm text-white truncate">{msg.text || msg.message}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}