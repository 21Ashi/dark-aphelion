import { useState } from 'react'
import { spring, interpolate, Easing } from 'remotion'
import { useScrollFrame } from '../hooks/useScrollFrame'

const FPS = 30

const SOCIALS = [
  { label: 'Email', value: 'mralashi17@gmail.com', href: 'mailto:mralashi17@gmail.com', color: '#1a56db' },
  { label: 'GitHub', value: 'github.com/21Ashi', href: 'https://github.com/21Ashi', color: '#e2e8f0' },
  { label: 'LinkedIn', value: 'linkedin.com/in/aboodashi', href: 'https://linkedin.com/in/aboodashi', color: '#0ea5e9' },
  { label: 'Phone', value: '+962 799 993 800', href: 'tel:+962799993800', color: '#22c55e' },
]

export function Contact() {
  const { frame, ref } = useScrollFrame({ fps: FPS, totalFrames: 160 })
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const subject = encodeURIComponent(`Portfolio contact from ${form.name}`)
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)
    window.open(`mailto:mralashi17@gmail.com?subject=${subject}&body=${body}`)
    setSent(true)
  }

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const titleY = interpolate(frame, [0, 35], [24, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  const leftOpacity = interpolate(frame, [25, 55], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const leftX = interpolate(frame, [25, 60], [-40, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  const rightOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const rightX = interpolate(frame, [40, 75], [40, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  return (
    <section
      id="contact"
      ref={ref}
      style={{
        padding: '100px 2rem 60px',
        background: 'linear-gradient(to bottom, transparent, rgba(26,86,219,0.05))',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: 'center', marginBottom: 64 }}>
          <div style={labelStyle}>Let's Talk</div>
          <h2 style={headingStyle}>Get In Touch</h2>
          <p style={subStyle}>
            Open to full-time roles, freelance projects, and interesting collaborations.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 40,
        }}>
          {/* socials left */}
          <div style={{ opacity: leftOpacity, transform: `translateX(${leftX}px)` }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>
              Contact Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
              {SOCIALS.map((s, i) => {
                const sDelay = 50 + i * 12
                const sOpacity = interpolate(frame, [sDelay, sDelay + 20], [0, 1], {
                  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                })
                const sY = interpolate(frame, [sDelay, sDelay + 25], [10, 0], {
                  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                })
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.href.startsWith('mailto') || s.href.startsWith('tel') ? undefined : '_blank'}
                    rel="noreferrer"
                    data-hover
                    style={{
                      opacity: sOpacity,
                      transform: `translateY(${sY}px)`,
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10, padding: '14px 18px',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: s.color, flexShrink: 0,
                      boxShadow: `0 0 6px ${s.color}`,
                    }} />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: s.color }}>
                        {s.value}
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>

          {/* form right */}
          <div style={{ opacity: rightOpacity, transform: `translateX(${rightX}px)` }}>
            {sent ? (
              <div style={{
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 16, padding: '48px 32px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✓</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>Message sent!</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Your email client should have opened. I'll reply soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { id: 'name', label: 'Name', type: 'text', placeholder: 'Your name' },
                  { id: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
                ].map(field => (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}
                    >
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      type={field.type}
                      required
                      placeholder={field.placeholder}
                      value={form[field.id]}
                      onChange={e => setForm(f => ({ ...f, [field.id]: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                ))}
                <div>
                  <label htmlFor="message" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    placeholder="Tell me about your project..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                  />
                </div>
                <button
                  type="submit"
                  data-hover
                  style={{
                    background: '#1a56db', color: '#fff',
                    border: 'none', borderRadius: 8,
                    padding: '14px 28px', fontWeight: 700,
                    fontSize: '0.95rem', letterSpacing: '0.02em',
                    boxShadow: '0 0 20px rgba(26,86,219,0.4)',
                  }}
                >
                  Send Message →
                </button>
              </form>
            )}
          </div>
        </div>

        {/* footer */}
        <div style={{
          marginTop: 80, paddingTop: 32,
          borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16,
        }}>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
            © 2025 Abdelmajeed Ashi
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Built with React + Remotion
          </span>
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
  fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 12,
}

const subStyle = {
  fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6,
}

const inputStyle = {
  width: '100%', background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 8, padding: '12px 16px',
  fontSize: '0.9rem', color: 'var(--text)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
}
