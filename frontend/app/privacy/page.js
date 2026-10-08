import '@/components/sections.css';
import './privacy.css';

export const metadata = { title: 'Privacy Policy & Terms | Magnate 26-27' };

const SECTIONS = [
  {
    title: 'Introduction',
    text: 'Welcome to Magnate 2026, organized by PICT Entrepreneurship Development Cell (EDC). This Privacy Policy outlines how we collect, use, protect, and handle your personal information when you register for our events. By using our website and registering for events, you agree to the terms outlined in this policy.',
  },
  {
    title: 'Information We Collect',
    text: 'We collect the following information during the registration process:',
    list: ['Full name', 'Email address', 'Phone number (10 digits)', 'College/Institution name', 'Year of study', 'Team information (for team events)'],
  },
  {
    title: 'How We Use Your Information',
    text: 'Your information is used for the following purposes:',
    list: [
      'Processing and confirming event registrations',
      'Communicating event updates, schedules, and important announcements',
      'Verifying participant eligibility and team compositions',
      'Managing event logistics and participant coordination',
      'Sending certificates and participation acknowledgments',
      'Improving our services and future events',
    ],
  },
  {
    title: 'Data Security',
    text: 'We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. Your data is stored securely and is only accessible to authorized personnel involved in managing Magnate 2026. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
  },
  {
    title: 'User Responsibilities',
    text: 'By registering for Magnate 2026, you agree to:',
    list: [
      'Provide accurate, current, and complete information during registration',
      'Verify all details before submitting your registration',
      'Ensure your phone number is exactly 10 digits',
      'Use a valid email address that you check regularly',
      'Ensure all team members are from the same college (for team events)',
      'Comply with all event rules and guidelines',
      'Maintain professional conduct during the event',
    ],
  },
  {
    title: 'Data Sharing',
    text: 'We do not sell, trade, or rent your personal information to third parties. Your information may be shared with event sponsors and partners solely for the purpose of event coordination and participant engagement. We ensure that any third parties we work with maintain appropriate data protection standards.',
  },
  {
    title: 'Your Rights',
    text: 'You have the right to:',
    list: [
      'Access your personal information stored with us',
      'Request corrections to your information (before registration approval)',
      'Withdraw consent for marketing communications',
      'Request deletion of your data (subject to legal and operational requirements)',
    ],
  },
  {
    title: 'Changes to This Policy',
    text: 'We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with an updated "Last updated" date. We encourage you to review this policy periodically to stay informed about how we protect your information.',
  },
  {
    title: 'Contact Us',
    text: 'If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us through the Contact section on our website.',
    address: ['PICT Entrepreneurship Development Cell (EDC)', 'Pune Institute of Computer Technology', 'Pune, Maharashtra, India'],
  },
];

export default function PrivacyPage() {
  return (
    <main className="privacy grid-bg">
      <h1>Privacy Policy &amp; Terms</h1>
      <p className="updated">Last updated: January 25, 2026</p>

      <div className="privacy-panel">
        {SECTIONS.map((s, i) => (
          <section key={s.title}>
            <h2>{i + 1}. {s.title}</h2>
            <p>{s.text}</p>
            {s.list && <ul>{s.list.map((item) => <li key={item}>{item}</li>)}</ul>}
            {s.address && (
              <p className="address">
                <strong>{s.address[0]}</strong><br />{s.address[1]}<br />{s.address[2]}
              </p>
            )}
          </section>
        ))}

        {/* TODO: replace with your original wording for this section */}
        <section className="accept">
          <h2>{SECTIONS.length + 1}. Acceptance of Terms</h2>
          <p>By registering for Magnate 2026 or using this website, you confirm that you have read, understood, and agree to this Privacy Policy &amp; Terms.</p>
        </section>
      </div>
    </main>
  );
}
