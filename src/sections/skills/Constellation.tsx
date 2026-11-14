import { useEffect, useRef } from 'react'
import { skillCategories } from '../../content/skills'
import { isTouch, prefersReducedMotion } from '../../lib/quality'

type Node = {
  label: string
  cat: number
  hx: number // home, normalised -1..1
  hy: number
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  glow: number
}

/**
 * A star chart of the toolkit, drawn on one 2D canvas. Each category is a
 * cluster; choosing one gathers its stars into a ring at the centre and
 * pushes the rest to the edges. The pointer gently repels nearby stars.
 */
export function Constellation({ active }: { active: number | null }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef<number | null>(active)
  activeRef.current = active

  useEffect(() => {
    const cv = canvas.current!
    const ctx = cv.getContext('2d')!
    let w = 0
    let h = 0
    let dpr = 1
    const cats = skillCategories.length

    // Home positions: clusters spaced around an ellipse, stars jittered around each.
    const nodes: Node[] = []
    let seed = 9
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    skillCategories.forEach((c, ci) => {
      const a = (ci / cats) * Math.PI * 2 - Math.PI / 2
      const cx = Math.cos(a) * 0.55
      const cy = Math.sin(a) * 0.55
      c.skills.forEach((label, si) => {
        const b = (si / c.skills.length) * Math.PI * 2 + rand()
        const r = 0.12 + rand() * 0.14
        const hx = cx + Math.cos(b) * r
        const hy = cy + Math.sin(b) * r
        nodes.push({ label, cat: ci, hx, hy, x: hx, y: hy, vx: 0, vy: 0, phase: rand() * 10, glow: 0 })
      })
    })

    const resize = () => {
      const r = cv.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width
      h = r.height
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cv)

    const pointer = { x: -9, y: -9 }
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
      pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1
    }
    const onLeave = () => {
      pointer.x = pointer.y = -9
    }
    if (!isTouch) {
      cv.addEventListener('pointermove', onMove)
      cv.addEventListener('pointerleave', onLeave)
    }

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(cv)

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      // rAF's timestamp can be older than `last` (set from performance.now()),
      // and a negative step makes the springs below diverge.
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05))
      last = now
      const t = now / 1000
      const act = activeRef.current
      const sx = Math.min(w * 0.82, h * 1.2) * 0.5
      const sy = h * 0.5
      const tx = (x: number) => w / 2 + x * sx
      const ty = (y: number) => h / 2 + y * sy

      // Targets: the active cluster forms a ring at the centre; others recede.
      const members = act === null ? [] : nodes.filter((n) => n.cat === act)
      nodes.forEach((n) => {
        let gx = n.hx
        let gy = n.hy
        if (act !== null) {
          if (n.cat === act) {
            const k = members.indexOf(n)
            const a = (k / members.length) * Math.PI * 2 - Math.PI / 2
            gx = Math.cos(a) * 0.42
            gy = Math.sin(a) * 0.58
          } else {
            const len = Math.hypot(n.hx, n.hy) || 1
            gx = (n.hx / len) * 0.8
            gy = (n.hy / len) * 0.86
          }
        }
        if (!prefersReducedMotion) {
          gx += Math.sin(t * 0.4 + n.phase) * 0.012
          gy += Math.cos(t * 0.35 + n.phase) * 0.016
        }
        // Spring toward target.
        const k = prefersReducedMotion ? 1 : 1 - Math.exp(-dt * 3.2)
        n.vx = (gx - n.x) * k
        n.vy = (gy - n.y) * k
        // Pointer repulsion.
        const dx = n.x - pointer.x
        const dy = n.y - pointer.y
        const d = Math.hypot(dx, dy)
        if (d < 0.22 && !prefersReducedMotion) {
          const f = (1 - d / 0.22) * 0.018
          n.vx += (dx / (d || 1)) * f
          n.vy += (dy / (d || 1)) * f
        }
        n.x += n.vx
        n.y += n.vy
        const want = act === null ? 0.55 : n.cat === act ? 1 : 0.12
        n.glow += (want - n.glow) * (1 - Math.exp(-dt * 5))
      })

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Orbits
      ctx.strokeStyle = 'rgba(245,240,237,0.06)'
      ctx.lineWidth = 1
      for (const r of [0.3, 0.55, 0.8]) {
        ctx.beginPath()
        ctx.ellipse(w / 2, h / 2, r * sx, r * sy, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Links within each cluster (a ring), plus a hub at the centre when active.
      for (let c = 0; c < cats; c++) {
        const group = nodes.filter((n) => n.cat === c)
        const g = group[0]?.glow ?? 0
        ctx.strokeStyle = act === c ? `rgba(230,57,70,${0.55 * g})` : `rgba(245,240,237,${0.14 * g})`
        ctx.beginPath()
        group.forEach((n, i) => {
          const m = group[(i + 1) % group.length]
          ctx.moveTo(tx(n.x), ty(n.y))
          ctx.lineTo(tx(m.x), ty(m.y))
        })
        ctx.stroke()
        if (act === c) {
          ctx.strokeStyle = `rgba(230,57,70,${0.22 * g})`
          ctx.beginPath()
          group.forEach((n) => {
            ctx.moveTo(w / 2, h / 2)
            ctx.lineTo(tx(n.x), ty(n.y))
          })
          ctx.stroke()
        }
      }

      // Stars and labels
      ctx.textBaseline = 'middle'
      nodes.forEach((n) => {
        const x = tx(n.x)
        const y = ty(n.y)
        const on = act === n.cat
        const twinkle = prefersReducedMotion ? 1 : 0.75 + 0.25 * Math.sin(t * 2 + n.phase * 3)
        const r = (on ? 4.5 : 2.4) * (0.8 + n.glow * 0.4)
        ctx.fillStyle = on ? `rgba(230,57,70,${n.glow})` : `rgba(245,240,237,${0.35 + n.glow * 0.6 * twinkle})`
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        if (on) {
          ctx.strokeStyle = `rgba(230,57,70,${0.4 * n.glow})`
          ctx.beginPath()
          ctx.arc(x, y, r + 7 + Math.sin(t * 3 + n.phase) * 2, 0, Math.PI * 2)
          ctx.stroke()
        }
        const size = on ? 15 : 11
        ctx.font = `${on ? 500 : 400} ${size}px "JetBrains Mono", monospace`
        ctx.fillStyle = on ? `rgba(245,240,237,${n.glow})` : `rgba(245,240,237,${0.18 + n.glow * 0.55})`
        const right = x > w / 2
        ctx.textAlign = right ? 'left' : 'right'
        ctx.fillText(n.label.toUpperCase(), x + (right ? 12 : -12), y)
      })

      // Centre mark
      if (act !== null) {
        ctx.fillStyle = 'rgba(230,57,70,0.9)'
        ctx.font = '500 11px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText(skillCategories[act].label.toUpperCase(), w / 2, h / 2)
      } else {
        ctx.fillStyle = 'rgba(245,240,237,0.5)'
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      cv.removeEventListener('pointermove', onMove)
      cv.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={canvas} style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden />
}
