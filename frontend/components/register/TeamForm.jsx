'use client';

/**
 * TeamForm — config-driven registration form.
 * Field names are NEVER hardcoded except the three core keys
 * (name, email, whatsapp) when building the final payload.
 * All shape comes from REGISTRATION_EVENTS via props.
 */

import { useRef, useState, useCallback, useId } from 'react';
import { validateRegistration } from '@/lib/validate-registration.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildEmptyMember(memberFields) {
  const obj = {};
  for (const f of memberFields) obj[f.key] = '';
  return obj;
}

function buildInitialMembers(minMembers, memberFields) {
  return Array.from({ length: minMembers }, () => buildEmptyMember(memberFields));
}

/**
 * A single generic field renderer (input / select / textarea).
 * errId is the aria-describedby id for the error span.
 */
function FieldInput({ field, value, onChange, error, errId, disabled }) {
  const { key, type, required, options } = field;
  const baseClass = type === 'textarea' ? 'reg-textarea' : type === 'select' ? 'reg-select' : 'reg-input';
  const hasError = !!error;
  const commonProps = {
    id: errId + '-input',
    name: key,
    value: value ?? '',
    onChange: (e) => onChange(e.target.value),
    required: !!required,
    disabled,
    'aria-invalid': hasError ? 'true' : undefined,
    'aria-describedby': hasError ? errId : undefined,
    className: baseClass,
    autoComplete: key === 'email' ? 'email' : key === 'name' ? 'name' : 'off',
  };

  if (type === 'textarea') {
    return <textarea {...commonProps} rows={3} />;
  }
  if (type === 'select') {
    return (
      <select {...commonProps}>
        <option value="">— Select —</option>
        {(options ?? []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  // text / email / tel / url
  const inputType = type === 'tel' ? 'tel' : type === 'email' ? 'email' : type === 'url' ? 'url' : 'text';
  return (
    <input
      {...commonProps}
      type={inputType}
      inputMode={type === 'tel' ? 'numeric' : undefined}
      placeholder={type === 'tel' ? '10-digit WhatsApp number' : undefined}
    />
  );
}

/** One labelled field with error display. */
function FormField({ field, value, onChange, error, baseId, disabled }) {
  const errId = `${baseId}-err`;
  return (
    <div className="reg-field">
      <label className="reg-label" htmlFor={`${errId}-input`}>
        {field.label}
        {field.required && <span className="reg-required-star" aria-hidden="true">*</span>}
      </label>
      <FieldInput
        field={field}
        value={value}
        onChange={onChange}
        error={error}
        errId={errId}
        disabled={disabled}
      />
      {error && (
        <span id={errId} className="reg-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TeamForm({ eventSlug, eventCfg, onSuccess }) {
  const uid = useId();
  const { minMembers, maxMembers, teamFields, memberFields } = eventCfg;

  // ── State ──
  const [teamName, setTeamName] = useState('');
  const [teamExtra, setTeamExtra] = useState(() => {
    const obj = {};
    for (const f of teamFields) obj[f.key] = '';
    return obj;
  });
  const [members, setMembers] = useState(() => buildInitialMembers(minMembers, memberFields));
  const [honeypot, setHoneypot] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverAlert, setServerAlert] = useState(null); // { msg, retryHint }
  const [pending, setPending] = useState(false);
  const submitLock = useRef(false);
  const formRef = useRef(null);

  // ── Member mutations ──
  const addMember = useCallback(() => {
    setMembers((prev) => [...prev, buildEmptyMember(memberFields)]);
  }, [memberFields]);

  const removeMember = useCallback((idx) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const setMemberField = useCallback((idx, key, val) => {
    setMembers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  }, []);

  // ── Focus first error field ──
  const focusFirstError = useCallback((errors) => {
    if (!formRef.current) return;
    const keys = Object.keys(errors);
    if (!keys.length) return;
    // Map error key -> element name attribute or id pattern
    // Keys: teamName | extra.<key> | members.N.<key> | members
    for (const k of keys) {
      let el = null;
      if (k === 'teamName') {
        el = formRef.current.querySelector('[name="teamName"]');
      } else if (k.startsWith('extra.')) {
        const fieldKey = k.slice(6);
        el = formRef.current.querySelector(`[name="${fieldKey}"][data-team]`);
      } else if (k.startsWith('members.')) {
        const parts = k.split('.');
        const idx = parts[1];
        const fkey = parts[2];
        el = formRef.current.querySelector(`[data-member="${idx}"] [name="${fkey}"]`);
      }
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
        break;
      }
    }
  }, []);

  // ── Submit ──
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (submitLock.current || pending) return;

    // Build payload
    const payload = {
      event: eventSlug,
      teamName,
      extra: { ...teamExtra },
      members: members.map((m, i) => {
        const row = {};
        for (const f of memberFields) {
          if (f.leaderOnly && i !== 0) continue;
          row[f.key] = m[f.key] ?? '';
        }
        return row;
      }),
      website: honeypot,
    };

    // Client-side validation (same rules as server — reuse the validator)
    const { ok, errors } = validateRegistration(payload);
    if (!ok) {
      setFieldErrors(errors);
      setServerAlert(null);
      requestAnimationFrame(() => focusFirstError(errors));
      return;
    }

    // Guard double-submit
    submitLock.current = true;
    setPending(true);
    setFieldErrors({});
    setServerAlert(null);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        onSuccess({ registrationId: data.registrationId, alreadyRegistered: data.alreadyRegistered, event: data.event });
        return; // keep lock — don't re-enable after success
      }

      // Field-level errors from server
      if (data?.fields && Object.keys(data.fields).length > 0) {
        setFieldErrors(data.fields);
        setServerAlert({ msg: data.error ?? 'Please fix the highlighted fields.', retryHint: false });
        requestAnimationFrame(() => focusFirstError(data.fields));
      } else {
        const is5xx = res.status >= 500;
        setServerAlert({
          msg: data?.error ?? 'Something went wrong. Please try again.',
          retryHint: is5xx,
        });
      }
    } catch {
      setServerAlert({
        msg: 'Network error. Please check your connection and try again.',
        retryHint: true,
      });
    } finally {
      submitLock.current = false;
      setPending(false);
    }
  }, [eventSlug, teamName, teamExtra, members, honeypot, memberFields, pending, onSuccess, focusFirstError]);

  // ── Render helpers ──
  const getError = (key) => fieldErrors[key];

  return (
    <form ref={formRef} className="reg-form" onSubmit={handleSubmit} noValidate>

      {/* ── Honeypot ── */}
      <div className="reg-honeypot" aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Website</label>
        <input
          id={`${uid}-website`}
          name="website"
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* ── Team Section ── */}
      <div className="reg-section">
        <span className="reg-section-title">Team Details</span>

        {/* Team Name */}
        <div className="reg-field">
          <label className="reg-label" htmlFor={`${uid}-teamName-input`}>
            Team Name<span className="reg-required-star" aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-teamName-input`}
            name="teamName"
            type="text"
            className="reg-input"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            disabled={pending}
            aria-invalid={getError('teamName') ? 'true' : undefined}
            aria-describedby={getError('teamName') ? `${uid}-teamName-err` : undefined}
            autoComplete="off"
          />
          {getError('teamName') && (
            <span id={`${uid}-teamName-err`} className="reg-field-error" role="alert">
              {getError('teamName')}
            </span>
          )}
        </div>

        {/* Dynamic extra team fields */}
        {teamFields.map((field) => (
          <FormField
            key={field.key}
            field={field}
            value={teamExtra[field.key]}
            onChange={(val) => setTeamExtra((prev) => ({ ...prev, [field.key]: val }))}
            error={getError(`extra.${field.key}`)}
            baseId={`${uid}-team-${field.key}`}
            disabled={pending}
          />
        ))}
      </div>

      {/* ── Members Section ── */}
      <div className="reg-section">
        <span className="reg-section-title">Team Members</span>

        <div className="reg-members-meta">
          <span className="reg-members-count">
            Members: {members.length} of {maxMembers} max
          </span>
          {members.length < maxMembers && (
            <button
              type="button"
              className="reg-add-btn"
              onClick={addMember}
              disabled={pending}
            >
              + Add member
            </button>
          )}
        </div>

        {getError('members') && (
          <span className="reg-field-error" role="alert" style={{ display: 'block', marginBottom: 12 }}>
            {getError('members')}
          </span>
        )}

        {members.map((member, idx) => {
          const isLeader = idx === 0;
          const isOptional = idx >= minMembers;
          const cardLabel = isLeader ? 'Team Leader' : `Member ${idx + 1}`;
          const visibleFields = memberFields.filter((f) => !(f.leaderOnly && !isLeader));

          return (
            <div
              key={idx}
              className="reg-member-card"
              data-member={idx}
            >
              <div className="reg-member-header">
                <span>
                  <span className="reg-member-label">{cardLabel}</span>
                  {isOptional && <span className="reg-member-optional">Optional</span>}
                </span>
                {isOptional && (
                  <button
                    type="button"
                    className="reg-remove-btn"
                    onClick={() => removeMember(idx)}
                    disabled={pending}
                    aria-label={`Remove ${cardLabel}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              {visibleFields.map((field) => (
                <FormField
                  key={field.key}
                  field={field}
                  value={member[field.key]}
                  onChange={(val) => setMemberField(idx, field.key, val)}
                  error={getError(`members.${idx}.${field.key}`)}
                  baseId={`${uid}-m${idx}-${field.key}`}
                  disabled={pending}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Server alert ── */}
      {serverAlert && (
        <div className="reg-alert" role="alert">
          {serverAlert.msg}
          {serverAlert.retryHint && (
            <p className="reg-retry-hint">
              If you already submitted, submitting again safely returns your registration ID.
            </p>
          )}
        </div>
      )}

      {/* ── Submit ── */}
      <div className="reg-submit-row">
        <button
          type="submit"
          className="reg-submit-btn"
          disabled={pending}
        >
          {pending ? 'Submitting…' : 'REGISTER TEAM'}
        </button>
      </div>
    </form>
  );
}
