import {
  siDjango,
  siFirebase,
  siFlutter,
  siLaravel,
  siMysql,
  siNestjs,
  siNextdotjs,
  siPhp,
  siReact,
  siSocketdotio,
  siSupabase,
  type SimpleIcon,
} from 'simple-icons'

/** Official logos (Simple Icons, CC0) for the technologies named on the slides. */
const LOGOS: Record<string, SimpleIcon> = {
  Flutter: siFlutter,
  Django: siDjango,
  React: siReact,
  'React Native': siReact,
  NestJS: siNestjs,
  'Socket.IO': siSocketdotio,
  Firebase: siFirebase,
  'Next.js': siNextdotjs,
  Supabase: siSupabase,
  Laravel: siLaravel,
  PHP: siPhp,
  MySQL: siMysql,
}

/** A brand colour too dark to read on the near-black stage is drawn in the page's white instead. */
function onDark(hex: string) {
  const n = parseInt(hex, 16)
  const ch = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const l = 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255)
  return l < 0.12 ? '#f5f0ed' : `#${hex}`
}

export function logoFor(name: string) {
  const icon = LOGOS[name]
  return icon ? { path: icon.path, color: onDark(icon.hex), title: icon.title } : null
}
