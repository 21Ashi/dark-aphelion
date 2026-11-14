import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { isTouch } from '../lib/quality'
import s from './Cursor.module.css'

/**
 * A precise dot and a lagging ring. Anything with [data-cursor="Label"]
 * swells the ring and prints the label inside it; links and buttons get a
 * smaller swell. Not rendered for touch input.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (isTouch) return
    document.documentElement.classList.add('has-cursor')
    const d = dot.current!
    const r = ring.current!
    const l = label.current!

    const dx = gsap.quickTo(d, 'x', { duration: 0.08, ease: 'power3' })
    const dy = gsap.quickTo(d, 'y', { duration: 0.08, ease: 'power3' })
    const rx = gsap.quickTo(r, 'x', { duration: 0.5, ease: 'power3' })
    const ry = gsap.quickTo(r, 'y', { duration: 0.5, ease: 'power3' })

    let visible = false
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!visible) {
        visible = true
        gsap.to([d, r], { autoAlpha: 1, duration: 0.3 })
        gsap.set([d, r], { x: e.clientX, y: e.clientY })
      }
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
    }

    let current: Element | null = null
    const over = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest('[data-cursor], a, button, [role="button"]') ?? null
      if (target === current) return
      current = target
      const text = target?.getAttribute('data-cursor') ?? ''
      l.textContent = text
      r.dataset.state = !target ? 'idle' : text ? 'label' : 'link'
      d.dataset.state = r.dataset.state
    }

    const leave = () => {
      visible = false
      gsap.to([d, r], { autoAlpha: 0, duration: 0.3 })
    }
    const down = () => gsap.to(r, { scale: 0.82, duration: 0.2, ease: 'snap' })
    const up = () => gsap.to(r, { scale: 1, duration: 0.4, ease: 'snap' })

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    document.addEventListener('pointerleave', leave)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      document.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  if (isTouch) return null
  return (
    <>
      <div ref={ring} className={s.ring} data-state="idle" aria-hidden>
        <span ref={label} className={s.label} />
      </div>
      <div ref={dot} className={s.dot} data-state="idle" aria-hidden />
    </>
  )
}
