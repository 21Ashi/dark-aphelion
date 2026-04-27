import { useEffect, useRef, useState } from 'react'
import { spring, interpolate, Easing } from 'remotion'
import { useScrollFrame } from '../hooks/useScrollFrame'
import { useCountUp } from '../hooks/useCountUp'

const FPS = 30

const STATS = [
  { value: 15000, suffix: '+', label: 'Game Downloads', sublabel: '"Wrong Answers" on Android & iOS', color: '#1a56db' },
  { value: 4, suffix: '+', label: 'Live Production Apps', sublabel: 'Used by real enterprise clients daily', color: '#0ea5e9' },
  { value: 45, suffix: '%', label: 'Process Reduction', sublabel: 'Via LLM automation at Optimiza', color: '#8b5cf6' },
  { value: 2, suffix: ' yrs', label: 'Game Dev Experience', sublabel: 'Solo indie game development', color: '#22c55e' },
]

function StatCard({ stat, delay, frame }) {
  const started = frame >= delay
  const count = useCountUp(stat.value, 2200, started)

  const opacity = interpolate(frame, [delay, delay + 25], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const cardScale = spring({
    frame: Math.max(0, frame - delay),
    fps: FPS,
    config: { damping: 12, stiffness: 100 },
    from: 0.85, to: 1,
  })
  const cardY = interpolate(frame, [delay, delay + 40], [32, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  })

  const displayValue = stat.value >= 1000
    ? count.toLocaleString()
    : count.toString()

  return (
    <div style={{
      opacity,
      transform: `translateY(${cardY}px) scale(${cardScale})`,
      background: 'var(--bg-card)',
      border: `1px solid var(--border)`,
      borderRadius: 16, padding: '36px 28px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`,
      }} />
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 100, height: 100, borderRadius: '50%',
        background: `${stat.color}08`,
      }} />

      <div style={{
        fontSize: 'clamp(2.4rem, 5vw, 3.2rem)',
        fontWeight: 900,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '-0.04em',
        color: stat.color,
        lineHeight: 1,
        marginBottom: 8,
        textShadow: `0 0 30px ${stat.color}66`,
      }}>
        {displayValue}{stat.suffix}
      </div>

      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
        {stat.label}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
        {stat.sublabel}
      </div>
    </div>
  )
}

export function Achievements() {
  const { frame, ref } = useScrollFrame({ fps: FPS, totalFrames: 160 })

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const titleY = interpolate(frame, [0, 35], [24, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  return (
    <section
      id="achievements"
      ref={ref}
      style={{
        padding: '100px 2rem',
        background: 'linear-gradient(to bottom, transparent, rgba(26,86,219,0.04), transparent)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: 'center', marginBottom: 64 }}>
          <div style={labelStyle}>By the Numbers</div>
          <h2 style={headingStyle}>Achievements</h2>
          <p style={subStyle}>Shipped work that makes a measurable difference.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 24,
        }}>
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} delay={30 + i * 20} frame={frame} />
          ))}
        </div>
      </div>
    </section>
  )
}

const labelStyle = {
  display: 'inline-block',
  fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
  color: '#1a56db', letterSpacing: '0.12em', textTransform: 'uppercase',
  marginBottom: 12,
  background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.25)',
  borderRadius: 4, padding: '4px 12px',
}

const headingStyle = {
  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
  fontWeight: 800, letterSpacing: '-0.03em',
  color: 'var(--text)', marginBottom: 12,
}

const subStyle = {
  fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6,
}
