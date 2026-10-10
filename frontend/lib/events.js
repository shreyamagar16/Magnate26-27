/**
 * @typedef {{ label: string; description: string }} Round
 * @typedef {{
 *   slug: string;
 *   title: string;
 *   card: string;
 *   tagline: string;
 *   gallery?: string[];
 *   heroImage?: string;
 *   images?: string[];
 *   date: string;
 *   venue: string;
 *   participants: string;
 *   prize?: string;
 *   teamSize?: string;
 *   description: string;
 *   about?: string;
 *   rounds?: Round[];
 *   registration: boolean;
 *   registerUrl: string;
 * }} Event
 */

/** @type {Event[]} */
export const EVENTS = [
  {
    slug: 'ideathon',
    title: 'Ideathon',
    card: 'https://picsum.photos/400/400?grayscale', // placeholder card image for deck
    tagline: 'Innovate and Create',
    // No gallery — image block will be skipped on the detail page
    heroImage: '/events/ideathon-magnate-stage.jpg',
    heroAlt: 'Hosts on stage at Magnate, Wall Street themed event',
    heroObjectPosition: 'center',
    date: '22nd October',
    venue: 'IT Seminar Hall, PICT',
    teamSize: '2-5 members',
    description: 'An exciting ideathon...',
    about:
      "Ideathon is where raw ideas meet real-world thinking. Bring together your team, pick a problem worth solving, and turn your concept into a pitch that can stand up to scrutiny. Whether you're sketching your very first startup idea or refining one you've been carrying for months, this is your stage to test it, sharpen it, and get feedback from people who've been there.",
    rounds: [
      {
        label: '01',
        title: 'Round 1: PPT Submission',
        description:
          'Submit a presentation outlining your idea: the problem, your solution, target audience, and how it could work as a venture. Shortlisted teams move on to the final round.',
      },
      {
        label: '02',
        title: 'Round 2: Final Pitch',
        description:
          'Present your idea in a 10-minute pitch in front of a panel of experts and judges, followed by their questions and feedback.',
      },
    ],
    registration: true,
    registerUrl: '/register',
  },
  {
    slug: 'casecom',
    title: 'CaseCom',
    card: 'https://picsum.photos/500/500?grayscale',
    tagline: 'Solve real problems',
    heroImage: '/events/casecom.jpg',
    heroAlt: 'Team presenting their business model at the Magnate CaseCom',
    heroObjectPosition: 'center 55%',
    date: '22nd October',
    venue: 'IT Seminar Hall, PICT',
    teamSize: '2-5 members',
    description: 'Case competition...',
    about: 'CaseCom puts you in the middle of a real business problem and asks you to find a way through it. Teams are given a case study drawn from the world of startups and business, and you have to analyse it, build a strategy, and present your solution to a panel of judges. It is not about having the right answer — it is about how clearly you think, how well you structure your reasoning, and how confidently you defend your decisions under pressure. Every case is different, and every pitch is a chance to sharpen the skills that matter in the real world. If you enjoy dissecting problems and turning them into plans, this is the room for you.',
    registration: true,
    registerUrl: '/register/casecom'
  },
  {
    slug: 'fun-game',
    title: 'Fun Game',
    card: 'https://picsum.photos/600/600?grayscale',
    tagline: 'Relax and have fun',
    gallery: ['https://picsum.photos/400/400?grayscale'],
    date: 'TBA',
    venue: 'TBA',
    participants: 'TBA',
    prize: 'TBA',
    teamSize: 'TBA',
    description: 'Fun games...',
    registration: false,
    registerUrl: '#'
  },
  {
    slug: 'boardroom',
    title: 'Boardroom',
    card: 'https://picsum.photos/700/700?grayscale',
    tagline: 'Step into the shoes of a CEO',
    heroImage: '/events/boardroom/session-1.jpg',
    date: '24th October',
    venue: 'IT Seminar Hall, PICT',
    participants: 'Open to all',
    // No prize or teamSize for Boardroom
    description: 'Boardroom competition...',
    about:
      "Boardroom is an open conversation between speakers and assessors. Speakers from the startup and business world sit down with our members to talk about entrepreneurship: what it really takes to build something, the mistakes worth avoiding, and the lessons that only come from experience. They share their field expertise directly with us, and you get to ask questions, challenge ideas, and learn from people who have been through it. If you're curious about startups and entrepreneurship, this room is for you.",
    registration: false,
    registerUrl: '#',
  },
  {
    slug: 'e-cell-meetup',
    title: 'E-Cell Meetup',
    card: 'https://picsum.photos/300/300?grayscale',
    tagline: 'Meet like-minded people',
    heroImage: '/events/ecell-meetup.jpg',
    heroAlt: 'Students on stage at the Magnate E-Cell Meetup',
    heroObjectPosition: 'center 40%',
    date: '23rd October',
    venue: 'IT Seminar Hall, PICT',
    participants: 'Open to all',
    description: 'Networking and meetup...',
    about:
      "The E-Cell Meetup is a relaxed, open gathering for anyone curious about entrepreneurship, startups, or simply looking to connect with like-minded people. Whether you're a first-year student with a spark of an idea or someone who has already been building, this is the space where conversations happen naturally. You'll meet fellow students, share experiences, and hear perspectives that don't usually come up in a classroom. There are no pitches and no pressure — just good conversations, new connections, and the energy that comes from being in a room full of people who are excited about building things. Come as you are, and leave with at least one person you didn't know before.",
    registration: false,
    registerUrl: '#'
  }
];

export function getEvent(slug) {
  return EVENTS.find((e) => e.slug === slug);
}

