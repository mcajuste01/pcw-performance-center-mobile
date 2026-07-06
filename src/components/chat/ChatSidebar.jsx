"use client";

import React from "react";
import { MessageSquare, Bell, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatSidebar({
  me,
  contacts,
  threads,
  requests,
  activeThread,
  onSelectThread,
  onStartConversation,
  unreadMap = {},
  view,
  setView,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter((p) =>
    (p.full_name || p.wrestling_name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredThreads = threads.filter((t) => {
    const otherId = t.participants?.find((p) => p !== me?.id);
    const other = contacts.find((c) => c.auth_user_id === otherId);
    return (other?.full_name || other?.wrestling_name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-80 bg-[#0a0a0a] border-r border-gray-800 flex flex-col h-full">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            Messages
          </h2>

          <button
            onClick={() => setView("requests")}
            className="relative p-2 hover:bg-gray-800 rounded-md transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-300" />
            {requests?.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 rounded-full text-xs w-5 h-5 flex items-center justify-center font-medium">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search contacts..."
            className="bg-gray-900 border-gray-700 text-white pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* CONTACTS */}
        <div className="px-3 py-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
            Contacts
          </p>
          {filteredContacts.length === 0 ? (
            <p className="text-sm text-gray-600 px-2">No contacts found</p>
          ) : (
            filteredContacts.map((profile) => (
              <button
                key={profile.id}
                onClick={() => onStartConversation(profile)}
                className="w-full px-3 py-2.5 hover:bg-gray-800/50 rounded-lg flex items-center gap-3 transition-colors group"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-purple-900 text-white">
                    {(profile.wrestling_name || profile.full_name || "?")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-white text-sm truncate">
                    {profile.wrestling_name || profile.full_name}
                  </p>
                  {profile.bio ? (
                    <p className="text-xs text-gray-500 truncate">{profile.bio}</p>
                  ) : profile.tier ? (
                    <p className="text-xs text-gray-500">{profile.tier}</p>
                  ) : null}
                </div>

                <Plus className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </div>

        {/* CONVERSATIONS */}
        <div className="px-3 py-2 mt-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
            Conversations
          </p>

          {filteredThreads.length === 0 ? (
            <p className="text-sm text-gray-600 px-2">No conversations yet</p>
          ) : (
            filteredThreads.map((thread) => {
              const otherId = thread.participants?.find((p) => p !== me?.id);
              const other = contacts.find((c) => c.auth_user_id === otherId);

              if (!other) return null;

              const unread = unreadMap[thread.id] || 0;
              const isActive = activeThread?.id === thread.id;

              return (
                <button
                  key={thread.id}
                  onClick={() => onSelectThread(thread)}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all",
                    isActive
                      ? "bg-purple-900/30 border border-purple-700/50"
                      : "hover:bg-gray-800/50 border border-transparent"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={other.avatar_url} />
                    <AvatarFallback className="bg-purple-900 text-white">
                      {(other.wrestling_name || other.full_name || "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-white text-sm truncate">
                      {other.wrestling_name || other.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {thread.lastMessage || "Start chatting..."}
                    </p>
                  </div>

                  {unread > 0 && (
                    <span className="bg-purple-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-medium">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}