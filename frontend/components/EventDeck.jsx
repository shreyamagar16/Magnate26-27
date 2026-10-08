'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BounceCards from '@/components/ui/BounceCards';
import { EVENTS } from '@/lib/events';
import { Nabla } from 'next/font/google';
import './events.css';

const nabla = Nabla({ subsets: ['latin'] });

const transformStyles = [
  "rotate(5deg) translate(-220px)",
  "rotate(0deg) translate(-110px)",
  "rotate(-5deg)",
  "rotate(5deg) translate(110px)",
  "rotate(-5deg) translate(220px)"
];

export default function EventDeck() {
  const router = useRouter();
  const images = EVENTS.map((e) => ({ src: e.card, title: e.title, slug: e.slug }));

  const handleClick = (e) => {
    const cardEl = e.target.closest('.card');
    if (cardEl) {
      const match = cardEl.className.match(/card-(\d+)/);
      if (match) {
        const idx = parseInt(match[1], 10);
        const event = images[idx];
        if (event) router.push(`/events/${event.slug}`);
      }
    }
  };

  return (
    <div className={`deck-wrap ${nabla.className}`}>
      <div className="deck" onClick={handleClick} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
        <BounceCards
          className="custom-bounceCards"
          images={images}
          containerWidth={500}
          containerHeight={300}
          animationDelay={0.5}
          animationStagger={0.08}
          easeType="elastic.out(1, 0.5)"
          transformStyles={transformStyles}
          enableHover={true}
        />
      </div>

      <nav className="deck-links">
        {EVENTS.map((e) => (
          <Link key={e.slug} href={`/events/${e.slug}`}>{e.title}</Link>
        ))}
      </nav>
    </div>
  );
}
