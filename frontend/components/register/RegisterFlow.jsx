'use client';

/**
 * RegisterFlow — orchestrates TeamForm <-> success panel.
 * Reads event config from REGISTRATION_EVENTS at import time (safe: no secrets).
 * Accepts an optional `eventSlug` prop; falls back to DEFAULT_EVENT when omitted.
 */

import { useState } from 'react';
import Link from 'next/link';
import { DEFAULT_EVENT, getEvent } from '@/lib/registration-config.js';
import TeamForm from './TeamForm.jsx';

export default function RegisterFlow({ eventSlug: propSlug }) {
  const eventSlug = propSlug || DEFAULT_EVENT;
  const eventCfg = getEvent(eventSlug);
  const [success, setSuccess] = useState(null); // null | { registrationId, alreadyRegistered, event }

  if (!eventCfg || !eventCfg.open) {
    return (
      <div className="reg-alert" role="alert" style={{ marginTop: 32 }}>
        Registration for this event is not open yet.
      </div>
    );
  }

  if (success) {
    return (
      <div className="reg-success" role="region" aria-label="Registration confirmed">
        <div className="reg-success-icon" aria-hidden="true">✓</div>
        <h2>You&rsquo;re in!</h2>
        <p className="reg-success-sub">
          {success.alreadyRegistered
            ? 'Your team was already registered. Here is your existing registration ID.'
            : 'Your team has been registered successfully. Save this ID — you will need it for check-in.'}
        </p>
        <div className="reg-success-code">
          <span>Registration ID</span>
          <strong>{success.registrationId}</strong>
        </div>
        {success.alreadyRegistered && (
          <p className="reg-success-already">
            This registration ID was generated from a previous submission.
          </p>
        )}
        <br />
        <Link href="/" className="reg-success-home">← Back to home</Link>
      </div>
    );
  }

  return (
    <TeamForm
      eventSlug={eventSlug}
      eventCfg={eventCfg}
      onSuccess={setSuccess}
    />
  );
}
