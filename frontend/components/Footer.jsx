import Link from 'next/link';
import './sections.css';

const InstaIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
);
const LinkedinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9v10M6 5.5v.01M11 19v-6a3 3 0 0 1 6 0v6M11 9v10" /></svg>
);

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/edc-logo.jpeg" alt="EDC PICT" />
            <span>MAGNATE</span>
          </div>
          <p>
            PICT EDC conducts an annual flagship event, Magnate, where we invite Entrepreneurs
            and conduct various sub-events for direct student-entrepreneur interaction. We
            conduct competitions to highlight skill development and collaborate with other
            organizations.
          </p>
          <div className="socials">
            <a href="https://www.instagram.com/edc_pict/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstaIcon /></a>
            <a href="https://www.linkedin.com/company/edc-pict/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><LinkedinIcon /></a>
          </div>
        </div>

        <div className="footer-cols">
          <div>
            <h4>Connect</h4>
            <Link href="/#contact">Contact</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/developers">Our Developers</Link>
            <a href="https://www.instagram.com/edc_pict/" target="_blank" rel="noopener noreferrer">EDC PICT</a>
          </div>
        </div>
      </div>
      <p className="copyright">© 2026 EDC PICT</p>
    </footer>
  );
}
