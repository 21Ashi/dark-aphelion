import type { CSSProperties } from 'react'


/**
 * Projects, newest first (by latest work). Facts come from each repository's
 * own docs and git history. `role` lines are conservative: confirm them.
 * Only projects with a real app icon are listed (see GALLERY_ICON in gallery.ts).
 *
 * `featured` projects get a full spread in the pinned Works track; every
 * project is listed in the Index that follows it.
 *
 * Case-study fields (`problem`, `solution`, `contribution`, `details`,
 * `gallery`) are optional. While you run the dev server, a missing one shows a
 * marked placeholder in the case study; the production build leaves it out.
 *
 * Media: drop files in /public/projects and point to them, e.g.
 *   media:   { type: 'image', src: 'projects/cri.jpg', alt: '...' }   // replaces the procedural preview
 *   gallery: [{ type: 'video', src: 'projects/cri.mp4', poster: 'projects/cri.jpg', alt: '...' }]
 */

export type ProjectVisual =
  | 'radar'
  | 'route'
  | 'vision'
  | 'tickets'
  | 'game'
  | 'pilgrimage'
  | 'auction'
  | 'dose'
  | 'party'
  | 'listings'
  | 'stadium'
  | 'bluff'

export type Media = { type: 'image' | 'video'; src: string; poster?: string; alt?: string; caption?: string }

/** Each project's own light inside the site's dark stage. */
export type Theme = {
  /** Highlights, the project's signal colour. Must read on near-black. */
  accent: string
  /** Deep companion colour for washes and large fills. */
  deep: string
  /** The room's background tone. */
  bg: string
}

/** How the spread is composed in the Works track. */
export type Layout = 'split' | 'reverse' | 'stage'

export type Project = {
  id: string
  title: string
  subtitle: string
  /** One or two words: what kind of product this is. */
  category: string
  description: string
  role: string
  stack: string[]
  highlights: string[]
  status: string
  year?: string
  /** Who it was built for, when it was built for a client. */
  client?: string
  /** Gets a full spread in the Works track (the Index lists everything). */
  featured?: boolean
  layout?: Layout
  theme: Theme
  problem?: string
  solution?: string
  contribution?: string
  /** Engineering notes worth a sentence each. */
  details?: string[]
  link?: { label: string; href: string }
  visual: ProjectVisual
  media?: Media
  gallery?: Media[]
}

