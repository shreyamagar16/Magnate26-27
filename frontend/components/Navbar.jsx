'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import './Navbar.css';

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Events', href: '/events' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <Link href="/" className="nav-brand">
        <Image src="/edc-logo.jpeg" alt="EDC PICT" width={44} height={44} priority />
        <span>EDC PICT</span>
      </Link>

      <nav className={`nav-links ${open ? 'open' : ''}`}>
        {LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={pathname === link.href ? 'active' : ''}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
        ☰
      </button>
    </header>
  );
}
