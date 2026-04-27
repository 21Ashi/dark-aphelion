import { useState } from 'react'
import { spring, interpolate, Easing } from 'remotion'
import { useScrollFrame } from '../hooks/useScrollFrame'

const FPS = 30

const PROJECTS = [
  {
    title: 'Sajaya CRI',
    subtitle: 'Cybersecurity Assessment Platform',
    description:
      'Full-stack cybersecurity risk assessment platform used by enterprises. Flutter frontend + Node.js/TypeScript backend with JWT auth and MySQL.',
    tags: ['Flutter', 'Node.js', 'TypeScript', 'JWT', 'MySQL'],
    status: 'Production',
    color: '#1a56db',
    gradient: 'linear-gradient(135deg, rgba(26,86,219,0.15), rgba(26,86,219,0.04))',
    link: null,
  },
  {
    title: 'Mahalatna',
    subtitle: 'Dual-App Delivery Solution',
    description:
      'Two Flutter apps (customer + driver) with real-time order tracking, Firebase backend, and Google Maps API integration. Live in production.',
    tags: ['Flutter', 'Firebase', 'Google Maps API', 'Real-time'],
    status: 'Production',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(14,165,233,0.04))',
    link: null,
  },
  {
    title: 'ChefLens',
    subtitle: 'AI Recipe Discovery App',
    description:
      'Point your camera at ingredients — get instant recipes. Flutter with BLoC state management + Computer Vision + AI recipe matching engine.',
    tags: ['Flutter', 'BLoC', 'Computer Vision', 'AI', 'Node.js'],
    status: 'Shipped',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.04))',
    link: 'https://github.com/21Ashi',
  },
  {
    title: 'Support Tickets System',
    subtitle: 'Enterprise Management Platform',
    description:
      'Full-featured IT support ticket system built for enterprise clients. Flutter + Node.js + MySQL with role-based access control.',
    tags: ['Flutter', 'Node.js', 'MySQL', 'RBAC'],
    status: 'Production',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.04))',
    link: null,
  },
]

function ProjectCard({ project, delay, frame }) {
  const [hovered, setHovered] = useState(false)

  const opacity = interpolate(frame, [delay, delay + 30], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const cardY = interpolate(frame, [delay, delay + 45], [48, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })
  const cardScale = spring({
    frame: Math.max(0, frame - delay),
    fps: FPS,
    config: { damping: 14, stiffness: 80 },
    from: 0.94, to: 1,
  })

  const hoverScale = hovered ? 1.025 : 1
  const hoverShadow = hovered ? `0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px ${project.color}44` : '0 4px 16px rgba(0,0,0,0.2)'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-hover
      style={{
        opacity,
        transform: `translateY(${cardY}px) scale(${cardScale * hoverScale})`,
        background: project.gradient,
        border: `1px solid ${hovered ? project.color + '44' : 'var(--border)'}`,
        borderRadius: 16,
        padding: '28px',
        display: 'flex', flexDirection: 'column',
        boxShadow: hoverShadow,
        willChange: 'transform, box-shadow',
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${project.color}22`,
          border: `1px solid ${project.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: project.color, opacity: 0.9 }} />
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
          background: project.status === 'Production' ? 'rgba(34,197,94,0.12)' : `${project.color}18`,
          color: project.status === 'Production' ? '#22c55e' : project.color,
          border: `1px solid ${project.status === 'Production' ? 'rgba(34,197,94,0.25)' : project.color + '33'}`,
          borderRadius: 4, padding: '3px 8px', letterSpacing: '0.06em',
        }}>
          {project.status}
        </span>
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>
        {project.title}
      </h3>
      <div style={{ fontSize: '0.8rem', color: project.color, fontWeight: 600, marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
        {project.subtitle}
      </div>

      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65, flex: 1, marginBottom: 20 }}>
        {project.description}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: project.link ? 20 : 0 }}>
        {project.tags.map(tag => (
          <span key={tag} style={{
            fontSize: '0.7rem', fontWeight: 500,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 4, padding: '3px 8px',
            color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
          }}>
            {tag}
          </span>
        ))}
      </div>

      {project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noreferrer"
          data-hover
          style={{
            fontSize: '0.82rem', fontWeight: 600,
            color: project.color, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          View on GitHub
          <span style={{ fontSize: '1rem' }}>→</span>
        </a>
      )}
    </div>
  )
}

export function Projects() {
  const { frame, ref } = useScrollFrame({ fps: FPS, totalFrames: 200 })

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const titleY = interpolate(frame, [0, 35], [24, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })

  return (
    <section
      id="projects"
      ref={ref}
      style={{ padding: '100px 2rem', maxWidth: 1100, margin: '0 auto' }}
    >
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, textAlign: 'center', marginBottom: 64 }}>
        <div style={labelStyle}>Portfolio</div>
        <h2 style={headingStyle}>Featured Projects</h2>
        <p style={subStyle}>All projects shipped to real users — not just demos.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
      }}>
        {PROJECTS.map((project, i) => (
          <ProjectCard
            key={project.title}
            project={project}
            delay={30 + i * 25}
            frame={frame}
          />
        ))}
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
