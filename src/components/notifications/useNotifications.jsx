"use client";

import { base44 } from "@/api/base44Client";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

export async function createNotification({
  userId,
  type,
  title,
  message,
  senderId,
  channelId,
  messageId,
  threadId,
  actionUrl,
}) {
  // Check user preferences first
  const prefsRes = await base44.entities.NotificationPreferences.filter({
    user_id: userId,
  });
  const prefs = toArray(prefsRes)[0];

  // Check if notification type is enabled
  if (prefs) {
    const typeKey = type.replace("-", "_");
    if (prefs[typeKey] === false) {
      return null; // User disabled this notification type
    }

    // Check if channel is muted
    if (channelId && prefs.muted_channels?.includes(channelId)) {
      return null; // Channel is muted
    }
  }

  // Create the notification
  return base44.entities.Notification.create({
    user_id: userId,
    type,
    title,
    message,
    sender_id: senderId,
    channel_id: channelId,
    message_id: messageId,
    thread_id: threadId,
    action_url: actionUrl,
    read: false,
  });
}

export async function notifyDirectMessage({ senderId, recipientId, senderName, messagePreview }) {
  return createNotification({
    userId: recipientId,
    type: "direct_message",
    title: `New message from ${senderName}`,
    message: messagePreview.substring(0, 100),
    senderId,
    actionUrl: "/DirectMessages",
  });
}

export async function notifyGroupMessage({
  senderId,
  channelId,
  channelName,
  senderName,
  messagePreview,
  memberIds,
}) {
  const notifications = memberIds
    .filter((id) => id !== senderId)
    .map((userId) =>
      createNotification({
        userId,
        type: "group_message",
        title: `New message in ${channelName}`,
        message: `${senderName}: ${messagePreview.substring(0, 80)}`,
        senderId,
        channelId,
        actionUrl: "/Chat",
      })
    );

  return Promise.all(notifications);
}

export async function notifyMention({
  senderId,
  mentionedUserId,
  senderName,
  channelName,
  messagePreview,
  channelId,
}) {
  return createNotification({
    userId: mentionedUserId,
    type: "mention",
    title: `${senderName} mentioned you`,
    message: `in ${channelName}: ${messagePreview.substring(0, 80)}`,
    senderId,
    channelId,
    actionUrl: channelId ? "/Chat" : "/DirectMessages",
  });
}

export async function notifyMessageRequest({ senderId, recipientId, senderName }) {
  return createNotification({
    userId: recipientId,
    type: "message_request",
    title: "New message request",
    message: `${senderName} wants to message you`,
    senderId,
    actionUrl: "/DirectMessages",
  });
}

export async function notifyAnnouncement({
  senderId,
  channelId,
  channelName,
  messagePreview,
  memberIds,
}) {
  const notifications = memberIds
    .filter((id) => id !== senderId)
    .map((userId) =>
      createNotification({
        userId,
        type: "announcement",
        title: `📢 Announcement in ${channelName}`,
        message: messagePreview.substring(0, 100),
        senderId,
        channelId,
        actionUrl: "/Chat",
      })
    );

  return Promise.all(notifications);
}

export async function notifyPinnedMessage({
  senderId,
  channelId,
  channelName,
  messagePreview,
  memberIds,
}) {
  const notifications = memberIds
    .filter((id) => id !== senderId)
    .map((userId) =>
      createNotification({
        userId,
        type: "pinned_message",
        title: `📌 Message pinned in ${channelName}`,
        message: messagePreview.substring(0, 100),
        senderId,
        channelId,
        actionUrl: "/Chat",
      })
    );

  return Promise.all(notifications);
}