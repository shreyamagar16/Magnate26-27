/**
 * Generic registration validator.
 * Driven entirely by the field config in registration-config.js.
 * No field names are hardcoded here except the three core keys
 * (name, email, whatsapp) that correspond to real DB columns.
 */

import { getEvent } from './registration-config.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize, trim, collapse whitespace, strip formula-injection prefixes. */
function sanitizeText(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw.normalize('NFKC').trim().replace(/\s+/g, ' ');
  // Strip leading spreadsheet formula-injection characters
  s = s.replace(/^[=+\-@\t\r]+/, '');
  return s;
}

/** Simple but practical email regex (RFC-ish). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalize a WhatsApp number:
 *  - Remove spaces and dashes
 *  - Strip a leading +91 / 91 / 0  — but ONLY if 10 digits remain after stripping
 *  - Final form must match ^[0-9]{10}$
 * Returns { value, error }.
 */
function normalizeWhatsapp(raw) {
  let s = String(raw ?? '').replace(/[\s\-]/g, '');
  // Strip leading +91, 91 (2-digit country code), or leading 0
  if (/^\+91/.test(s) && /^[0-9]{10}$/.test(s.slice(3))) s = s.slice(3);
  else if (/^91/.test(s) && /^[0-9]{10}$/.test(s.slice(2))) s = s.slice(2);
  else if (/^0/.test(s) && /^[0-9]{10}$/.test(s.slice(1))) s = s.slice(1);
  if (!/^[0-9]{10}$/.test(s)) return { value: s, error: 'Enter a valid 10-digit WhatsApp number.' };
  return { value: s, error: null };
}

/**
 * Validate a single field value according to its field definition.
 * Returns { value, error }.
 */
