import { useState, useEffect, useRef, useCallback } from 'react'

export function useScrollFrame({ fps = 30, totalFrames = 90 } = {}) {
  const [frame, setFrame] = useState(0)
  const ref = useRef(null)
  const animRef = useRef(null)
  const startTimeRef = useRef(null)
  const hasAnimated = useRef(false)

  const startAnimation = useCallback(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const duration = (totalFrames / fps) * 1000

    function tick(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      setFrame(Math.round(progress * totalFrames))
      if (progress < 1) animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
  }, [fps, totalFrames])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) startAnimation() },
      { threshold: 0.1 }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [startAnimation])

  return { frame, ref }
}
