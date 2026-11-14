import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { projects } from '../../content/projects'
import { SLIDES } from '../../content/showcase'
import { iconSrc } from '../../content/gallery'
import { motion, worksHover } from '../../lib/motion'
import { levelConfig, quality } from '../../lib/quality'
import { precompileHidden, PREWARM } from '../prewarm'
import { whenIdle } from '../idle'
import { seeded } from '../path'
import { stage, studioEnvironment } from './state'
import { glowFrag, plainVert, ringFrag, ringVert, screenFrag, screenVert, shadowFrag } from './shaders'

/**
 * Everything standing on the Works stage, built from the supplied GLB models
 * (public/models): the obsidian pedestal is the floor, the smartphone mockup
 * carries the project's real screenshots on its glass (its placeholder UI is
 * hidden), the orbital sculpture turns slowly in the background. One phone
 * stands centred on the pedestal; around it: the app icon as a 3D tile, two
 * orbits of light and a few rocks.
 *
 * Units: the stage floor (the pedestal's top, centred on its axis) is the origin;
 * the phone is 6 units tall. Showcase.tsx places and scales the whole stage in the frame.
 */
const BASE = import.meta.env.BASE_URL
const MODELS = {
  pedestal: `${BASE}models/01_project_pedestal.glb`,
  orbital: `${BASE}models/02_orbital_sculpture.glb`,
  phone: `${BASE}models/03_smartphone_mockup.glb`,
}

/** The phone mockup's display glass, in the GLB's own units (the phone is 0.82 × 1.68). */
const GLASS = { w: 0.736, h: 1.566, z: 0.0768, r: 0.07 }
const PHONE_S = 6 / 1.68
/** The pedestal: radius 1.65 and Z-up in the GLB; the top of its inset is the floor. */
const PED_S = 3.35 / 1.65
const PED_TOP = 0.308

type V3 = [number, number, number]
type At = { p: V3; r: V3; s: number }
const AT: Record<'front' | 'icon' | 'hero' | 'orbital', At> = {
  // the phone stands centred on the pedestal (its foot on the floor), turned a little into 3D
  front: { p: [0, 3.03, 0.35], r: [-0.035, -0.3, 0.012], s: 1 },
  // the icon floats at the phone's upper left
  icon: { p: [-3.75, 6.2, 0.6], r: [-0.12, 0.42, 0.07], s: 1.7 },
  // a project with no screens puts its icon on the pedestal instead
  hero: { p: [0, 3.3, 0.5], r: [-0.04, -0.3, 0.03], s: 3.6 },
  // low on the left, behind the pedestal, between the type and the phone
  orbital: { p: [-6.6, 0.4, -10], r: [0.25, 0, 0.1], s: 0.7 },
}
/** Portrait screens: the stage is narrower, so the icon comes in closer. */
const STACKED: Partial<Record<keyof typeof AT, At>> = {
  front: { p: [0, 3.03, 0.35], r: [-0.035, -0.26, 0.012], s: 1 },
  icon: { p: [-2.75, 6.45, 0.4], r: [-0.12, 0.38, 0.07], s: 1.3 },
}
const at = (k: keyof typeof AT) => (stage.portrait && STACKED[k]) || AT[k]

/**
 * Orbits round the pedestal itself, nearly flat: every arc stays below the screens (the near arc
 * passes in front of the plinth, the far arc behind the phone's foot).
 */
const RINGS: { x: number; z: number; R: number; c: V3; i: number; speed: number }[] = [
  { x: -1.3, z: 0.05, R: 4.4, c: [0.2, -0.32, 0.2], i: 0.8, speed: 0.045 },
  { x: -1.42, z: -0.03, R: 5.6, c: [-0.2, -0.38, -0.4], i: 0.32, speed: -0.03 },
]
/** Rocks: the first five lie around the pedestal's foot, the rest float. */
const ROCKS: { p: V3; s: number }[] = [
  { p: [-3.2, -1.5, 1.2], s: 1.0 },
  { p: [2.9, -1.6, 1.6], s: 1.15 },
  { p: [0.4, -1.9, 2.5], s: 0.9 },
  { p: [-1.4, -1.6, -2.4], s: 1.2 },
  { p: [3.7, -1.2, -1.0], s: 0.8 },
  { p: [-5.4, 0.7, 1.4], s: 0.3 },
  { p: [-3.9, 0.5, 2.6], s: 0.17 },
  { p: [4.3, 1.1, 1.9], s: 0.26 },
  { p: [5.2, 4.5, -0.6], s: 0.14 },
  { p: [-5.6, 7.6, -1.3], s: 0.12 },
  { p: [2.5, 7.4, -1.9], s: 0.16 },
]

