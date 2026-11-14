import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { armQualityMonitor, ceiling, levelConfig, perfStats, phoneDpr, prefersReducedMotion, quality, sampleFrame, tier } from '../lib/quality'
import { motion } from '../lib/motion'
import { useStore } from '../hooks/useStore'
import { complete } from '../lib/loader'
import { CameraRig } from './CameraRig'
import { Star } from './Star'
import { Monoliths } from './Monoliths'
import { Ground } from './Ground'
import { Sculpture } from './Sculpture'
import { Shards } from './Shards'
import { Showcase } from './showcase/Showcase'
import { Dust, Shafts, Smoke } from './Atmosphere'
import { Effects } from './Effects'
import { SUN } from './path'
import { precompileHidden } from './prewarm'
import { afterIntro, whenIdle } from './idle'

/** Compile every shader up front; report ready on the first frame drawn after. */
function Warmup() {
  const { gl, scene, camera, invalidate } = useThree()
  const compiled = useRef(false)
  const frames = useRef(0)
  useEffect(() => {
    let alive = true
    gl.compileAsync(scene, camera)
      .catch(() => gl.compile(scene, camera))
      .finally(() => {
        if (!alive) return
        compiled.current = true
        invalidate() // on-demand mode (reduced motion) needs a nudge to draw
      })
    return () => {
      alive = false
    }
  }, [gl, scene, camera, invalidate])
  useFrame(() => {
    if (!compiled.current || frames.current >= 2) return
    if (++frames.current === 2) {
      complete('gpu')
      // The hidden Works stage compiles in the background, long before anyone scrolls to it.
      afterIntro(() =>
        precompileHidden(gl, scene, camera, levelConfig(quality.get()).post, whenIdle, () =>
          // start judging frame times only once all of that is done
          window.setTimeout(armQualityMonitor, 3000),
        ),
      )
    }
    else invalidate()
  })
  return null
}

/**
 * Stop rendering while an opaque chapter covers the canvas, or the tab is
 * hidden. Reduced motion renders on demand only.
 */
function FrameGovernor() {
  const setFrameloop = useThree((s) => s.setFrameloop)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (prefersReducedMotion) {
      setFrameloop('demand')
      let last = -1
      const id = window.setInterval(() => {
        // Re-render only when the chapter actually changes.
        const c = Math.round(motion.chapter * 20)
        if (c !== last) {
          last = c
          invalidate()
        }
      }, 120)
      return () => window.clearInterval(id)
    }
    // Every frame while the visitor is active; 30 fps after 20 s without any
    // input (the ambient motion carries on, at half the battery cost);
    // nothing while an opaque overlay covers the canvas or the tab is hidden.
    let lastInput = performance.now()
    let mode: 'always' | 'idle' | 'never' = 'always'
    let pulse = 0
    const apply = (next: typeof mode) => {
      if (next === mode) return
      mode = next
      motion.renderMode = next
      window.clearInterval(pulse)
      if (next === 'idle') {
        setFrameloop('demand')
        pulse = window.setInterval(() => invalidate(), 1000 / 30)
      } else setFrameloop(next)
    }
    const poke = () => {
      lastInput = performance.now()
      if (mode === 'idle') apply('always')
    }
    const events = ['pointermove', 'pointerdown', 'wheel', 'keydown', 'touchstart', 'scroll'] as const
    events.forEach((e) => window.addEventListener(e, poke, { passive: true }))
    const id = window.setInterval(() => {
      const hidden = motion.sceneCovered || document.hidden
      apply(hidden ? 'never' : performance.now() - lastInput > 20000 ? 'idle' : 'always')
    }, 100)
    return () => {
      window.clearInterval(id)
      window.clearInterval(pulse)
      events.forEach((e) => window.removeEventListener(e, poke))
    }
  }, [setFrameloop, invalidate])
  return null
}

/** Feeds frame times to the quality manager (and resets renderer stats per frame in development). */
function FrameStats() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    if (import.meta.env.DEV) gl.info.autoReset = false
  }, [gl])
  useFrame((_, dt) => {
    if (import.meta.env.DEV) gl.info.reset()
    // only real, continuous rendering says anything about the device
    if (motion.renderMode === 'always') sampleFrame(dt * 1000)
  }, -1)
  return null
}

/** Colonnade size is fixed by the starting level: changing it later would rebuild the world in view. */
const MONOLITHS = { ultra: 46, high: 46, medium: 34, low: 24 }[ceiling]

export default function Scene() {
  const level = useStore(quality)
  useStore(phoneDpr) // a phone's resolution step re-renders the canvas settings
  const cfg = levelConfig(level)
  const still = prefersReducedMotion

  return (
    <Canvas
      dpr={[1, cfg.dprMax]}
      gl={{ antialias: tier !== 'low', powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: 40, near: 0.1, far: 1600, position: [0, 3.2, 40] }}
      onCreated={({ gl, scene }) => {
        // Development only: the renderer, for the perf harness and panel.
        if (import.meta.env.DEV) Object.assign(window, { __aphelion: { gl, scene, quality, perfStats } })
        gl.setClearColor('#080707')
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.95
        scene.fog = new THREE.FogExp2('#060404', 0.0085)
      }}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.08} color="#3a2a2a" />
        <directionalLight name="sun" position={[SUN.pos.x, SUN.pos.y + 20, SUN.pos.z]} intensity={1.25} color="#d8382c" />
        <directionalLight position={[-30, 40, 60]} intensity={0.22} color="#8a7a78" />

        {/* Everything the Works stage replaces while it is on screen. */}
        <group name="world">
          <Star frozen={still} />
          <Monoliths count={MONOLITHS} />
          <Ground reflect={cfg.reflect && !still} frozen={still} />
          <Shards count={cfg.shards} frozen={still} />
          <Dust count={cfg.dust} frozen={still} />
          <Smoke frozen={still} />
          {tier !== 'low' && <Shafts frozen={still} />}
        </group>
        <Sculpture detail={tier === 'low' ? 18 : tier === 'medium' ? 26 : 34} frozen={still} />
        {!still && <Showcase />}

        <CameraRig still={still} />
        {cfg.post && <Effects aberration={cfg.aberration} />}
        <Warmup />
        <FrameGovernor />
        <FrameStats />
      </Suspense>
    </Canvas>
  )
}
