import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Hash, Upload, Loader2, X, Settings, Pin, Users } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import ChannelSettingsModal from "@/components/chat/ChannelSettingsModal";
import PinnedMessages from "@/components/chat/PinnedMessages";
import { notifyGroupMessage, notifyMention, notifyAnnouncement, notifyPinnedMessage } from "@/components/notifications/useNotifications";
import { usePresence, useChatRealtime } from "@/components/chat/usePresence";
import { AvatarWithPresence, TypingIndicator } from "@/components/chat/PresenceIndicator";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};

function ChannelButton({ channel, selected, onClick, accentColor = "#8b3dff", isCohort = false }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg mb-1 transition-all"
      style={selected
        ? { background: `${accentColor}25`, border: `1px solid ${accentColor}50`, color: "#fff" }
        : { color: "#9ca3af", border: "1px solid transparent" }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      <div className="flex items-center gap-2">
        <span>{channel.icon || (channel.channel_type === "group" ? "👥" : "#")}</span>
        <span className="font-medium text-sm truncate">{channel.display_name}</span>
        {channel.channel_type === "group" && <Users className="w-3 h-3 text-gray-500 ml-auto flex-shrink-0" />}
        {isCohort && channel.cohort_filter && (
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: `${accentColor}20`, color: accentColor }}>
            {channel.cohort_filter}
          </span>
        )}
      </div>
      {channel.read_only && <span className="text-xs text-gray-600 ml-6">read-only</span>}
    </button>
  );
}

