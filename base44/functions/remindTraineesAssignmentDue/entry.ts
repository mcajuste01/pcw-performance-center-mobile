import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow scheduled (unauthenticated) calls via a shared secret
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret') || req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');

  // If a secret is configured, verify it; otherwise allow (for initial setup)
  if (expectedSecret && secret !== expectedSecret) {
    // Also allow admin users to trigger manually
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = new Date();

  // Window: assignments due between now+23h and now+25h (2-hour window around 24h mark)
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const windowStartDate = windowStart.toISOString().split('T')[0];
  const windowEndDate = windowEnd.toISOString().split('T')[0];

  // Fetch all assignments that have a due_date within the 24h window
  const allAssignments = await base44.asServiceRole.entities.Assignment.list('-created_date', 500);
  const assignments = Array.isArray(allAssignments) ? allAssignments : (allAssignments?.items || []);

  const dueAssignments = assignments.filter(a => {
    if (!a.due_date) return false;
    return a.due_date >= windowStartDate && a.due_date <= windowEndDate;
  });

  if (dueAssignments.length === 0) {
    return Response.json({ message: 'No assignments due in 24 hours.', sent: 0 });
  }

  // Fetch all submissions to check which trainees have already submitted
  const allSubmissions = await base44.asServiceRole.entities.AssignmentSubmission.list('-created_date', 2000);
  const submissions = Array.isArray(allSubmissions) ? allSubmissions : (allSubmissions?.items || []);

  // Fetch all user profiles for trainee emails
  const allProfiles = await base44.asServiceRole.entities.UserProfile.list('full_name', 1000);
  const profiles = Array.isArray(allProfiles) ? allProfiles : (allProfiles?.items || []);

  // Fetch all auth users for emails
  const allUsers = await base44.asServiceRole.entities.User.list('full_name', 1000);
  const users = Array.isArray(allUsers) ? allUsers : (allUsers?.items || []);

  const getUserEmail = (authUserId) => {
    const u = users.find(u => u.id === authUserId);
    return u?.email || null;
  };

  const getUserName = (authUserId) => {
    const p = profiles.find(p => p.auth_user_id === authUserId);
    return p?.wrestling_name || p?.full_name || 'Wrestler';
  };

  // Get list of trainees who should receive each assignment
  const traineeProfiles = profiles.filter(p => p.role === 'trainee');

  let sentCount = 0;
  const errors = [];

  for (const assignment of dueAssignments) {
    // Determine which trainees this assignment targets
    let targetTrainees = [];

    if (assignment.trainee_id) {
      // Individual assignment
      const profile = profiles.find(p => p.auth_user_id === assignment.trainee_id);
      if (profile) targetTrainees = [profile];
    } else {
      // Tier-wide or all assignment
      targetTrainees = traineeProfiles.filter(p => {
        if (assignment.tier === 'All') return true;
        return p.tier === assignment.tier;
      });
    }

    for (const trainee of targetTrainees) {
      // Check if this trainee has already submitted
      const hasSubmitted = submissions.some(s =>
        s.assignment_id === assignment.id &&
        s.trainee_id === trainee.auth_user_id &&
        s.submission_status === 'submitted'
      );

      if (hasSubmitted) continue;

      const email = getUserEmail(trainee.auth_user_id);
      if (!email) continue;

      const name = getUserName(trainee.auth_user_id);
      const dueDate = new Date(assignment.due_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      const typeLabel = (assignment.assignment_type || 'assignment').replace(/_/g, ' ');

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `⏰ Reminder: "${assignment.title}" is due tomorrow`,
          body: `
Hi ${name},

This is a friendly reminder that your assignment is due in approximately 24 hours and has not yet been submitted.

📋 Assignment: ${assignment.title}
📅 Due: ${dueDate}
🏷️ Type: ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}

${assignment.description ? `Details:\n${assignment.description}\n` : ''}
Please log in to the PCW app to submit your work before the deadline.

Keep grinding,
PCW Coaching Staff
          `.trim()
        });
        sentCount++;
      } catch (err) {
        errors.push({ trainee: email, assignment: assignment.title, error: err.message });
      }
    }
  }

  return Response.json({
    message: `Reminder emails sent.`,
    sent: sentCount,
    dueAssignmentsChecked: dueAssignments.length,
    errors: errors.length > 0 ? errors : undefined
  });
});