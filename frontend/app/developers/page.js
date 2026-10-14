'use client';

import { useState } from 'react';
import '@/components/sections.css';
import './developers.css';

const DEVELOPERS = [
  {
    name: 'Shreya Magar',
    role: 'EDC Student Member',
    photo: '/developers/shreya-magar.jpg',
    initials: 'SM',
    instagram: 'https://www.instagram.com/shreyamagarr',
    linkedin: 'https://www.linkedin.com/in/shreya-magar/',
  },
  {
    name: 'Divyam Jain',
    role: 'EDC Student Member',
    photo: '/developers/divyam-jain.jpg',
    initials: 'DJ',
    instagram: 'https://www.instagram.com/divyamjain015',
    linkedin: 'https://www.linkedin.com/in/divyamjain015',
  },
  {
    name: 'Devesh Gujarathi',
    role: 'EDC Student Member',
    photo: '/developers/devesh-gujarathi.jpg',
    initials: 'DG',
    instagram: 'https://www.instagram.com/devesh_the.outlier/',
    linkedin: 'https://www.linkedin.com/in/devesh-gujarathi-a88625378/',
  },
];

const InstaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);

const LinkedinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9v10M6 5.5v.01M11 19v-6a3 3 0 0 1 6 0v6M11 9v10" />
  </svg>
);

function DeveloperCard({ dev }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="dev-card">
      {!imgError && dev.photo ? (
        <img
          src={dev.photo}
          alt={dev.name}
          className="dev-card-img"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="dev-card-fallback">
          <span className="dev-initials">{dev.initials}</span>
        </div>
      )}

      <div className="dev-card-overlay">
        <h3 className="dev-name">{dev.name}</h3>
        <p className="dev-role">{dev.role}</p>

        <div className="dev-socials">
          {dev.linkedin && (
            <a
              href={dev.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${dev.name} LinkedIn`}
              className="dev-social-link"
            >
              <LinkedinIcon />
            </a>
          )}
          {dev.instagram && (
            <a
              href={dev.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${dev.name} Instagram`}
              className="dev-social-link"
            >
              <InstaIcon />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DevelopersPage() {
  return (
    <main className="developers-page grid-bg">
      <div className="developers-header">
        <h1>Our Developers</h1>
        <p className="developers-sub">
          Meet the talented team behind Magnate&apos;s digital experience. Our developers work tirelessly to bring you the best event management platform.
        </p>
      </div>

      <div className="developers-grid">
        {DEVELOPERS.map((dev) => (
          <DeveloperCard key={dev.name} dev={dev} />
        ))}
      </div>
    </main>
  );
}
