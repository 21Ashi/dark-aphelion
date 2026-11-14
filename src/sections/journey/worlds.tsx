import type { CSSProperties, ReactNode } from 'react'
import type { Project } from '../../content/projects'
import { ProjectVisual } from '../work/ProjectVisual'
import s from './Journey.module.css'

/**
 * Art direction for the Works journey: one full-screen composition per
 * project, in the order the visitor travels. Positions are in viewport units
 * (`--x`, `--y`, `--w`, `--h`); phones restack everything in CSS.
 *
 * `into` is the transition that brings this world on screen.
 */
export type Transition = 'side' | 'shatter' | 'expand' | 'blinds' | 'turn' | 'warp' | 'scan' | 'glitch'

export type WorldDef = {
  id: string
  into: Transition
  /** Where the giant title sits, and whether it is behind the visual. */
  title: { lines: { text: string; outline?: boolean; serif?: boolean }[]; at: CSSProperties; behind?: boolean; size?: string }
  /** Where the small facts block sits. */
  meta: CSSProperties
  Scene: (props: { project: Project; index: number }) => ReactNode
}

const BASE = import.meta.env.BASE_URL
const pos = (x: string, y: string, w?: string, h?: string, extra: CSSProperties = {}) =>
  ({ '--x': x, '--y': y, ...(w ? { '--w': w } : {}), ...(h ? { '--h': h } : {}), ...extra }) as CSSProperties

/** Mouse-parallax layer: the deeper, the further it travels with the pointer. */
function Depth({ d, children, className = '', style }: { d: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`${s.abs} ${className}`} style={style} data-depth={d}>
      {children}
    </div>
  )
}

function Phone({ src, alt, children, tilt }: { src?: string; alt?: string; children?: ReactNode; tilt?: string }) {
  return (
    <div className={s.phone} style={tilt ? { transform: `perspective(1600px) ${tilt}` } : undefined}>
      <div className={s.screen}>
        {src ? <img src={`${BASE}${src}`} alt={alt ?? ''} loading="lazy" decoding="async" draggable={false} /> : children}
      </div>
    </div>
  )
}

function Browser({ src, alt, url, tilt }: { src: string; alt: string; url: string; tilt?: string }) {
  return (
    <div className={s.browser} style={tilt ? { transform: `perspective(1800px) ${tilt}` } : undefined}>
      <div className={s.bar}>
        <i />
        <i />
        <i />
        <span>{url}</span>
      </div>
      <img src={`${BASE}${src}`} alt={alt} loading="lazy" decoding="async" draggable={false} />
    </div>
  )
}

function Rings({ n = 3 }: { n?: number }) {
  return (
    <svg className={s.rings} viewBox="-100 -100 200 200" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} r={40 + i * 22} className={i === 1 ? s.ringDash : undefined} />
      ))}
    </svg>
  )
}

