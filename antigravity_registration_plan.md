# Task for Antigravity: All-5-Events Registration for Magnate 26-27

Paste this whole file into the agent as the task. Work in phases. Finish each phase and stop at the checkpoints marked **STOP** so I can review before you continue.

## Goal
Let people register for all 5 events directly on the website, backed by Supabase and the Next.js API routes. Today only `ideathon` and `casecom` work, through hardcoded DB constraints, a hardcoded RPC, and separate static register pages. Replace that with one config-driven system that supports team and solo registrations.

## Events and rules (final decisions)

| Event | Slug | Mode | Members | Access |
|---|---|---|---|---|
| Ideathon | `ideathon` | Team | 1-4 | Open |
| CaseCom | `casecom` | Team | 2-5 | Open |
| Fun Game | `fun-game` | Solo | 1-1 | Open |
| Boardroom | `boardroom` | Solo | 1-1 | E-Cell members of any college only |
| E-Cell Meetup | `e-cell-meetup` | Solo | 1-1 | E-Cell members of any college only |

Registration codes: `MAG-ID-0001`, `MAG-CC-0001`, `MAG-FG-0001`, `MAG-BR-0001`, `MAG-EM-0001`.

## Ground rules
- Do not break or delete existing Ideathon/CaseCom registrations. All DB changes are additive, in a new migration file.
- Do not edit unrelated pages, styling, or content. Match the existing code style and component patterns.
- Never commit secrets. Use environment variables, and add any new ones to `.env.example`.
- The Supabase service-role key is used only in server code (API routes), never in client components.
- If something in this plan conflicts with what the repo actually does, follow the repo's conventions and tell me what you changed and why.
- Ask me if a decision is not covered here. Don't guess on DB changes.

---

## Phase 0: Audit (read-only, no changes)
Read the repo and report back with:
1. Project layout (workspaces, where the Next.js app lives, router type, JS or TS).
2. Current registration flow end to end: `lib/registration-config.js`, `lib/validate-registration.js`, `app/api/register/route.js`, `app/api/export/route.js`, `components/register/*`, `app/register/*`, `lib/events.js`, `app/events/[slug]/page.js`.
3. Current `supabase/schema.sql`: tables, constraints, sequences, the `register_team` RPC, and the export views.
4. Every place that hardcodes `ideathon` or `casecom`.
5. Existing env vars, and how Supabase is called (client library, service role, RLS state).
6. Risks you see for the plan below.

**STOP.** Wait for my go-ahead.

