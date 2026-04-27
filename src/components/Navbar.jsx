import { useState, useEffect } from 'react'

const LINKS = ['About', 'Skills', 'Experience', 'Projects', 'Contact']

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40)

      const sections = LINKS.map(l => document.getElementById(l.toLowerCase()))
      for (let i = sections.length - 1; i >= 0; i--) {
        const s = sections[i]
        if (s && s.getBoundingClientRect().top <= 120) {
          setActive(LINKS[i].toLowerCase())
          break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '0 2rem',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(7,13,27,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        willChange: 'background',
      }}
    >
      <a
        href="#hero"
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '1.1rem',
          color: '#1a56db',
          letterSpacing: '-0.02em',
        }}
        data-hover
      >
        &lt;AA /&gt;
      </a>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        {LINKS.map(link => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            data-hover
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: active === link.toLowerCase() ? '#1a56db' : 'var(--text-muted)',
              letterSpacing: '0.02em',
              position: 'relative',
              paddingBottom: 2,
            }}
          >
            {link}
            <span style={{
              position: 'absolute',
              bottom: -2,
              left: 0,
              right: active === link.toLowerCase() ? 0 : '100%',
              height: 1.5,
              background: '#1a56db',
              borderRadius: 1,
            }} />
          </a>
        ))}

        <a
          href="mailto:mralashi17@gmail.com"
          data-hover
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#fff',
            background: '#1a56db',
            padding: '8px 18px',
            borderRadius: 6,
            letterSpacing: '0.03em',
          }}
        >
          Hire Me
        </a>
      </div>
    </nav>
  )
}