export const WORLDS: WorldDef[] = [
  {
    id: 'mzad-al-fakher',
    into: 'side',
    title: { lines: [{ text: 'Mzad' }, { text: 'Al Fakher', outline: true }], at: { left: '4vw', top: '16vh' }, behind: true, size: '15vw' },
    meta: { left: '4vw', bottom: '9vh' },
    Scene: () => (
      <>
        <div className={s.bg} data-bg>
          <div className={s.glow} style={pos('62vw', '50vh')} />
          <div className={s.abs} style={pos('62vw', '50vh', '120vh')}>
            <Rings />
          </div>
        </div>
        <div className={s.visual} data-visual>
          <Depth d={0.6} className={s.optional} style={pos('71vw', '15vh', undefined, '64vh')}>
            <Phone src="projects/mzad-al-fakher/p1.jpg" alt="Mzad Al Fakher home screen" tilt="rotateY(-26deg) rotateZ(4deg)" />
          </Depth>
          <Depth d={1.2} className={s.hero} style={pos('49vw', '8vh', undefined, '84vh')}>
            <Phone src="projects/mzad-al-fakher/p2.jpg" alt="Live auctions with countdowns" tilt="rotateY(-14deg) rotateX(4deg) rotateZ(-2deg)" />
          </Depth>
          <Depth d={2.4} className={`${s.chip} ${s.optional}`} style={pos('40vw', '24vh')}>
            <b>Live</b> Lot 07 · 06:33
          </Depth>
          <Depth d={3} className={`${s.chip} ${s.chipBig} ${s.optional}`} style={pos('69vw', '74vh')}>
            48,500 <small>QAR</small>
          </Depth>
        </div>
      </>
    ),
  },
  {
    id: 'jola',
    into: 'shatter',
    title: { lines: [{ text: 'Jola', outline: true }], at: { left: '50%', top: '-4vh', transform: 'translateX(-50%)' }, behind: true, size: '36vw' },
    meta: { right: '4vw', top: '16vh' },
    Scene: () => {
      const shots = [
        ['63-m-vote', 'Voting round'],
        ['40-board', 'A question board'],
        ['11-night-board', "The night's standings"],
        ['85-nw-reveal', 'A round reveal'],
      ]
      return (
        <>
          <div className={s.bg} data-bg>
            <div className={s.dots} />
            <div className={s.glow} style={pos('50vw', '95vh')} />
          </div>
          <div className={s.visual} data-visual>
            {shots.map(([f, alt], i) => {
              const rot = [-15, -5, 5, 15][i]
              const x = [24, 39, 54, 69][i]
              return (
                <Depth
                  key={f}
                  d={0.8 + i * 0.4}
                  className={i === 1 ? s.hero : s.optional}
                  style={pos(`${x}vw`, `${[22, 14, 14, 22][i]}vh`, undefined, '72vh')}
                >
                  <Phone src={`projects/jola/${f}.jpg`} alt={alt} tilt={`rotateZ(${rot}deg) rotateY(${-rot}deg)`} />
                </Depth>
              )
            })}
          </div>
        </>
      )
    },
  },
  {
    id: 'qatar-gates',
    into: 'expand',
    title: { lines: [{ text: 'Qatar' }, { text: 'Gates', serif: true }], at: { left: '4vw', top: '14vh' }, size: '12vw' },
    meta: { left: '4vw', bottom: '9vh' },
    Scene: () => (
      <>
        <div className={s.bg} data-bg>
          <svg className={s.gates} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
            {Array.from({ length: 9 }, (_, i) => {
              const k = 1 - i * 0.085
              const w = 150 * k
              const h = 640 * k
              const x = 380 + i * 150 * (0.4 + k * 0.6)
              const y = 860 - h
              return <path key={i} d={`M${x} 860 V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V860`} />
            })}
            <line x1="0" x2="1600" y1="860" y2="860" />
          </svg>
        </div>
        <div className={s.visual} data-visual>
          <Depth d={1} className={s.hero} style={pos('30vw', '15vh', '58vw')}>
            <Browser
              src="projects/qatar-gates/d1.jpg"
              alt="Qatar Gates homepage with VIP banners and latest listings"
              url="caravangates.com"
              tilt="rotateY(-14deg) rotateX(5deg)"
            />
          </Depth>
          <Depth d={2.2} className={s.optional} style={pos('79vw', '34vh', undefined, '58vh')}>
            <Phone src="projects/qatar-gates/m1.jpg" alt="The homepage on a phone" tilt="rotateY(-10deg) rotateZ(3deg)" />
          </Depth>
          <Depth d={3} className={`${s.chip} ${s.optional}`} style={pos('24vw', '68vh')}>
            <b>VIP</b> Caravan · 85,000 QAR
          </Depth>
        </div>
      </>
    ),
  },
  {
    id: 'alhammadi-hajj',
    into: 'blinds',
    title: { lines: [{ text: 'Al-Hammadi' }, { text: 'Hajj', serif: true }], at: { left: '4vw', top: '14vh' }, size: '9.5vw' },
    meta: { left: '4vw', top: '52vh' },
    Scene: ({ project, index }) => (
      <>
        <div className={s.bg} data-bg>
          <div className={s.sun} />
          <div className={s.horizon} />
        </div>
        <div className={s.visual} data-visual>
          <Depth d={0.9} className={`${s.hero} ${s.panel}`} style={pos('36vw', '13vh', '58vw', '62vh')}>
            <ProjectVisual project={project} index={index} large />
          </Depth>
          <Depth d={2.6} className={`${s.ribbon} ${s.optional}`} style={pos('-2vw', '80vh')}>
            Makkah · Mina · Arafat · Muzdalifah · Mina · Makkah
          </Depth>
        </div>
      </>
    ),
  },
  {
    id: 'mudaraj-al-anabi',
    into: 'turn',
    title: { lines: [{ text: 'Mudaraj' }, { text: 'Al-Anabi', serif: true }], at: { left: '4vw', bottom: '6vh' }, size: '13vw' },
    meta: { left: '4vw', top: '16vh' },
    Scene: ({ project, index }) => (
      <>
        <div className={s.bg} data-bg>
          <div className={s.beams} />
          <div className={s.stands} />
        </div>
        <div className={s.visual} data-visual>
          <Depth d={0.8} className={`${s.hero} ${s.panel}`} style={pos('34vw', '10vh', '58vw', '60vh')}>
            <ProjectVisual project={project} index={index} large />
          </Depth>
          <Depth d={2.8} className={s.optional} style={pos('70vw', '56vh', '22vw')}>
            <div className={s.card}>
              <span>Membership</span>
              <b>Al-Anabi</b>
              <i aria-hidden />
              <em>2026</em>
            </div>
          </Depth>
        </div>
      </>
    ),
  },
]
