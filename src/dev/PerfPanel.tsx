import { useEffect, useRef, useState } from 'react'
import type * as THREE from 'three'
import { ceiling, levelConfig, perfStats, quality, type Level } from '../lib/quality'
import { motion } from '../lib/motion'

/**
 * Development only: live performance numbers. Toggle with Shift+P, or open
 * the page with ?perf. Updates twice a second by writing text directly, so
 * it costs the page nothing measurable and never re-renders React.
 */
const LEVELS: Level[] = ['low', 'medium', 'high', 'ultra']

export default function PerfPanel() {
  const [open, setOpen] = useState(() => new URLSearchParams(location.search).has('perf'))
  const out = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'p') setOpen((o) => !o)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  useEffect(() => {
    if (!open) return
    const id = window.setInterval(() => {
      const n = perfStats.count
      const buf = perfStats.frames
      const list: number[] = []
      for (let i = 0; i < n; i++) list.push(buf[(perfStats.head - 1 - i + buf.length) % buf.length])
      const recent = list.slice(0, 60)
      const sorted = [...list].sort((a, b) => a - b)
      const q = (p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0)
      const avg = list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0
      const sd = list.length ? Math.sqrt(list.reduce((a, b) => a + (b - avg) ** 2, 0) / list.length) : 0
      const fps = recent.length ? 1000 / (recent.reduce((a, b) => a + b, 0) / recent.length) : 0
      const gl = (window as unknown as { __aphelion?: { gl: THREE.WebGLRenderer } }).__aphelion?.gl
      const level = quality.get()
      const cfg = levelConfig(level)
      const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
      const lines = [
        `fps      ${fps.toFixed(0).padStart(4)}   budget ${perfStats.budget.toFixed(1)} ms`,
        `frame    avg ${avg.toFixed(1)}  p95 ${q(0.95).toFixed(1)}  p99 ${q(0.99).toFixed(1)}  sd ${sd.toFixed(1)}`,
        `long     >25ms ${list.filter((x) => x > 25).length}   >50ms ${list.filter((x) => x > 50).length}   (last ${n})`,
        `quality  ${level} (start ${ceiling})   mode ${motion.renderMode}`,
        gl
          ? `canvas   ${gl.domElement.width}×${gl.domElement.height} @ ${gl.getPixelRatio().toFixed(2)}x`
          : 'canvas   (no WebGL)',
        gl ? `draws    ${gl.info.render.calls}   tris ${(gl.info.render.triangles / 1000).toFixed(0)}k` : '',
        gl ? `gpu mem  ${gl.info.memory.textures} tex  ${gl.info.memory.geometries} geo  ${gl.info.programs?.length ?? 0} programs` : '',
        `effects  post ${cfg.post ? 'on' : 'off'}  reflect ${cfg.reflect ? 'on' : 'off'}  dust ${cfg.dust}  shards ${cfg.shards}`,
        mem ? `js heap  ${(mem.usedJSHeapSize / 1048576).toFixed(0)} MB` : '',
        ...perfStats.changes.slice(-3).map((c) => `change   ${(c.at / 1000).toFixed(0)}s ${c.from}→${c.to}: ${c.why}`),
      ]
      if (out.current) out.current.textContent = lines.filter(Boolean).join('\n')
    }, 500)
    return () => window.clearInterval(id)
  }, [open])

  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 2147483000,
        padding: '10px 12px',
        background: 'rgba(8,7,7,0.86)',
        border: '1px solid rgba(245,240,237,0.2)',
        font: '11px/1.5 ui-monospace, Menlo, monospace',
        color: '#f5f0ed',
        pointerEvents: 'auto',
      }}
    >
      <pre ref={out} style={{ margin: 0, whiteSpace: 'pre' }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => quality.set(l)}
            style={{ font: 'inherit', color: 'inherit', border: '1px solid rgba(245,240,237,0.3)', padding: '2px 6px' }}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}
