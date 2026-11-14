import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from 'react'
import { themeVars, type Project } from '../../content/projects'
import s from './ProjectVisual.module.css'

/**
 * Procedural stand-ins for project media: each project gets a small, living
 * motion graphic in the site's palette. Set `media` on a project to replace
 * it with a real image or video. Animations pause off-screen.
 */
export function ProjectVisual({ project, index, large = false }: { project: Project; index: number; large?: boolean }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => (el.dataset.playing = e.isIntersecting ? 'true' : 'false'), {
      rootMargin: '10% 30%',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const fig = `FIG. ${String(index + 1).padStart(2, '0')}`
  const uid = 'pv' + useId().replace(/[^a-zA-Z0-9]/g, '')

  return (
    <div
      ref={root}
      className={`${s.frame} ${large ? s.large : ''}`}
      style={themeVars(project.theme)}
      data-playing="false"
      aria-hidden
    >
      <Ids.Provider value={uid}>
      {project.media ? (
        project.media.type === 'video' ? (
          <video
            className={s.media}
            src={`${import.meta.env.BASE_URL}${project.media.src}`}
            poster={project.media.poster ? `${import.meta.env.BASE_URL}${project.media.poster}` : undefined}
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <img className={s.media} src={`${import.meta.env.BASE_URL}${project.media.src}`} alt="" loading="lazy" />
        )
      ) : (
        <Art kind={project.visual} />
      )}
      </Ids.Provider>
      <span className={s.corner} data-c="tl" />
      <span className={s.corner} data-c="tr" />
      <span className={s.corner} data-c="bl" />
      <span className={s.corner} data-c="br" />
      <span className={s.fig}>
        {fig} — {project.subtitle}
      </span>
      <span className={s.scan} />
    </div>
  )
}

function Art({ kind }: { kind: Project['visual'] }) {
  switch (kind) {
    case 'radar':
      return <Radar />
    case 'route':
      return <Route />
    case 'vision':
      return <Vision />
    case 'tickets':
      return <Tickets />
    case 'game':
      return <Game />
    case 'pilgrimage':
      return <Pilgrimage />
    case 'auction':
      return <Auction />
    case 'dose':
      return <Dose />
    case 'party':
      return <Party />
    case 'listings':
      return <Listings />
    case 'stadium':
      return <Stadium />
    case 'bluff':
      return <Bluff />
  }
}

/** Per-instance ids for the gradients below, so each preview can use its own project's colours. */
const Ids = createContext('pv')
function useIds() {
  const u = useContext(Ids)
  return { grid: `${u}-grid`, glow: `${u}-glow`, sweep: `${u}-sweep`, dawn: `${u}-dawn` }
}

function Svg({ children }: { children: ReactNode }) {
  const ids = useIds()
  return (
    <svg className={s.svg} viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={ids.grid} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="rgba(245,240,237,0.05)" strokeWidth="1" />
        </pattern>
        <radialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: 'var(--pv-accent)', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: 'var(--pv-accent)', stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={ids.sweep} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: 'var(--pv-accent)', stopOpacity: 0 }} />
          <stop offset="100%" style={{ stopColor: 'var(--pv-accent)', stopOpacity: 0.45 }} />
        </linearGradient>
        <linearGradient id={ids.dawn} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--pv-bg)', stopOpacity: 0 }} />
          <stop offset="55%" style={{ stopColor: 'var(--pv-deep)', stopOpacity: 0.45 }} />
          <stop offset="100%" style={{ stopColor: 'var(--pv-accent)', stopOpacity: 0.5 }} />
        </linearGradient>
      </defs>
      <rect width="800" height="560" fill="var(--pv-bg)" />
      <rect width="800" height="560" fill={`url(#${ids.grid})`} />
      {children}
    </svg>
  )
}

/* 01 — Cyber risk radar */
function Radar() {
  const ids = useIds()
  const blips = [
    [120, 0.62, 'CRITICAL'],
    [205, 0.38, 'HIGH'],
    [300, 0.78, 'HIGH'],
    [40, 0.28, 'MED'],
    [255, 0.55, 'MED'],
    [160, 0.84, 'LOW'],
  ] as const
  return (
    <Svg>
      <circle cx="400" cy="280" r="250" fill={`url(#${ids.glow})`} />
      <g fill="none" stroke="rgba(245,240,237,0.16)">
        {[60, 120, 180, 240].map((r) => (
          <circle key={r} cx="400" cy="280" r={r} />
        ))}
      </g>
      <g stroke="rgba(245,240,237,0.08)">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2
          return <line key={i} x1="400" y1="280" x2={400 + Math.cos(a) * 250} y2={280 + Math.sin(a) * 250} />
        })}
      </g>
      <g className={s.sweep}>
        <path d="M400 280 L650 280 A250 250 0 0 0 616.5 155 Z" fill={`url(#${ids.sweep})`} />
        <line x1="400" y1="280" x2="650" y2="280" stroke="var(--pv-accent)" strokeWidth="1.5" />
      </g>
      {blips.map(([deg, r, label], i) => {
        const a = (-deg * Math.PI) / 180
        const x = 400 + Math.cos(a) * r * 240
        const y = 280 + Math.sin(a) * r * 240
        return (
          <g key={i} className={s.blip} style={{ animationDelay: `${(deg / 360) * 4 - 4}s` }}>
            <circle cx={x} cy={y} r="5" fill={label === 'CRITICAL' ? 'var(--pv-accent)' : '#f5f0ed'} />
            <circle cx={x} cy={y} r="14" fill="none" stroke="var(--pv-accent)" strokeOpacity="0.6" />
            <text x={x + 18} y={y + 4} className={s.svgMono}>
              {label}
            </text>
          </g>
        )
      })}
      <g className={s.svgMono}>
        <text x="40" y="500">ASSESSMENT · LIVE</text>
        <text x="40" y="520" fill="var(--pv-accent)">
          CONTROLS 112 / FINDINGS 26
        </text>
      </g>
    </Svg>
  )
}

