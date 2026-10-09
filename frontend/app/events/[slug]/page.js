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
  ].filter(([, value]) => value && value !== 'TBA');

  return (
    <main className="event-page grid-bg">
      <Link href="/events" className="back">← All events</Link>
      <h1>{event.title}</h1>
      <p className="tagline">{event.tagline}</p>

      {/* Hero: heroImage left + About right — used when heroImage is explicitly set (e.g. Ideathon) */}
      {event.heroImage && (
        <div className={`event-hero-row${event.about ? ' has-both' : ''}`}>
          <div className="event-hero-img-wrap">
            <img
              src={event.heroImage}
              alt={event.heroAlt || `${event.title} group photo`}
              className="event-hero-img"
              style={event.heroObjectPosition ? { objectPosition: event.heroObjectPosition } : undefined}
            />
          </div>
          {event.about && (
            <section className="event-about">
              <h2 className="section-heading">About the Event</h2>
              <p className="event-about-body">{event.about}</p>
            </section>
          )}
        </div>
      )}

      {/* Info cards */}
      <div className="facts">
        {facts.map(([label, value]) => (
          <div className="fact" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {/* Photo gallery — used when event.images is set (e.g. Boardroom) */}
      {event.images && event.images.length > 0 && (
        <div className={`event-images event-images--${event.images.length === 1 ? 'single' : 'grid'}`}>
          {event.images.map((src, i) => (
            <div className="event-img-wrap" key={src}>
              <img
                src={src}
                alt={`${event.title} session photo ${i + 1}`}
                className="event-img"
              />
            </div>
          ))}
        </div>
      )}

      {/* About the Event — standalone (used when no heroImage, e.g. Boardroom) */}
      {event.about && !event.heroImage && (
        <section className="event-about event-about--standalone">
          <h2 className="section-heading">About the Event</h2>
          <p className="event-about-body">{event.about}</p>
        </section>
      )}

      {/* Rounds — optional */}
      {event.rounds && event.rounds.length > 0 && (
        <section className="event-rounds">
          <h2 className="section-heading">Rounds</h2>
          <div className="rounds-grid">
            {event.rounds.map((round) => (
              <div className="round-card" key={round.label}>
                <span className="round-label">{round.label}</span>
                <h3 className="round-title">{round.title}</h3>
                <p className="round-desc">{round.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

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
