'use client';

import './sections.css';

// put each logo in /public/partners/ (png or svg) and match the file names here.
// if a logo file is missing, the card shows the name instead.
const PARTNERS = [
  { name: 'Subway', logo: '/partners/subway.png' },
  { name: 'Campus Times', logo: '/partners/campus-times.png' },
  { name: 'Imperial', logo: '/partners/imperial.png' },
  { name: 'Oxyrich', logo: '/partners/oxyrich.png' },
  { name: 'Ardent', logo: '/partners/ardent.png' },
  { name: 'DigiProdigy', logo: '/partners/digiprodigy.png' },
];

export default function Collaborations() {
  const loop = [...PARTNERS, ...PARTNERS]; // doubled so the scroll loops seamlessly

  const showName = (e) => {
    e.currentTarget.style.display = 'none';
    e.currentTarget.nextSibling.style.display = 'block';
  };

  return (
    <section className="collab">
      <h2>Our Past Collaborations</h2>
      <p>
        We are proud to partner with industry leaders who share our vision of fostering
        innovation and entrepreneurship. Their support makes Magnate possible.
      </p>
      <div className="marquee">
        <div className="marquee-track">
          {loop.map((p, i) => (
            <div className="partner" key={i}>
              <img src={p.logo} alt={p.name} onError={showName} />
              <span style={{ display: 'none' }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
