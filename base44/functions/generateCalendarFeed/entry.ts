import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TIER_TO_LEVEL: Record<string, string> = {
  T1: 'fundamentals',
  T2: 'intermediate',
  T3: 'advanced',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let userId = url.searchParams.get('user_id') || url.searchParams.get('userId');

    // Also accept user_id from POST body (SDK invoke / download)
    if (!userId && (req.method === 'POST' || req.method === 'PUT')) {
      try {
        const body = await req.json();
        userId = body?.user_id || body?.userId || null;
      } catch (_) { /* no body */ }
    }

    // Determine user's tier/role for relevance filtering
    let userTier: string | null = null;
    let isStaff = false;
    if (userId) {
      try {
        const profiles: any = await base44.asServiceRole.entities.UserProfile.filter({ auth_user_id: userId });
        const list = Array.isArray(profiles) ? profiles : profiles?.items || [];
        const profile = list[0];
        if (profile) {
          userTier = profile.tier;
          isStaff = profile.role === 'coach' || profile.role === 'admin';
        }
      } catch (_) { /* ignore — fall back to all events */ }
    }

    // Fetch events (newest first so upcoming events are always included)
    const allEvents: any = await base44.asServiceRole.entities.Event.list('-event_date', 500);
    const eventList = Array.isArray(allEvents) ? allEvents : allEvents?.items || [];

    // Filter to upcoming, non-cancelled events
    const todayStr = new Date().toISOString().split('T')[0];
    let relevant = eventList.filter((e: any) => {
      if (!e.event_date) return false;
      if (e.event_date < todayStr) return false;
      if (e.status === 'cancelled') return false;
      return true;
    });

    // Trainee filtering: show only relevant events (coaches/admins see all)
    if (!isStaff && userTier) {
      relevant = relevant.filter((e: any) => {
        if (['show', 'showcase', 'conditioning'].includes(e.event_type)) return true;
        if (Array.isArray(e.participants) && e.participants.includes(userId)) return true;
        const levels: string[] = Array.isArray(e.session_levels) ? e.session_levels : [];
        if (levels.length > 0) {
          const userLevel = TIER_TO_LEVEL[userTier];
          if (userLevel && levels.includes(userLevel)) return true;
          if (levels.includes('all')) return true;
        }
        return false;
      });
    }

    const ics = buildICS(relevant);

    // GET (calendar apps) → raw text/calendar; POST (SDK/download) → JSON
    if (req.method === 'GET') {
      return new Response(ics, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="pcw-schedule.ics"',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    return Response.json({ ics, count: relevant.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildICS(events: any[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PCW Performance Center//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:PCW Performance Center',
    'X-WR-TIMEZONE:America/New_York',
  ];

  const sorted = [...events].sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''));

  for (const e of sorted) {
    if (!e.event_date) continue;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:pcw-event-${e.id}@pcwperformance.center`);
    lines.push(`DTSTAMP:${icsStamp(new Date())}`);

    const dateStr = e.event_date.replace(/-/g, '');
    if (e.event_time) {
      const t = e.event_time.replace(':', '');
      lines.push(`DTSTART:${dateStr}T${t}00`);
      if (e.event_end_time) {
        lines.push(`DTEND:${dateStr}T${e.event_end_time.replace(':', '')}00`);
      } else {
        lines.push(`DTEND:${dateStr}T${addHoursToTime(e.event_time, 2).replace(':', '')}00`);
      }
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
      lines.push(`DTEND;VALUE=DATE:${nextDateStr(e.event_date)}`);
    }

    const typeLabel: Record<string, string> = { training: 'Training', show: 'Show', showcase: 'Showcase', conditioning: 'Conditioning' };
    const label = typeLabel[e.event_type];
    const name = e.event_name || 'PCW Event';
    lines.push(`SUMMARY:${escICS(label ? `[${label}] ${name}` : name)}`);
    if (e.location) lines.push(`LOCATION:${escICS(e.location)}`);

    const descParts: string[] = [];
    if (e.description) descParts.push(e.description);
    if (e.status === 'in_progress') descParts.push('Status: In Progress');
    if (Array.isArray(e.participants) && e.participants.length > 0) descParts.push(`Participants: ${e.participants.length}`);
    if (descParts.length > 0) lines.push(`DESCRIPTION:${escICS(descParts.join('\n'))}`);

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escICS(text: any): string {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function icsStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function nextDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}`;
}

function addHoursToTime(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h + hours;
  const nh = String(((total % 24) + 24) % 24).padStart(2, '0');
  const nm = String(m || 0).padStart(2, '0');
  return `${nh}:${nm}`;
}