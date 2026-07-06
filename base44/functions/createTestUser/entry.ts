import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Generate test user email with timestamp
    const timestamp = Date.now();
    const testEmail = `testuser+${timestamp}@pcwtraining.test`;
    
    // Invite the test user as a trainee
    const result = await base44.users.inviteUser(testEmail, "trainee");

    return Response.json({
      success: true,
      email: testEmail,
      role: "trainee",
      message: "Test user invitation created! Check the email for the signup link, or use the returned invite URL.",
      inviteDetails: result
    });

  } catch (error) {
    console.error("Error creating test user:", error);
    return Response.json({ 
      error: error.message || "Failed to create test user",
      details: error.toString()
    }, { status: 500 });
  }
});