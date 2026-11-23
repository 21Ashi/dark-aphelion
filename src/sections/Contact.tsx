import { useEffect, useRef, useState } from 'react'
import { gsap, SplitText, useGSAP } from '../lib/gsap'
import { profile, socials } from '../content/profile'
import { Magnetic } from '../components/Magnetic'
import { scrollToTarget } from '../lib/scroll'
import s from './Contact.module.css'

/**
 * Aphelion — the finale. As you arrive the camera turns to the star and an
 * eclipse closes over it; the headline assembles from both sides, scrubbed
 * to the same scroll, and "product" fills with light.
 */
export function Contact() {
  const root = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()
      const sub = SplitText.create(q('[data-ct-sub]'), { type: 'words', mask: 'words' })

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 10%', scrub: 0.6 },
          defaults: { ease: 'none' },
        })
        tl.fromTo(q('[data-ct-line="1"]'), { xPercent: -45, opacity: 0 }, { xPercent: 0, opacity: 1 }, 0)
          .fromTo(q('[data-ct-line="2"]'), { xPercent: 45, opacity: 0 }, { xPercent: 0, opacity: 1 }, 0.08)
          .fromTo(q('[data-ct-line="3"]'), { xPercent: -30, opacity: 0 }, { xPercent: 0, opacity: 1 }, 0.16)
          .fromTo(q('[data-ct-fill]'), { '--fill': '0%' }, { '--fill': '100%' }, 0.3)

        gsap
          .timeline({ scrollTrigger: { trigger: q('[data-ct-sub]'), start: 'top 85%' } })
          .from(sub.words, { yPercent: 110, duration: 1, stagger: 0.04 })
          .from(q('[data-ct-in]'), { y: 40, opacity: 0, duration: 1.1, stagger: 0.07 }, 0.2)
      })

      return () => {
        mm.revert()
        sub.revert()
      }
    },
    { scope: root },
  )

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 2200)
    return () => window.clearTimeout(id)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <section id="contact" ref={root} className={`chapter ${s.contact}`}>
      <div className={s.inner}>
        <span className={s.index}>
          <span>05</span> — Aphelion
        </span>

        <h2 className={s.headline}>
          <span className={s.line} data-ct-line="1">
            Have a
          </span>
          <span className={`${s.line} ${s.fill}`} data-ct-line="2" data-ct-fill>
            product
          </span>
          <span className={s.line} data-ct-line="3">
            in mind<span className={s.q}>?</span>
          </span>
        </h2>

        <p className={`serif ${s.sub}`} data-ct-sub>
          Tell me what it is and who it’s for.
        </p>

        <div className={s.mailRow} data-ct-in>
          <Magnetic strength={0.22}>
            <a className={s.mail} href={`mailto:${profile.email}`} data-cursor="Write">
              {profile.email}
            </a>
          </Magnetic>
          <button className={s.copy} onClick={copy} data-cursor={copied ? 'Copied' : 'Copy'}>
            <span aria-live="polite">{copied ? 'Copied ✓' : 'Copy address'}</span>
          </button>
        </div>

        <ul className={s.socials} data-ct-in>
          {socials
            .filter((x) => x.label !== 'Email')
            .map((x) => (
              <li key={x.label}>
                <a href={x.href} target={x.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  <span className={s.socialLabel}>{x.label}</span>
                  <span className={s.socialHandle}>{x.handle}</span>
                  <span className={s.socialArrow} aria-hidden>
                    ↗
                  </span>
                </a>
              </li>
            ))}
        </ul>
        <p className={s.avail} data-ct-in>
          <i aria-hidden /> {profile.availability}
        </p>
      </div>

      <footer className={s.footer}>
        <span>© {new Date().getFullYear()} Abood Ashi</span>
        <span className={s.footMid}>Designed and built in {profile.location}</span>
        <button className={s.top} onClick={() => scrollToTarget('home')} data-cursor="Top">
          Back to top ↑
        </button>
      </footer>
    </section>
  )
}
