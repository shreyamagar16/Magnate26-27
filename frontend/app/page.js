import MicroSlats from '@/components/MicroSlats';
import TechText from '@/components/TechText';
import { dmSerif } from './fonts';
import Contact from '@/components/Contact';
import FlexCarousel from '@/components/ui/FlexCarousel';
import './landing.css';
import '@/components/sections.css';

const carouselItems = [
  { src: '/budhani.jpg', alt: 'Budhani' },
  { src: '/ardent.jpg', alt: 'Ardent' },
  { src: '/bamboo.jpg', alt: 'Bamboo' },
  { src: '/campustimes.jpg', alt: 'Campus Times' },
  { src: '/digiprodigy.jpg', alt: 'Digiprodigy' },
  { src: '/imperial.jpg', alt: 'Imperial' },
  { src: '/oxyrich.jpg', alt: 'Oxyrich' },
  { src: '/subway.jpg', alt: 'Subway' },
  { src: '/youva.jpg', alt: 'Youva' }
];

export default function Home() {
  return (
    <main style={{ overflowX: 'hidden' }}>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <MicroSlats
            preset="swell"
            color="#22C55E"
            glintColor="#ffffff"
            backgroundColor="#000000"
            slatWidth={10}
            slatHeight={25}
            gap={3}
            roundness={0.75}
            interactive
            cursorStrength={1}
            cursorSize={40}
            swirl={0}
            trail={1.4}
            lean={0}
            intro
          />
        </div>

        <div className="hero-content">
          <div className="pill">
            <span className="pill-tag">BSE</span>
            <span className="pill-text">PICTEDC ▲ 19.92%</span>
          </div>

          <p className="kicker">SCAM 1992</p>
          {/* real heading for SEO / screen readers; also makes the browser load the font */}
          <h1 className="sr-only" style={{ fontFamily: dmSerif.style.fontFamily }}>Magnate 26-27</h1>

          <div className="hero-title">
            <TechText
              text="Magnate 26-27"
              fontWeight={400}
              fontSize={120}
              reveal="letter"
              dashLength={4}
              dashGap={2}
              specks={15}
              fontFamily={dmSerif.style.fontFamily}
              color="#ffffff"
              accentColor="#4ade80"
              letterSpacing={-0.05}
              reach={200}
              softness={0.7}
              strokeWidth={1.5}
              speed={1}
              lineStyle="dashed"
              selection
              labels
              draggable
              sweep
            />
          </div>
          <p className="date">22ND TO 24TH OCTOBER</p>

          <div className="buttons">
            <a href="/events" className="btn btn-primary">Enter the ring</a>
            <a href="/about" className="btn btn-ghost">Learn more</a>
          </div>

          <p className="note">TERMINAL CONNECTION: SECURE. USE CHROME/EDGE.</p>
        </div>
      </section>

      {/* FULL WIDTH CAROUSEL */}
      <section className="carousel-section">
        <div className="carousel-wrapper">
          <FlexCarousel
            items={carouselItems}
            preset="liquid"
            intro="rise"
            cardHeight={0.35}
            gap={10}
            squeeze={0.2}
            focusOnClick={false}
            captions={false}
            fit="natural"
            radius={0}
            lensWidth={0.65}
            lensHeight={0.9}
            tilt={45}
            roundness={0.8}
            bend={0.25}
            reach={0.3}
            curl="twist"
            dispersion={0.4}
            liquid={0}
            followCursor={false}
            autoplay={false}
            interval={4}
            captureWheel={false}
          />
        </div>
      </section>

      <div className="grid-bg"><Contact /></div>
    </main>
  );
}
