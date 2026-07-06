"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";


import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatRequests from "@/components/chat/ChatRequests";
import ChatThread from "@/components/chat/ChatThread";
import ChatComposer from "@/components/chat/ChatComposer";
import MessageSearch from "@/components/chat/MessageSearch";

if (typeof window !== "undefined") {
  window.base44 = base44;
}

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

export default function DirectMessages() {
  const queryClient = useQueryClient();
  const [activeThread, setActiveThread] = useState(null);
  const [view, setView] = useState("inbox");

  // Load current user
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  // Load all users from UserProfile (accessible to all users)
  const { data: profiles = [] } = useQuery({
    queryKey: ["allContacts", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      let userMap = new Map(); // Map by id to avoid duplicates
      
      // Primary source: UserProfile entity (accessible to all users)
      try {
        const profileRes = await base44.entities.UserProfile.list();
        toArray(profileRes).forEach((p) => {
          const id = p.auth_user_id || p.id;
          userMap.set(id, {
            id: p.id,
            auth_user_id: p.auth_user_id,
            full_name: p.full_name,
            email: p.email,
            wrestling_name: p.wrestling_name || "",
            tier: p.tier || "",
            bio: p.bio || "",
            avatar_url: p.avatar_url || "",
          });
        });
      } catch (e) {
        console.log("Could not fetch UserProfile entity", e);
      }

      // For admins, also try User entity to get any users without profiles
      if (me?.role === "admin") {
        try {
          const userRes = await base44.entities.User.list();
          toArray(userRes).forEach((u) => {
            if (!userMap.has(u.id)) {
              userMap.set(u.id, {
                id: u.id,
                auth_user_id: u.id,
                full_name: u.full_name,
                email: u.email,
                wrestling_name: "",
                tier: "",
                bio: "",
                avatar_url: "",
              });
            }
          });
        } catch (e) {
          console.log("Could not fetch User entity", e);
        }
      }

      // Also get contacts from existing DMs (shows anyone you've messaged with)
      try {
        const sent = await base44.entities.DirectMessage.filter({ sender_id: me.id });
        const received = await base44.entities.DirectMessage.filter({ recipient_id: me.id });
        const allDMs = [...toArray(sent), ...toArray(received)];
        
        // Extract unique user IDs from DMs
        const dmUserIds = new Set();
        allDMs.forEach((dm) => {
          if (dm.sender_id !== me.id) dmUserIds.add(dm.sender_id);
          if (dm.recipient_id !== me.id) dmUserIds.add(dm.recipient_id);
        });
        
        // Add DM contacts that aren't already known
        dmUserIds.forEach((userId) => {
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              id: userId,
              auth_user_id: userId,
              full_name: `User ${userId.slice(0, 6)}`,
              email: "",
              wrestling_name: "",
              tier: "",
              bio: "",
              avatar_url: "",
            });
          }
        });
      } catch (e) {
        console.log("Could not fetch DMs for contacts", e);
      }

      // Convert map to array and filter out current user
      const users = Array.from(userMap.values());
      return users.filter(
        (u) => u.auth_user_id !== me.id && u.id !== me.id && u.email !== me.email
      );
    },
  });

  // Load DM threads
  const { data: threads = [] } = useQuery({
    queryKey: ["dmThreads"],
    enabled: !!me?.id,
    queryFn: async () => {
      const sent = await base44.entities.DirectMessage.filter({ sender_id: me.id });
      const received = await base44.entities.DirectMessage.filter({ recipient_id: me.id });
      const allMessages = [...toArray(sent), ...toArray(received)];

      // Group by thread
      const threadMap = {};
      allMessages.forEach((msg) => {
        const otherId = msg.sender_id === me.id ? msg.recipient_id : msg.sender_id;
        const threadId = [me.id, otherId].sort().join("_");
        if (!threadMap[threadId]) {
          threadMap[threadId] = {
            id: threadId,
            participants: [me.id, otherId],
            messages: [],
          };
        }
        threadMap[threadId].messages.push(msg);
      });

      // Sort messages and get last message
      Object.values(threadMap).forEach((t) => {
        t.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        t.lastMessage = t.messages[t.messages.length - 1]?.message || "";
      });

      return Object.values(threadMap);
    },
    refetchInterval: 5000,
  });

  // Unread counts
  const unreadMap = useMemo(() => {
    const counts = {};
    threads.forEach((t) => {
      const unread = t.messages.filter(
        (m) => m.recipient_id === me?.id && !m.read
      ).length;
      if (unread > 0) counts[t.id] = unread;
    });
    return counts;
  }, [threads, me]);



  // Start conversation
  const startConversation = useMutation({
    mutationFn: async (profile) => {
      const existing = threads.find((t) =>
        t.participants.includes(profile.auth_user_id)
      );
      if (existing) {
        setActiveThread(existing);
        setView("thread");
        return existing;
      }
      // Create empty thread placeholder
      const newThread = {
        id: [me.id, profile.auth_user_id].sort().join("_"),
        participants: [me.id, profile.auth_user_id],
        messages: [],
      };
      setActiveThread(newThread);
      setView("thread");
      return newThread;
    },
  });

  // Delete message
  const deleteMessage = useMutation({
    mutationFn: (msgId) => base44.entities.DirectMessage.delete(msgId),
    onSuccess: () => {
      queryClient.invalidateQueries(["dmThreads"]);
      toast.success("Message deleted");
    },
  });

  // Handle reactions
  const handleReaction = async (msgId, emoji, action) => {
    const msg = activeMessages.find((m) => m.id === msgId);
    if (!msg) return;

    let reactions = [...(msg.reactions || [])];
    const reactionIndex = reactions.findIndex((r) => r.emoji === emoji);

    if (action === "add") {
      if (reactionIndex >= 0) {
        if (!reactions[reactionIndex].user_ids.includes(me.id)) {
          reactions[reactionIndex].user_ids.push(me.id);
        }
      } else {
        reactions.push({ emoji, user_ids: [me.id] });
      }
    } else if (action === "remove") {
      if (reactionIndex >= 0) {
        reactions[reactionIndex].user_ids = reactions[reactionIndex].user_ids.filter(
          (id) => id !== me.id
        );
        if (reactions[reactionIndex].user_ids.length === 0) {
          reactions.splice(reactionIndex, 1);
        }
      }
    }

    await base44.entities.DirectMessage.update(msgId, { reactions });
    queryClient.invalidateQueries(["dmThreads"]);
  };

  // Pin message
  const pinMessage = async (msgId) => {
    await base44.entities.DirectMessage.update(msgId, {
      pinned: true,
      pinned_by: me.id,
      pinned_at: new Date().toISOString(),
    });
    queryClient.invalidateQueries(["dmThreads"]);
    toast.success("Message pinned");
  };

  // Unpin message
  const unpinMessage = async (msgId) => {
    await base44.entities.DirectMessage.update(msgId, {
      pinned: false,
      pinned_by: null,
      pinned_at: null,
    });
    queryClient.invalidateQueries(["dmThreads"]);
    toast.success("Message unpinned");
  };

  // Reply to message state
  const [replyingTo, setReplyingTo] = useState(null);

  // Get active thread messages
  const activeMessages = useMemo(() => {
    if (!activeThread) return [];
    const thread = threads.find((t) => t.id === activeThread.id);
    return thread?.messages || activeThread.messages || [];
  }, [activeThread, threads]);

  useEffect(() => {
    if (view !== "thread" || !activeThread || !me?.id) return;

    const unreadMessages = activeMessages.filter(
      (message) => message.recipient_id === me.id && !message.read
    );

    if (!unreadMessages.length) return;

    Promise.all(
      unreadMessages.map((message) =>
        base44.entities.DirectMessage.update(message.id, { read: true })
      )
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["dmThreads"] });
    });
  }, [activeMessages, activeThread, me?.id, queryClient, view]);

  if (meLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-black text-white">
      {/* Sidebar */}
      <ChatSidebar
        me={me}
        contacts={profiles}
        threads={threads}
        requests={[]}
        activeThread={activeThread}
        onSelectThread={(t) => {
          setActiveThread(t);
          setReplyingTo(null);
          setView("thread");
        }}
        onStartConversation={(p) => startConversation.mutate(p)}
        unreadMap={unreadMap}
        view={view}
        setView={setView}
      />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col border-l border-gray-800">
        {view === "inbox" && (
          <div className="p-8 flex flex-col items-center justify-center h-full">
            <div className="w-full max-w-md mb-8">
              <MessageSearch
                threads={threads}
                profiles={profiles}
                onSelectThread={(t) => {
                  setActiveThread(t);
                  setReplyingTo(null);
                  setView("thread");
                }}
              />
            </div>
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500 text-lg">Select a conversation or start a new one</p>
            </div>
          </div>
        )}

        {view === "requests" && (
          <ChatRequests
            me={me}
            requests={[]}
            profiles={profiles}
            onAccept={() => {}}
            onDecline={() => {}}
            onBack={() => setView("inbox")}
          />
        )}

        {view === "thread" && activeThread && (
          <>
            <ChatThread
              thread={{ ...activeThread, messages: activeMessages }}
              me={me}
              profiles={profiles}
              onDeleteMessage={(id) => deleteMessage.mutate(id)}
              onReaction={handleReaction}
              onPinMessage={pinMessage}
              onUnpinMessage={unpinMessage}
              onReplyTo={setReplyingTo}
            />
            <ChatComposer
              thread={activeThread}
              me={me}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              onSent={() => {
                queryClient.invalidateQueries(["dmThreads"]);
                setReplyingTo(null);
              }}
            />
          </>
        )}

        {view === "thread" && !activeThread && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}