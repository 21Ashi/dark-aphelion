import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { activeChapter, CHAPTERS } from '../lib/motion'
import { scrollToTarget } from '../lib/scroll'
import { useStore } from '../hooks/useStore'
import s from './Rail.module.css'

/** Vertical chapter rail on the right edge: progress fill, ticks, live percentage. */
export function Rail() {
  const active = useStore(activeChapter)
  const fill = useRef<HTMLSpanElement>(null)
  const pct = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        gsap.set(fill.current, { scaleY: self.progress })
        if (pct.current) pct.current.textContent = String(Math.round(self.progress * 100)).padStart(2, '0')
      },
    })
    return () => st.kill()
  }, [])

  return (
    <aside className={s.rail} aria-label="Chapters" data-away={active === 'work'}>
      <span className={s.pct} aria-hidden>
        <span ref={pct}>00</span>%
      </span>
      <div className={s.track}>
        <span ref={fill} className={s.fill} />
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            className={s.tick}
            style={{ top: `${(i / (CHAPTERS.length - 1)) * 100}%` }}
            data-active={active === c.id}
            onClick={() => scrollToTarget(c.id)}
            aria-label={`Go to ${c.label}`}
            data-cursor={c.label}
          >
            <span className={s.tickLabel}>
              {String(i + 1).padStart(2, '0')} {c.label}
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
