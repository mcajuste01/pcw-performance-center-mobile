import { createClientFromRequest } from 'npm:@base44/sdk@0.8.35';

const baseUrl = () => (Deno.env.get('OPEN_WEARABLES_BASE_URL') || '').replace(/\/$/, '');
const headers = () => ({
  Authorization: `Bearer ${Deno.env.get('OPEN_WEARABLES_API_KEY') || ''}`,
  'Content-Type': 'application/json',
});

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const caller = await base44.auth.me();
  if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body.consent) return Response.json({ error: 'Explicit coach-sharing consent is required' }, { status: 400 });
  if (!baseUrl() || !Deno.env.get('OPEN_WEARABLES_API_KEY')) return Response.json({ error: 'Wearables integration is not configured' }, { status: 503 });

  const existing = await base44.asServiceRole.entities.WearableConnection.filter({ trainee_id: caller.id });
  const connections = Array.isArray(existing) ? existing : existing?.items || [];
  let connection = connections[0];
  if (!connection?.open_wearables_user_id) {
    const create = await fetch(`${baseUrl()}/api/v1/users`, { method: 'POST', headers: headers(), body: JSON.stringify({}) });
    if (!create.ok) return Response.json({ error: 'Unable to create wearable profile' }, { status: 502 });
    const owUser = await create.json();
    connection = await base44.asServiceRole.entities.WearableConnection.create({
      trainee_id: caller.id, open_wearables_user_id: owUser.id, status: 'pending', coach_sharing_consent: true, consented_at: new Date().toISOString(), provider: body.provider,
    });
  }
  const nativeProviders = new Set(['apple', 'google']);
  if (nativeProviders.has(body.provider)) {
    // Apple Health and Android Health Connect are device-local stores, not OAuth providers.
    // The Capacitor app must request native permissions and upload a minimized, normalized payload
    // through a separate authenticated ingestion function; never open a browser OAuth URL for these.
    return Response.json({
      connection_id: connection.id,
      flow: 'native_sdk_required',
      provider: body.provider,
      message: 'Complete native HealthKit/Health Connect permission and collection in the mobile app.',
    });
  }

  const authorize = await fetch(`${baseUrl()}/api/v1/oauth/${encodeURIComponent(body.provider)}/authorize?user_id=${encodeURIComponent(connection.open_wearables_user_id)}&redirect_uri=${encodeURIComponent(body.return_url || '')}`);
  if (!authorize.ok) return Response.json({ error: 'Unable to start provider authorization' }, { status: 502 });
  const data = await authorize.json();
  return Response.json({ authorization_url: data.authorization_url, connection_id: connection.id, flow: 'oauth' });
});
