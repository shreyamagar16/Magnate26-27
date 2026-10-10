/**
 * POST /api/register
 * Node.js runtime, no caching.
 * Validates input via lib/validate-registration.js, then calls the
 * register_team() Postgres function via the service-role Supabase client.
 */


import { NextResponse } from 'next/server';
import { validateRegistration } from '@/lib/validate-registration.js';
import { supabase } from '@/lib/supabase-server.js';

// 20 KB body limit (raw text)
const MAX_BODY_BYTES = 20 * 1024;

export async function POST(request) {
  // --- Body size guard ---
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'Request body too large.' },
      { status: 400 }
    );
  }

  // --- Parse JSON ---
  let body;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'Request body too large.' },
        { status: 400 }
      );
    }
    if (!text.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Empty request body.' },
        { status: 400 }
      );
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON.' },
      { status: 400 }
    );
  }

  // --- Honeypot: non-empty website field -> silent fake success ---
  if (body.website && String(body.website).trim() !== '') {
    return NextResponse.json(
      { ok: true, registrationId: 'MAG-XX-0000' },
      { status: 201 }
    );
  }

  // --- Validate ---
  const { ok, values, errors } = validateRegistration(body);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: 'Please fix the highlighted fields.', fields: errors },
      { status: 400 }
    );
  }

  // --- Call DB function ---
  const { event, teamName, extra, members } = values;

  // Shape members for the DB function: { name, email, whatsapp, extra }
  // For CaseCom, only the Team Leader (index 0) provides an email.
  // Non-leader members get a unique synthetic placeholder so the DB NOT NULL / length
  // constraint (char_length between 5 and 254) is satisfied.  The placeholder passes
  // the DB basic-format regex ([^@\s]+@[^@\s]+\.[^@\s]+) and has a random suffix so
  // it does not collide with the (event, lower(email)) unique index.
  const p_members = members.map((m, i) => {
    let email = m.email ?? '';
    if (event === 'casecom' && i > 0 && !email) {
      const rand = Math.random().toString(36).slice(2, 10);
      email = `cc-p${i + 1}-${Date.now()}-${rand}@casecom.internal`;
    }
    return {
      name: m.name,
      email,
      whatsapp: m.whatsapp,
      extra: m.extra ?? {},
    };
  });

  let result, dbError;
  try {
    const response = await supabase.rpc('register_team', {
      p_event: event,
      p_team_name: teamName,
      p_extra: extra ?? {},
      p_members,
    });
    result = response.data;
    dbError = response.error;
  } catch (err) {
    console.error('[register] unexpected JS error calling register_team:', err?.message ?? err);
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }

  if (dbError) {
    const code    = dbError.code    ?? '';
    const message = dbError.message ?? '';
    const details = dbError.details ?? '';

    // Log the full DB error for server-side diagnosis (never sent to client)
    console.error('[register] db error code=' + code + ' message=' + message);

    if (code === '23505') {
      // Unique violation — decide which constraint was hit by constraint name in message
      if (message.includes('registrations_team_unique')) {
        return NextResponse.json(
          {
            ok: false,
            error: 'This team name is already taken for this event.',
            fields: {
              teamName: 'This team name is already taken. Please choose another.',
            },
          },
          { status: 409 }
        );
      }

      if (message.includes('registration_members_email_unique')) {
        // Try to identify which member's email caused the conflict.
        // Supabase details typically contains the conflicting key value, e.g.:
        //   Key (event, lower(email))=(ideathon, alice@example.com) already exists.
        const emailMatch = details.match(/,\s*([^@\s,)]+@[^@\s,)]+)\)/);
        const conflictingEmail = emailMatch ? emailMatch[1].toLowerCase() : null;
        let fieldKey = 'members.0.email'; // fallback
        if (conflictingEmail) {
          const idx = p_members.findIndex(
            (m) => (m.email ?? '').toLowerCase() === conflictingEmail
          );
          if (idx !== -1) fieldKey = `members.${idx}.email`;
        }
        const emailError = 'This email is already registered for this event.';
        return NextResponse.json(
          { ok: false, error: emailError, fields: { [fieldKey]: emailError } },
          { status: 409 }
        );
      }

      // Unknown unique violation
      return NextResponse.json(
        { ok: false, error: 'A duplicate entry was detected. Please check your details.' },
        { status: 409 }
      );
    }

    // PGRST202 = RPC function not found (schema not yet applied to Supabase)
    // 42883 = PostgreSQL undefined_function
    if (code === 'PGRST202' || code === '42883') {
      console.error('[register] register_team() RPC not found — has the schema SQL been run in Supabase?');
      return NextResponse.json(
        { ok: false, error: 'Registration is not available right now. Please try again later.' },
        { status: 503 }
      );
    }

    // 22023 = raise_exception from our function (validation errors the API missed)
    if (code === '22023') {
      return NextResponse.json(
        { ok: false, error: message || 'Validation failed. Please check your details.' },
        { status: 400 }
      );
    }

    // Any other DB error
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }

  // --- Success ---
  const regCode = result?.reg_code ?? result?.registrationId ?? '';
  const already = result?.already === true;

  return NextResponse.json(
    { ok: true, registrationId: regCode, alreadyRegistered: already, event },
    { status: already ? 200 : 201 }
  );
}
