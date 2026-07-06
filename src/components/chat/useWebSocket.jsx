"use client";

import { useEffect, useState, useCallback } from "react";

export function useWebSocket({ onMessage, me }) {
  const [typingUser, setTypingUser] = useState(null);

  useEffect(() => {
    if (!me?.id) return;

    const channel = new BroadcastChannel("pcw_dm_socket");

    channel.onmessage = (event) => {
      const data = event.data;

      if (data.type === "typing" && data.sender_id !== me.id) {
        setTypingUser({
          id: data.sender_id,
          name: data.name,
        });

        setTimeout(() => setTypingUser(null), 2500);
      }

      if (data.type === "message" && onMessage) {
        onMessage(data.message);
      }

      if (data.type === "read_receipt" && onMessage) {
        onMessage({ type: "read_receipt", ...data });
      }
    };

    return () => channel.close();
  }, [me, onMessage]);

  const sendTyping = useCallback((threadId, name) => {
    if (!me?.id) return;
    
    const channel = new BroadcastChannel("pcw_dm_socket");
    channel.postMessage({
      type: "typing",
      threadId,
      sender_id: me.id,
      name,
    });
    channel.close();
  }, [me]);

  const sendReadReceipt = useCallback((messageId, senderId) => {
    if (!me?.id) return;
    
    const channel = new BroadcastChannel("pcw_dm_socket");
    channel.postMessage({
      type: "read_receipt",
      messageId,
      senderId,
      readBy: me.id,
    });
    channel.close();
  }, [me]);

  return {
    typingUser,
    sendTyping,
    sendReadReceipt,
  };
}