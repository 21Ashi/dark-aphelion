import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { projects } from '../../content/projects'
import { SLIDES } from '../../content/showcase'
import { motion } from '../../lib/motion'
import { tier } from '../../lib/quality'
import { live, seeded } from '../path'
import { PREWARM } from '../prewarm'
import { afterIntro, whenIdle } from '../idle'
import { stage, studioEnvironment } from './state'
import { backdropFrag, plainVert, skyFrag, skyVert } from './shaders'

/** The GLB models and everything standing on the stage: fetched and built after the intro. */
const Stage = lazy(() => import('./Stage'))

const N = projects.length
/** Distance from the camera to the stage, in world units. */
const DEPTH = 15
const SKY_R = 52
/** Distance from the camera to a backdrop photo: far enough to drift a little against the stage. */
const BACK = 40
/** Landscape: the pedestal's axis, as a fraction of the half-width right of the frame's centre. */
const STAGE_X = 0.36
/** ...and while a case study is open, its panel on the left. */
const CS_X = 0.5

const smooth = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const cam = new THREE.Vector3()
const focus = new THREE.Vector3()
const ray = new THREE.Vector3()
const white = new THREE.Color('#fff6ee')

/** A tiling picture of soft noise (four octaves of value noise), for the room's smoke. Built once. */
function smokeTexture(n = 128) {
  const rand = seeded(9)
  const data = new Uint8Array(n * n)
  const octaves = [4, 8, 16, 32].map((period, i) => ({
    period,
    amp: 0.5 / 2 ** i,
    grid: Float32Array.from({ length: period * period }, rand),
  }))
  const fade = (t: number) => t * t * (3 - 2 * t)
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let v = 0
      for (const o of octaves) {
        const fx = (x / n) * o.period
        const fy = (y / n) * o.period
        const x0 = Math.floor(fx)
        const y0 = Math.floor(fy)
        const tx = fade(fx - x0)
        const ty = fade(fy - y0)
        const at = (i: number, j: number) => o.grid[(j % o.period) * o.period + (i % o.period)]
        const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx
        const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx
        v += (top + (bottom - top) * ty) * o.amp
      }
      data[y * n + x] = Math.round((v / 0.9375) * 255)
    }
  const t = new THREE.DataTexture(data, n, n, THREE.RedFormat, THREE.UnsignedByteType)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}

/**
 * The Works chapter's stage. One selected project at a time: its phones on the
 * pedestal, its icon, an orbit of light, in a room of its own colours.
 *
 * This shell is mounted with the scene: the backdrop (which replaces the world
 * while the chapter is on screen), the dust, the stage's two lights (always
 * present, dark outside the chapter, so the light count never changes and no
 * material recompiles) and the stage's placement in the frame. The models are
 * in Stage.tsx, loaded once the intro has played.
 */
