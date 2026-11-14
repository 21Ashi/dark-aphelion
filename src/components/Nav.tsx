import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { activeChapter, CHAPTERS, NAV_ITEMS, type ChapterId } from '../lib/motion'
import { scrollToTarget, startScroll, stopScroll } from '../lib/scroll'
import { useStore } from '../hooks/useStore'
import { profile, socials } from '../content/profile'
import { prefersReducedMotion } from '../lib/quality'
import s from './Nav.module.css'

const navFor = (id: ChapterId): ChapterId => (id === 'skills' ? 'experience' : id)

export function Nav() {
  const active = useStore(activeChapter)
  const [open, setOpen] = useState(false)
  const bar = useRef<HTMLElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const dot = useRef<HTMLSpanElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const chapterLabel = useRef<HTMLSpanElement>(null)
  const menuTl = useRef<gsap.core.Timeline | null>(null)

  const chapterIndex = CHAPTERS.findIndex((c) => c.id === active)
  const chapter = CHAPTERS[chapterIndex] ?? CHAPTERS[0]

  // Slide the active dot under the current link.
  useLayoutEffect(() => {
    const target = list.current?.querySelector<HTMLElement>(`[data-id="${navFor(active)}"]`)
    if (!target || !dot.current || !list.current) return
    const x = target.offsetLeft + target.offsetWidth / 2
    gsap.to(dot.current, { x, duration: prefersReducedMotion ? 0 : 0.8, ease: 'cine' })
  }, [active])

  // Roll the chapter label when it changes.
  useEffect(() => {
    if (!chapterLabel.current || prefersReducedMotion) return
    gsap.fromTo(chapterLabel.current, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'cine' })
  }, [active])

  // Retreat on scroll down, return on scroll up; gain a backdrop after the hero.
  useEffect(() => {
    const el = bar.current!
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll()
        el.dataset.scrolled = y > window.innerHeight * 0.6 ? 'true' : 'false'
        if (open) return
        const hide = self.direction === 1 && y > window.innerHeight * 0.9
        gsap.to(el, { yPercent: hide ? -110 : 0, duration: 0.6, ease: 'cine', overwrite: 'auto' })
      },
    })
    return () => st.kill()
  }, [open])

  // Full-screen menu: an expanding circle from the button, then staggered links.
  useLayoutEffect(() => {
    const m = menu.current
    if (!m) return
    const q = gsap.utils.selector(m)
    const tl = gsap.timeline({ paused: true })
    tl.set(m, { visibility: 'visible' })
      .fromTo(
        m,
        { clipPath: 'circle(0% at calc(100% - 48px) 40px)' },
        { clipPath: 'circle(150% at calc(100% - 48px) 40px)', duration: 0.9, ease: 'cineInOut' },
      )
      .fromTo(q('[data-link]'), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.06 }, 0.35)
      .fromTo(q('[data-fade]'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05 }, 0.6)
    menuTl.current = tl
    return () => {
      tl.kill()
    }
  }, [])

  useEffect(() => {
    const tl = menuTl.current
    if (!tl) return
    if (open) {
      stopScroll()
      tl.timeScale(1).play()
    } else {
      startScroll()
      tl.timeScale(1.6).reverse()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: ChapterId) => {
    setOpen(false)
    // Let the menu start closing before the long scroll.
    window.setTimeout(() => scrollToTarget(id), open ? 250 : 0)
  }

  return (
    <>
      <header ref={bar} className={s.bar} data-scrolled="false">
        <button className={s.brand} onClick={() => go('home')} aria-label="Back to top" data-cursor="Top">
          <svg viewBox="0 0 120 64" aria-hidden>
            <path d="M6 58 L33 6 L60 58 M60 58 L87 6 L114 58" />
            <rect x="0" y="40" width="120" height="4" />
          </svg>
          <span className={s.brandText}>
            {profile.firstName} {profile.lastName}
          </span>
        </button>

        <div className={s.chapter} aria-hidden>
          <span className={s.chapterNum}>{String(chapterIndex + 1).padStart(2, '0')}</span>
          <span className={s.chapterSep} />
          <span className={s.chapterMask}>
            <span ref={chapterLabel}>{chapter.label}</span>
          </span>
        </div>

        <nav className={s.links} aria-label="Primary">
          <ul ref={list}>
            {NAV_ITEMS.map((item, i) => (
              <li key={item.id} data-id={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={navFor(active) === item.id ? 'true' : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    go(item.id)
                  }}
                >
                  <sup>0{i + 1}</sup>
                  <span className={s.roll} data-text={item.label}>
                    {item.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <span ref={dot} className={s.dot} aria-hidden />
        </nav>

        <button
          className={s.menuBtn}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
          data-open={open}
        >
          <span className={s.menuWord}>{open ? 'Close' : 'Menu'}</span>
          <span className={s.burger} aria-hidden>
            <i />
            <i />
          </span>
        </button>
      </header>

      <div id="site-menu" ref={menu} className={s.menu} aria-hidden={!open} inert={!open}>
        <ol className={s.menuList}>
          {NAV_ITEMS.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  go(item.id)
                }}
                aria-current={navFor(active) === item.id ? 'true' : undefined}
              >
                <span className={s.menuIndex} data-fade>
                  0{i + 1}
                </span>
                <span className={s.menuMask}>
                  <span data-link>{item.label}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
        <div className={s.menuFoot}>
          <a data-fade href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <div className={s.menuSocials}>
            {socials
              .filter((x) => x.label !== 'Email' && x.label !== 'Phone')
              .map((x) => (
                <a data-fade key={x.label} href={x.href} target="_blank" rel="noreferrer">
                  {x.label} ↗
                </a>
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
