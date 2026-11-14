import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/gsap'
import { isTouch, prefersReducedMotion } from '../lib/quality'

/**
 * Pulls its child toward the pointer while hovered and springs back on leave.
 * The inner layer travels further than the outer, so labels feel suspended.
 */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const outer = useRef<HTMLSpanElement>(null)
  const inner = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (isTouch || prefersReducedMotion) return
    const o = outer.current!
    const i = inner.current!
    const ox = gsap.quickTo(o, 'x', { duration: 0.6, ease: 'power3' })
    const oy = gsap.quickTo(o, 'y', { duration: 0.6, ease: 'power3' })
    const ix = gsap.quickTo(i, 'x', { duration: 0.6, ease: 'power3' })
    const iy = gsap.quickTo(i, 'y', { duration: 0.6, ease: 'power3' })

    const move = (e: PointerEvent) => {
      const r = o.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      ox(x * strength)
      oy(y * strength)
      ix(x * strength * 0.45)
      iy(y * strength * 0.45)
    }
    const leave = () => {
      gsap.to([o, i], { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' })
    }
    o.addEventListener('pointermove', move)
    o.addEventListener('pointerleave', leave)
    return () => {
      o.removeEventListener('pointermove', move)
      o.removeEventListener('pointerleave', leave)
    }
  }, [strength])

  return (
    <span ref={outer} className={className} style={{ display: 'inline-block' }}>
      <span ref={inner} style={{ display: 'inline-block' }}>
        {children}
      </span>
    </span>
  )
}
