import { spring, interpolate, Easing } from 'remotion'
import { useScrollFrame } from '../hooks/useScrollFrame'

const FPS = 30

const SKILL_GROUPS = [
  {
    category: 'Mobile',
    color: '#1a56db',
    skills: [
      { name: 'Flutter / Dart', pct: 95 },
      { name: 'BLoC / Riverpod', pct: 90 },
      { name: 'Firebase', pct: 88 },
    ],
  },
  {
    category: 'Backend',
    color: '#0ea5e9',
    skills: [
      { name: 'Node.js / Express', pct: 85 },
      { name: 'C# .NET', pct: 82 },
      { name: 'Entity Framework', pct: 78 },
    ],
  },
  {
    category: 'Data & Tools',
    color: '#8b5cf6',
    skills: [
      { name: 'MySQL', pct: 80 },
      { name: 'TypeScript', pct: 82 },
      { name: 'Google Maps API', pct: 85 },
    ],
  },
]

const BADGES = [
  'Flutter', 'Dart', 'Node.js', 'C# .NET', 'TypeScript',
  'Firebase', 'MySQL', 'BLoC', 'Riverpod', 'Google Maps',
  'Unity', 'Computer Vision', 'AI / LLM', 'JWT', 'REST APIs',
]

function SkillBar({ name, pct, delay, frame, color }) {
  const barWidth = interpolate(frame, [delay, delay + 40], [0, pct], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const labelX = interpolate(frame, [delay, delay + 30], [-16, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  return (
    <div style={{ opacity, transform: `translateX(${labelX}px)`, marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)' }}>{name}</span>
        <span style={{
          fontSize: '0.75rem', fontWeight: 700,
          fontFamily: 'var(--font-mono)', color: color,
        }}>
          {Math.round(barWidth)}%
        </span>
      </div>
      <div style={{
        height: 5, borderRadius: 4,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${barWidth}%`,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${color}, ${color}99)`,
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  )
}

export function Skills() {
  const { frame, ref } = useScrollFrame({ fps: FPS, totalFrames: 180 })

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const titleY = interpolate(frame, [0, 35], [24, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  return (
    <section
      id="skills"
      ref={ref}
      style={{ padding: '100px 2rem', maxWidth: 1100, margin: '0 auto' }}
    >
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: 'center', marginBottom: 64 }}>
        <div style={labelStyle}>Tech Stack</div>
        <h2 style={headingStyle}>Skills & Technologies</h2>
        <p style={subStyle}>Production-tested tools I use to ship real products.</p>
      </div>

      {/* Skill bars */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 32, marginBottom: 64,
      }}>
        {SKILL_GROUPS.map((group, gi) => (
          <div key={group.category} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16, padding: '28px 28px 24px',
            borderTop: `2px solid ${group.color}`,
          }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
              color: group.color, letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 20,
            }}>
              {group.category}
            </div>
            {group.skills.map((skill, si) => (
              <SkillBar
                key={skill.name}
                {...skill}
                color={group.color}
                delay={30 + gi * 20 + si * 15}
                frame={frame}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Floating badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {BADGES.map((badge, i) => {
          const delay = 60 + i * 6
          const badgeOpacity = interpolate(frame, [delay, delay + 20], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          })
          const badgeScale = spring({
            frame: Math.max(0, frame - delay),
            fps: FPS,
            config: { damping: 10, stiffness: 120 },
            from: 0.6, to: 1,
          })
          const badgeY = interpolate(frame, [delay, delay + 25], [14, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          })

          return (
            <div key={badge} style={{
              opacity: badgeOpacity,
              transform: `translateY(${badgeY}px) scale(${badgeScale})`,
              background: 'rgba(26,86,219,0.08)',
              border: '1px solid rgba(26,86,219,0.2)',
              borderRadius: 20, padding: '7px 16px',
              fontSize: '0.82rem', fontWeight: 500,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              {badge}
            </div>
          )
        })}
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
