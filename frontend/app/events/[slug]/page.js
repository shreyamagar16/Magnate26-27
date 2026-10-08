import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EVENTS, getEvent } from '@/lib/events';
import '@/components/sections.css';
import '@/components/events.css';

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = getEvent(slug);
  return { title: event ? `${event.title} | Magnate 26-27` : 'Event' };
}

export default async function EventPage({ params }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const facts = [
    ['Date', event.date],
    ['Venue', event.venue],
    ['Participants', event.participants],
    ['Prize pool', event.prize],
    ['Team size', event.teamSize],
  ].filter(([, value]) => value);

  return (
    <main className="event-page grid-bg">
      <Link href="/events" className="back">← All events</Link>
      <h1>{event.title}</h1>
      <p className="tagline">{event.tagline}</p>

      <div className="gallery">
        {event.gallery.map((src, i) => (
          <img key={src} src={src} alt={`${event.title} photo ${i + 1}`} />
        ))}
      </div>

      <div className="facts">
        {facts.map(([label, value]) => (
          <div className="fact" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <p className="event-desc">{event.description}</p>

      <div className="register-box">
        {event.registration ? (
          <>
            <p>Ready to take part?</p>
            <a href={event.registerUrl} className="register-btn">Register for {event.title}</a>
          </>
        ) : (
          <p>{event.title} is an open event. No registration needed.</p>
        )}
      </div>
    </main>
  );
}
