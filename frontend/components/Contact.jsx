import './sections.css';

const MailIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
const PinIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
);

export default function Contact() {
  return (
    <section id="contact" className="contact">
      <div>
        <h2>Contact<br />Information</h2>
        <p className="intro">Get in touch with us for any queries, collaborations, or event information.</p>

        <div className="info">
          <div className="info-icon"><MailIcon /></div>
          <div>
            <h3>Email:</h3>
            <p>edc@pict.edu</p>
          </div>
        </div>

        <div className="info">
          <div className="info-icon"><PinIcon /></div>
          <div>
            <h3>Address:</h3>
            <p>Pune Institute of Computer Technology,<br />Behind Bharati Vidyapeeth Campus,<br />Dhankawadi, Pune, Maharashtra – 411043</p>
          </div>
        </div>
      </div>

      <div className="map">
        <iframe
          title="EDC PICT location"
          src="https://www.google.com/maps?q=EDC+Pict+Pune+Institute+of+Computer+Technology+Dhankawadi+Pune&output=embed"
          loading="lazy"
        />
      </div>
    </section>
  );
}
