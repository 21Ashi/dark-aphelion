import { useRef, type CSSProperties } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { about } from '../content/profile'
import { isTouch } from '../lib/quality'
import { Chars, travel, useFit, velocitySkew } from './about/kinetic'
import s from './About.module.css'

/** The one supporting line, cut from `about.intro` in content/profile.ts. */
const SUPPORT = 'From an empty repository to the store.'

const STATEMENT_TEXT = `${about.kicker} ${about.headline}`.toLowerCase().replace(/^./, (c) => c.toUpperCase())

// ── Numbers ──────────────────────────────────────────────────────────────
type Slot = { ch: string; run: number }

/** "40–50" → one slot per glyph; every run of digits is a number that counts up from zero. */
function slotsOf(text: string) {
  const slots: Slot[] = []
  const totals: number[] = []
  let open = false
  for (const ch of text) {
    const digit = ch >= '0' && ch <= '9'
    if (digit && !open) totals.push(0)
    open = digit || (open && ch === ',')
    if (digit) totals[totals.length - 1] = totals[totals.length - 1] * 10 + Number(ch)
    slots.push({ ch, run: open ? totals.length - 1 : -1 })
  }
  const lengths = totals.map((_, r) => slots.filter((sl) => sl.run === r && sl.ch !== ',').length)
  return { slots, totals, lengths }
}

const STATS = about.stats.map((st) => ({
  ...st,
  text: `${st.prefix}${st.value.toLocaleString('en-US')}`,
  ...slotsOf(`${st.prefix}${st.value.toLocaleString('en-US')}`),
}))

/** Writes the count at progress `p` into the glyphs; zeros still waiting are drawn hollow. */
function paint(glyphs: HTMLElement[], stat: (typeof STATS)[number], p: number) {
  const now = stat.totals.map((t, r) => String(Math.round(t * p)).padStart(stat.lengths[r], '0'))
  const at = stat.totals.map(() => 0)
  const hollow = stat.totals.map(() => p < 1)
  stat.slots.forEach((slot, i) => {
    if (slot.run < 0) return
    const r = slot.run
    let ch = slot.ch
    if (ch !== ',') {
      ch = now[r][at[r]++]
      if (ch !== '0') hollow[r] = false
    }
    const el = glyphs[i]
    if (el.textContent !== ch) el.textContent = ch
    const state = hollow[r] ? 'true' : 'false'
    if (el.dataset.hollow !== state) el.dataset.hollow = state
  })
}

// ── The sequence, in viewport-heights of scroll ──────────────────────────
const PRE = 0.75 // the statement assembles while the stage rises into place
const STATEMENT = 0.8
const STAT = 0.95 // one number
const CROSS = 1.35 // the principles pass through
const POST = 1 // the stage scrolls away
const PIN = STATEMENT + STAT * STATS.length + CROSS

/** Fast in, slow through the middle, fast out: a pass, not a stop. */
const pass = (p: number) => {
  const u = 2 * p - 1
  return 0.5 + 0.5 * (0.16 * u + 0.84 * u * u * u)
}

/**
 * Origin. One pinned stage, one idea on screen at a time, all of it scrubbed:
 * a statement in masked type, each number counting up on its own, then the
 * three principles crossing at different depths. Nothing here is a paragraph;
 * the scene behind stays in view throughout.
 */
