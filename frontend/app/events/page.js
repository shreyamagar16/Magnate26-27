import EventDeck from '@/components/EventDeck';
import '@/components/sections.css';
import '@/components/events.css';

export const metadata = { title: 'Events | Magnate 26-27' };

export default function EventsPage() {
  return (
    <main className="events-page grid-bg">
      <h1 style={{ color: '#4ade80' }}>Events</h1>
      <p className="sub">Hover over the deck and click an event to see the details.</p>
      <EventDeck />
    </main>
  );
}
