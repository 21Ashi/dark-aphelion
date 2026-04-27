import { spring, interpolate, Easing } from 'remotion'
import { useScrollFrame } from '../hooks/useScrollFrame'

const FPS = 30

const FACTS = [
  { icon: '📍', label: 'Based in', value: 'Amman, Jordan' },
  { icon: '🎓', label: 'Education', value: 'Computer Science — Applied Science University' },
  { icon: '🗣️', label: 'Languages', value: 'Arabic (native) · English (professional)' },
  { icon: '🎮', label: 'Published', value: '"Wrong Answers" — 15,000+ downloads' },
]

export function About() {
  const { frame, ref } = useScrollFrame({ fps: FPS, totalFrames: 140 })

  const leftOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const leftX = interpolate(frame, [0, 45], [-48, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  const rightOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const rightX = interpolate(frame, [20, 60], [48, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  return (
    <section
      id="about"
      ref={ref}
      style={{ padding: '100px 2rem', maxWidth: 1100, margin: '0 auto' }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 64, alignItems: 'center',
      }}>
        {/* left */}
        <div style={{ opacity: leftOpacity, transform: `translateX(${leftX}px)` }}>
          <div style={labelStyle}>Who I Am</div>
          <h2 style={{ ...headingStyle, marginTop: 12 }}>About Me</h2>

          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 20 }}>
            I'm a full-stack developer from Amman, Jordan with a passion for shipping software that people
            actually use. My sweet spot is Flutter — I can take a product from zero to the App Store
            faster than most teams can finish the spec.
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 32 }}>
            At Matrix/Sajaya I built enterprise CRM/ERP modules used daily by thousands of employees.
            Before that, I published an indie game that hit 15,000 downloads without any ad budget.
            I care about code quality, real impact, and shipping things that work.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="mailto:mralashi17@gmail.com" data-hover style={btnPrimary}>Get in touch</a>
            <a href="https://linkedin.com/in/aboodashi" target="_blank" rel="noreferrer" data-hover style={btnSecondary}>
              LinkedIn
            </a>
          </div>
        </div>

        {/* right */}
        <div style={{ opacity: rightOpacity, transform: `translateX(${rightX}px)` }}>
          {/* avatar placeholder */}
          <div style={{
            width: '100%', maxWidth: 320, margin: '0 auto 32px',
            aspectRatio: '1',
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(26,86,219,0.2), rgba(139,92,246,0.1))',
            border: '1px solid rgba(26,86,219,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(26,86,219,0.3), transparent 60%)',
            }} />
            <div style={{
              fontSize: '4rem',
              fontWeight: 900, fontFamily: 'var(--font-mono)',
              color: 'rgba(26,86,219,0.6)',
              letterSpacing: '-0.04em',
            }}>
              AA
            </div>
            {/* corner accent */}
            <div style={{
              position: 'absolute', bottom: 16, right: 16,
              background: '#1a56db', borderRadius: 6,
              padding: '6px 12px',
              fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
              color: '#fff', letterSpacing: '0.06em',
            }}>
              &lt;/dev&gt;
            </div>
          </div>

          {/* facts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FACTS.map((fact, i) => {
              const fDelay = 50 + i * 15
              const fOpacity = interpolate(frame, [fDelay, fDelay + 20], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              })
              const fY = interpolate(frame, [fDelay, fDelay + 25], [12, 0], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              })
              return (
                <div key={fact.label} style={{
                  opacity: fOpacity,
                  transform: `translateY(${fY}px)`,
                  display: 'flex', gap: 12, alignItems: 'center',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 16px',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{fact.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: 2 }}>
                      {fact.label}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
                      {fact.value}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

const labelStyle = {
  display: 'inline-block',
  fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
  color: '#1a56db', letterSpacing: '0.12em', textTransform: 'uppercase',
  background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.25)',
  borderRadius: 4, padding: '4px 12px',
}

const headingStyle = {
  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
  fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 12,
}

const btnPrimary = {
  background: '#1a56db', color: '#fff',
  padding: '12px 24px', borderRadius: 8,
  fontWeight: 700, fontSize: '0.875rem',
  boxShadow: '0 0 20px rgba(26,86,219,0.35)',
}

const btnSecondary = {
  background: 'transparent', color: 'var(--text)',
  padding: '12px 24px', borderRadius: 8,
  fontWeight: 600, fontSize: '0.875rem',
  border: '1px solid rgba(255,255,255,0.12)',
}
