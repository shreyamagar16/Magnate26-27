import DitherVeil from '@/components/DitherVeil';
import Link from 'next/link';
import './about.css';
import '@/components/sections.css';

export const metadata = { title: 'About | Magnate 26-27' };

export default function AboutPage() {
  return (
    <main className="about grid-bg">
      <h1>About</h1>

      {/* first picture: club members, dithered, full colour under the cursor */}
      <div className="about-hero">
        <DitherVeil
          src="/club-members.jpg"
          pattern="floyd"
          pixelSize={2}
          inkColor="#000000"
          paperColor="#4ade80"
          revealRadius={200}
          softness={0.6}
          linger={1}
          fit="cover"
          rimColor="#4ade80"
          palette="duotone"
          levels={2}
          contrast={1.15}
          brightness={0}
          rim={0}
          reverse={false}
          wander={false}
          clickBurst
        />
      </div>

      <section className="about-block">
        <h2>About EDC PICT</h2>
        <p>
          Entrepreneurship Development Cell (EDC), PICT is a student-driven organization
          dedicated to fostering innovation and entrepreneurial thinking among students.
          Through workshops, mentorship programs, competitions, startup expos, and industry
          interactions, EDC provides a platform for aspiring entrepreneurs to learn,
          collaborate, and transform ideas into impactful ventures.
        </p>
      </section>

      <section className="about-split">
        <img src="/magnate-arch.jpg" alt="Magnate at PICT" />
        <div>
          <h2>What is Magnate?</h2>
          <p>
            Magnate is EDC PICT&apos;s flagship entrepreneurship conclave that brings together
            students, startups, founders, investors, and industry leaders under one roof.
            Designed to inspire innovation and collaboration, Magnate features competitive
            events, startup showcases, expert talks, and hands-on experiences that empower
            participants to think boldly, build confidently, and shape the future of
            entrepreneurship.
          </p>
        </div>
      </section>

      <section className="about-cta">
        <h2>Magnate 2026</h2>
        <p>
          Join us in this incredible journey of innovation, entrepreneurship, and growth.
          Explore our events and discover what Magnate has to offer.
        </p>
        <Link href="/events" className="cta-btn">View Events</Link>
      </section>
    </main>
  );
}
