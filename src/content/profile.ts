/**
 * Everything personal lives in /src/content. Edit these files to change copy —
 * no component needs to be touched.
 */

export const profile = {
  firstName: 'ABOOD',
  lastName: 'ASHI',
  greeting: "HELLO, I'M",
  role: 'FULL-STACK DEVELOPER',
  tagline: 'I build Flutter apps and the servers behind them.',
  location: 'Amman, Jordan',
  coordinates: '31.9539° N — 35.9106° E',
  timezone: 'Asia/Amman',
  availability: 'Open to full-time roles and freelance projects.',
  email: 'mralashi17@gmail.com',
}

export type SocialLink = { label: string; handle: string; href: string }

export const socials: SocialLink[] = [
  { label: 'GitHub', handle: 'github.com/21Ashi', href: 'https://github.com/21Ashi' },
  { label: 'LinkedIn', handle: 'linkedin.com/in/aboodashi', href: 'https://linkedin.com/in/aboodashi' },
  { label: 'Email', handle: 'mralashi17@gmail.com', href: 'mailto:mralashi17@gmail.com' },
  { label: 'Phone', handle: '+962 799 993 800', href: 'tel:+962799993800' },
]

/** About chapter. The paragraph is revealed word by word as you scroll. */
export const about = {
  kicker: 'FROM REPO',
  headline: 'TO STORE.',
  intro:
    "I'm a full-stack developer from Amman, Jordan, and I like shipping software that people actually use. " +
    'I take products from an empty repository to the store — Flutter on the front, Node.js and .NET behind it — ' +
    'and I care as much about how a thing feels in the hand as how it holds up under real load.',
  facts: [
    { label: 'Based in', value: 'Amman, Jordan' },
    { label: 'Studied', value: 'Computer Science — Applied Science University' },
    { label: 'Speaks', value: 'Arabic (native) · English (professional)' },
    { label: 'Published', value: '“Wrong Answers” — Android & iOS' },
  ],
  stats: [
    { value: 15000, prefix: '', suffix: '+', label: 'Organic downloads', note: '“Wrong Answers”, Android & iOS' },
    { value: 4, prefix: '', suffix: '+', label: 'Apps in production', note: 'Used daily by enterprise clients' },
    { value: 50, prefix: '40–', suffix: '%', label: 'Less manual work', note: 'LLM workflows at Optimiza' },
  ],
}