export function Showcase() {
  const root = useRef<THREE.Group>(null)
  const sky = useRef<THREE.Mesh>(null)
  const photo = useRef<THREE.Mesh>(null)
  const photos = useRef(new Map<number, THREE.Texture>())
  const motes = useRef<THREE.Points>(null)
  const key = useRef<THREE.DirectionalLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)
  const [ready, setReady] = useState(false)
  const st = useRef({
    focus: -1,
    pulse: 1,
    photo: -1,
    k: 0,
    /** 0 → 1: a case study is open over the stage. */
    cs: 0,
    sun: null as THREE.DirectionalLight | null,
    sunBase: 0,
    world: null as THREE.Object3D | null,
  })

  useEffect(() => afterIntro(() => setReady(true)), [])

  // Backdrop photos, for the projects that have one.
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    let alive = true
    const store = photos.current
    const cancel = afterIntro(() =>
      projects.forEach((p, i) => {
        const bd = SLIDES[p.id]?.backdrop
        if (!bd) return
        loader.load(`${import.meta.env.BASE_URL}${bd.src}`, (t) => {
          if (!alive) return t.dispose()
          t.colorSpace = THREE.SRGBColorSpace
          whenIdle(() => alive && gl.initTexture(t))
          store.set(i, t)
        })
      }),
    )
    return () => {
      alive = false
      cancel()
      store.forEach((t) => t.dispose())
      store.clear()
    }
  }, [gl])

  const { skyMat, photoMat, themes, moteGeo, moteMat, smoke, env } = useMemo(() => {
    // Built now, while the preloader is up: the reflections are GPU work, the smoke a few ms of CPU.
    const env = studioEnvironment(gl)
    stage.env = env
    const smoke = smokeTexture()
    const photoMat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: null }, uOpacity: { value: 0 }, uStacked: { value: 0 } },
      vertexShader: plainVert,
      fragmentShader: backdropFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uDeep: { value: new THREE.Color('#8b1a1a') },
        uAccent: { value: new THREE.Color('#e63946') },
        uFocus: { value: new THREE.Vector3(0.3, -0.1, -0.95) },
        uOn: { value: 0 },
        uPulse: { value: 1 },
        uTime: { value: 0 },
        uSmoke: { value: smoke },
      },
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      side: THREE.BackSide,
      // painted over the whole world (no depth test); everything on the stage is drawn after it
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const themes = projects.map((p) => ({ deep: new THREE.Color(p.theme.deep), accent: new THREE.Color(p.theme.accent) }))
    const rand = seeded(1448)
    const n = tier === 'low' ? 110 : 260
    const pts = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pts[i * 3] = -11 + rand() * 18
      pts[i * 3 + 1] = -2 + rand() * 13
      pts[i * 3 + 2] = -7 + rand() * 11
    }
    const moteGeo = new THREE.BufferGeometry()
    moteGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
    const moteMat = new THREE.PointsMaterial({
      size: 0.06,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: '#e63946',
    })
    return { skyMat, photoMat, themes, moteGeo, moteMat, smoke, env }
  }, [gl])

  useEffect(
    () => () => {
      skyMat.dispose()
      photoMat.dispose()
      smoke.dispose()
      env.dispose()
      if (stage.env === env) stage.env = null
      moteGeo.dispose()
      moteMat.dispose()
    },
    [skyMat, photoMat, moteGeo, moteMat, smoke, env],
  )

  useFrame(({ clock, camera }, dt) => {
    const w = motion.works
    const s = st.current
    const su = skyMat.uniforms
    const on = smooth(clamp01(w.on * 1.15)) * (1 - smooth(clamp01((w.out - 0.45) / 0.55)))
    stage.present = on
    su.uOn.value = on
    sky.current!.visible = on > 0.002

    // Once the backdrop is opaque nothing of the world can be seen: stop drawing it.
    // The world's red sun is dimmed meanwhile; the stage has its own key and rim light.
    s.world ??= scene.getObjectByName('world') ?? null
    if (s.world) s.world.visible = on < 0.995
    if (!s.sun) {
      s.sun = (scene.getObjectByName('sun') as THREE.DirectionalLight | undefined) ?? null
      if (s.sun) s.sunBase = s.sun.intensity
    }
    // (fully: even a little of it glints red off the polished pedestal top)
    if (s.sun) s.sun.intensity = s.sunBase * (1 - on)
    const g = root.current!
    if (!sky.current!.visible) {
      g.visible = false
      photo.current!.visible = false
      key.current!.intensity = 0
      rim.current!.intensity = 0
      return
    }
    g.visible = true

    const d = Math.min(dt, 1 / 10)
    const t = clock.elapsedTime
    s.cs += ((w.cs.open ? 1 : 0) - s.cs) * (1 - Math.exp(-d * 3))
    // CameraRig's portrait framing is by aspect; the stacked composition also covers narrow windows
    // (the same rule as the type column's CSS).
    const portrait = size.width / size.height < 0.9
    const stacked = portrait || size.width < 760
    stage.portrait = stacked

    // The palette follows the selected project; a wave of the new colour marks the change.
    const near = Math.round(THREE.MathUtils.clamp(w.pos, 0, N - 1))
    if (near !== s.focus) {
      if (s.focus >= 0) s.pulse = 0
      s.focus = near
    }
    s.pulse = Math.min(1, s.pulse + d * 0.8)
    const kc = 1 - Math.exp(-d * 2.6)
    stage.accent.lerp(themes[near].accent, kc)
    stage.deep.lerp(themes[near].deep, kc)
    ;(su.uDeep.value as THREE.Color).copy(stage.deep)
    ;(su.uAccent.value as THREE.Color).copy(stage.accent)
    su.uPulse.value = s.pulse
    su.uTime.value = t

    // Frame the stage from where the camera settles for this chapter (CameraRig):
    // the type column on the left, the stage on the right; on portrait screens,
    // the stage above and the type below.
    const sc = live.sculpt
    cam.set(sc.x + (portrait ? 0 : 2.2), sc.y + 0.6, sc.z + (portrait ? 36 : 34))
    const fov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov)
    const halfH = Math.tan(fov / 2) * DEPTH
    const halfW = halfH * (size.width / size.height)
    const cy = cam.y - (0.6 * DEPTH) / (portrait ? 36 : 34)
    const stageX = THREE.MathUtils.lerp(STAGE_X, CS_X, s.cs)
    let k: number
    if (stacked) {
      // Fit the stage's bounds (local units: the icon top left, the pedestal at the foot) into the
      // band between the nav and the type column, with a margin at the sides.
      // (the case study's panel takes the place of the slide's type column)
      const sTop = THREE.MathUtils.lerp(w.safe.top, w.cs.safe.top, s.cs)
      const sBottom = THREE.MathUtils.lerp(w.safe.bottom, w.cs.safe.bottom, s.cs)
      const top = cy + halfH * (1 - 2 * sTop)
      const bottom = cy + halfH * (1 - 2 * Math.max(sTop + 0.2, sBottom))
      // y0 reaches below the plinth: its front edge and the model's tilted halo hang lower in perspective
      const B = { x0: -3.45, x1: 3.45, y0: -2.5, y1: 7.25 }
      const want = Math.min((top - bottom) / (B.y1 - B.y0), (0.92 * 2 * halfW) / (B.x1 - B.x0))
      s.k = s.k ? s.k + (want - s.k) * (1 - Math.exp(-d * 4)) : want
      k = s.k
      const mid = (top + bottom) / 2 - ((B.y0 + B.y1) / 2) * k
      g.position.set(cam.x - ((B.x0 + B.x1) / 2) * k, mid, cam.z - DEPTH)
    } else {
      k = Math.min(0.2 * halfH, 0.112 * halfW) * (1 + 0.08 * s.cs)
      g.position.set(cam.x + stageX * halfW, cy - (0.64 - 0.03 * s.cs) * halfH, cam.z - DEPTH)
    }
    g.scale.setScalar(k)
    const lean = stacked ? 0.3 : 1
    g.rotation.set(-motion.pointer.y * 0.025 * lean, motion.pointer.x * 0.05 * lean, 0)

    // Where the stage sits on the backdrop, so its light pools behind it.
    focus.set(0, 3.2 * k, 0).add(g.position)
    ray.copy(focus).sub(cam).normalize()
    const c = cam.sub(sc)
    const b = c.dot(ray)
    const tt = -b + Math.sqrt(Math.max(0, b * b - (c.lengthSq() - SKY_R * SKY_R)))
    ;(su.uFocus.value as THREE.Vector3).copy(c).addScaledVector(ray, tt).normalize()
    sky.current!.position.copy(sc)

    // The selected project's backdrop photo, if it has one: fades out, swaps, fades in.
    const want = SLIDES[projects[near].id]?.backdrop ? near : -1
    const pu = photoMat.uniforms
    if (want !== s.photo && pu.uOpacity.value < 0.02) {
      s.photo = want
      pu.uMap.value = (want >= 0 && photos.current.get(want)) || null
    }
    if (s.photo >= 0 && !pu.uMap.value) pu.uMap.value = photos.current.get(s.photo) ?? null
    // only behind a project's own slide: never under the chapter's "Selected works" intro
    const slideIn = smooth(clamp01((w.build - 0.72) / 0.28))
    const show = want === s.photo && pu.uMap.value ? 1 : 0
    pu.uOpacity.value += (show * on * slideIn - pu.uOpacity.value) * (1 - Math.exp(-d * (show ? 2.2 : 5)))
    const ph = photo.current!
    ph.visible = pu.uOpacity.value > 0.003
    if (ph.visible && s.photo >= 0) {
      // Cover the frame at its depth, with the photo's focus beside the stage
      // (to the right of it; above the type on portrait screens).
      const bd = SLIDES[projects[s.photo].id].backdrop!
      const onStage = bd.anchor === 'stage'
      const img = (pu.uMap.value as THREE.Texture).image as { width: number; height: number }
      const ia = img.width / img.height
      const depth = onStage ? DEPTH : BACK
      const bh = Math.tan(fov / 2) * depth
      const bw = bh * (size.width / size.height)
      const pw = Math.max(2 * bw, 2 * bh * ia) * 1.08
      const phh = pw / ia
      // where the focus lands on screen (0–1 from the top left): the top of the 3D pedestal, or beside the stage
      const fx = onStage ? (stacked ? 0.6 : 0.5 + stageX / 2) : stacked ? 0.5 : 0.9
      const fy = onStage ? (stacked ? 0.47 : 0.82) : stacked ? 0.3 : 0.5
      ph.position.set(
        cam.x + sc.x + (fx - 0.5) * 2 * bw - (bd.focus[0] - 0.5) * pw,
        cam.y + sc.y - (0.6 * depth) / (portrait ? 36 : 34) - (fy - 0.5) * 2 * bh + (bd.focus[1] - 0.5) * phh,
        cam.z + sc.z - depth,
      )
      // keep the photo inside the frame's edges
      ph.position.x = THREE.MathUtils.clamp(ph.position.x, cam.x + sc.x + bw - pw / 2, cam.x + sc.x - bw + pw / 2)
      ph.position.y = THREE.MathUtils.clamp(ph.position.y, cam.y + sc.y + bh - phh / 2 - 0.5, cam.y + sc.y - bh + phh / 2 + 0.5)
      ph.scale.set(pw, phh, 1)
      pu.uStacked.value = stacked ? 1 : 0
    }

    // The stage's own light: a soft key from the front left, the project's colour as a rim from behind.
    key.current!.color.copy(white).lerp(stage.accent, 0.18)
    rim.current!.color.copy(stage.accent)
    key.current!.intensity = 1.5 * on
    rim.current!.intensity = 2.4 * on

    const m = motes.current!
    m.rotation.y = t * 0.015
    m.position.y = Math.sin(t * 0.2) * 0.3
    moteMat.opacity = 0.6 * on * smooth(clamp01((w.build - 0.2) / 0.6))
    moteMat.color.copy(stage.accent)
  })

  return (
    <>
      <mesh ref={sky} material={skyMat} renderOrder={50} frustumCulled={false} visible={false} userData={PREWARM}>
        <sphereGeometry args={[SKY_R, 48, 32]} />
      </mesh>
      <mesh ref={photo} material={photoMat} renderOrder={52} frustumCulled={false} visible={false} userData={PREWARM}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      {/* directional lights point at the origin: only their direction matters */}
      <directionalLight ref={key} position={[-6, 9, 11]} intensity={0} />
      <directionalLight ref={rim} position={[9, 4, -10]} intensity={0} />
      <group ref={root} visible={false}>
        <points ref={motes} geometry={moteGeo} material={moteMat} renderOrder={65} frustumCulled={false} userData={PREWARM} />
        {ready && (
          <Suspense fallback={null}>
            <Stage />
          </Suspense>
        )}
      </group>
    </>
  )
}
