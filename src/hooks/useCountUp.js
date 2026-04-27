import { useState, useEffect, useRef } from 'react'

export function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  const animRef = useRef(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (!start || hasRun.current) return
    hasRun.current = true

    const startTime = performance.now()

    function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [start, target, duration])

  return count
}
