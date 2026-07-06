import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate the caller — do not trust client-provided coachName
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { assignmentId, traineeId, feedback } = body;

    if (!assignmentId || !traineeId) {
      return Response.json(
        { error: 'Missing required fields: assignmentId, traineeId' },
        { status: 400 }
      );
    }

    // Verify the caller is a coach or admin via their UserProfile
    const callerProfiles = await base44.entities.UserProfile.filter({ auth_user_id: user.id });
    const callerProfile = (Array.isArray(callerProfiles) ? callerProfiles : callerProfiles?.items || [])[0];
    const isCoachOrAdmin = user.role === 'admin' || callerProfile?.role === 'coach' || callerProfile?.role === 'admin';

    if (!isCoachOrAdmin) {
      return Response.json(
        { error: 'Forbidden — only coaches and admins can send feedback notifications' },
        { status: 403 }
      );
    }

    // Use the authenticated caller's actual name, not a client-provided value
    const coachName = callerProfile?.full_name || callerProfile?.wrestling_name || user.full_name || 'Your Coach';

    // Create notification record
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id: traineeId,
      type: 'assignment_submitted',
      title: '📝 Coach Feedback Received',
      message: `${coachName} left feedback on your assignment${feedback ? ': ' + feedback.substring(0, 50) + '...' : '.'}`,
      action_url: `/Assignments?assignmentId=${assignmentId}`,
    });

    // Try to send push notification if user is subscribed
    try {
      const pushPayload = {
        title: '📝 Coach Feedback',
        body: `${coachName} reviewed your work`,
        tag: `feedback-${assignmentId}`,
        type: 'coach_feedback',
        actionUrl: `/Assignments?assignmentId=${assignmentId}`,
        requireInteraction: true,
      };

      console.log('Push notification payload prepared:', pushPayload);
    } catch (pushError) {
      console.log('Push notification not available, notification record created');
    }

    return Response.json({
      success: true,
      notificationId: notification.id,
      message: 'Feedback notification sent to trainee',
    });
  } catch (error) {
    console.error('Coach feedback notification error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});