/**
 * The selected-project slide in the Works chapter: what the type column says
 * and what stands on the 3D stage. Every line is condensed from the project's
 * own facts in projects.ts; nothing here is new information.
 *
 *   lines    the name; the second line is set in the project's accent colour.
 *            A one-word name takes `kicker` as its accent line instead.
 *   front    a real screenshot (a file in /public/projects), shown in the one
 *            phone that stands centred on the pedestal. A project with no
 *            screens puts its app icon on the pedestal instead.
 *   backdrop optional photo behind the stage, supplied by the owner (WebP in
 *            /public/projects/<id>/).
 */
export type Screen = { src: string; crop?: [number, number] }
export type Slide = {
  lines: [string] | [string, string]
  kicker?: string
  tagline: string
  features: [Feature, Feature, Feature]
  stack: string[]
  front?: Screen
  backdrop?: Backdrop
}
/**
 * `focus`: a point of the photo (0–1, from the top left).
 *   anchor 'beside' (default): the focus is kept in view to the right of the stage, and the
 *     photo sits far behind it, drifting a little against it as the view moves.
 *   anchor 'stage': the photo has a stage of its own; its focus (the top of the photo's
 *     pedestal) is placed right behind the 3D pedestal and moves with it.
 */
export type Backdrop = { src: string; focus: [number, number]; anchor?: 'beside' | 'stage' }
/** `icon`: a Phosphor icon, by name (mapped in sections/work/Slide.tsx, so the 3D scene never loads icons). */
export type Feature = { icon: FeatureIcon; label: string }
export type FeatureIcon =
  | 'browser'
  | 'crown'
  | 'game-controller'
  | 'gavel'
  | 'hand-heart'
  | 'headphones'
  | 'identification-card'
  | 'lifebuoy'
  | 'lightning'
  | 'lock-key'
  | 'qr-code'
  | 'receipt'
  | 'shopping-bag'
  | 'soccer-ball'
  | 'storefront'
  | 'ticket'
  | 'users-three'
  | 'wifi-slash'

/** es7a's only screenshot is a render that includes its phone: crop the frame off. */
const ES7A: Screen = { src: 'projects/es7a/p1.webp', crop: [0.045, 0.022] }

export const SLIDES: Record<string, Slide> = {
  'alhammadi-hajj': {
    lines: ['Al-Hammadi', 'Hajj'],
    tagline: 'One platform for a Hajj campaign, built to keep working offline in Mina and Arafat.',
    features: [
      { icon: 'wifi-slash', label: 'Works offline' },
      { icon: 'users-three', label: 'Six user roles' },
      { icon: 'hand-heart', label: 'Made for elders' },
    ],
    stack: ['Flutter', 'Django', 'React'],
    front: { src: 'projects/alhammadi-hajj/p1.webp' },
    backdrop: { src: 'projects/alhammadi-hajj/backdrop.webp', focus: [0.84, 0.52] },
  },
  'mzad-al-fakher': {
    lines: ['Mzad', 'Al Fakher'],
    tagline: 'Live auctions and a shop for a luxury store in Doha, with every bid decided on the server.',
    features: [
      { icon: 'gavel', label: 'Live bidding' },
      { icon: 'receipt', label: 'Deposits & receipts' },
      { icon: 'shopping-bag', label: 'Shop & pickup' },
    ],
    stack: ['Flutter', 'NestJS', 'Socket.IO'],
    front: { src: 'projects/mzad-al-fakher/p2.webp' },
    backdrop: { src: 'projects/mzad-al-fakher/backdrop.webp', focus: [0.686, 0.805], anchor: 'stage' },
  },
  es7a: {
    lines: ['Es7a'],
    kicker: 'Recovery & habit-building',
    tagline: 'An Arabic recovery and habit-building app, built around one short audio session a day.',
    features: [
      { icon: 'headphones', label: 'Daily audio dose' },
      { icon: 'lifebuoy', label: 'Panic button' },
      { icon: 'lock-key', label: 'Private by design' },
    ],
    stack: ['Flutter', 'Firebase', 'Next.js'],
    front: ES7A,
    // composed for this layout: kept as it is, the arch around the stage
    backdrop: { src: 'projects/es7a/backdrop.webp', focus: [0.9, 0.5] },
  },
  jola: {
    lines: ['Jola'],
    kicker: 'Party games for the majlis',
    tagline: 'The host runs the night from the app; friends join from their browser with a code.',
    features: [
      { icon: 'qr-code', label: 'Join by QR' },
      { icon: 'game-controller', label: 'Five games' },
      { icon: 'browser', label: 'No install' },
    ],
    stack: ['React Native', 'Next.js', 'Supabase'],
    front: { src: 'projects/jola/40-board.webp' },
  },
  'qatar-gates': {
    lines: ['Qatar', 'Gates'],
    tagline: 'Classifieds for caravans and motorhomes in Qatar, with dashboards for merchants and staff.',
    features: [
      { icon: 'lightning', label: 'Fast on mobile' },
      { icon: 'crown', label: 'VIP listings' },
      { icon: 'storefront', label: 'Merchant dashboards' },
    ],
    stack: ['Laravel', 'PHP', 'MySQL'],
    front: { src: 'projects/qatar-gates/m1.webp' },
  },
  'mudaraj-al-anabi': {
    lines: ['Mudaraj', 'Al-Anabi'],
    tagline: 'An Arabic-first app for supporters of Qatar’s national team: membership, match day, travel.',
    features: [
      { icon: 'identification-card', label: 'Membership card' },
      { icon: 'soccer-ball', label: 'Live scores' },
      { icon: 'ticket', label: 'Offline tickets' },
    ],
    stack: ['Flutter', 'Django'],
  },
}
