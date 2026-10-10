/**
 * /register — server component (no 'use client').
 * Reads event config at build time for metadata + the fact chip.
 * All interactivity lives in RegisterFlow (client component).
 */

import '@/components/sections.css';
import '@/components/register/register.css';
import { DEFAULT_EVENT, REGISTRATION_EVENTS } from '@/lib/registration-config.js';
import RegisterFlow from '@/components/register/RegisterFlow.jsx';
import Link from 'next/link';

export const metadata = {
  title: 'Register | Magnate 26-27',
  description: 'Register your team for Magnate 26-27 events at PICT EDC.',
};

export default function RegisterPage() {
  const eventCfg = REGISTRATION_EVENTS[DEFAULT_EVENT];
  const { label, tagline, minMembers, maxMembers } = eventCfg ?? {};

  const teamSizeText = minMembers === maxMembers
    ? `${minMembers} member${minMembers !== 1 ? 's' : ''}`
    : `${minMembers}–${maxMembers} members`;

  return (
    <main className="register-page grid-bg">
      <Link href="/events" className="reg-back">← All events</Link>

      <h1 className="reg-heading">{label} Registration</h1>
      {tagline && <p className="reg-tagline">{tagline}</p>}

      <div className="reg-meta">
        <span className="reg-meta-label">Team Size</span>
        <span className="reg-meta-value">{teamSizeText.toUpperCase()}</span>
      </div>

      <RegisterFlow />
    </main>
  );
}