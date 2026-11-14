import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap'
import { loaderDone, motion } from '../lib/motion'
import { useStore } from '../hooks/useStore'
import { profile } from '../content/profile'
import { Magnetic } from '../components/Magnetic'
import { scrollToTarget } from '../lib/scroll'
import { isTouch, prefersReducedMotion } from '../lib/quality'
import s from './Hero.module.css'

function LocalTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const t = new Intl.DateTimeFormat('en-GB', {
    timeZone: profile.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
  return <span>{t} GMT+3</span>
}

/**
 * Arrival. The name is set huge and lives *in* the scene: it parallaxes with
 * the camera, splits apart as the camera flies through it, and is lit by the
 * star — letters in front of it turn to silhouettes with a crimson rim.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null)
  const ready = useStore(loaderDone)

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const lines = q('[data-line]') as HTMLElement[]
      const nameChars: HTMLElement[] = []
      const splits: SplitText[] = []

      lines.forEach((line) => {
        const split = SplitText.create(line.querySelector('[data-split]')!, { type: 'chars', charsClass: s.char })
        splits.push(split)
        nameChars.push(...(split.chars as HTMLElement[]))
      })
      const tagline = SplitText.create(q('[data-tagline]'), {
        type: 'lines,words',
        mask: 'lines',
        linesClass: 'split-line',
        wordsClass: 'split-word',
      })
      splits.push(tagline)

      // Hidden until the loader hands over.
      gsap.set(nameChars, { yPercent: 115, '--wdth': 125, opacity: 0, filter: 'blur(14px)' })
      gsap.set(q('[data-greet]'), { yPercent: 110 })
      gsap.set(q('[data-greet-line]'), { scaleX: 0 })
      gsap.set(q('[data-role]'), { opacity: 0 })
      gsap.set(tagline.lines, { yPercent: 0 })
      gsap.set(tagline.words, { yPercent: 105 })
      gsap.set(q('[data-cta]'), { y: 30, opacity: 0 })
      gsap.set(q('[data-meta]'), { opacity: 0, y: 10 })
      gsap.set(q('[data-rule]'), { scaleX: 0 })

      return () => splits.forEach((sp) => sp.revert())
    },
    { scope: root },
  )

  // The entrance, once the preloader opens its eyelid.
  useGSAP(
    () => {
      if (!ready) return
      const el = root.current!
      const q = gsap.utils.selector(el)
      const chars = q(`.${s.char}`) as HTMLElement[]
      const a = chars.filter((c) => c.closest('[data-line="a"]'))
      const b = chars.filter((c) => c.closest('[data-line="b"]'))

      const reduce = prefersReducedMotion
      // Hold every letter in a box of its final width while its width axis
      // animates, so condensing letters never push their neighbours around
      // (that motion counted as layout shift). One read pass, one write pass.
      gsap.set(chars, { '--wdth': 68 })
      // exact (fractional) widths, display untouched: releasing them later moves nothing
      const widths = chars.map((c) => c.getBoundingClientRect().width)
      chars.forEach((c, i) => (c.style.width = `${widths[i]}px`))
      gsap.set(chars, { '--wdth': 125 })
      el.dataset.intro = 'true'
      const tl = gsap.timeline({
        delay: reduce ? 0 : 0.25,
        defaults: { ease: 'cine' },
        onComplete: () => {
          gsap.set(chars, { clearProps: 'transform,filter,opacity,width' })
          el.dataset.lit = 'true'
        },
      })
      if (reduce) {
        tl.set(chars, { yPercent: 0, '--wdth': 68, opacity: 1, filter: 'none' })
          .set(q('[data-greet], [data-tagline] *'), { yPercent: 0 })
          .set(q('[data-greet-line], [data-rule]'), { scaleX: 1 })
          .set(q('[data-role], [data-cta], [data-meta]'), { opacity: 1, y: 0 })
        return
      }

      tl.to(q('[data-greet-line]'), { scaleX: 1, duration: 0.9, ease: 'cineInOut' }, 0)
        .to(q('[data-greet]'), { yPercent: 0, duration: 0.9 }, 0.2)
        .to(a, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.5, stagger: 0.07 }, 0.25)
        .to(a, { '--wdth': 68, duration: 1.9, stagger: 0.07, ease: 'expo.out' }, 0.25)
        .to(b, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.5, stagger: { each: 0.07, from: 'end' } }, 0.45)
        .to(b, { '--wdth': 68, duration: 1.9, stagger: { each: 0.07, from: 'end' }, ease: 'expo.out' }, 0.45)
        .to(q('[data-rule]'), { scaleX: 1, duration: 1.2, ease: 'cineInOut' }, 0.9)
        .set(q('[data-role]'), { opacity: 1 }, 1.0)
        .to(
          q('[data-role-text]'),
          { duration: 1.4, scrambleText: { text: profile.role, chars: 'XO/<>_-01#', speed: 0.6, revealDelay: 0.2 } },
          1.0,
        )
        .to(q('[data-tagline] .split-word'), { yPercent: 0, duration: 1.1, stagger: 0.025 }, 1.15)
        .to(q('[data-cta]'), { y: 0, opacity: 1, duration: 1, stagger: 0.1 }, 1.35)
        .to(q('[data-meta]'), { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 1.5)
    },
    { scope: root, dependencies: [ready] },
  )

  // Live layer: pointer parallax, scroll split, velocity skew, star lighting,
  // and letters that widen near the cursor.
  //
  // Performance: layout is read once and cached (re-read only on resize, font
  // load, or while letters are changing width), always before anything is
  // written in the frame, and styles are only written when their value changes.
  useEffect(() => {
    const el = root.current!
    const lines = Array.from(el.querySelectorAll<HTMLElement>('[data-line]'))
    const layers = Array.from(el.querySelectorAll<HTMLElement>('[data-depth]'))
    const off = new Map<HTMLElement, { x: number; y: number }>()
    const written = new Map<HTMLElement, Record<string, string>>()
    /** Set a style or custom property only if it changed (no needless style recalcs). */
    const put = (node: HTMLElement, prop: string, value: string) => {
      let m = written.get(node)
      if (!m) written.set(node, (m = {}))
      if (m[prop] === value) return
      m[prop] = value
      if (prop.startsWith('--')) node.style.setProperty(prop, value)
      else (node.style as unknown as Record<string, string>)[prop] = value
    }

    type CharGeo = { el: HTMLElement; x: number; y: number; w: number; h: number }
    const geo = { valid: false, left: 0, top: 0, lines: [] as { left: number; top: number; w: number; h: number; chars: CharGeo[] }[] }
    const measure = () => {
      geo.left = el.offsetLeft
      geo.top = el.offsetTop
      geo.lines = lines.map((ln) => ({
        left: ln.offsetLeft,
        top: ln.offsetTop,
        w: ln.clientWidth,
        h: ln.clientHeight,
        chars: Array.from(ln.querySelectorAll<HTMLElement>(`.${s.char}`)).map((c) => ({
          el: c,
          x: c.offsetLeft,
          y: c.offsetTop,
          w: c.offsetWidth,
          h: c.offsetHeight,
        })),
      }))
      geo.valid = true
    }
    const invalidate = () => (geo.valid = false)
    window.addEventListener('resize', invalidate)
    document.fonts?.ready.then(invalidate)
    let swellUntil = 0 // letters are changing width: re-measure every frame until then

    let split = 0
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => (split = self.progress),
    })

    const pointer = { x: 0, y: 0 }
    let skew = 0

    let lit = ''
    const tick = () => {
      if (split >= 1 && motion.chapter > 1.2) return
      if (el.dataset.lit !== lit) {
        lit = el.dataset.lit ?? ''
        geo.valid = false // the entrance has landed: letters have their final widths
      }
      // Reads first. This tick runs before the other per-frame work (it is
      // registered with priority), so layout is still clean here.
      const remeasure = !geo.valid || performance.now() < swellUntil
      if (remeasure) measure()
      const vw = window.innerWidth
      const sy = window.scrollY

      const reduce = prefersReducedMotion
      pointer.x += (motion.pointer.x - pointer.x) * 0.06
      pointer.y += (motion.pointer.y - pointer.y) * 0.06
      skew += ((reduce ? 0 : gsap.utils.clamp(-7, 7, -motion.velocity * 0.25)) - skew) * 0.12
      const e = split * split

      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth)
        const dir = layer.dataset.line === 'a' ? -1 : layer.dataset.line === 'b' ? 1 : 0
        const x = reduce ? 0 : -pointer.x * depth + dir * e * vw * 0.42
        const y = reduce ? 0 : pointer.y * depth * 0.6 - (dir === 0 ? e * 120 : e * 40)
        off.set(layer, { x, y })
        put(layer, 'transform', `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) skewX(${dir ? skew.toFixed(2) : 0}deg)`)
        put(layer, 'opacity', String(Math.max(0, 1 - split * (dir ? 1.1 : 1.8)).toFixed(3)))
      })

      // Light each line from the star's projected position.
      if (motion.sun.ready && geo.lines.length === lines.length) {
        lines.forEach((ln, i) => {
          const g = geo.lines[i]
          const o = off.get(ln) ?? { x: 0, y: 0 }
          const left = g.left + geo.left + o.x
          const top = g.top + geo.top - sy + o.y
          put(ln, '--lx', `${(motion.sun.x - left).toFixed(1)}px`)
          put(ln, '--ly', `${(motion.sun.y - top).toFixed(1)}px`)
          put(ln, '--lr', `${motion.sun.r.toFixed(1)}px`)
          put(ln, '--hy', `${(motion.sun.horizon - top).toFixed(1)}px`)
          // Each letter clips its own copy of the line's light (see Hero.module.css).
          if (remeasure) {
            put(ln, '--lw', `${g.w}px`)
            put(ln, '--lh', `${g.h}px`)
            g.chars.forEach((c) => {
              put(c.el, '--cx', `${c.x}px`)
              put(c.el, '--cy', `${c.y}px`)
            })
          }
        })
      }
    }
    gsap.ticker.add(tick, false, true)

    // Letters swell toward the pointer (desktop only), using the cached geometry.
    let setters: ((v: number) => void)[] = []
    let charEls: CharGeo[] = []
    const onMove = (ev: PointerEvent) => {
      if (el.dataset.lit !== 'true' || !geo.valid) return
      if (!setters.length) {
        charEls = geo.lines.flatMap((g) => g.chars)
        setters = charEls.map((c) => gsap.quickTo(c.el, '--wdth', { duration: 0.8, ease: 'power3' }))
      }
      const sy = window.scrollY
      geo.lines.forEach((g, li) => {
        const o = off.get(lines[li]) ?? { x: 0, y: 0 }
        g.chars.forEach((c) => {
          const cx = geo.left + g.left + o.x + c.x + c.w / 2
          const cy = geo.top + g.top + o.y - sy + c.y + c.h / 2
          const f = Math.max(0, 1 - Math.hypot(ev.clientX - cx, ev.clientY - cy) / 320)
          setters[charEls.indexOf(c)]?.(68 + f * f * 44)
        })
      })
      swellUntil = performance.now() + 1000
    }
    const onLeave = () => {
      setters.forEach((set) => set(68))
      swellUntil = performance.now() + 1000
    }
    if (!isTouch && !prefersReducedMotion) {
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
    }

    return () => {
      gsap.ticker.remove(tick)
      st.kill()
      window.removeEventListener('resize', invalidate)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section id="home" ref={root} className={`chapter ${s.hero}`} data-lit="false">
      <h1 className="sr-only">
        {profile.firstName} {profile.lastName} — {profile.role}
      </h1>

      <div className={s.greeting} data-depth="10" aria-hidden>
        <span className={s.greetLine} data-greet-line />
        <span className={s.mask}>
          <span data-greet>{profile.greeting}</span>
        </span>
      </div>

      <div className={`${s.line} ${s.lineA}`} data-line="a" data-depth="16" aria-hidden>
        <span data-split>{profile.firstName}</span>
      </div>
      <div className={`${s.line} ${s.lineB}`} data-line="b" data-depth="30" aria-hidden>
        <span data-split>{profile.lastName}</span>
      </div>

      <div className={s.role} data-role data-depth="20" aria-hidden>
        <span className={s.roleIndex}>(01)</span>
        <span className={s.roleText} data-role-text>
          {profile.role}
        </span>
        <span className={s.rule} data-rule />
      </div>

      <div className={s.lower} data-depth="6">
        <p className={s.tagline} data-tagline>
          I build digital experiences where <em className="serif">engineering</em> meets{' '}
          <em className="serif">imagination.</em>
        </p>
        <div className={s.ctas}>
          <span data-cta>
            <Magnetic>
              <a
                className={s.ctaPrimary}
                href="#work"
                data-cursor="Explore"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget('work')
                }}
              >
                <span className={s.ctaFill} aria-hidden />
                <span className={s.ctaLabel}>Explore my work</span>
                <span className={s.ctaArrow} aria-hidden>
                  ↘
                </span>
              </a>
            </Magnetic>
          </span>
          <span data-cta>
            <Magnetic>
              <a
                className={s.ctaGhost}
                href="#about"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget('about')
                }}
              >
                About me
              </a>
            </Magnetic>
          </span>
        </div>
      </div>

      <div className={s.meta}>
        <div data-meta className={s.metaBlock}>
          <span className={s.metaKey}>Based in</span>
          <span>{profile.location}</span>
          <span className={s.metaDim}>{profile.coordinates}</span>
        </div>
        <button
          data-meta
          className={s.scroll}
          onClick={() => scrollToTarget('about')}
          aria-label="Scroll to the next chapter"
          data-cursor="Scroll"
        >
          <span className={s.scrollTrack}>
            <span className={s.scrollDot} />
          </span>
          <span>Scroll</span>
        </button>
        <div data-meta className={`${s.metaBlock} ${s.metaRight}`}>
          <span className={s.metaKey}>Local time</span>
          <LocalTime />
          <span className={s.metaDim}>Full-stack · Creative</span>
        </div>
      </div>
    </section>
  )
}