export function About() {
  const root = useRef<HTMLElement>(null)
  useFit(root)

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const lean = velocitySkew(q('[data-lean]'), 'skewX', 9)
        const tilt = velocitySkew(q('[data-tilt]'), 'skewY', 4)

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el,
            start: 'top 75%',
            end: 'bottom top',
            scrub: isTouch ? 0.5 : 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const v = self.getVelocity()
              lean.kick(v)
              tilt.kick(v)
            },
          },
        })

        // 1 · The statement: characters rise into place, fading in (no hard mask, so a
        // paused scroll never leaves letters sliced), while the two lines travel
        // against each other; then they leave upward.
        const aCh = q('[data-row="a"] [data-ch]')
        const bCh = q('[data-row="b"] [data-ch]')
        const out = PRE + STATEMENT - 0.32
        gsap.set([...aCh, ...bCh], { yPercent: 55, opacity: 0 })
        gsap.set(bCh, { '--wdth': 104 })
        gsap.set(q('[data-index], [data-support]'), { yPercent: 60, opacity: 0 })
        gsap.set(q('[data-support-rule]'), { scaleX: 0 })
        // Everything has landed by the time the stage pins (t = PRE), so a
        // jump straight to #about arrives on a finished frame.
        tl.to(q('[data-index]'), { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' }, 0.3)
          .to(aCh, { yPercent: 0, opacity: 1, duration: 0.36, ease: 'power3.out', stagger: { amount: 0.16 } }, 0.16)
          .to(bCh, { yPercent: 0, opacity: 1, duration: 0.36, ease: 'power3.out', stagger: { amount: 0.2 } }, 0.2)
          .to(bCh, { '--wdth': 62, duration: 0.36, ease: 'power3.out', stagger: { amount: 0.2 } }, 0.2)
          .fromTo(q('[data-row="a"]'), { x: travel(16, 7) }, { x: travel(-12, -5), duration: PRE + STATEMENT }, 0)
          .fromTo(q('[data-row="b"]'), { x: travel(-10, -5) }, { x: travel(8, 4), duration: PRE + STATEMENT }, 0)
          .to(q('[data-support-rule]'), { scaleX: 1, duration: 0.22, ease: 'power2.out' }, 0.48)
          .to(q('[data-support]'), { yPercent: 0, opacity: 1, duration: 0.22, ease: 'power3.out' }, 0.53)
          .to(aCh, { yPercent: -55, opacity: 0, duration: 0.22, ease: 'power2.in', stagger: { amount: 0.1 } }, out)
          .to(bCh, { yPercent: -55, opacity: 0, duration: 0.24, ease: 'power2.in', stagger: { amount: 0.12, from: 'end' } }, out + 0.02)
          .to(q('[data-support]'), { yPercent: -60, opacity: 0, duration: 0.18, ease: 'power2.in' }, out)
          .to(q('[data-support-rule]'), { scaleX: 0, duration: 0.18, ease: 'power2.in' }, out + 0.04)

        // 2 · The numbers, one at a time: glyphs rise and fade in while the value
        // counts, drift across with a slow push in, and rise on out.
        const restore: (() => void)[] = []
        ;(q('[data-stat]') as HTMLElement[]).forEach((li, i) => {
          const stat = STATS[i]
          const at = PRE + STATEMENT - 0.06 + i * STAT
          const leave = at + STAT - 0.18 // still rolling out as the next one rolls in
          const glyphs = Array.from(li.querySelectorAll<HTMLElement>('[data-glyph]'))
          const moving = li.querySelectorAll('[data-glyph], [data-suffix]')
          const caps = li.querySelectorAll('[data-cap]')
          const rule = li.querySelector('[data-cap-rule]')
          const dir = i % 2 ? -1 : 1
          const count = { p: 0 }

          paint(glyphs, stat, 0)
          restore.push(() => paint(glyphs, stat, 1))
          gsap.set(moving, { yPercent: 40, opacity: 0 })
          gsap.set(caps, { yPercent: 50, opacity: 0 })
          gsap.set(rule, { xPercent: -101 })

          // Hollow zeros arrive first; the count then fills them in.
          tl.to(moving, { yPercent: 0, opacity: 1, duration: 0.26, ease: 'power3.out', stagger: { amount: 0.1, from: 'end' } }, at)
            .to(count, { p: 1, duration: 0.28, ease: 'power1.inOut', onUpdate: () => paint(glyphs, stat, count.p) }, at + 0.1)
            .fromTo(
              li.querySelector('[data-figure]'),
              { x: travel(dir * 6, dir * 3), scale: 0.95 },
              { x: travel(dir * -6, dir * -3), scale: 1.03, duration: STAT + 0.1 },
              at,
            )
            .to(rule, { xPercent: 0, duration: 0.26, ease: 'power2.out' }, at + 0.16)
            .to(caps, { yPercent: 0, opacity: 1, duration: 0.24, ease: 'power3.out', stagger: 0.05 }, at + 0.2)
            .to(moving, { yPercent: -40, opacity: 0, duration: 0.22, ease: 'power2.in', stagger: { amount: 0.1 } }, leave)
            .to(caps, { yPercent: -50, opacity: 0, duration: 0.18, ease: 'power2.in', stagger: 0.03 }, leave)
            .to(rule, { xPercent: 101, duration: 0.2, ease: 'power2.in' }, leave)
        })

        // 3 · The principles: each title crosses the stage on its own line,
        // alternate lines from opposite sides. The word at the back runs a
        // beat behind the one in front, so the pair stretches when it moves
        // fast and closes up as it slows.
        const cross = PRE + STATEMENT + STATS.length * STAT - 0.15
        ;(q('[data-principle]') as HTMLElement[]).forEach((row, i) => {
          const dir = i % 2 ? -1 : 1
          const words = [row.querySelector('[data-noun]'), row.querySelector('[data-adv]')].filter(Boolean)
          if (dir < 0) words.reverse()
          words.forEach((word, n) =>
            tl.fromTo(
              word,
              { x: () => dir * window.innerWidth * 1.05 },
              { x: () => -dir * window.innerWidth * 1.05, duration: CROSS + 0.35, ease: pass },
              cross + i * 0.13 + n * 0.05,
            ),
          )
        })

        tl.set({}, {}, PRE + PIN + POST)

        return () => {
          lean.kill()
          tilt.kill()
          restore.forEach((fn) => fn())
        }
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="about" ref={root} className={`chapter ${s.about}`} style={{ '--pin': PIN } as CSSProperties}>
      <div className={s.stage}>
        <p className={s.index}>
          <span className={s.mask}>
            <span data-index>
              <b>02</b> — Origin
            </span>
          </span>
        </p>

        {/* 1 · Statement */}
        <div className={s.beat}>
          <h2 className={s.title} data-lean>
            <span className="sr-only">{STATEMENT_TEXT}</span>
            <span className={`serif ${s.row} ${s.rowA}`} data-row="a">
              <Chars text={about.kicker.toLowerCase()} />
            </span>
            <span className={`${s.row} ${s.rowB}`} data-row="b">
              <Chars text={about.headline} />
            </span>
          </h2>
          <p className={s.support}>
            <i data-support-rule aria-hidden />
            <span className={s.mask}>
              <span data-support>{SUPPORT}</span>
            </span>
          </p>
        </div>

        {/* 2 · Numbers */}
        <ul className={s.stats}>
          {STATS.map((st, i) => (
            <li key={st.label} className={`${s.beat} ${s.stat}`} data-stat data-align={['start', 'end', 'center'][i % 3]}>
              <p className="sr-only">
                {st.text}
                {st.suffix}
              </p>
              <div className={s.figureBox} data-tilt aria-hidden>
                <div className={s.figure} data-figure data-fit="0.9">
                  {st.slots.map((slot, n) => (
                    <span key={n} className={s.slot}>
                      <span className={s.glyph} data-glyph>
                        {slot.ch}
                      </span>
                    </span>
                  ))}
                  {st.suffix && (
                    <span className={`${s.slot} ${s.suffix}`}>
                      <span className={s.glyph} data-suffix>
                        {st.suffix}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              {/* what the number counts, said plainly and at reading size */}
              <p className={s.caption}>
                <span className={s.capRule} aria-hidden>
                  <i data-cap-rule />
                </span>
                <span className={s.capLabel} data-cap>
                  {st.label}
                </span>
                <span className={s.capNote} data-cap>
                  {st.note}
                </span>
              </p>
            </li>
          ))}
        </ul>

        {/* 3 · Principles, titles only */}
        <ul className={`${s.beat} ${s.principles}`} data-lean>
          {about.principles.map((p) => {
            const cut = p.title.lastIndexOf(' ')
            return (
              <li key={p.title} className={s.principle} data-principle>
                <h3 className={s.pTitle}>
                  <span className={s.noun} data-noun>
                    {cut > 0 ? p.title.slice(0, cut) : p.title}
                  </span>
                  {cut > 0 && (
                    <>
                      {' '}
                      <span className={`serif ${s.adv}`} data-adv>
                        {p.title.slice(cut + 1)}
                      </span>
                    </>
                  )}
                </h3>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