## Phase 1: Database migration
Create `supabase/migrations/002_all_events.sql` (or the repo's migration convention). Also update `supabase/schema.sql` so it stays the full reference copy.

1. `events` table: `slug` pk, `name`, `code_prefix`, `min_members`, `max_members`, `is_open` (default true), `capacity` (nullable), `deadline` (nullable timestamptz), `requires_approval` (default false), `whatsapp_url` (nullable). Seed the 5 rows from the table above. Set `requires_approval = true` for `boardroom` and `e-cell-meetup`.
2. `registrations`: drop the hardcoded event check and add a foreign key to `events(slug)`. Add `status text not null default 'confirmed'` (allowed: `confirmed`, `pending`, `approved`, `rejected`) and `extra jsonb not null default '{}'`. `team_name` must be nullable (solo events store null).
3. `registration_members`: add `college text` and `extra jsonb default '{}'` if not present.
4. `registration_counters(event text primary key references events(slug), last_value int not null default 0)`. Increment inside the RPC with a row lock (`update ... returning`). Seed one row per event. If existing sequences already hold Ideathon/CaseCom numbers, start those counters from the current max so codes don't collide.
5. Unique indexes: `(event, lower(email))` on members, `(event, lower(team_name))` on registrations where `team_name is not null`. Before creating them, check for existing duplicates and report instead of failing.
6. RPC `register_event(p_event text, p_team_name text, p_members jsonb, p_extra jsonb)`, security definer, one transaction:
   - Load the event; reject if missing, not `is_open`, past `deadline`, or at `capacity`.
   - Check the member count against `min_members` / `max_members`.
   - Insert the registration (status `pending` if `requires_approval`, else `confirmed`) and the members.
   - Return `code`, `status`, and `registration_id`.
   - Raise clear error codes: `EVENT_CLOSED`, `EVENT_FULL`, `BAD_MEMBER_COUNT`, `DUPLICATE_EMAIL`, `DUPLICATE_TEAM`.
   - Keep `register_team` working as a thin wrapper, or migrate its callers, so nothing breaks mid-way.
7. Enable RLS on all tables with no public policies. Only the service role writes.
8. Export views: one per event (`ideathon_export`, `casecom_export`, `fun_game_export`, `boardroom_export`, `ecell_meetup_export`) plus an all-events `members_export`. For solo events show the participant name in place of team name. Boardroom and E-Cell Meetup exports include college, E-Cell name, role, proof, and status.

Give me the SQL file and a short rollback note. **STOP.** I will run it on a test Supabase project before you continue.

## Phase 2: Config and validation
1. Expand `lib/registration-config.js` with UI fields only (labels, field lists, input types, hints). Member bounds are read from the `events` table on the server, so there's one source of truth.
2. Fields per event:
   - `ideathon`: team name; each member: name, email, WhatsApp.
   - `casecom`: team name; each member: name, WhatsApp; leader email only; problem statement select (keep the existing options).
   - `fun-game`: name, email, WhatsApp, college (optional).
   - `boardroom`, `e-cell-meetup`: name, email, WhatsApp, college (required), E-Cell name (required), role in E-Cell (required: member / core team / head), proof (required: E-Cell head's contact or a verification link), why attend (optional).
3. Put validation in one shared module used by both the form and the API: email format, WhatsApp at least 10 digits, required fields, and trimmed strings. Team name is optional for solo events.

## Phase 3: API
1. `app/api/register/route.js`: accept any open event slug, validate with the shared module, call `register_event`, and map error codes to HTTP: validation 400, duplicates 409, closed or full 409/410 with a friendly message.
2. Add per-IP rate limiting and a hidden honeypot field. Keep it simple (in-memory or the repo's existing approach), and tell me the limits if serverless makes in-memory unreliable.
3. `app/api/export/route.js`: support all 5 events via a map of event to view and columns. Keep bearer-token auth, compare tokens in constant time, and never expose the token to client code.
4. Never log full request bodies with personal data.

## Phase 4: Frontend
1. New `app/register/[slug]/page.js` handles all 5 events. Unknown slugs 404. It reads config, shows the event name and a "Solo" or "Team of N" chip, and renders the form.
2. `RegisterFlow` / `TeamForm`: when `min === 1 && max === 1`, hide team name and member controls and show a single-person form. Otherwise keep the existing team form with add/remove members.
3. For the E-Cell-only events, show a clear notice: "Only for E-Cell members. Registrations are verified." After submit, say it is pending verification.
4. Success screen: registration code, status message, WhatsApp link when set, and "check your email".
5. `app/register/page.js` becomes a hub listing all 5 events with status badge (Open, Closed, E-Cell only), team-size badge, and a Register link.
6. `lib/events.js` and `app/events/[slug]/page.js`: enable registration for all 5 with `registerUrl: '/register/<slug>'`. Drive the button's enabled state from the event's open status where practical.
7. Redirect the old static Ideathon/CaseCom register routes to `/register/:slug`.
8. Reuse existing components and styles. No new UI libraries without asking me.

**STOP** after Phases 2-4 for review.

## Phase 5: Confirmation emails
1. Use Resend (or Brevo if the repo already uses it). Add `EMAIL_API_KEY` and `EMAIL_FROM` to `.env.example`.
2. One template with per-event text: event name, code, status (confirmed or pending verification), WhatsApp link if set.
3. Send after a successful registration without blocking it. If sending fails, log the error and still return success.
4. Tell me what DNS (SPF/DKIM) setup I need for the sender address.

## Phase 6: Tests and verification
Run `npm run build --workspace=frontend` and `npm run lint --workspace=frontend`, then verify each of these and report results:
- Every event registers successfully with valid data, and the code format is correct.
- Invalid email and phone under 10 digits are rejected.
- A duplicate email for the same event returns 409, and the same email works for a different event.
- Ideathon/CaseCom: duplicate team name rejected, member limits enforced.
- Boardroom and E-Cell Meetup: required E-Cell fields enforced, status saved as `pending`, form shows the E-Cell notice.
- Setting an event to closed stops both the form and the API. Reaching `capacity` returns the full message.
- Two simultaneous submissions with the same email: only one succeeds.
- Each event's export works with the bearer token and fails without it.
- Existing Ideathon/CaseCom registrations still appear in exports after the migration.

## Final report
End with a short summary: files changed, SQL to run and in what order, new env vars, anything you couldn't verify, and open items for me.

## Open items (do not block; use placeholders)
- Seat caps and deadlines per event: leave `capacity` and `deadline` null.
- WhatsApp group links per event: leave `whatsapp_url` null.
- Who approves E-Cell registrations: for now, organizers update `status` from the Supabase table or the export.