function validateField(field, raw, isLeader) {
  // leaderOnly fields are skipped (and returned empty) for non-leaders
  if (field.leaderOnly && !isLeader) return { value: undefined, error: null };

  const { key, type, required, options } = field;

  if (type === 'tel' && key === 'whatsapp') {
    const rawStr = String(raw ?? '');
    if (!rawStr.replace(/[\s\-]/g, '')) {
      if (required) return { value: '', error: 'WhatsApp number is required.' };
      return { value: '', error: null };
    }
    return normalizeWhatsapp(rawStr);
  }

  if (type === 'email') {
    let s = sanitizeText(String(raw ?? '')).toLowerCase();
    if (!s) {
      if (required) return { value: '', error: 'Email is required.' };
      return { value: '', error: null };
    }
    if (s.length > 254) return { value: s, error: 'Email must be at most 254 characters.' };
    if (!EMAIL_RE.test(s)) return { value: s, error: 'Enter a valid email address.' };
    return { value: s, error: null };
  }

  // Reject non-string types for all remaining fields
  if (typeof raw !== 'string' && raw !== null && raw !== undefined) {
    return { value: '', error: 'Invalid value.' };
  }
  let s = sanitizeText(String(raw ?? ''));

  if (!s) {
    if (required) return { value: '', error: `${field.label} is required.` };
    return { value: '', error: null };
  }

  if (type === 'select') {
    if (!Array.isArray(options) || !options.includes(s)) {
      return { value: s, error: 'Select a valid option.' };
    }
    return { value: s, error: null };
  }

  if (type === 'url') {
    if (!/^https?:\/\//i.test(s)) return { value: s, error: 'URL must start with http:// or https://.' };
    return { value: s, error: null };
  }

  const maxLen = type === 'textarea' ? 1000 : 200;
  if (key === 'name' && (s.length < 2 || s.length > 100)) {
    return { value: s, error: 'Name must be 2–100 characters.' };
  }
  if (s.length > maxLen) {
    return { value: s, error: `Must be at most ${maxLen} characters.` };
  }

  return { value: s, error: null };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Validate a raw registration submission.
 *
 * @param {{ event:string, teamName:string, extra:object, members:object[], website:string }} input
 * @returns {{ ok:boolean, values:object|null, errors:object }}
 */
export function validateRegistration(input) {
  const errors = {};

  // --- Reject non-object inputs ---
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, values: null, errors: { _: 'Invalid request body.' } };
  }

  // --- Event ---
  const rawEvent = input.event;
  if (typeof rawEvent !== 'string') {
    errors.event = 'Registration for this event is not open yet.';
  }
  const eventCfg = getEvent(rawEvent);
  if (!eventCfg || !eventCfg.open) {
    errors.event = 'Registration for this event is not open yet.';
  }

  if (errors.event) return { ok: false, values: null, errors };

  const { minMembers, maxMembers, teamFields, memberFields } = eventCfg;

  // --- Team name ---
  let teamName = '';
  {
    const raw = input.teamName;
    if (typeof raw !== 'string') {
      errors.teamName = 'Team name is required.';
    } else {
      teamName = sanitizeText(raw);
      if (teamName.length < 2 || teamName.length > 100) {
        errors.teamName = 'Team name must be 2–100 characters.';
      }
    }
  }

  // --- Extra team fields ---
  const extraTeam = {};
  {
    const rawExtra = input.extra ?? {};
    if (typeof rawExtra !== 'object' || Array.isArray(rawExtra)) {
      errors['extra'] = 'Invalid extra data.';
    } else {
      for (const field of teamFields) {
        const raw = rawExtra[field.key];
        const { value, error } = validateField(field, raw, true);
        if (error) errors[`extra.${field.key}`] = error;
        else if (value !== undefined && value !== '') extraTeam[field.key] = value;
      }
    }
  }

  // --- Members ---
  const rawMembers = input.members;
  if (!Array.isArray(rawMembers)) {
    errors.members = 'Members must be an array.';
    return { ok: false, values: null, errors };
  }

  // Detect "empty" optional rows: a row beyond minMembers where every non-core
  // visible field is blank.
  function isRowEmpty(rawRow, index) {
    if (index === 0) return false; // leader is never dropped
    const visibleFields = memberFields.filter((f) => !(f.leaderOnly && index > 0));
    return visibleFields.every((f) => {
      const v = rawRow[f.key];
      return v === undefined || v === null || String(v).trim() === '';
    });
  }

  const validatedMembers = [];
  const seenWhatsapp = new Map(); // normalized -> submission index (1-based friendly)
  const seenEmail = new Map();

  for (let i = 0; i < rawMembers.length; i++) {
    const rawRow = rawMembers[i];
    const isLeader = i === 0;
    const isRequired = i < minMembers;

    if (!rawRow || typeof rawRow !== 'object' || Array.isArray(rawRow)) {
      errors[`members.${i}._`] = 'Invalid member entry.';
      continue;
    }

    // Drop empty optional rows
    if (!isRequired && isRowEmpty(rawRow, i)) continue;

    const memberCore = {};
    const memberExtra = {};
    let rowHasError = false;

    for (const field of memberFields) {
      const { key, core, leaderOnly } = field;
      if (leaderOnly && !isLeader) continue;

      const raw = rawRow[key];
      const { value, error } = validateField(field, raw, isLeader);

      if (error) {
        errors[`members.${i}.${key}`] = error;
        rowHasError = true;
      } else if (value !== undefined) {
        if (core) {
          memberCore[key] = value;
        } else if (value !== '') {
          memberExtra[key] = value;
        }
      }
    }

    if (!rowHasError) {
      // Intra-submission duplicate checks
      const wa = memberCore.whatsapp;
      if (wa) {
        if (seenWhatsapp.has(wa)) {
          errors[`members.${i}.whatsapp`] = 'This number is already used by another member of your team.';
          rowHasError = true;
        } else {
          seenWhatsapp.set(wa, i);
        }
      }
      const em = memberCore.email;
      if (em) {
        if (seenEmail.has(em)) {
          errors[`members.${i}.email`] = 'This email is already used by another member of your team.';
          rowHasError = true;
        } else {
          seenEmail.set(em, i);
        }
      }
    }

    if (!rowHasError) {
      validatedMembers.push({
        name: memberCore.name,
        email: memberCore.email,
        whatsapp: memberCore.whatsapp,
        extra: memberExtra,
      });
    }
  }

  // --- Member count after dropping empty rows ---
  if (validatedMembers.length < minMembers) {
    errors.members = `At least ${minMembers} member${minMembers > 1 ? 's' : ''} required.`;
  } else if (validatedMembers.length > maxMembers) {
    errors.members = `At most ${maxMembers} members allowed.`;
  }

  // --- Leader must have email (redundant guard since email is now required for all) ---
  // Kept as a final safety net in case config changes in the future.
  if (validatedMembers.length > 0 && !validatedMembers[0].email) {
    errors['members.0.email'] = errors['members.0.email'] ?? 'Leader email is required.';
  }

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    values: ok
      ? { event: rawEvent, teamName, extra: extraTeam, members: validatedMembers }
      : null,
    errors,
  };
}
