import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users
    const users = await base44.asServiceRole.entities.UserProfile.list('full_name', 1000);
    const userList = Array.isArray(users) ? users : users?.items || [];

    // Get today's events
    const today = new Date().toISOString().split('T')[0];
    const events = await base44.asServiceRole.entities.Event.filter(
      { event_date: today, status: 'upcoming' },
      'event_time'
    );
    const eventList = Array.isArray(events) ? events : events?.items || [];

    // Send reminders to trainees with events today
    const notificationPromises = [];

    for (const user of userList) {
      if (user.role === 'trainee' || user.role === 'admin') {
        // Check if user has events today
        const userEvents = eventList.filter((ev) => {
          if (!ev.participants) return false;
          return ev.participants.includes(user.auth_user_id);
        });

        if (userEvents.length > 0) {
          const eventNames = userEvents.map((e) => e.event_name).join(', ');
          const pushPayload = {
            title: 'Training Reminder 🔥',
            body: `Don't forget: ${eventNames} is today!`,
            tag: `workout-${today}`,
            type: 'workout_reminder',
            actionUrl: '/Events',
            requireInteraction: false,
          };

          notificationPromises.push(
            base44.asServiceRole.entities.Notification.create({
              user_id: user.auth_user_id,
              type: 'announcement',
              title: pushPayload.title,
              message: pushPayload.body,
              action_url: pushPayload.actionUrl,
            })
          );
        }
      }
    }

    await Promise.all(notificationPromises);

    return Response.json({
      success: true,
      notificationsSent: notificationPromises.length,
    });
  } catch (error) {
    console.error('Daily reminder error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});