/* 02 — Delivery route across a city grid */
function Route() {
  const route = 'M120 460 L120 380 L260 380 L260 250 L420 250 L420 170 L560 170 L560 110 L680 110'
  return (
    <Svg>
      <g stroke="rgba(245,240,237,0.1)" strokeWidth="10" strokeLinecap="square">
        {[110, 170, 250, 380, 460].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="800" y2={y} />
        ))}
        {[120, 260, 420, 560, 680].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="560" />
        ))}
      </g>
      <path d="M-20 320 C 160 300, 300 520, 820 470" fill="none" stroke="var(--pv-d35)" strokeWidth="26" />
      <path d={route} fill="none" stroke="rgba(245,240,237,0.18)" strokeWidth="3" strokeDasharray="2 10" />
      <path d={route} fill="none" stroke="var(--pv-accent)" strokeWidth="3" className={s.routeLine} pathLength={1} />
      <circle r="8" fill="#f5f0ed" className={s.courier}>
        <animateMotion dur="6s" repeatCount="indefinite" path={route} keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear" />
      </circle>
      <g>
        <circle cx="120" cy="460" r="10" fill="none" stroke="#f5f0ed" strokeWidth="2" />
        <text x="140" y="490" className={s.svgMono}>
          PICKUP
        </text>
        <circle cx="680" cy="110" r="14" fill="var(--pv-accent)" className={s.pulse} />
        <circle cx="680" cy="110" r="5" fill="var(--pv-bg)" />
        <text x="604" y="80" className={s.svgMono}>
          CUSTOMER
        </text>
      </g>
      <g className={s.svgMono}>
        <text x="520" y="500">DRIVER APP ⇄ CUSTOMER APP</text>
        <text x="520" y="520" fill="var(--pv-accent)">
          TRACKING · REAL-TIME
        </text>
      </g>
    </Svg>
  )
}

/* 03 — Camera recognising ingredients */
function Vision() {
  const items = [
    { cx: 260, cy: 300, r: 86, fill: 'var(--pv-deep)', label: 'tomato', p: '0.97' },
    { cx: 470, cy: 230, r: 62, fill: '#e9e1dc', label: 'garlic', p: '0.92' },
    { cx: 520, cy: 400, r: 48, fill: '#4a4040', label: 'pepper', p: '0.88' },
  ]
  return (
    <Svg>
      {items.map((it) => (
        <g key={it.label}>
          <circle cx={it.cx} cy={it.cy} r={it.r} fill={it.fill} opacity="0.85" />
          <circle cx={it.cx - it.r * 0.3} cy={it.cy - it.r * 0.35} r={it.r * 0.25} fill="#fff" opacity="0.08" />
        </g>
      ))}
      {items.map((it, i) => (
        <g key={`b${it.label}`} className={s.detect} style={{ animationDelay: `${i * 0.9}s` }}>
          <rect
            x={it.cx - it.r - 10}
            y={it.cy - it.r - 10}
            width={(it.r + 10) * 2}
            height={(it.r + 10) * 2}
            fill="none"
            stroke="var(--pv-accent)"
            strokeWidth="2"
          />
          <rect x={it.cx - it.r - 11} y={it.cy - it.r - 34} width="128" height="24" fill="var(--pv-accent)" />
          <text x={it.cx - it.r - 3} y={it.cy - it.r - 17} className={s.svgMono} fill="var(--pv-bg)">
            {it.label} {it.p}
          </text>
        </g>
      ))}
      <line x1="60" x2="740" y1="0" y2="0" stroke="#f5f0ed" strokeOpacity="0.5" className={s.scanLine} />
      <g fill="none" stroke="#f5f0ed" strokeWidth="2">
        <path d="M60 100 V60 H100" />
        <path d="M700 60 H740 V100" />
        <path d="M60 460 V500 H100" />
        <path d="M740 460 V500 H700" />
      </g>
      <g className={s.svgMono}>
        <text x="600" y="540" fill="var(--pv-accent)">
          3 RECIPES MATCHED
        </text>
      </g>
    </Svg>
  )
}