export default function Chat() {
  const [user, setUser] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef(null);
  const [mobileShowChannels, setMobileShowChannels] = useState(false);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["chatMessages", selectedChannel?.id] });
  }, [queryClient, selectedChannel?.id]);

  const { containerRef: chatContainerRef, isRefreshing, pullDistance, handlers: pullHandlers } = usePullToRefresh(handleRefresh);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  // Load all channels
  const { data: allChannels = [] } = useQuery({
    queryKey: ["chatChannels"],
    queryFn: async () => {
      const res = await base44.entities.ChatChannel.list("order");
      return toArray(res);
    },
    initialData: [],
  });

  // Load user profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["userProfiles"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.list();
      return toArray(res);
    },
    initialData: [],
  });

  const isCoach =
    user?.roles?.includes("coach") ||
    user?.roles?.includes("admin") ||
    user?.role === "admin";

  // Get current user's tier from profile
  const myProfile = profiles.find((p) => p.auth_user_id === user?.id);
  const myTier = myProfile?.tier;

  // Filter channels based on user role / tier / membership
  const channels = (allChannels || []).filter((channel) => {
    if (channel.channel_type === "group") {
      return channel.members?.includes(user?.id);
    }
    if (channel.channel_type === "cohort") {
      if (isCoach) return true; // coaches see all cohort rooms
      if (channel.cohort_filter === "coaches") return false; // trainees can't see coaches lounge
      // Tier match: user's tier or Graduated also sees Graduated room
      if (channel.cohort_filter === "Graduated") {
        return myTier === "Graduated" || myTier === "PCW Wrestler";
      }
      return channel.cohort_filter === myTier;
    }
    if (isCoach) return true;
    if (channel.name === "injury-check") return false;
    return true;
  });

  // Split channels into regular and cohort rooms for sidebar grouping
  const regularChannels = channels.filter((c) => c.channel_type !== "cohort");
  const cohortChannels = channels.filter((c) => c.channel_type === "cohort");

  const COHORT_COLORS = {
    T1: "#8b3dff", T2: "#dc2626", T3: "#c0c0c0",
    Graduated: "#10b981", "PCW Wrestler": "#f59e0b", coaches: "#f59e0b",
  };

  const isChannelAdmin = selectedChannel?.admins?.includes(user?.id) || isCoach;

  // Load messages for selected channel
  const { data: messages = [] } = useQuery({
    queryKey: ["chatMessages", selectedChannel?.id],
    queryFn: async () => {
      const res = await base44.entities.ChatMessage.filter(
        { channel_id: selectedChannel.id },
        "created_date"
      );
      return toArray(res);
    },
    enabled: !!selectedChannel,
    initialData: [],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await base44.entities.User.list();
      return toArray(res);
    },
    initialData: [],
  });

  // Real-time presence and chat hooks
  const { presenceMap, getStatus, isOnline } = usePresence({
    userId: user?.id,
    userName: user?.wrestling_name || user?.full_name,
    initialStatus: user?.status || "online",
  });

  const handleNewMessage = useCallback((data) => {
    // Refresh messages when new message arrives in current channel
    if (data.channelId === selectedChannel?.id) {
      queryClient.invalidateQueries({ queryKey: ["chatMessages", selectedChannel?.id] });
    }
  }, [selectedChannel?.id, queryClient]);

  const { typingUsers, sendTyping, broadcastNewMessage } = useChatRealtime({
    userId: user?.id,
    channelId: selectedChannel?.id,
    onNewMessage: handleNewMessage,
  });

  // Default to first channel
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
    }
  }, [channels, selectedChannel]);

  // Scroll & last_seen_chat update
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      if (selectedChannel && user?.id) {
        base44.entities.User
          .update(user.id, {
            last_seen_chat: new Date().toISOString(),
          })
          .catch(() => {});
      }
    }
  }, [messages, selectedChannel, user?.id]);

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const msg = await base44.entities.ChatMessage.create({
        channel_id: selectedChannel.id,
        author_id: user.id,
        content: messageData.content,
        mentions: extractMentions(messageData.content),
        attachments: messageData.attachments,
      });

      // Send notifications
      const mentions = extractMentions(messageData.content);
      const senderName = user?.wrestling_name || user?.full_name || "Someone";

      // Notify mentioned users
      for (const mentionedId of mentions) {
        notifyMention({
          senderId: user.id,
          mentionedUserId: mentionedId,
          senderName,
          channelName: selectedChannel.display_name,
          messagePreview: messageData.content,
          channelId: selectedChannel.id,
        }).catch(() => {});
      }

      // Notify for announcements or group messages
      if (selectedChannel.channel_type === "group" && selectedChannel.members) {
        notifyGroupMessage({
          senderId: user.id,
          channelId: selectedChannel.id,
          channelName: selectedChannel.display_name,
          senderName,
          messagePreview: messageData.content,
          memberIds: selectedChannel.members,
        }).catch(() => {});
      } else if (selectedChannel.read_only) {
        const allUserIds = allUsers.map((u) => u.id);
        notifyAnnouncement({
          senderId: user.id,
          channelId: selectedChannel.id,
          channelName: selectedChannel.display_name,
          messagePreview: messageData.content,
          memberIds: allUserIds,
        }).catch(() => {});
      }

      return msg;
    },
    onMutate: async (messageData) => {
      await queryClient.cancelQueries({ queryKey: ["chatMessages", selectedChannel?.id] });
      const prev = queryClient.getQueryData(["chatMessages", selectedChannel?.id]);
      const optimistic = {
        id: `temp-${Date.now()}`,
        channel_id: selectedChannel?.id,
        author_id: user?.id,
        content: messageData.content,
        attachments: messageData.attachments || [],
        created_date: new Date().toISOString(),
      };
      queryClient.setQueryData(["chatMessages", selectedChannel?.id], (old) => [
        ...(old || []),
        optimistic,
      ]);
      setMessage("");
      setAttachments([]);
      return { prev };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(["chatMessages", selectedChannel?.id], ctx.prev);
      }
    },
    onSuccess: (msg) => {
      broadcastNewMessage(msg, selectedChannel?.id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages", selectedChannel?.id] });
    },
  });

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    if (selectedChannel && user) {
      sendTyping(selectedChannel.id, user.wrestling_name || user.full_name);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        // Typing stopped
      }, 2000);
    }
  };

  const handleFileUpload = async (file) => {
    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({
        file,
      });
      setAttachments((prev) => [
        ...prev,
        {
          url: file_url,
          type: file.type,
          name: file.name,
        },
      ]);
      toast.success("File uploaded");
    } catch (error) {
      toast.error("Failed to upload file");
    }
    setUploadingFile(false);
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedUser = allUsers.find(
        (u) =>
          u.wrestling_name?.toLowerCase() === match[1].toLowerCase() ||
          u.full_name?.toLowerCase() === match[1].toLowerCase()
      );
      if (mentionedUser) mentions.push(mentionedUser.id);
    }
    return mentions;
  };

  const hasRole = (role) => {
    return (
      user?.roles?.includes(role) ||
      (role === "admin" && user?.role === "admin")
    );
  };

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;

    if (
      selectedChannel.read_only &&
      !hasRole("coach") &&
      !hasRole("admin")
    ) {
      toast.error("Only coaches can post announcements");
      return;
    }

    sendMessageMutation.mutate({ content: message, attachments });
  };

  const pinMessage = async (messageId) => {
    if (!selectedChannel || !isChannelAdmin) return;
    const currentPinned = selectedChannel.pinned_messages || [];
    const isPinned = currentPinned.includes(messageId);
    
    try {
      await base44.entities.ChatChannel.update(selectedChannel.id, {
        pinned_messages: isPinned
          ? currentPinned.filter((id) => id !== messageId)
          : [...currentPinned, messageId],
      });
      queryClient.invalidateQueries({ queryKey: ["chatChannels"] });
      toast.success(isPinned ? "Message unpinned" : "Message pinned");

      // Send notification for pinned message
      if (!isPinned && selectedChannel.members) {
        const pinnedMsg = messages.find((m) => m.id === messageId);
        notifyPinnedMessage({
          senderId: user.id,
          channelId: selectedChannel.id,
          channelName: selectedChannel.display_name,
          messagePreview: pinnedMsg?.content || "A message was pinned",
          memberIds: selectedChannel.members,
        }).catch(() => {});
      }
    } catch (err) {
      toast.error("Failed to update pin");
    }
  };

  const jumpToMessage = (messageId) => {
    messageRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    messageRefs.current[messageId]?.classList.add("bg-purple-900/30");
    setTimeout(() => {
      messageRefs.current[messageId]?.classList.remove("bg-purple-900/30");
    }, 2000);
  };

  const getUserName = (userId) => {
    const u = allUsers.find((usr) => usr.id === userId);
    if (u) return u.wrestling_name || u.full_name || "Unknown";
    const p = profiles.find((pr) => pr.auth_user_id === userId);
    return p?.wrestling_name || p?.full_name || "Unknown";
  };

  const canPost =
    !selectedChannel?.read_only || hasRole("coach") || hasRole("admin");

  return (
    <div
      className="flex flex-1 min-h-0"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
      }}
    >
      {/* Mobile channel drawer */}
      {mobileShowChannels && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileShowChannels(false)} />
          <div className="absolute left-0 top-0 bottom-16 w-72 slide-in-left flex flex-col" style={{ background: "#0f0f0f", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-white font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" style={{ color: "#8b3dff" }} /> Channels
              </h2>
              <button onClick={() => setMobileShowChannels(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {cohortChannels.length > 0 && (
                  <div className="mb-2">
                    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">🏟 Training Rooms</p>
                    {cohortChannels.map((channel) => (
                      <ChannelButton key={channel.id} channel={channel} selected={selectedChannel?.id === channel.id}
                        onClick={() => { setSelectedChannel(channel); setMobileShowChannels(false); }}
                        accentColor={COHORT_COLORS[channel.cohort_filter] || "#8b3dff"} isCohort />
                    ))}
                  </div>
                )}
                {regularChannels.length > 0 && (
                  <div>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600"># Channels</p>
                    {regularChannels.map((channel) => (
                      <ChannelButton key={channel.id} channel={channel} selected={selectedChannel?.id === channel.id}
                        onClick={() => { setSelectedChannel(channel); setMobileShowChannels(false); }} />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Channels Sidebar — desktop only */}
      <div
        className="hidden md:flex w-64 border-r border-gray-800 flex-col"
        style={{ background: "#0f0f0f" }}
      >
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <MessageCircle
              className="w-5 h-5"
              style={{ color: "#8b3dff" }}
            />
            Chat Channels
          </h2>
          <div className="mt-2">
            <CreateGroupModal
              profiles={profiles}
              currentUser={user}
              onCreated={() => queryClient.invalidateQueries({ queryKey: ["chatChannels"] })}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Training Rooms (cohort channels) */}
            {cohortChannels.length > 0 && (
              <div className="mb-3">
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                  🏟 Training Rooms
                </p>
                {cohortChannels.map((channel) => (
                  <ChannelButton key={channel.id} channel={channel} selected={selectedChannel?.id === channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    accentColor={COHORT_COLORS[channel.cohort_filter] || "#8b3dff"}
                    isCohort
                  />
                ))}
              </div>
            )}

            {/* Regular channels */}
            {regularChannels.length > 0 && (
              <div>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                  # Channels
                </p>
                {regularChannels.map((channel) => (
                  <ChannelButton key={channel.id} channel={channel} selected={selectedChannel?.id === channel.id}
                    onClick={() => setSelectedChannel(channel)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Channel Header */}
        <div
          className="p-4 border-b border-gray-800"
          style={{ background: "#0f0f0f" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="md:hidden p-1 text-gray-400" onClick={() => setMobileShowChannels(true)}>
                <Hash className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  {selectedChannel?.channel_type === "group"
                    ? <span className="text-xl">{selectedChannel?.icon || "👥"}</span>
                    : selectedChannel?.channel_type === "cohort"
                    ? <span className="text-xl">{selectedChannel?.icon || "🏟"}</span>
                    : <Hash className="w-5 h-5" style={{ color: "#8b3dff" }} />}
                  {selectedChannel?.display_name}
                  {selectedChannel?.channel_type === "cohort" && selectedChannel?.cohort_filter && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: `${COHORT_COLORS[selectedChannel.cohort_filter] || "#8b3dff"}25`,
                               color: COHORT_COLORS[selectedChannel.cohort_filter] || "#8b3dff" }}>
                      {selectedChannel.cohort_filter}
                    </span>
                  )}
                </h3>
                {selectedChannel?.description && (
                  <p className="text-sm text-gray-400 mt-1">{selectedChannel.description}</p>
                )}
              </div>
            </div>
            {selectedChannel?.channel_type === "group" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Pinned Messages */}
        <PinnedMessages
          messages={messages}
          pinnedIds={selectedChannel?.pinned_messages}
          profiles={profiles}
          currentUser={user}
          isAdmin={isChannelAdmin}
          onUnpin={pinMessage}
          onJumpToMessage={jumpToMessage}
        />

        {/* Pull-to-refresh indicator */}
        <div className="ptr-indicator" style={{ height: pullDistance > 0 ? pullDistance / 2 : 0 }}>
          {isRefreshing
            ? <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            : pullDistance > 40 && <div className="text-xs text-gray-500">Release to refresh</div>}
        </div>
        {/* Messages */}
         <ScrollArea className="flex-1 min-h-0 p-4">
           <div className="space-y-4 max-w-4xl">
            {messages.map((msg) => (
              <div
                key={msg.id}
                ref={(el) => (messageRefs.current[msg.id] = el)}
                className="flex gap-3 transition-colors duration-500 rounded-lg p-1 -m-1 group"
              >
                <AvatarWithPresence
                  name={getUserName(msg.author_id)}
                  status={getStatus(msg.author_id)}
                  size="md"
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-white">
                      {getUserName(msg.author_id)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_date).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-gray-300 whitespace-pre-wrap flex-1">
                      {msg.content}
                    </p>
                    {isChannelAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => pinMessage(msg.id)}
                        title={selectedChannel?.pinned_messages?.includes(msg.id) ? "Unpin" : "Pin"}
                      >
                        <Pin
                          className={`w-3 h-3 ${
                            selectedChannel?.pinned_messages?.includes(msg.id)
                              ? "text-yellow-500"
                              : "text-gray-500"
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                  {msg.attachments?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded border border-gray-700 hover:border-purple-500 transition-colors"
                          style={{ background: "#0a0a0a" }}
                        >
                          <Upload
                            className="w-4 h-4"
                            style={{ color: "#8b3dff" }}
                          />
                          <span className="text-sm text-gray-300">
                            {att.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-2">
              <TypingIndicator users={typingUsers} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div
          className="p-3 pb-20 md:pb-3 border-t border-gray-800 flex-shrink-0"
          style={{ background: "#0f0f0f" }}
        >
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1 rounded border border-gray-700"
                  style={{ background: "#0a0a0a" }}
                >
                  <span className="text-xs text-gray-300">
                    {att.name}
                  </span>
                  <button
                    onClick={() =>
                      setAttachments((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    <X className="w-3 h-3 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) =>
                e.target.files[0] && handleFileUpload(e.target.files[0])
              }
            />
            <label htmlFor="file-upload">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={uploadingFile || !canPost}
                style={{
                  borderColor: "#8b3dff",
                  color: "#8b3dff",
                }}
                onClick={() =>
                  document.getElementById("file-upload").click()
                }
              >
                {uploadingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
            </label>
            <Input
              value={message}
              onChange={handleInputChange}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              placeholder={
                canPost
                  ? "Type a message... (use @username to mention)"
                  : "Read-only channel"
              }
              disabled={!canPost}
              className="flex-1 bg-gray-900 border-gray-700 text-white"
            />
            <Button
              onClick={handleSend}
              disabled={
                (!message.trim() && attachments.length === 0) || !canPost
              }
              style={{ background: "#8b3dff" }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Channel Settings Modal */}
      {selectedChannel?.channel_type === "group" && (
        <ChannelSettingsModal
          channel={selectedChannel}
          profiles={profiles}
          currentUser={user}
          open={showSettings}
          onOpenChange={setShowSettings}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ["chatChannels"] })}
          onDeleted={() => {
            setSelectedChannel(null);
            queryClient.invalidateQueries({ queryKey: ["chatChannels"] });
          }}
        />
      )}
    </div>
  );
}