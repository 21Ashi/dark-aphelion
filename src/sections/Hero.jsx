import { useEffect, useRef, useState } from 'react'
import { spring, interpolate, Easing } from 'remotion'
import { useScrollFrame } from '../hooks/useScrollFrame'

const FPS = 30
const ROLES = ['Full Stack Developer', 'Flutter Specialist', 'Mobile Engineer', 'Backend Developer']

function ParticleCanvas() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight

    const N = 80
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    }))

    function draw() {
      ctx.clearRect(0, 0, W, H)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(26,86,219,0.6)'
        ctx.fill()
      }

      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(26,86,219,${0.12 * (1 - dist / 120)})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    function onResize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.7,
      }}
    />
  )
}

export function Hero() {
  const { frame, ref } = useScrollFrame({ fps: FPS, totalFrames: 120 })
  const [roleIndex, setRoleIndex] = useState(0)
  const [typeText, setTypeText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  // Typewriter — string slicing per Remotion text-animation rules
  useEffect(() => {
    const text = ROLES[roleIndex]
    const startFrame = 20
    const typeFrames = 60
    const charsPerFrame = text.length / typeFrames
    const charCount = Math.min(
      Math.floor(Math.max(0, frame - startFrame) * charsPerFrame),
      text.length
    )
    setTypeText(text.slice(0, charCount))
  }, [frame, roleIndex])

  // Role cycling after first animation completes
  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex(i => (i + 1) % ROLES.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(v => !v), 530)
    return () => clearInterval(interval)
  }, [])

  // name: fade + scale spring
  const nameOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })
  const nameScale = spring({ frame, fps: FPS, config: { damping: 14, stiffness: 80 }, from: 0.85, to: 1 })
  const nameY = interpolate(frame, [0, 40], [32, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  // subtitle
  const subtitleOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const subtitleY = interpolate(frame, [20, 55], [24, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  // role line
  const roleOpacity = interpolate(frame, [35, 65], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // CTAs
  const ctaOpacity = interpolate(frame, [55, 85], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })
  const ctaY = interpolate(frame, [55, 90], [20, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  // scroll hint
  const hintOpacity = interpolate(frame, [90, 120], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <section
      id="hero"
      ref={ref}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(26,86,219,0.12) 0%, transparent 70%)',
      }}
    >
      <ParticleCanvas />

      {/* grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(26,86,219,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(26,86,219,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 800, padding: '0 2rem' }}>

        {/* badge */}
        <div style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.3)',
          borderRadius: 20, padding: '6px 16px', marginBottom: 28,
          fontSize: '0.78rem', fontWeight: 600, color: '#3b82f6',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          Available for work · Amman, Jordan
        </div>

        {/* name */}
        <h1 style={{
          opacity: nameOpacity,
          transform: `translateY(${nameY}px) scale(${nameScale})`,
          fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: '-0.04em',
          marginBottom: 16,
          background: 'linear-gradient(135deg, #f1f5f9 30%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Abdelmajeed Ashi
        </h1>

        {/* role typewriter */}
        <div style={{
          opacity: roleOpacity,
          height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 0, marginBottom: 32,
        }}>
          <span style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            fontWeight: 600,
            color: '#1a56db',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.02em',
          }}>
            {typeText}
          </span>
          <span style={{
            width: 2, height: '1.4em',
            background: '#1a56db',
            opacity: showCursor ? 1 : 0,
            marginLeft: 2, borderRadius: 1,
            display: 'inline-block',
          }} />
        </div>

        {/* description */}
        <p style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
          color: 'var(--text-muted)',
          lineHeight: 1.7,
          maxWidth: 560,
          margin: '0 auto 40px',
        }}>
          Building production-grade mobile & web apps with Flutter, Node.js, and C# .NET.
          4+ months delivering live enterprise software at Matrix/Sajaya.
        </p>

        {/* CTAs */}
        <div style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
        }}>
          <a
            href="#projects"
            data-hover
            style={{
              background: '#1a56db',
              color: '#fff',
              padding: '14px 32px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.02em',
              boxShadow: '0 0 24px rgba(26,86,219,0.4)',
            }}
          >
            View My Work
          </a>
          <a
            href="https://github.com/21Ashi"
            target="_blank"
            rel="noreferrer"
            data-hover
            style={{
              background: 'transparent',
              color: 'var(--text)',
              padding: '14px 32px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.95rem',
              border: '1px solid rgba(255,255,255,0.12)',
              letterSpacing: '0.02em',
            }}
          >
            GitHub Profile
          </a>
        </div>

        {/* social row */}
        <div style={{
          opacity: ctaOpacity,
          display: 'flex', gap: 24, justifyContent: 'center', marginTop: 40,
        }}>
          {[
            { label: 'GitHub', href: 'https://github.com/21Ashi' },
            { label: 'LinkedIn', href: 'https://linkedin.com/in/aboodashi' },
            { label: 'Email', href: 'mailto:mralashi17@gmail.com' },
          ].map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              data-hover
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
              }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%',
        transform: 'translateX(-50%)',
        opacity: hintOpacity,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
          SCROLL
        </span>
        <div style={{
          width: 1, height: 40,
          background: 'linear-gradient(to bottom, rgba(26,86,219,0.6), transparent)',
        }} />
      </div>
    </section>
  )
}