/* 04 — Support tickets flowing through a queue */
function Tickets() {
  const rows = [
    ['#4821', 'VPN access denied', 'OPEN'],
    ['#4822', 'Printer offline — floor 3', 'IN PROGRESS'],
    ['#4823', 'New laptop request', 'RESOLVED'],
    ['#4824', 'Password reset', 'RESOLVED'],
    ['#4825', 'ERP sync failure', 'OPEN'],
    ['#4826', 'Mailbox quota', 'IN PROGRESS'],
    ['#4827', 'Badge reader error', 'OPEN'],
  ]
  const all = [...rows, ...rows]
  return (
    <Svg>
      <g className={s.svgMono} fill="#888080">
        <text x="60" y="64">TICKET</text>
        <text x="190" y="64">SUBJECT</text>
        <text x="560" y="64">STATUS</text>
        <text x="690" y="64">ROLE</text>
      </g>
      <line x1="60" x2="740" y1="80" y2="80" stroke="rgba(245,240,237,0.2)" />
      <svg x="0" y="90" width="800" height="420" viewBox="0 0 800 420" overflow="hidden">
        <g className={s.queue}>
          {all.map(([id, subject, status], i) => (
            <g key={i} transform={`translate(0 ${i * 60})`}>
              <rect x="60" y="6" width="680" height="48" fill={i % 7 === 0 ? 'var(--pv-a08)' : 'rgba(245,240,237,0.025)'} />
              <text x="76" y="36" className={s.svgMono} fill="#f5f0ed">
                {id}
              </text>
              <text x="190" y="37" className={s.svgSans}>
                {subject}
              </text>
              <rect
                x="552"
                y="18"
                width={status.length * 9 + 18}
                height="24"
                fill={status === 'OPEN' ? 'var(--pv-accent)' : 'none'}
                stroke={status === 'RESOLVED' ? 'rgba(245,240,237,0.25)' : 'var(--pv-accent)'}
              />
              <text x="561" y="35" className={s.svgMono} fill={status === 'OPEN' ? 'var(--pv-bg)' : status === 'RESOLVED' ? '#888080' : 'var(--pv-accent)'}>
                {status}
              </text>
              <text x="690" y="36" className={s.svgMono} fill="#888080">
                {['AGENT', 'ADMIN', 'USER'][i % 3]}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <line x1="60" x2="740" y1="520" y2="520" stroke="rgba(245,240,237,0.2)" />
    </Svg>
  )
}

/* 05 — Indie game: questions, answers, and the wrong ones */
function Game() {
  const ids = useIds()
  return (
    <Svg>
      <circle cx="400" cy="260" r="220" fill={`url(#${ids.glow})`} />
      <text x="400" y="380" textAnchor="middle" className={s.glyph}>
        ?
      </text>
      {['A', 'B', 'C', 'D'].map((l, i) => (
        <g key={l} className={s.chip} style={{ animationDelay: `${i * 0.6}s` }}>
          <rect x={90 + i * 160} y="440" width="140" height="56" fill="none" stroke={i === 2 ? 'var(--pv-accent)' : 'rgba(245,240,237,0.35)'} />
          <text x={110 + i * 160} y="475" className={s.svgMono} fill={i === 2 ? 'var(--pv-accent)' : '#f5f0ed'}>
            {l}
          </text>
          {i === 2 && (
            <path d={`M${190 + i * 160} 456 l24 24 m0 -24 l-24 24`} stroke="var(--pv-accent)" strokeWidth="3" className={s.cross} />
          )}
        </g>
      ))}
      <g className={s.svgMono}>
        <text x="60" y="70">ANDROID · iOS</text>
        <text x="60" y="90" fill="var(--pv-accent)">
          15,000+ DOWNLOADS
        </text>
      </g>
    </Svg>
  )
}

/** Deterministic pseudo-random in [0, 1) so the art is the same on every render. */
const rand = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Items that arrive one by one and then all clear together, on one loop.
 * `animation-delay` can't do that (each item's loop would drift by its delay),
 * so each item gets its own keyframes: hidden until `start`%, in, held until
 * `hold`%, out. Use with the `.seq` class and `animationName: name-<k>`.
 */
function SeqKeyframes({ name, starts, hold = 88 }: { name: string; starts: number[]; hold?: number }) {
  const css = starts
    .map(
      (p, k) =>
        `@keyframes ${name}-${k}{0%,${p}%{opacity:0;transform:translateY(12px) scale(.6)}${p + 4}%{opacity:1;transform:none}${hold}%{opacity:1;transform:none}${hold + 5}%,100%{opacity:0;transform:none}}`,
    )
    .join('')
  return <style>{css}</style>
}

/* Hajj — the itinerary, read right to left, working with no network */
function Pilgrimage() {
  const ids = useIds()
  const stations = ['MAKKAH', 'MINA', 'ARAFAT', 'MUZDALIFAH', 'MINA', 'MAKKAH']
  const current = 2
  const x = (i: number) => 710 - i * 124
  return (
    <Svg>
      <circle cx="400" cy="300" r="260" fill={`url(#${ids.glow})`} />
      <text x="400" y="112" textAnchor="middle" className={`${s.svgMono} ${s.topLabel}`} fill="#888080">
        PROGRAMME · DAY 2
      </text>

      {/* offline ↔ synced chip */}
      <g className={s.swapA}>
        <rect x="296" y="132" width="208" height="30" fill="none" stroke="var(--pv-accent)" />
        <circle cx="314" cy="147" r="4" fill="var(--pv-accent)" />
        <text x="326" y="152" className={s.svgMono} fill="var(--pv-accent)">
          OFFLINE · SAVED
        </text>
      </g>
      <g className={s.swapB}>
        <rect x="296" y="132" width="208" height="30" fill="var(--pv-accent)" />
        <circle cx="314" cy="147" r="4" fill="var(--pv-bg)" />
        <text x="326" y="152" className={s.svgMono} fill="var(--pv-bg)">
          SYNCED · 0 PENDING
        </text>
      </g>

      <text x="400" y="300" textAnchor="middle" className={s.displayOutline}>
        ARAFAT
      </text>
      <text x="400" y="342" textAnchor="middle" className={s.serifText}>
        the day the network goes quiet
      </text>

      {/* timeline, right to left */}
      <line x1={x(5)} x2={x(0)} y1="400" y2="400" stroke="rgba(245,240,237,0.18)" strokeWidth="2" />
      <line
        x1={x(0)}
        x2={x(current)}
        y1="400"
        y2="400"
        stroke="var(--pv-accent)"
        strokeWidth="3"
        pathLength={1}
        className={s.routeLine}
      />
      {stations.map((name, i) => (
        <g key={i}>
          {i === current && <circle cx={x(i)} cy="400" r="16" fill="var(--pv-accent)" className={s.pulse} />}
          <circle
            cx={x(i)}
            cy="400"
            r={i === current ? 10 : 7}
            fill={i < current ? '#f5f0ed' : i === current ? 'var(--pv-accent)' : 'var(--pv-bg)'}
            stroke={i > current ? 'rgba(245,240,237,0.5)' : 'none'}
            strokeWidth="2"
          />
          <text
            x={x(i)}
            y="436"
            textAnchor="middle"
            className={s.svgMono}
            fill={i === current ? 'var(--pv-accent)' : i < current ? '#f5f0ed' : '#888080'}
            fontSize="11"
          >
            {name}
          </text>
        </g>
      ))}
      <g className={s.svgMono} textAnchor="middle">
        <text x="400" y="500">BUS 04 · NEXT STOP MUZDALIFAH</text>
        <text x="400" y="520" fill="var(--pv-accent)">
          OFFLINE-FIRST · ARABIC / RTL
        </text>
      </g>
    </Svg>
  )
}

/* Mzad — a live lot: the clock runs down while bids land */
function Auction() {
  const ids = useIds()
  const bids = [48500, 47000, 45500, 44000, 42500, 41000, 39500]
  const rowH = 56
  const all = [...bids, ...bids]
  const fmt = (n: number) => n.toLocaleString('en-US')
  return (
    <Svg>
      <circle cx="230" cy="280" r="230" fill={`url(#${ids.glow})`} />
      <g stroke="rgba(245,240,237,0.22)">
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2
          const r1 = i % 5 === 0 ? 140 : 146
          return (
            <line
              key={i}
              x1={230 + Math.cos(a) * r1}
              y1={280 + Math.sin(a) * r1}
              x2={230 + Math.cos(a) * 152}
              y2={280 + Math.sin(a) * 152}
            />
          )
        })}
      </g>
      <circle cx="230" cy="280" r="124" fill="none" stroke="rgba(245,240,237,0.1)" strokeWidth="8" />
      <circle
        cx="230"
        cy="280"
        r="124"
        fill="none"
        stroke="var(--pv-accent)"
        strokeWidth="8"
        pathLength={1}
        transform="rotate(-90 230 280)"
        className={s.deplete}
      />
      <text x="230" y="248" textAnchor="middle" className={s.svgMono} fill="#888080">
        LOT 07 · CURRENT BID
      </text>
      <text x="230" y="310" textAnchor="middle" className={s.displaySm}>
        {fmt(bids[0])}
      </text>
      <text x="230" y="338" textAnchor="middle" className={s.svgMono} fill="var(--pv-accent)">
        QAR
      </text>

      <g>
        <circle cx="432" cy="108" r="12" fill="var(--pv-accent)" className={s.pulse} />
        <circle cx="432" cy="108" r="5" fill="var(--pv-accent)" />
        <text x="450" y="113" className={s.svgMono}>
          LIVE BIDS
        </text>
      </g>
      <line x1="420" x2="690" y1="132" y2="132" stroke="rgba(245,240,237,0.2)" />
      <svg x="0" y="136" width="800" height="336" viewBox="0 0 800 336" overflow="hidden">
        <g className={s.feed}>
          {all.map((b, i) => (
            <g key={i} transform={`translate(0 ${i * rowH})`}>
              <rect x="420" y="6" width="270" height={rowH - 10} fill={i % bids.length === 0 ? 'var(--pv-a12)' : 'rgba(245,240,237,0.03)'} />
              <text x="434" y="35" className={s.svgMono} fill="#888080">
                BIDDER {String(((i * 7) % 23) + 3).padStart(2, '0')}
              </text>
              <text x="676" y="36" textAnchor="end" className={s.svgSans} fill={i % bids.length === 0 ? 'var(--pv-accent)' : '#f5f0ed'}>
                {fmt(b)}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <g className={s.svgMono}>
        <text x="420" y="500">ANTI-SNIPING · MAX BIDS</text>
        <text x="420" y="520" fill="var(--pv-accent)">
          PRICES DECIDED ON THE SERVER
        </text>
      </g>
    </Svg>
  )
}

/* Es7a — a calm morning dose: breathing ring, audio, the streak, dawn */
function Dose() {
  const ids = useIds()
  const bars = 48
  const days = [17, 18, 19, 20, 21, 22, 23]
  return (
    <Svg>
      <rect y="240" width="800" height="320" fill={`url(#${ids.dawn})`} />
      {Array.from({ length: 26 }, (_, i) => (
        <circle
          key={i}
          cx={30 + rand(i) * 740}
          cy={40 + rand(i + 40) * 200}
          r={rand(i + 80) > 0.8 ? 1.8 : 1.1}
          fill="#f5f0ed"
          className={s.twinkle}
          style={{ animationDelay: `${-rand(i + 120) * 4}s` }}
        />
      ))}
      <g className={s.rise}>
        <circle cx="400" cy="520" r="120" fill="var(--pv-accent)" opacity="0.18" />
        <circle cx="400" cy="520" r="70" fill="var(--pv-accent)" opacity="0.35" />
      </g>
      <line x1="0" x2="800" y1="470" y2="470" stroke="rgba(245,240,237,0.25)" />

      <circle cx="400" cy="230" r="96" fill="none" stroke="rgba(245,240,237,0.25)" className={s.breathe} />
      <g>
        {Array.from({ length: bars }, (_, i) => (
          <g key={i} transform={`rotate(${(i / bars) * 360} 400 230)`}>
            <rect
              x="398.5"
              y={230 - 150}
              width="3"
              height={14 + rand(i) * 26}
              fill={i < bars * 0.62 ? 'var(--pv-accent)' : 'rgba(245,240,237,0.3)'}
              className={s.eq}
              style={{ animationDelay: `${-rand(i + 7) * 1.6}s` }}
            />
          </g>
        ))}
      </g>
      <text x="400" y="252" textAnchor="middle" className={s.displaySm}>
        23
      </text>
      <text x="400" y="280" textAnchor="middle" className={s.svgMono} fill="#888080">
        DAYS
      </text>

      <g>
        {days.map((d, i) => {
          const cx = 400 + (i - 3) * 44
          const today = i === days.length - 1
          return (
            <g key={d}>
              <rect
                x={cx - 16}
                y="392"
                width="32"
                height="32"
                fill={today ? 'var(--pv-accent)' : 'rgba(245,240,237,0.08)'}
                stroke={today ? 'none' : 'rgba(245,240,237,0.25)'}
                className={today ? s.blinkSoft : undefined}
              />
              <text x={cx} y="413" textAnchor="middle" className={s.svgMono} fontSize="11" fill={today ? 'var(--pv-bg)' : '#f5f0ed'}>
                {d}
              </text>
            </g>
          )
        })}
      </g>
      <text x="60" y="110" className={`${s.svgMono} ${s.topLabel}`} fill="#888080">
        TODAY'S DOSE · 02:40
      </text>
      <g className={s.svgMono}>
        <text x="60" y="500">AFTER FAJR · ONE SMALL TASK</text>
        <text x="60" y="520" fill="var(--pv-accent)">
          PRIVATE · STAYS ON THE PHONE
        </text>
      </g>
    </Svg>
  )
}

/* Jola — one screen for the room, phones joining from the browser */
function Party() {
  const ids = useIds()
  const glyphs = ['circle', 'tri', 'square', 'cross', 'diamond', 'new'] as const
  const tile = (g: (typeof glyphs)[number], cx: number, cy: number) => {
    switch (g) {
      case 'circle':
        return <circle cx={cx} cy={cy} r="18" fill="none" stroke="#f5f0ed" strokeWidth="3" />
      case 'tri':
        return <path d={`M${cx} ${cy - 20} L${cx + 20} ${cy + 15} L${cx - 20} ${cy + 15} Z`} fill="none" stroke="#f5f0ed" strokeWidth="3" />
      case 'square':
        return <rect x={cx - 16} y={cy - 16} width="32" height="32" fill="none" stroke="#f5f0ed" strokeWidth="3" />
      case 'cross':
        return <path d={`M${cx - 16} ${cy - 16} L${cx + 16} ${cy + 16} M${cx + 16} ${cy - 16} L${cx - 16} ${cy + 16}`} stroke="#f5f0ed" strokeWidth="3" />
      case 'diamond':
        return <path d={`M${cx} ${cy - 20} L${cx + 20} ${cy} L${cx} ${cy + 20} L${cx - 20} ${cy} Z`} fill="none" stroke="#f5f0ed" strokeWidth="3" />
      case 'new':
        return (
          <text x={cx} y={cy + 6} textAnchor="middle" className={s.svgMono} fill="#888080">
            NEXT
          </text>
        )
    }
  }
  const qr = Array.from({ length: 81 }, (_, i) => i).filter((i) => rand(i + 3) > 0.48)
  return (
    <Svg>
      <circle cx="330" cy="230" r="240" fill={`url(#${ids.glow})`} />
      {/* the TV */}
      <rect x="120" y="100" width="360" height="240" fill="#151111" stroke="rgba(245,240,237,0.4)" strokeWidth="2" />
      <line x1="260" x2="340" y1="356" y2="356" stroke="rgba(245,240,237,0.4)" strokeWidth="2" />
      {glyphs.map((g, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = 138 + col * 112
        const y = 118 + row * 108
        return (
          <g key={g}>
            <rect x={x} y={y} width="100" height="96" fill="rgba(245,240,237,0.03)" stroke="rgba(245,240,237,0.14)" />
            {g !== 'new' && (
              <rect
                x={x}
                y={y}
                width="100"
                height="96"
                fill="var(--pv-a14)"
                stroke="var(--pv-accent)"
                strokeWidth="2"
                className={s.tileOn}
                style={{ animationDelay: `${i * 1.4}s` }}
              />
            )}
            {tile(g, x + 50, y + 42)}
            <text x={x + 8} y={y + 86} className={s.svgMono} fontSize="10" fill="#888080">
              {String(i + 1).padStart(2, '0')}
            </text>
          </g>
        )
      })}

      {/* the room code */}
      <g>
        <rect x="510" y="100" width="170" height="240" fill="none" stroke="rgba(245,240,237,0.25)" />
        <g transform="translate(541 122)">
          {qr.map((i) => (
            <rect key={i} x={(i % 9) * 12} y={Math.floor(i / 9) * 12} width="11" height="11" fill="#f5f0ed" />
          ))}
          {[
            [0, 0],
            [72, 0],
            [0, 72],
          ].map(([px, py]) => (
            <g key={`${px}${py}`}>
              <rect x={px} y={py} width="36" height="36" fill="#151111" />
              <rect x={px + 3} y={py + 3} width="30" height="30" fill="none" stroke="#f5f0ed" strokeWidth="5" />
              <rect x={px + 12} y={py + 12} width="12" height="12" fill="var(--pv-accent)" />
            </g>
          ))}
        </g>
        <text x="595" y="262" textAnchor="middle" className={s.svgMono} fill="#888080">
          ROOM
        </text>
        <text x="595" y="314" textAnchor="middle" className={s.displaySm}>
          K7QX
        </text>
      </g>

      {/* phones joining */}
      <SeqKeyframes name="pv-join" starts={Array.from({ length: 6 }, (_, i) => 4 + i * 9)} />
      {Array.from({ length: 6 }, (_, i) => {
        const x = 140 + i * 60
        return (
          <g key={i} className={s.seq} style={{ animationName: `pv-join-${i}`, ['--dur' as string]: '8s' }}>
            <path d={`M${x + 18} 392 L300 360`} stroke="var(--pv-a35)" strokeDasharray="3 5" />
            <rect x={x} y="392" width="36" height="64" rx="7" fill="#151111" stroke="#f5f0ed" strokeOpacity="0.6" />
            <circle cx={x + 18} cy="416" r="8" fill={i === 0 ? 'var(--pv-accent)' : '#f5f0ed'} opacity={i === 0 ? 1 : 0.8} />
            <rect x={x + 8} y="432" width="20" height="4" fill="rgba(245,240,237,0.4)" />
          </g>
        )
      })}
      <g className={s.svgMono} fill="#888080">
        <text x="520" y="406">NO INSTALL</text>
        <text x="520" y="426">NO ACCOUNT</text>
      </g>
      <g className={s.svgMono} textAnchor="middle">
        <text x="400" y="500">HOST APP + BROWSER PLAYERS</text>
        <text x="400" y="520" fill="var(--pv-accent)">
          6 PLAYERS IN THE ROOM
        </text>
      </g>
    </Svg>
  )
}

/** A caravan silhouette for the classifieds cards. */
function Caravan({ x, y, w, accent = false }: { x: number; y: number; w: number; accent?: boolean }) {
  const h = w * 0.42
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="14" fill={accent ? 'var(--pv-deep)' : '#2a2222'} />
      <rect x={x + w * 0.08} y={y + h * 0.2} width={w * 0.26} height={h * 0.3} rx="4" fill="var(--pv-bg)" opacity="0.7" />
      <rect x={x + w * 0.42} y={y + h * 0.2} width={w * 0.16} height={h * 0.62} rx="3" fill="var(--pv-bg)" opacity="0.55" />
      <rect x={x + w * 0.66} y={y + h * 0.2} width={w * 0.24} height={h * 0.3} rx="4" fill="var(--pv-bg)" opacity="0.7" />
      <line x1={x + w} y1={y + h * 0.82} x2={x + w * 1.16} y2={y + h * 0.9} stroke="#888080" strokeWidth="3" />
      <circle cx={x + w * 0.3} cy={y + h} r={h * 0.18} fill="var(--pv-bg)" stroke="#888080" strokeWidth="3" />
      <circle cx={x + w * 0.46} cy={y + h} r={h * 0.18} fill="var(--pv-bg)" stroke="#888080" strokeWidth="3" />
    </g>
  )
}

/* Qatar Gates — listings, right to left, prices in QAR */
function Listings() {
  const cards = [
    { title: 'CARAVAN · 2023', price: '85,000', badge: 'VIP' },
    { title: 'MOTORHOME · 2021', price: '142,000', badge: '' },
    { title: 'TOW TRAILER · 2024', price: '23,500', badge: 'NEW' },
  ]
  const banners = ['VIP', 'VVIP', 'VIP', 'VVIP']
  return (
    <Svg>
      {/* VIP banner slider */}
      <svg x="60" y="96" width="680" height="88" viewBox="0 0 680 88" overflow="hidden">
        <g className={s.slide}>
          {[...banners, ...banners].map((b, i) => (
            <g key={i} transform={`translate(${i * 340} 0)`}>
              <rect x="0" y="0" width="328" height="88" fill={i % 2 ? 'rgba(245,240,237,0.04)' : 'var(--pv-d40)'} stroke="rgba(245,240,237,0.15)" />
              <text x="312" y="52" textAnchor="end" className={s.displayXs}>
                {b}
              </text>
              <text x="16" y="72" className={s.svgMono} fontSize="10" fill="#888080">
                BANNER {String((i % banners.length) + 1).padStart(2, '0')}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {cards.map((c, i) => {
        // right to left: the first card sits on the right
        const x = 520 - i * 230
        return (
          <g key={c.title} className={s.chip} style={{ animationDelay: `${i * 0.5}s` }}>
            <rect x={x} y="206" width="220" height="264" fill="rgba(245,240,237,0.03)" stroke="rgba(245,240,237,0.18)" />
            <rect x={x} y="206" width="220" height="130" fill="rgba(245,240,237,0.04)" />
            <Caravan x={x + 30} y={232} w={140} accent={i === 0} />
            {c.badge && (
              <g>
                <rect x={x + 10} y="216" width={c.badge.length * 9 + 16} height="22" fill="var(--pv-accent)" />
                <text x={x + 18} y="232" className={s.svgMono} fontSize="11" fill="var(--pv-bg)">
                  {c.badge}
                </text>
              </g>
            )}
            <text x={x + 206} y="364" textAnchor="end" className={s.svgMono} fontSize="11" fill="#888080">
              {c.title}
            </text>
            <text x={x + 206} y="398" textAnchor="end" className={s.svgSans} fontSize="24">
              {c.price}
              <tspan className={s.svgMono} fontSize="11" fill="var(--pv-accent)" dx="6">
                QAR
              </tspan>
            </text>
            <rect x={x + 14} y="420" width="92" height="34" fill="none" stroke="rgba(245,240,237,0.35)" />
            <text x={x + 60} y="442" textAnchor="middle" className={s.svgMono} fontSize="11">
              CALL
            </text>
            <rect x={x + 114} y="420" width="92" height="34" fill="var(--pv-accent)" />
            <text x={x + 160} y="442" textAnchor="middle" className={s.svgMono} fontSize="11" fill="var(--pv-bg)">
              WHATSAPP
            </text>
          </g>
        )
      })}
      <g className={s.svgMono}>
        <text x="740" y="510" textAnchor="end">
          ARABIC · RIGHT TO LEFT
        </text>
        <text x="740" y="530" textAnchor="end" fill="var(--pv-accent)">
          CARAVANS · MOTORHOMES · TRAILERS
        </text>
      </g>
    </Svg>
  )
}

/* Mudaraj — a tifo in the stands, a wave through it, the countdown to kick-off */
function Stadium() {
  const cols = 30
  const rows = 9
  // Serrated edge, like the flag: white on the left, maroon on the right.
  const edge = (r: number) => 8 + (r % 2 === 0 ? 0 : 2)
  return (
    <Svg>
      <g>
        {Array.from({ length: cols }, (_, c) => (
          <g key={c} className={s.wave} style={{ animationDelay: `${c * 0.07}s` }}>
            {Array.from({ length: rows }, (_, r) => (
              <circle
                key={r}
                cx={62 + c * 23.4}
                cy={104 + r * 17}
                r="6"
                fill={c < edge(r) ? '#f5f0ed' : 'var(--pv-deep)'}
                opacity={c < edge(r) ? 0.85 : 0.95}
              />
            ))}
          </g>
        ))}
      </g>
      <line x1="40" x2="760" y1="262" y2="262" stroke="rgba(245,240,237,0.3)" />

      {/* pitch lines behind the clock */}
      <g fill="none" stroke="rgba(245,240,237,0.1)" strokeWidth="2">
        <line x1="60" x2="740" y1="470" y2="470" />
        <path d="M290 470 A110 110 0 0 1 510 470" />
        <rect x="60" y="300" width="680" height="240" />
      </g>

      <text x="400" y="304" textAnchor="middle" className={s.svgMono} fill="#888080">
        NEXT MATCH · KICK-OFF IN
      </text>
      {['02', '14', '36'].map((v, i) => (
        <text key={v} x={260 + i * 140} y="396" textAnchor="middle" className={s.displaySm} fontSize="84">
          {v}
        </text>
      ))}
      {[330, 470].map((cx) => (
        <g key={cx} className={s.cross}>
          <circle cx={cx} cy="352" r="5" fill="var(--pv-accent)" />
          <circle cx={cx} cy="378" r="5" fill="var(--pv-accent)" />
        </g>
      ))}
      <g className={s.svgMono} fontSize="10" fill="#888080">
        <text x="260" y="422" textAnchor="middle">HRS</text>
        <text x="400" y="422" textAnchor="middle">MIN</text>
        <text x="540" y="422" textAnchor="middle">SEC</text>
      </g>

      <text x="400" y="500" textAnchor="middle" className={s.svgMono}>
        MEMBERS · TICKETS · AWAY DAYS
      </text>
      <g>
        {Array.from({ length: 5 }, (_, i) => (
          <rect
            key={i}
            x={294 + i * 7}
            y="510"
            width="4"
            height="16"
            fill="var(--pv-accent)"
            className={s.eq}
            style={{ animationDelay: `${-i * 0.23}s` }}
          />
        ))}
        <text x="338" y="523" className={s.svgMono} fill="var(--pv-accent)">
          LIVE CHANT · IN SYNC
        </text>
      </g>
    </Svg>
  )
}

/* Khabatha — four answers, three of them lies; the votes land, the truth is out */
function Bluff() {
  const ids = useIds()
  const answers = [
    { x: 60, y: 214, lines: [210, 150], votes: 2 },
    { x: 410, y: 214, lines: [240, 90], votes: 1 },
    { x: 60, y: 344, lines: [180, 120], votes: 3, truth: true },
    { x: 410, y: 344, lines: [230, 170], votes: 1 },
  ]
  // Every vote, in the order they land.
  const total = answers.reduce((n, a) => n + a.votes, 0)
  const starts = Array.from({ length: total }, (_, n) => Math.round(6 + n * 4.5))
  let n = 0
  return (
    <Svg>
      <SeqKeyframes name="pv-vote" starts={starts} hold={86} />
      <circle cx="230" cy="400" r="220" fill={`url(#${ids.glow})`} />
      <g className={`${s.svgMono} ${s.topLabel}`} fill="#888080">
        <text x="60" y="112">ROUND 03 · WRITE A LIE</text>
      </g>
      <rect x="60" y="134" width="380" height="14" fill="rgba(245,240,237,0.55)" />
      <rect x="456" y="134" width="120" height="14" fill="rgba(245,240,237,0.55)" />
      <line x1="592" x2="700" y1="150" y2="150" stroke="var(--pv-accent)" strokeWidth="3" />
      <rect x="704" y="128" width="3" height="24" fill="var(--pv-accent)" className={s.cross} />
      <rect x="60" y="160" width="250" height="14" fill="rgba(245,240,237,0.55)" />

      {answers.map((a, i) => (
        <g key={i}>
          <path
            d={`M${a.x} ${a.y} h330 v88 h-290 l-18 16 v-16 h-22 Z`}
            fill={a.truth ? 'var(--pv-a10)' : 'rgba(245,240,237,0.03)'}
            stroke={a.truth ? 'var(--pv-accent)' : 'rgba(245,240,237,0.3)'}
            strokeWidth={a.truth ? 2 : 1}
          />
          {a.lines.map((w, j) => (
            <rect key={j} x={a.x + 20} y={a.y + 22 + j * 24} width={w} height="10" fill="rgba(245,240,237,0.4)" />
          ))}
          {Array.from({ length: a.votes }, (_, v) => (
            <circle
              key={v}
              cx={a.x + 312 - v * 22}
              cy={a.y + 66}
              r="8"
              fill={['#f5f0ed', 'var(--pv-accent)', '#888080'][(i + v) % 3]}
              className={s.seq}
              style={{ animationName: `pv-vote-${n++}`, ['--dur' as string]: '7s' }}
            />
          ))}
          <text
            x={a.x + 20}
            y={a.y + 80}
            className={`${s.svgMono} ${s.reveal}`}
            fontSize="11"
            fill={a.truth ? 'var(--pv-accent)' : '#888080'}
          >
            {a.truth ? 'THE TRUTH' : `A LIE · FOOLED ${a.votes}`}
          </text>
        </g>
      ))}
      <g className={s.stamp}>
        <rect x="236" y="320" width="132" height="40" fill="var(--pv-accent)" transform="rotate(-6 302 340)" />
        <text x="302" y="347" textAnchor="middle" className={s.svgMono} fontSize="15" fill="var(--pv-bg)" transform="rotate(-6 302 340)">
          TRUTH
        </text>
      </g>
      <g className={s.svgMono}>
        <text x="60" y="500">REAL-TIME ROOMS · WEBSOCKETS</text>
        <text x="60" y="520" fill="var(--pv-accent)">
          ARABIC · RIGHT TO LEFT
        </text>
      </g>
    </Svg>
  )
}
