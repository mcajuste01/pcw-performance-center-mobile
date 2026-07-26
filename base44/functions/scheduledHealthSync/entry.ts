import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole.entities;

    // Find all connected wearable connections
    const connections = toArray(
      await svc.WearableConnection.filter({ status: "connected" })
    );

    const now = Date.now();
    const tenMinAgo = now - 10 * 60 * 1000;
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    let remindersSent = 0;
    let freshCount = 0;

    for (const conn of connections) {
      // Skip if data is fresh (synced within last 10 min)
      const lastSynced = conn.last_synced_at
        ? new Date(conn.last_synced_at).getTime()
        : 0;
      if (lastSynced > tenMinAgo) {
        freshCount++;
        continue;
      }

      // Avoid spam: skip if we already sent a health-sync reminder in the last 2 hours
      const recentNotifs = toArray(
        await svc.Notification.filter(
          { user_id: conn.trainee_id, type: "announcement" },
          "-created_date",
          5
        )
      );

      const hasRecentReminder = recentNotifs.some((n) => {
        if (!n.title || !n.title.includes("Health Sync")) return false;
        const notifTime = new Date(n.created_date).getTime();
        return notifTime > twoHoursAgo;
      });

      if (hasRecentReminder) continue;

      // Send in-app reminder notification
      await svc.Notification.create({
        user_id: conn.trainee_id,
        type: "announcement",
        title: "Health Sync Needed 📊",
        message:
          "Your health data hasn't synced recently. Open the Performance Lab to update your readiness metrics.",
        action_url: "/PerformanceLab",
      });
      remindersSent++;
    }

    return Response.json({
      success: true,
      connectionsChecked: connections.length,
      freshConnections: freshCount,
      remindersSent,
    });
  } catch (error) {
    console.error("scheduledHealthSync error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});