export const projects: Project[] = [
  {
    id: 'alhammadi-hajj',
    title: 'Al-Hammadi Hajj',
    subtitle: 'Hajj campaign platform',
    category: 'Service platform',
    description:
      'One platform for a Qatari Hajj campaign: a Flutter app for pilgrims and the people who look after them, a web console for the campaign team, and the Django API behind both. It works offline, because the network disappears for hours in Mina and Arafat, exactly when the app is needed.',
    role: 'Full-stack: Django API, Flutter app and React console',
    stack: ['Flutter', 'Django', 'DRF', 'PostgreSQL', 'Celery', 'React', 'TypeScript'],
    highlights: [
      'Offline-first: the programme, the bus and the places work without a network',
      'Six roles, from pilgrim to campaign manager, with permissions enforced on the server',
      'Interface rules for elderly pilgrims: large type, large controls, no swipes',
      'Arabic and right-to-left across the app and the console',
    ],
    problem:
      'A Hajj campaign looks after a few hundred pilgrims, many of them elderly, from Makkah to Mina, Arafat and Muzdalifah and back. The network drops for hours at the busiest moments, the data is sensitive (passports, medical notes, signed contracts), and men\'s and women\'s information is separated only where the campaign\'s rules say so.',
    solution:
      'A Django API that checks every permission on the server, a Flutter app that keeps what each person needs on the device and syncs when the network returns, and a React console for the campaign team. The app follows written rules for older users: large type and controls, colour always paired with a word, no swipes or drop-downs.',
    contribution:
      'Built all three parts, the API, the mobile app and the console, against the client\'s specification and a shared API contract.',
    details: [
      'Bus rule on the server: a leader sees only the men when a women\'s supervisor is assigned, and everyone otherwise.',
      'One API contract for the app and the console; every change to it is logged.',
      'Six roles in one app, gated by role, plus a web console for administrators and managers.',
      'Arabic, right-to-left interfaces on both the phone and the web.',
    ],
    status: 'In development',
    year: '2026',
    client: 'Hamlat Al-Hammadi, Qatar',
    featured: true,
    layout: 'split',
    theme: { accent: '#e6d6b0', deep: '#5b4a2c', bg: '#0f0d09' },
    visual: 'pilgrimage',
    gallery: [
      { type: 'image', src: 'projects/alhammadi-hajj/p1.webp', alt: 'The pilgrim\'s home screen', caption: 'Home, from the design prototype' },
      { type: 'image', src: 'projects/alhammadi-hajj/p2.webp', alt: 'The pilgrim\'s journey screen', caption: 'My journey' },
    ],
  },
  {
    id: 'mzad-al-fakher',
    title: 'Mzad Al Fakher',
    subtitle: 'Live auctions for a luxury store',
    category: 'Commerce',
    description:
      'A customer app, a real-time auction server and an admin dashboard for a luxury store in Doha. The store\'s approved design was rebuilt screen for screen in Flutter; prices, bids, deposits and timers are all decided on the server.',
    role: 'Full-stack: Flutter app, NestJS API and React dashboard',
    stack: ['Flutter', 'NestJS', 'PostgreSQL', 'Prisma', 'Socket.IO', 'React'],
    highlights: [
      'Live bidding over Socket.IO, with anti-sniping and maximum bids',
      'Deposits, winner receipts and payment deadlines handled end to end',
      'Shop checkout, pickup codes, shipping and invoice PDFs',
      'Arabic first, with a full English, left-to-right mode',
    ],
    problem:
      'A luxury store wanted to sell pieces through live auctions and a shop from one app, with the money rules (deposits, bid increments, payment deadlines) enforced so that no price or bid can be faked from a phone.',
    solution:
      'A Flutter app rebuilt screen for screen from the store\'s approved web demo, a NestJS API that decides every price, bid and timer, live updates over Socket.IO, and a React dashboard where staff run lots, orders, receipts and reports.',
    contribution:
      'Built the customer app, the API and the dashboard in one monorepo, with the business rules shared between the server and the dashboard.',
    details: [
      'Server-authoritative bidding: start price, increments, maximum bids and anti-sniping.',
      'A wallet ledger: deposits are held during a lot and returned when it closes.',
      'The winner\'s path: a 48-hour deadline, a receipt upload, staff approval or forfeit.',
      'Invoices and statements rendered as PDFs on the server; times in Qatar time.',
    ],
    status: 'In development',
    year: '2026',
    client: 'A luxury store in Doha',
    featured: true,
    layout: 'reverse',
    theme: { accent: '#d9c08f', deep: '#1c2a55', bg: '#0a0c14' },
    visual: 'auction',
    gallery: [
      { type: 'image', src: 'projects/mzad-al-fakher/p2.webp', alt: 'Live auctions: lots with their countdowns', caption: 'Live auctions, from the store\'s approved design' },
      { type: 'image', src: 'projects/mzad-al-fakher/p1.webp', alt: 'Home: auctions and direct purchase', caption: 'Home: auctions and direct purchase' },
    ],
  },
  {
    id: 'es7a',
    title: 'Es7a',
    subtitle: 'Recovery and habit-building, one audio session a day',
    category: 'Health & habit',
    description: 'An Arabic recovery and habit-building app built around a short daily audio session, with a streak counter, a calming panic button and an AI companion. Journal entries and recordings never leave the phone.',
    role: 'Full-stack: Flutter app, Firebase backend and ops dashboard',
    stack: ['Flutter', 'Firebase', 'Cloud Functions', 'TypeScript', 'RevenueCat', 'Next.js'],
    highlights: [
      'A daily audio dose that opens at the time each user chooses',
      'A calming panic button for the hard moments',
      'Private by design: journal text and recordings stay on the device',
      'Version 1.0 on the App Store, with subscriptions',
    ],
    problem:
      'The app has to be there every morning and in the moment things get hard, and the people using it have to trust that what they write or record stays private.',
    solution:
      'A daily routine built around a short audio dose and one small task, a panic button with breathing and short audio for hard moments, and an AI companion called Sanad that answers through a Cloud Function. Journal text and recordings stay on the phone; subscriptions run through RevenueCat.',
    contribution:
      'Built the Flutter app, the Firebase backend and Cloud Functions, and the Next.js ops dashboard, from the owner\'s specification.',
    details: [
      'Separate dev and prod flavours on separate Firebase projects.',
      'Security rules and functions tested on the Firestore emulator.',
      'Doses imported from the content team\'s own files.',
      'The journal is encrypted on the device, behind a biometric lock.',
    ],
    status: 'Released',
    year: '2026',
    layout: 'split',
    theme: { accent: '#4fe0cf', deep: '#17295a', bg: '#070b17' },
    visual: 'dose',
    gallery: [
      { type: 'image', src: 'projects/es7a/p1.webp', alt: 'Home: the streak counter under a night sky and today\'s audio session', caption: 'Home, from the design reference' },
    ],
  },
  {
    id: 'jola',
    title: 'Jola',
    subtitle: 'Party games for the majlis',
    category: 'Party games',
    description:
      'A box of Arabic party games for friends gathered in a majlis. The host runs the night from the app; everyone else joins from their phone\'s browser with a QR code or a four-letter code. No install, no account.',
    role: 'Lead developer since September 2026, on an existing platform',
    stack: ['React Native', 'Expo', 'Next.js', 'TypeScript', 'Node.js', 'Supabase'],
    highlights: [
      'Players join from the browser: scan a QR or type a room code',
      'Five games, each a plugin on one shared engine',
      'Admins edit every game\'s words and timers through generated forms, not code',
      'Game-night packs as in-app purchases in the native host app',
    ],
    problem:
      'Friends in a majlis want to be playing within a minute, on whatever phones they brought, without everyone installing an app or creating an account.',
    solution:
      'The host runs the night from a native app and players join from the browser. Every game is a plugin on one engine, so a new game ships without rebuilding the platform, and admins edit each game\'s content through forms generated from its schema.',
    contribution: 'Took over an existing, deployed platform in September 2026 and has led it since: the five current games, the native host app and its in-app purchases.',
    details: [
      'The server decides anything secret or shared, such as roles and whether a room is full.',
      'A broken game is caught by an error boundary and cannot take the rest down.',
      'Arabic only at launch, with the string layer ready for more languages.',
      'Standings carry across games, so a night has one running score.',
    ],
    status: 'Web live, app in review',
    year: '2026',
    featured: true,
    layout: 'stage',
    theme: { accent: '#f2c14e', deep: '#1f2b5e', bg: '#0a0e1f' },
    link: { label: 'jola.website', href: 'https://jola.website' },
    visual: 'party',
    gallery: [
      { type: 'image', src: 'projects/jola/40-board.webp', alt: 'A question board in a Jola game', caption: 'The board, on the host\'s phone' },
      { type: 'image', src: 'projects/jola/11-night-board.webp', alt: 'The night\'s standings across games', caption: 'The night\'s standings' },
      { type: 'image', src: 'projects/jola/63-m-vote.webp', alt: 'Voting for the impostor', caption: 'Voting round' },
      { type: 'image', src: 'projects/jola/85-nw-reveal.webp', alt: 'A round reveal', caption: 'The reveal' },
    ],
  },
  {
    id: 'qatar-gates',
    title: 'Qatar Gates',
    subtitle: 'Caravan classifieds',
    category: 'Marketplace',
    description:
      'An Arabic, right-to-left classifieds site for caravans, motorhomes and tow trailers in Qatar, with dashboards for merchants and staff. Buyers browse by section and reach the seller directly by phone or WhatsApp; the owner earns from paid listings and banners.',
    role: 'Full-stack: Laravel site and dashboards',
    stack: ['Laravel', 'PHP', 'MySQL', 'Blade', 'Alpine.js'],
    highlights: [
      'Server-rendered pages, light enough for a phone on mobile data',
      'Three levels of sections, paid listings and VIP banner slots',
      'Merchant and staff dashboards, with Arabic PDF invoices',
      'Sign-in with one-time codes sent to the phone',
    ],
    problem:
      'Caravan buyers in Qatar browse on their phones, often from a WhatsApp link or a search result, and want to reach the seller without a middleman.',
    solution:
      'A server-rendered Laravel site that loads fast on mobile data and can be indexed by search engines, with merchant and staff dashboards, paid listings, VIP banner slots and Arabic PDF invoices.',
    contribution: 'Built the site and both dashboards from the client\'s specification and clickable prototype.',
    details: [
      'Listing photos processed in a queue into WebP with a watermark.',
      'Listings expire on a daily schedule in Qatar time.',
      'Search-ready pages: canonical tags, Open Graph and structured data on every listing.',
      'Light and dark themes.',
    ],
    status: 'Live',
    year: '2026',
    featured: true,
    layout: 'split',
    theme: { accent: '#f07a2a', deep: '#6b2e08', bg: '#110c08' },
    link: { label: 'caravangates.com', href: 'https://www.caravangates.com' },
    visual: 'listings',
    gallery: [
      { type: 'image', src: 'projects/qatar-gates/d1.webp', alt: 'Homepage with VIP banners and latest listings', caption: 'Homepage, from the clickable prototype' },
      { type: 'image', src: 'projects/qatar-gates/m1.webp', alt: 'The homepage on a phone', caption: 'On a phone' },
    ],
  },
  {
    id: 'mudaraj-al-anabi',
    title: 'Mudaraj Al-Anabi',
    subtitle: 'App for fans of Qatar\'s national team',
    category: 'Sport & fans',
    description: 'An Arabic-first app for supporters of Qatar\'s national football team, built for a supporters\' association: membership, match day with live scores, free-ticket requests, away-day travel groups and chants, on iOS and Android. The essentials (the membership card, downloaded tickets, fixtures) work offline.',
    role: 'Flutter app; migrated and extended the inherited Django backend',
    stack: ['Flutter', 'Riverpod', 'Dio', 'Hive', 'Django'],
    highlights: [
      'A digital membership card whose QR code refreshes every minute',
      'Live scores pushed to open apps, and chants kept in sync across phones',
      'An offline ticket wallet, and away-day journeys with group rooms',
      'Phone sign-in with one-time codes',
    ],
    problem:
      'Supporters needed one place for membership, match day, ticket requests and away-day travel, with the essentials still available without a connection.',
    solution:
      'An Arabic-first Flutter app with a dynamic-QR membership card, live match day with chants synced across phones, ticket requests, and travel journeys with boarding passes and group rooms, on top of the existing Django backend.',
    contribution:
      'Built the Flutter app and added the endpoints it needed to the Django backend that a previous developer had started.',
    details: [
      'Chant playback aligned to a server timestamp, so every phone sings together.',
      'Offline cache in Hive; tokens in secure storage.',
      'Typed models with freezed, state and dependency injection with Riverpod.',
      'Western digits throughout a right-to-left interface.',
    ],
    status: 'In TestFlight',
    year: '2026',
    featured: true,
    layout: 'split',
    theme: { accent: '#e2b655', deep: '#7a1f3d', bg: '#12080c' },
    visual: 'stadium',
  },
]

/** CSS custom properties that put a project's light on an element. */
export const themeVars = (t: Theme) =>
  ({ '--pv-accent': t.accent, '--pv-deep': t.deep, '--pv-bg': t.bg }) as CSSProperties