/**
 * Discard what lies outside a rounded rectangle of half-size `half` (local x/y) with
 * corner radius r. The sizes are uniforms, so every part shares one shader program.
 */
function roundCorners(m: THREE.MeshStandardMaterial, half: [number, number], r: number, centre: [number, number] = [0, 0]) {
  const uniforms = {
    uRoundHalf: { value: new THREE.Vector2(...half) },
    uRoundC: { value: new THREE.Vector2(...centre) },
    uRoundR: { value: r },
  }
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vRound;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRound = position.xy;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vRound;\nuniform vec2 uRoundHalf, uRoundC;\nuniform float uRoundR;')
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        {
          vec2 q = abs(vRound - uRoundC) - uRoundHalf + uRoundR;
          if (length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRoundR > 0.0005) discard;
        }`,
      )
  }
  m.customProgramCacheKey = () => 'round-corners'
}

/**
 * The app icon as a solid tile: a rounded square (iOS proportions) extruded with a
 * soft bevel. The picture covers the whole face, bevel included, and its edge
 * colours run round the sides, so the icon is the object rather than a sticker on one.
 */
function tileGeometry() {
  const R = 0.225
  const b = 0.035
  const depth = 0.1
  const h = 0.5 - b
  const r = R - b
  const shape = new THREE.Shape()
  shape.moveTo(-h + r, -h)
  shape.lineTo(h - r, -h)
  shape.absarc(h - r, -h + r, r, -Math.PI / 2, 0, false)
  shape.lineTo(h, h - r)
  shape.absarc(h - r, h - r, r, 0, Math.PI / 2, false)
  shape.lineTo(-h + r, h)
  shape.absarc(-h + r, h - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(-h, -h + r)
  shape.absarc(-h + r, -h + r, r, Math.PI, Math.PI * 1.5, false)
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 5, curveSegments: 10 })
  g.translate(0, 0, -depth / 2)
  const p = g.attributes.position
  const uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) uv.setXY(i, clamp01(p.getX(i) + 0.5), clamp01(p.getY(i) + 0.5))
  return toCreasedNormals(g, 0.7)
}

/** A 1×1 white picture: the icon tile's material is built with a map from the start. */
const BLANK = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
BLANK.colorSpace = THREE.SRGBColorSpace
BLANK.needsUpdate = true

const smooth = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const norm = (s: string) => s.replace(/_/g, ' ')
const obj = new THREE.Object3D()
const corner = new THREE.Vector3()
const tint = new THREE.Color()

/** glTF meshes here carry positions only: give them normals, creased at hard edges. */
const creasedCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>()
function creased(g: THREE.BufferGeometry) {
  let c = creasedCache.get(g)
  if (!c) {
    c = toCreasedNormals(g, 0.6)
    creasedCache.set(g, c)
  }
  return c
}

/** Rebuild a loaded model with the stage's materials; `pick` returns null to leave a part out. */
function rebuild(src: THREE.Object3D, pick: (part: string) => THREE.Material | null) {
  const out = new THREE.Group()
  src.updateMatrixWorld(true)
  src.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const mat = pick(norm(m.name))
    if (!mat) return
    const mesh = new THREE.Mesh(creased(m.geometry), mat)
    mesh.name = norm(m.name)
    mesh.applyMatrix4(m.matrixWorld)
    out.add(mesh)
  })
  return out
}

function rockGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 2)
  const p = g.attributes.position
  const rand = seeded(77)
  const seen = new Map<string, number>()
  for (let i = 0; i < p.count; i++) {
    const id = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`
    let k = seen.get(id)
    if (k === undefined) {
      k = 0.8 + rand() * 0.34
      seen.set(id, k)
    }
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.78, p.getZ(i) * k)
  }
  g.computeVertexNormals()
  return g
}

function screenMaterial(radius: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: null },
      uScale: { value: new THREE.Vector2(1, 1) },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uSize: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: radius },
      uReady: { value: 0 },
      uGlow: { value: 0 },
      uOn: { value: 1 },
      // lit, but under the bloom threshold, so white interfaces keep their text
      uBright: { value: 0.74 },
    },
    vertexShader: screenVert,
    fragmentShader: screenFrag,
    transparent: true,
  })
}
const glowMaterial = (soft: number) =>
  new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uI: { value: 0 }, uSoft: { value: soft } },
    vertexShader: plainVert,
    fragmentShader: glowFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

