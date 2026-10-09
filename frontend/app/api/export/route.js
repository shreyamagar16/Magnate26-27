/**
 * GET /api/export?event=ideathon  (or event=casecom)
 *
 * Protected server-side CSV export.  Never call this from client-side code.
 *
 * Authentication:
 *   Pass the EXPORT_SECRET value in the Authorization header:
 *     Authorization: Bearer <your-EXPORT_SECRET-value>
 *
 * Usage examples (replace TOKEN and HOST):
 *   curl -H "Authorization: Bearer TOKEN" https://HOST/api/export?event=ideathon -o ideathon.csv
 *   curl -H "Authorization: Bearer TOKEN" https://HOST/api/export?event=casecom  -o casecom.csv
 *
 * Required environment variables (server-side only, never NEXT_PUBLIC_):
 *   EXPORT_SECRET   — a strong random string you generate; protects this endpoint
 *   SUPABASE_URL    — your Supabase project URL
 *   SUPABASE_SECRET_KEY — your Supabase service-role key
 *
 * The route queries the `ideathon_export` or `casecom_export` views defined in
 * supabase/schema.sql.  Those views include every member's name, email, and
 * WhatsApp for all member positions.
 *
 * Security notes:
 *   · This endpoint is not linked from any UI page.
 *   · EXPORT_SECRET is never returned in any response body.
 *   · Supabase errors are logged server-side only; clients receive a generic message.
 *   · RLS on the underlying tables means even a leaked anon key cannot read data.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server.js';

// Supported events and their corresponding Supabase export view names.
const EXPORT_VIEWS = {
  ideathon: 'ideathon_export',
  casecom:  'casecom_export',
};

// CSV column definitions per view.
// Columns must exactly match the view column names in schema.sql.
const IDEATHON_COLUMNS = [
  { header: 'Registration ID',    key: 'reg_code'          },
  { header: 'Team Name',          key: 'team_name'         },
  { header: 'Member Count',       key: 'member_count'      },
  { header: 'Registered At',      key: 'created_at'        },
  { header: 'Leader Name',        key: 'leader_name'       },
  { header: 'Leader Email',       key: 'leader_email'      },
  { header: 'Leader WhatsApp',    key: 'leader_whatsapp'   },
  { header: 'Member 2 Name',      key: 'member2_name'      },
  { header: 'Member 2 Email',     key: 'member2_email'     },
  { header: 'Member 2 WhatsApp',  key: 'member2_whatsapp'  },
  { header: 'Member 3 Name',      key: 'member3_name'      },
  { header: 'Member 3 Email',     key: 'member3_email'     },
  { header: 'Member 3 WhatsApp',  key: 'member3_whatsapp'  },
  { header: 'Member 4 Name',      key: 'member4_name'      },
  { header: 'Member 4 Email',     key: 'member4_email'     },
  { header: 'Member 4 WhatsApp',  key: 'member4_whatsapp'  },
];

const CASECOM_COLUMNS = [
  { header: 'Registration ID',    key: 'reg_code'          },
  { header: 'Team Name',          key: 'team_name'         },
  { header: 'Member Count',       key: 'member_count'      },
  { header: 'Problem Statement',  key: 'team_extra'        }, // JSON: { problem_statement: "..." }
  { header: 'Registered At',      key: 'created_at'        },
  { header: 'Leader Name',        key: 'leader_name'       },
  { header: 'Leader Email',       key: 'leader_email'      },
  { header: 'Leader WhatsApp',    key: 'leader_whatsapp'   },
  { header: 'Member 2 Name',      key: 'member2_name'      },
  { header: 'Member 2 WhatsApp',  key: 'member2_whatsapp'  },
  { header: 'Member 3 Name',      key: 'member3_name'      },
  { header: 'Member 3 WhatsApp',  key: 'member3_whatsapp'  },
  { header: 'Member 4 Name',      key: 'member4_name'      },
  { header: 'Member 4 WhatsApp',  key: 'member4_whatsapp'  },
  { header: 'Member 5 Name',      key: 'member5_name'      },
  { header: 'Member 5 WhatsApp',  key: 'member5_whatsapp'  },
];

const COLUMNS_BY_EVENT = {
  ideathon: IDEATHON_COLUMNS,
  casecom:  CASECOM_COLUMNS,
};

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

/** Escape a single cell value per RFC 4180. */
function csvCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Wrap in double-quotes if the value contains commas, quotes, or newlines.
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** Convert an array of row objects to a CSV string. */
function buildCsv(columns, rows) {
  const header = columns.map((c) => csvCell(c.header)).join(',');
  const lines  = rows.map((row) =>
    columns.map((c) => csvCell(row[c.key])).join(',')
  );
  return [header, ...lines].join('\r\n');
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request) {
  // ── 1. Authenticate ────────────────────────────────────────────────────────
  const exportSecret = process.env.EXPORT_SECRET ?? '';
  if (!exportSecret) {
    // Misconfigured server — fail closed.
    console.error('[export] EXPORT_SECRET environment variable is not set.');
    return NextResponse.json(
      { ok: false, error: 'Export is not configured on this server.' },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const provided   = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';

  // Constant-time comparison to prevent timing attacks.
  if (!provided || provided.length !== exportSecret.length ||
      !timingSafeEqual(provided, exportSecret)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized.' },
      { status: 401 }
    );
  }

  // ── 2. Validate event parameter ─────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const event = (searchParams.get('event') ?? '').toLowerCase().trim();

  if (!EXPORT_VIEWS[event]) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unknown event. Supported values: ${Object.keys(EXPORT_VIEWS).join(', ')}.`,
      },
      { status: 400 }
    );
  }

  const viewName = EXPORT_VIEWS[event];
  const columns  = COLUMNS_BY_EVENT[event];

  // ── 3. Query the export view ────────────────────────────────────────────────
  let rows;
  try {
    const { data, error } = await supabase
      .from(viewName)
      .select('*');

    if (error) {
      console.error('[export] Supabase error querying', viewName, error.code, error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to retrieve registrations. Please try again.' },
        { status: 502 }
      );
    }

    rows = data ?? [];
  } catch (err) {
    console.error('[export] Network error querying', viewName, err?.message);
    return NextResponse.json(
      { ok: false, error: 'Network error connecting to the database.' },
      { status: 502 }
    );
  }

  // ── 4. Build and return CSV ─────────────────────────────────────────────────
  const csv      = buildCsv(columns, rows);
  const filename = `magnate-${event}-registrations-${datestamp()}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Very simple constant-time string comparison (no crypto dependency needed). */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Returns YYYYMMDD string in local server time for the filename. */
function datestamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
