import { spring, interpolate, Easing } from 'remotion'
import { useScrollFrame } from '../hooks/useScrollFrame'

const FPS = 30

const JOBS = [
  {
    role: 'Full Stack Developer',
    company: 'Matrix / Sajaya',
    period: '2024 — Present · 4 months',
    type: 'Full-time',
    color: '#1a56db',
    description:
      'Delivered production Flutter frontend paired with C# .NET + Entity Framework backend. Shipped live apps used daily by enterprise clients.',
    tags: ['Flutter', 'C# .NET', 'Entity Framework', 'Firebase', 'MySQL'],
  },
  {
    role: 'Prompt Engineering Intern',
    company: 'Optimiza',
    period: '2024 · 2 months',
    type: 'Internship',
    color: '#0ea5e9',
    description:
      'Designed LLM workflows and prompt chains that reduced manual processing by 40–50%. Integrated AI into production pipelines.',
    tags: ['LLM', 'Prompt Engineering', 'AI Workflows', 'Python'],
  },
  {
    role: 'Independent Game Developer',
    company: 'Self-Employed',
    period: '2022 — 2024',
    type: 'Freelance',
    color: '#8b5cf6',
    description:
      'Published "Wrong Answers" on Android & iOS. Reached 15,000+ downloads organically. Full solo dev cycle: design → build → ship.',
    tags: ['Unity', 'C#', 'Android', 'iOS', 'Game Design'],
  },
]

export function Experience() {
  const { frame, ref } = useScrollFrame({ fps: FPS, totalFrames: 200 })

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const titleY = interpolate(frame, [0, 35], [24, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  // Timeline line draws down
  const lineHeight = interpolate(frame, [30, 160], [0, 100], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  return (
    <section
      id="experience"
      ref={ref}
      style={{ padding: '100px 2rem', maxWidth: 860, margin: '0 auto' }}
    >
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: 'center', marginBottom: 72 }}>
        <div style={labelStyle}>Career</div>
        <h2 style={headingStyle}>Work Experience</h2>
        <p style={subStyle}>Real-world production experience across mobile, backend, and AI.</p>
      </div>

      <div style={{ position: 'relative' }}>
        {/* vertical line */}
        <div style={{
          position: 'absolute', left: 20, top: 0,
          width: 1, background: 'var(--border)',
          height: '100%',
        }} />
        <div style={{
          position: 'absolute', left: 20, top: 0,
          width: 1, background: 'linear-gradient(to bottom, #1a56db, #0ea5e9)',
          height: `${lineHeight}%`,
          boxShadow: '0 0 8px rgba(26,86,219,0.5)',
        }} />

        {JOBS.map((job, i) => {
          const delay = 40 + i * 50
          const itemOpacity = interpolate(frame, [delay, delay + 30], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          })
          const itemX = interpolate(frame, [delay, delay + 40], [40, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })
          const dotScale = spring({
            frame: Math.max(0, frame - delay),
            fps: FPS,
            config: { damping: 10, stiffness: 150 },
            from: 0, to: 1,
          })

          return (
            <div key={job.role} style={{
              display: 'flex', gap: 32,
              marginBottom: i < JOBS.length - 1 ? 56 : 0,
            }}>
              {/* dot */}
              <div style={{ flexShrink: 0, paddingTop: 4, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 40, height: 40,
                  transform: `scale(${dotScale})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: job.color,
                    boxShadow: `0 0 12px ${job.color}`,
                    border: '2px solid var(--bg)',
                    outline: `1px solid ${job.color}44`,
                  }} />
                </div>
              </div>

              {/* card */}
              <div style={{
                flex: 1,
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: `2px solid ${job.color}`,
                borderRadius: 12, padding: '24px 28px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                      {job.role}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: job.color, fontWeight: 600 }}>{job.company}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-mono)',
                      color: 'var(--text-dim)', marginBottom: 4,
                    }}>
                      {job.period}
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700,
                      background: `${job.color}18`, color: job.color,
                      border: `1px solid ${job.color}33`,
                      borderRadius: 4, padding: '2px 8px',
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                    }}>
                      {job.type}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 16 }}>
                  {job.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {job.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: '0.72rem', fontWeight: 500,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 4, padding: '3px 8px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
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
