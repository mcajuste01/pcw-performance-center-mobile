"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// Shared presence state across tabs
const PRESENCE_CHANNEL = "pcw_presence";
const CHAT_CHANNEL = "pcw_chat_realtime";
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const PRESENCE_TIMEOUT = 60000; // 60 seconds - consider offline after this

// Global presence store (singleton pattern for cross-component state)
let globalPresenceMap = {};
let presenceListeners = new Set();

const notifyListeners = () => {
  presenceListeners.forEach(listener => listener({ ...globalPresenceMap }));
};

export function usePresence({ userId, userName, initialStatus = "online" }) {
  const [presenceMap, setPresenceMap] = useState(globalPresenceMap);
  const [myStatus, setMyStatus] = useState(initialStatus);
  const heartbeatRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to presence updates
    const listener = (newMap) => setPresenceMap(newMap);
    presenceListeners.add(listener);

    // Create broadcast channel for cross-tab communication
    channelRef.current = new BroadcastChannel(PRESENCE_CHANNEL);

    // Handle incoming presence updates
    channelRef.current.onmessage = (event) => {
      const data = event.data;

      if (data.type === "presence_update") {
        globalPresenceMap[data.userId] = {
          status: data.status,
          lastSeen: Date.now(),
          userName: data.userName,
        };
        notifyListeners();
      }

      if (data.type === "presence_request") {
        // Respond with our own presence
        broadcastPresence(userId, myStatus, userName);
      }
    };

    // Broadcast our presence initially
    broadcastPresence(userId, myStatus, userName);

    // Request presence from other tabs/users
    channelRef.current.postMessage({ type: "presence_request", userId });

    // Set up heartbeat
    heartbeatRef.current = setInterval(() => {
      broadcastPresence(userId, myStatus, userName);
      cleanupStalePresence();
    }, HEARTBEAT_INTERVAL);

    // Cleanup on unmount
    return () => {
      presenceListeners.delete(listener);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (channelRef.current) {
        // Broadcast offline status before closing
        channelRef.current.postMessage({
          type: "presence_update",
          userId,
          status: "offline",
          userName,
        });
        channelRef.current.close();
      }
    };
  }, [userId, myStatus, userName]);

  const broadcastPresence = (uid, status, name) => {
    if (!channelRef.current) return;
    channelRef.current.postMessage({
      type: "presence_update",
      userId: uid,
      status,
      userName: name,
    });
    globalPresenceMap[uid] = {
      status,
      lastSeen: Date.now(),
      userName: name,
    };
    notifyListeners();
  };

  const cleanupStalePresence = () => {
    const now = Date.now();
    let changed = false;
    Object.keys(globalPresenceMap).forEach(uid => {
      if (now - globalPresenceMap[uid].lastSeen > PRESENCE_TIMEOUT) {
        globalPresenceMap[uid].status = "offline";
        changed = true;
      }
    });
    if (changed) notifyListeners();
  };

  const updateStatus = useCallback((newStatus) => {
    setMyStatus(newStatus);
    if (userId) {
      broadcastPresence(userId, newStatus, userName);
    }
  }, [userId, userName]);

  const getStatus = useCallback((uid) => {
    return presenceMap[uid]?.status || "offline";
  }, [presenceMap]);

  const isOnline = useCallback((uid) => {
    const status = presenceMap[uid]?.status;
    return status === "online" || status === "away";
  }, [presenceMap]);

  return {
    presenceMap,
    myStatus,
    updateStatus,
    getStatus,
    isOnline,
  };
}

// Hook for typing indicators and real-time chat events
export function useChatRealtime({ userId, channelId, onNewMessage, onTyping }) {
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRefs = useRef({});
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    channelRef.current = new BroadcastChannel(CHAT_CHANNEL);

    channelRef.current.onmessage = (event) => {
      const data = event.data;

      // Typing indicator
      if (data.type === "typing" && data.userId !== userId) {
        if (!channelId || data.channelId === channelId) {
          setTypingUsers(prev => ({
            ...prev,
            [data.userId]: { name: data.userName, channelId: data.channelId },
          }));

          // Clear typing after 3 seconds
          if (typingTimeoutRefs.current[data.userId]) {
            clearTimeout(typingTimeoutRefs.current[data.userId]);
          }
          typingTimeoutRefs.current[data.userId] = setTimeout(() => {
            setTypingUsers(prev => {
              const next = { ...prev };
              delete next[data.userId];
              return next;
            });
          }, 3000);

          onTyping?.(data);
        }
      }

      // New message notification
      if (data.type === "new_message" && data.userId !== userId) {
        if (!channelId || data.channelId === channelId) {
          onNewMessage?.(data);
        }
      }

      // Message read receipt
      if (data.type === "message_read" && data.userId !== userId) {
        // Handle read receipts if needed
      }
    };

    return () => {
      Object.values(typingTimeoutRefs.current).forEach(clearTimeout);
      if (channelRef.current) channelRef.current.close();
    };
  }, [userId, channelId, onNewMessage, onTyping]);

  const sendTyping = useCallback((chId, userName) => {
    if (!channelRef.current || !userId) return;
    channelRef.current.postMessage({
      type: "typing",
      userId,
      userName,
      channelId: chId,
      timestamp: Date.now(),
    });
  }, [userId]);

  const broadcastNewMessage = useCallback((message, chId) => {
    if (!channelRef.current || !userId) return;
    channelRef.current.postMessage({
      type: "new_message",
      userId,
      channelId: chId,
      message,
      timestamp: Date.now(),
    });
  }, [userId]);

  const sendReadReceipt = useCallback((messageId, senderId) => {
    if (!channelRef.current || !userId) return;
    channelRef.current.postMessage({
      type: "message_read",
      userId,
      messageId,
      senderId,
      timestamp: Date.now(),
    });
  }, [userId]);

  // Get typing users for current channel
  const currentTypingUsers = channelId
    ? Object.entries(typingUsers)
        .filter(([_, data]) => data.channelId === channelId)
        .map(([id, data]) => ({ id, ...data }))
    : Object.entries(typingUsers).map(([id, data]) => ({ id, ...data }));

  return {
    typingUsers: currentTypingUsers,
    sendTyping,
    broadcastNewMessage,
    sendReadReceipt,
  };
}