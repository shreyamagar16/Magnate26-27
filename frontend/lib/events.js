export const EVENTS = [
  {
    slug: 'ideathon',
    title: 'Ideathon',
    card: 'https://picsum.photos/400/400?grayscale', // placeholder
    tagline: 'Innovate and Create',
    gallery: ['https://picsum.photos/500/500?grayscale'],
    date: 'TBA',
    venue: 'TBA',
    participants: 'TBA',
    prize: 'TBA',
    teamSize: 'TBA',
    description: 'An exciting ideathon...',
    registration: false,
    registerUrl: '#'
  },
  {
    slug: 'casecom',
    title: 'CaseCom',
    card: 'https://picsum.photos/500/500?grayscale',
    tagline: 'Solve real problems',
    gallery: ['https://picsum.photos/400/400?grayscale'],
    date: 'TBA',
    venue: 'TBA',
    participants: 'TBA',
    prize: 'TBA',
    teamSize: 'TBA',
    description: 'Case competition...',
    registration: false,
    registerUrl: '#'
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
    gallery: ['https://picsum.photos/400/400?grayscale'],
    date: 'TBA',
    venue: 'TBA',
    participants: 'TBA',
    prize: 'TBA',
    teamSize: 'TBA',
    description: 'Boardroom competition...',
    registration: false,
    registerUrl: '#'
  },
  {
    slug: 'e-cell-meetup',
    title: 'E-Cell Meetup',
    card: 'https://picsum.photos/300/300?grayscale',
    tagline: 'Meet like-minded people',
    gallery: ['https://picsum.photos/400/400?grayscale'],
    date: 'TBA',
    venue: 'TBA',
    participants: 'TBA',
    prize: 'TBA',
    teamSize: 'TBA',
    description: 'Networking and meetup...',
    registration: false,
    registerUrl: '#'
  }
];

export function getEvent(slug) {
  return EVENTS.find((e) => e.slug === slug);
}