/**
 * Show a whole screenshot on a screen of size w × h at its own aspect: nothing cropped, nothing
 * stretched. The screen mesh is narrowed (or shortened) to match; the glass behind is black.
 */
function fit(mesh: THREE.Mesh, u: Record<string, THREE.IUniform>, t: THREE.Texture | undefined, w: number, h: number, crop: [number, number] = [0, 0]) {
  u.uMap.value = t ?? null
  u.uReady.value = t ? 1 : 0
  let sx = 1
  let sy = 1
  const img = t?.image as { width: number; height: number } | undefined
  if (t && img) {
    const cx = 1 - crop[0] * 2
    const cy = 1 - crop[1] * 2
    const ta = (img.width * cx) / (img.height * cy)
    const sa = w / h
    if (ta < sa) sx = ta / sa
    else sy = sa / ta
    ;(u.uScale.value as THREE.Vector2).set(cx, cy)
    ;(u.uOffset.value as THREE.Vector2).set(crop[0], crop[1])
  }
  ;(u.uSize.value as THREE.Vector2).set(w * sx, h * sy)
  mesh.scale.set(sx, sy, 1)
}

type Tex = { front?: THREE.Texture; icon?: THREE.Texture }

export default function Stage() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const pedestalGlb = useGLTF(MODELS.pedestal, false, false)
  const orbitalGlb = useGLTF(MODELS.orbital, false, false)
  const phoneGlb = useGLTF(MODELS.phone, false, false)
  const root = useRef<THREE.Group>(null)
  const tex = useRef<Tex[]>(projects.map(() => ({})))
  const st = useRef({
    shown: -1,
    hero: false,
    explore: 0,
    hover: -1,
    /** The screenshot an open case study asks the phone to show (null: the slide's own). */
    csSrc: null as string | null,
    /** The phone's screen matches csSrc (false while its picture is still loading). */
    applied: true,
    /** 1 → 0: the phone turns and its screen dips as the picture changes. */
    swap: 0,
  })
  /** The case study's screenshots, loaded on demand. */
  const extra = useRef(new Map<string, THREE.Texture | 'loading'>())

  const built = useMemo(() => {
    // the studio reflections are rendered by the shell at start-up, behind the preloader
    const env = stage.env ?? studioEnvironment(gl)

    // The models' own materials, lit by a studio environment; drawn in the transparent
    // pass so they land after the room's backdrop.
    const gm = { ...pedestalGlb.materials, ...orbitalGlb.materials, ...phoneGlb.materials }
    const from = (name: string, p: THREE.MeshStandardMaterialParameters) => {
      const src = gm[name] as THREE.MeshStandardMaterial | undefined
      const m = src?.isMeshStandardMaterial ? src.clone() : new THREE.MeshStandardMaterial()
      m.setValues({ envMap: env, transparent: true, ...p })
      return m
    }
    const M = {
      obsidian: from('Obsidian', { envMapIntensity: 0.42 }),
      inset: from('Deep Burgundy', { envMapIntensity: 0.5 }),
      gold: from('Warm Champagne Gold', { envMapIntensity: 1.15 }),
      halo: from('Warm Champagne Gold', { emissiveIntensity: 1 }),
      // the orbital sculpture is decoration: its own, quieter metals
      chrome: from('Polished Chrome', { envMapIntensity: 0.3 }),
      dimGold: from('Warm Champagne Gold', { envMapIntensity: 0.45 }),
      dimObsidian: from('Obsidian', { envMapIntensity: 0.22 }),
      titanium: from('Polished Chrome', { roughness: 0.3, envMapIntensity: 0.6, side: THREE.DoubleSide }),
      bezel: from('Obsidian', { color: '#060506', roughness: 0.2, metalness: 0.3, envMapIntensity: 0.6 }),
      island: from('Obsidian', { color: '#020202', roughness: 0.25, metalness: 0.2, envMapIntensity: 0.4 }),
      glass: from('Screen Surface', { color: '#030304', roughness: 0.06, metalness: 0.25, envMapIntensity: 0.7 }),
      stone: new THREE.MeshStandardMaterial({ color: '#100e12', roughness: 0.9, metalness: 0.1, envMap: env, envMapIntensity: 0.3, transparent: true }),
      // the icon tile: its picture is assigned per project (a blank one until then, so the shader never changes)
      iconFace: new THREE.MeshStandardMaterial({
        map: BLANK,
        emissiveMap: BLANK,
        emissive: '#ffffff',
        emissiveIntensity: 0.14,
        roughness: 0.3,
        metalness: 0.08,
        envMap: env,
        envMapIntensity: 0.38,
        transparent: true,
      }),
      iconSide: new THREE.MeshStandardMaterial({
        map: BLANK,
        emissiveMap: BLANK,
        emissive: '#ffffff',
        emissiveIntensity: 0.12,
        color: '#b8b8b8',
        roughness: 0.36,
        metalness: 0.1,
        envMap: env,
        envMapIntensity: 0.5,
        transparent: true,
      }),
    }
    const base = { gold: M.gold.color.clone(), inset: M.inset.color.clone(), titanium: M.titanium.color.clone() }
    // The mockup is built from boxes: give the phone's frame, bezel, glass and camera island
    // rounded corners in the shader (in the GLB's own units), like the real device.
    roundCorners(M.titanium, [0.41, 0.84], 0.12)
    roundCorners(M.bezel, [0.393, 0.817], 0.105)
    roundCorners(M.glass, [0.368, 0.783], 0.085)
    roundCorners(M.island, [0.115, 0.018], 0.018, [0, 0.775])

    const pedestal = rebuild(pedestalGlb.scene, (part) =>
      part === 'Obsidian pedestal' ? M.obsidian : part === 'Pedestal upper inset' ? M.inset : part === 'Gold rim' ? M.gold : part === 'Floating halo' ? M.halo : null,
    )
    pedestal.rotation.x = -Math.PI / 2
    pedestal.scale.setScalar(PED_S)
    pedestal.position.y = -PED_TOP * PED_S
    pedestal.children.forEach((c) => (c.renderOrder = 64))
    // The model's floating halo is tilted: find its high side, so the stage can keep it at the back
    // (behind the phones) rather than sweeping it across the screens.
    const halo = pedestal.children.find((c) => c.name === 'Floating halo') as THREE.Mesh | undefined
    let haloFacing = 0
    if (halo) {
      const pos = halo.geometry.attributes.position
      let top = 0
      for (let i = 1; i < pos.count; i++) if (pos.getZ(i) > pos.getZ(top)) top = i
      // GLB (x, y, z-up) becomes stage (x, z, -y); turn that direction to face away from the camera
      haloFacing = Math.PI - Math.atan2(pos.getX(top), -pos.getY(top))
    }

    const orbital = rebuild(orbitalGlb.scene, (part) =>
      part === 'Obsidian core' ? M.dimObsidian : part === 'Equatorial orbit' || part === 'Vertical orbit' ? M.chrome : M.dimGold,
    )
    orbital.rotation.x = -Math.PI / 2
    orbital.children.forEach((c) => (c.renderOrder = 62))

    // The phone mockup without its placeholder interface: body, bezel, glass, camera island, buttons.
    const PLACEHOLDER = new Set(['App burgundy header', 'Schedule card', 'Guidance card', 'Bottom navigation'])
    const screenGeo = new THREE.PlaneGeometry(GLASS.w, GLASS.h)
    const phone = (order: number) => {
      const g = rebuild(phoneGlb.scene, (part) =>
        PLACEHOLDER.has(part)
          ? null
          : part === 'Phone titanium body' || part === 'Volume buttons'
            ? M.titanium
            : part === 'Power button'
              ? M.gold
              : part === 'Display glass'
                ? M.glass
                : part === 'Camera island'
                  ? M.island
                  : M.bezel,
      )
      g.children.forEach((c) => (c.renderOrder = order))
      const mat = screenMaterial(GLASS.r)
      const screen = new THREE.Mesh(screenGeo, mat)
      screen.position.z = GLASS.z
      screen.renderOrder = order + 1
      g.add(screen)
      // the camera island sits over the glass
      g.children.find((c) => c.name === 'Camera island')!.renderOrder = order + 2
      return { group: g, screen: mat, mesh: screen }
    }
    const front = phone(70)

    // The app icon as a solid tile (faces: the picture; sides and bevel: its edge colours).
    const tileGeo = tileGeometry()
    const icon = new THREE.Group()
    const tileBody = new THREE.Mesh(tileGeo, [M.iconFace, M.iconSide])
    tileBody.renderOrder = 72
    const iconGlowMat = glowMaterial(2)
    const iconGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), iconGlowMat)
    iconGlow.position.z = -0.4
    iconGlow.renderOrder = 61
    icon.add(iconGlow, tileBody)

    // Light behind the phone, a pool on the pedestal, a contact shadow under the phone.
    const backGlowMat = glowMaterial(2.2)
    const backGlow = new THREE.Mesh(new THREE.PlaneGeometry(19, 19), backGlowMat)
    backGlow.position.set(-0.3, 3.8, -3.6)
    backGlow.renderOrder = 60
    const poolMat = glowMaterial(1.5)
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), poolMat)
    pool.rotation.x = -Math.PI / 2
    pool.position.y = 0.012
    pool.renderOrder = 65
    const shadowMat = new THREE.ShaderMaterial({
      uniforms: { uI: { value: 0 }, uStretch: { value: new THREE.Vector2(1, 2.4) } },
      vertexShader: plainVert,
      fragmentShader: shadowFrag,
      transparent: true,
      depthWrite: false,
    })
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.6), shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.set(AT.front.p[0], 0.02, AT.front.p[2])
    shadow.renderOrder = 66

    // Orbits of light round the pedestal.
    const ringGeo = new THREE.TorusGeometry(1, 0.0028, 6, 320)
    const rings = RINGS.map((r) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color() }, uI: { value: 0 }, uDraw: { value: 0 }, uTime: { value: 0 }, uSpeed: { value: r.speed } },
        vertexShader: ringVert,
        fragmentShader: ringFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const mesh = new THREE.Mesh(ringGeo, mat)
      mesh.renderOrder = 74
      const tilt = new THREE.Group()
      tilt.rotation.x = r.x
      tilt.add(mesh)
      const outer = new THREE.Group()
      outer.position.set(...r.c)
      outer.rotation.z = r.z
      outer.add(tilt)
      return { outer, mesh, mat, def: r }
    })

    const rockGeo = rockGeometry()
    const rocks = new THREE.InstancedMesh(rockGeo, M.stone, ROCKS.length)
    rocks.renderOrder = 63
    rocks.frustumCulled = false

    const orbitalOuter = new THREE.Group()
    orbitalOuter.add(orbital)
    const pedestalOuter = new THREE.Group()
    pedestalOuter.add(pedestal)

    return {
      env,
      M,
      base,
      pedestal: pedestalOuter,
      haloFacing,
      orbital: orbitalOuter,
      orbits: orbital.children.filter((c) => /orbit/i.test(c.name)),
      front,
      icon,
      iconGlowMat,
      backGlow,
      backGlowMat,
      pool,
      poolMat,
      shadow,
      shadowMat,
      rings,
      rocks,
      dispose: [screenGeo, tileGeo, ringGeo, rockGeo, iconGlow.geometry, backGlow.geometry, pool.geometry, shadow.geometry],
    }
  }, [gl, pedestalGlb, orbitalGlb, phoneGlb])

  useEffect(() => {
    const b = built
    return () => {
      if (b.env !== stage.env) b.env.dispose()
      Object.values(b.M).forEach((m) => m.dispose())
      ;[b.front.screen, b.iconGlowMat, b.backGlowMat, b.poolMat, b.shadowMat, ...b.rings.map((r) => r.mat)].forEach((m) => m.dispose())
      b.dispose.forEach((g) => g.dispose())
      extra.current.forEach((t) => t !== 'loading' && t.dispose())
      b.rocks.dispose()
    }
  }, [built])

  // Screenshots and icons, nearest to the selected project first; each upload in its own idle slot.
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    let alive = true
    const cache = new Map<string, Promise<THREE.Texture>>()
    const get = (src: string) => {
      let p = cache.get(src)
      if (!p)
        cache.set(
          src,
          (p = loader.loadAsync(src).then((t) => {
            t.colorSpace = THREE.SRGBColorSpace
            t.anisotropy = 8
            whenIdle(() => alive && gl.initTexture(t))
            return t
          })),
        )
      return p
    }
    const order = projects.map((_, i) => i).sort((a, b) => Math.abs(a - motion.works.pos) - Math.abs(b - motion.works.pos))
    const list = tex.current
    order.forEach((i) => {
      const sl = SLIDES[projects[i].id]
      const want: [keyof Tex, string | undefined][] = [
        ['front', sl?.front && BASE + sl.front.src],
        ['icon', iconSrc(projects[i].id)],
      ]
      want.forEach(([slot, src]) => {
        if (!src) return
        get(src)
          .then((t) => {
            if (!alive) return
            list[i][slot] = t
            if (st.current.shown === i) st.current.shown = -1 // apply it now
          })
          .catch(() => {})
      })
    })
    return () => {
      alive = false
      cache.forEach((p) => p.then((t) => t.dispose()).catch(() => {}))
    }
  }, [gl])

  // Compile the stage's shaders in the background, before anyone scrolls to it.
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      precompileHidden(gl, scene, camera, levelConfig(quality.get()).post, whenIdle, () => {}, root.current!),
    )
    return () => cancelAnimationFrame(id)
  }, [gl, scene, camera])

  /** Put project i on the stage. */
  const mount = (i: number) => {
    const s = st.current
    const sl = SLIDES[projects[i].id]
    const t = tex.current[i]
    const b = built
    s.hero = !sl?.front
    if (sl?.front) fit(b.front.mesh, b.front.screen.uniforms, t.front, GLASS.w, GLASS.h, sl.front.crop)
    s.applied = !s.csSrc
    const pic = t.icon ?? BLANK
    b.M.iconFace.map = b.M.iconFace.emissiveMap = pic
    b.M.iconSide.map = b.M.iconSide.emissiveMap = pic
  }

  /** Put the case study's screenshot on the phone (or the slide's own back); false while it loads. */
  const showShot = (i: number) => {
    const s = st.current
    const sl = SLIDES[projects[i].id]
    const b = built
    if (!s.csSrc) {
      if (sl?.front) fit(b.front.mesh, b.front.screen.uniforms, tex.current[i].front, GLASS.w, GLASS.h, sl.front.crop)
      return true
    }
    const src = s.csSrc
    const full = BASE + src
    const have = extra.current.get(full)
    if (have instanceof THREE.Texture) {
      const crop = sl?.front?.src === src ? sl.front.crop : undefined
      fit(b.front.mesh, b.front.screen.uniforms, have, GLASS.w, GLASS.h, crop)
      return true
    }
    if (!have) {
      extra.current.set(full, 'loading')
      new THREE.TextureLoader()
        .loadAsync(full)
        .then((t) => {
          t.colorSpace = THREE.SRGBColorSpace
          t.anisotropy = 8
          extra.current.set(full, t)
          st.current.applied = false
        })
        .catch(() => extra.current.delete(full))
    }
    return false
  }

  const place = (o: THREE.Object3D, at: At, dx: number, dy: number, dz: number, rx: number, ry: number, rz: number, k: number) => {
    o.position.set(at.p[0] + dx, at.p[1] + dy, at.p[2] + dz)
    o.rotation.set(at.r[0] + rx, at.r[1] + ry, at.r[2] + rz)
    o.scale.setScalar(Math.max(0.0001, k))
  }

  useFrame(({ clock }, dt) => {
    const w = motion.works
    const r = root.current!
    const s = st.current
    const b = built
    r.visible = stage.present > 0.01 && w.build > 0.12
    if (!r.visible) {
      w.rect.w = 0
      if (s.hover !== -1) worksHover.set((s.hover = -1))
      return
    }
    const d = Math.min(dt, 1 / 20)
    const t = clock.elapsedTime
    const px = motion.pointer.x
    const py = motion.pointer.y

    // Between two projects the scroll turns this one away and the next one in.
    const N = projects.length
    const near = Math.round(THREE.MathUtils.clamp(w.pos, 0, N - 1))
    const off = w.pos - near
    const a = smooth(clamp01(Math.abs(off) * 2.2))
    const dir = off < 0 ? -1 : 1
    if (near !== s.shown) {
      s.shown = near
      mount(near)
    }
    // A case study asks for one of the project's screenshots: the phone turns and shows it.
    const wantShot = w.cs.open ? w.cs.src : null
    if (wantShot !== s.csSrc) {
      s.csSrc = wantShot
      s.applied = false
      s.swap = 1
    }
    if (!s.applied) s.applied = showShot(near)
    s.swap = Math.max(0, s.swap - d * 1.7)
    const sw = Math.sin(s.swap * Math.PI)

    // Arrival: the pedestal rises, the orbits draw on, the phones come down, the icon turns in.
    // Departure: the same, in reverse, as the chapter hands over to the next.
    const o = w.out
    const ped = smooth(clamp01((w.build - 0.15) / 0.5)) * (1 - smooth(clamp01((o - 0.35) / 0.55)))
    const orb = smooth(clamp01((w.build - 0.4) / 0.55)) * (1 - smooth(clamp01(o / 0.5)))
    const dev = smooth(clamp01((w.build - 0.58) / 0.42)) * (1 - smooth(clamp01(o / 0.45)))
    const ico = smooth(clamp01((w.build - 0.62) / 0.38)) * (1 - smooth(clamp01(o / 0.4)))
    const stones = smooth(clamp01((w.build - 0.2) / 0.6)) * (1 - smooth(clamp01((o - 0.2) / 0.6)))

    s.explore += ((w.exploreHover || s.hover === near ? 1 : 0) - s.explore) * (1 - Math.exp(-d * 5))
    const ex = s.explore
    const lit = (1 - a * 0.5) * dev * (1 + ex * 0.4)

    // The project's colours on the metal.
    b.M.gold.color.copy(b.base.gold).lerp(stage.accent, 0.5)
    b.M.halo.color.copy(b.M.gold.color)
    b.M.halo.emissive.copy(stage.accent)
    b.M.halo.emissiveIntensity = 0.25 + 0.55 * lit
    b.M.inset.color.copy(b.base.inset).lerp(stage.deep, 0.6).multiplyScalar(0.55)
    b.M.titanium.color.copy(b.base.titanium).multiplyScalar(0.2).lerp(tint.copy(stage.accent).multiplyScalar(0.4), 0.16)

    // Pedestal: rises into place, its halo's high side kept behind the phones, swaying a little.
    const pd = b.pedestal
    pd.visible = ped > 0.001
    pd.position.set(0, -(1 - ped) * 6, 0)
    pd.rotation.y = b.haloFacing + Math.sin(t * 0.18) * 0.12 + (1 - ped) * 1.2
    pd.scale.setScalar(0.75 + 0.25 * ped)

    // Front phone, or the icon when there are no screens.
    const showFront = !s.hero
    const fr = b.front.group
    fr.visible = showFront && dev > 0.001
    if (fr.visible) {
      // Standing on the pedestal, it only sways a little. Between projects it slides off, shrinking
      // and turning no more than ~35°, so a screen never passes edge-on to the camera.
      const fa = at('front')
      const k = (1 - a * 0.86) * (0.55 + 0.45 * dev)
      place(
        fr,
        fa,
        -dir * a * 2.6,
        // keep the foot on the floor as it scales, until it lifts away
        -3.03 * (1 - k) + a * 0.5 + (1 - dev) * 1.6 + ex * 0.12,
        -a * 1.2,
        Math.sin(t * 0.33) * 0.012 - py * 0.03,
        Math.sin(t * 0.27) * 0.04 + px * 0.08 + dir * a * 0.6 + (1 - dev) * 0.8 + sw * 0.45,
        0,
        PHONE_S * fa.s * k,
      )
      const u = b.front.screen.uniforms
      u.uOn.value = (1 - a * 0.6) * (1 - 0.7 * sw)
      u.uGlow.value = ex
    }

    // The icon: beside the phone, or on the pedestal itself; shrinks away with a quarter-turn to change.
    const ic = b.icon
    const iat = s.hero ? AT.hero : at('icon')
    const icScale = iat.s * ico * (1 - a * 0.92)
    ic.visible = icScale > 0.002
    if (ic.visible) {
      const depth = s.hero ? 0.15 : 0.55
      place(
        ic,
        iat,
        px * depth - dir * a * 1.2,
        Math.sin(t * 0.9) * 0.16 + py * depth * 0.6 + (s.hero ? ex * 0.2 : 0),
        0,
        Math.sin(t * 0.5) * 0.06 - py * 0.12,
        Math.sin(t * 0.35) * 0.2 + px * 0.2 + dir * a * 0.7 + (1 - ico) * 1.2,
        Math.sin(t * 0.4) * 0.03,
        icScale,
      )
      b.iconGlowMat.uniforms.uI.value = 0.26 * ico * (1 - a)
      ;(b.iconGlowMat.uniforms.uColor.value as THREE.Color).copy(stage.accent)
    }

    // Orbits of light: drawn on as the stage arrives, turning with the scroll.
    b.rings.forEach((rg, n) => {
      const u = rg.mat.uniforms
      u.uDraw.value = orb * (1 - a * 0.2)
      u.uI.value = rg.def.i * (0.9 + ex * 0.8) * (1 - a * 0.4)
      u.uTime.value = t
      ;(u.uColor.value as THREE.Color).copy(stage.accent).lerp(tint.set('#ffffff'), 0.25)
      rg.mesh.rotation.z = t * (n ? -0.05 : 0.07) + w.pos * (n ? -0.6 : 0.9)
      // portrait: a tighter orbit, so its near arc stays clear of the type below the stage
      rg.mesh.scale.setScalar(rg.def.R * (s.hero ? 0.82 : 1) * (stage.portrait ? 0.86 : 1))
      rg.outer.rotation.z = rg.def.z + px * 0.04
      // seen through the wider portrait lens the near arc rides higher: drop it to stay under the screens
      rg.outer.position.y = rg.def.c[1] - (stage.portrait ? 0.15 : 0)
      // the wide outer orbit would cross the type column on portrait screens
      rg.outer.visible = orb > 0.001 && !(n && stage.portrait)
    })

    // The orbital sculpture: small, far back, slowly turning.
    const ob = b.orbital
    ob.visible = orb > 0.001
    ob.position.set(AT.orbital.p[0] + px * -0.4, AT.orbital.p[1] + Math.sin(t * 0.45) * 0.2 + (1 - orb) * 3, AT.orbital.p[2])
    ob.rotation.set(AT.orbital.r[0], t * 0.12, AT.orbital.r[2])
    ob.scale.setScalar(AT.orbital.s * orb)
    b.orbits.forEach((m, n) => (m.rotation.z = t * [0.22, -0.16, 0.11][n % 3]))

    // Rocks: heavy ones at the pedestal's foot, small ones drifting.
    ROCKS.forEach((rk, n) => {
      const float = n >= 5
      // on portrait screens the type sits right under the pedestal: no rock pile there
      const hide = !float && stage.portrait
      const bob = float ? Math.sin(t * 0.5 + n) * 0.25 : 0
      obj.position.set(rk.p[0] + (float ? px * 0.3 : 0), rk.p[1] + bob - (1 - stones) * (float ? 2 : 4), rk.p[2])
      obj.rotation.set(n * 1.7 + (float ? t * 0.15 : 0), n * 2.3 + (float ? t * 0.1 : 0), n * 0.9)
      obj.scale.setScalar(hide ? 0.0001 : rk.s * Math.max(0.0001, stones))
      obj.updateMatrix()
      b.rocks.setMatrixAt(n, obj.matrix)
    })
    b.rocks.instanceMatrix.needsUpdate = true
    b.rocks.visible = stones > 0.001

    // Light: behind the phones, pooled on the pedestal, a shadow under the front phone.
    ;(b.backGlowMat.uniforms.uColor.value as THREE.Color).copy(stage.accent)
    b.backGlowMat.uniforms.uI.value = 0.2 * lit
    ;(b.poolMat.uniforms.uColor.value as THREE.Color).copy(stage.accent).lerp(tint.set('#ffffff'), 0.3)
    b.poolMat.uniforms.uI.value = 0.22 * ped * (1 - a * 0.4) * (1 + ex * 0.5)
    b.shadow.visible = showFront
    b.shadow.position.x = at('front').p[0] - dir * a * 2.6
    b.shadow.position.z = at('front').p[2]
    b.shadowMat.uniforms.uI.value = 0.7 * dev * (1 - a)
    b.M.titanium.envMapIntensity = 0.55 + 0.25 * lit

    // The front phone (or the icon on the pedestal) on screen: hover, and where a case study opens from.
    const hero = showFront ? fr : ic
    const hw = showFront ? 0.41 : 0.5
    const hh = showFront ? 0.84 : 0.5
    let x0 = Infinity
    let x1 = -Infinity
    let y0 = Infinity
    let y1 = -Infinity
    if (hero.visible && a < 0.35) {
      hero.updateMatrixWorld()
      ;[0, 1, 3, 2].forEach((ci, n) => {
        corner.set(((ci & 1) - 0.5) * 2 * hw, ((ci >> 1) - 0.5) * 2 * hh, 0.06).applyMatrix4(hero.matrixWorld).project(camera)
        x0 = Math.min(x0, corner.x)
        x1 = Math.max(x1, corner.x)
        y0 = Math.min(y0, corner.y)
        y1 = Math.max(y1, corner.y)
        w.quad[n * 2] = ((corner.x + 1) / 2) * size.width
        w.quad[n * 2 + 1] = ((1 - corner.y) / 2) * size.height
      })
      w.rect.x = ((x0 + 1) / 2) * size.width
      w.rect.y = ((1 - y1) / 2) * size.height
      w.rect.w = ((x1 - x0) / 2) * size.width
      w.rect.h = ((y1 - y0) / 2) * size.height
    } else w.rect.w = 0
    const over = w.rect.w > 0 && px > x0 && px < x1 && py > y0 && py < y1
    const hover = over && !w.cs.open && stage.present > 0.9 && w.build > 0.95 && w.out < 0.05 ? near : -1
    if (hover !== s.hover) worksHover.set((s.hover = hover))
  })

  return (
    <group ref={root} userData={PREWARM}>
      <primitive object={built.backGlow} />
      <primitive object={built.orbital} />
      <primitive object={built.rocks} />
      <primitive object={built.pedestal} />
      <primitive object={built.pool} />
      <primitive object={built.shadow} />
      <primitive object={built.front.group} />
      <primitive object={built.icon} />
      {built.rings.map((r, i) => (
        <primitive key={i} object={r.outer} />
      ))}
    </group>
  )
}
