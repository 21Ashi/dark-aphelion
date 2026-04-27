import { useEffect, useRef, useState } from 'react'

export function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const posRef = useRef({ x: -100, y: -100 })
  const ringPosRef = useRef({ x: -100, y: -100 })
  const [isHovering, setIsHovering] = useState(false)
  const animRef = useRef(null)

  useEffect(() => {
    function onMove(e) {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      }
    }

    function onEnter() { setIsHovering(true) }
    function onLeave() { setIsHovering(false) }

    document.addEventListener('mousemove', onMove)
    document.querySelectorAll('a, button, [data-hover]').forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    function animateRing() {
      ringPosRef.current.x += (posRef.current.x - ringPosRef.current.x) * 0.12
      ringPosRef.current.y += (posRef.current.y - ringPosRef.current.y) * 0.12
      if (ringRef.current) {
        const size = isHovering ? 40 : 28
        ringRef.current.style.transform = `translate(${ringPosRef.current.x - size / 2}px, ${ringPosRef.current.y - size / 2}px)`
        ringRef.current.style.width = size + 'px'
        ringRef.current.style.height = size + 'px'
      }
      animRef.current = requestAnimationFrame(animateRing)
    }
    animRef.current = requestAnimationFrame(animateRing)

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(animRef.current)
    }
  }, [isHovering])

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#1a56db',
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          borderRadius: '50%',
          border: `1.5px solid ${isHovering ? '#1a56db' : 'rgba(26,86,219,0.5)'}`,
          pointerEvents: 'none',
          zIndex: 9998,
          willChange: 'transform, width, height',
          background: isHovering ? 'rgba(26,86,219,0.08)' : 'transparent',
        }}
      />
    </>
  )
}
