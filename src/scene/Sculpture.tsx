import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from '../lib/motion'
import { cageFragment, cageVertex, sculptureFragment, sculptureVertex } from './shaders/sculpture'
import { live, SUN } from './path'

/** Per-chapter form: [morph sphere→cube, noise amplitude, noise frequency, cage opacity, veins]. */
const FORMS: [number, number, number, number, number][] = [
  [0.0, 0.16, 1.5, 0.35, 1.0], // arrival — molten, organic
  [0.9, 0.05, 2.2, 0.9, 0.5], // origin — crystalline, the cage takes over
  [0.35, 0.28, 1.2, 0.25, 1.0], // works — restless
  [0.0, 0.1, 2.6, 0.5, 0.7], // trajectory
  [0.0, 0.24, 1.3, 0.15, 1.2], // aphelion — molten again, glowing
]

const ray = new THREE.Ray()
const closest = new THREE.Vector3()
const inv = new THREE.Matrix4()
const ndc = new THREE.Vector2()
const sunDir = new THREE.Vector3()

export function Sculpture({ detail, frozen = false }: { detail: number; frozen?: boolean }) {
  const group = useRef<THREE.Group>(null)
  const bodyMesh = useRef<THREE.Mesh>(null)
  const cageMesh = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.PointLight>(null)
  const portrait = useThree((s) => s.size.width / s.size.height < 0.9)
  const smoothed = useRef({ morph: 0, amp: 0.16, freq: 1.5, cage: 0.35, veins: 1, force: 0 })

  const { body, cage, bodyGeo, cageGeo } = useMemo(() => {
    const shared = {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uAmp: { value: 0.16 },
      uFreq: { value: 1.5 },
      uPointerObj: { value: new THREE.Vector3(0, 0, 1) },
      uPointerForce: { value: 0 },
    }
    const body = new THREE.ShaderMaterial({
      // In the transparent pass only so it can be drawn after the Works gallery backdrop.
      transparent: true,
      vertexShader: sculptureVertex,
      fragmentShader: sculptureFragment,
      uniforms: {
        ...shared,
        uSunDir: { value: new THREE.Vector3(0, 0.05, -1) },
        uIntensity: { value: 1 },
        uVeins: { value: 1 },
      },
    })
    const cage = new THREE.ShaderMaterial({
      vertexShader: cageVertex,
      fragmentShader: cageFragment,
      uniforms: { ...shared, uOpacity: { value: 0.35 } },
      wireframe: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return {
      body,
      cage,
      bodyGeo: new THREE.IcosahedronGeometry(1, detail),
      cageGeo: new THREE.IcosahedronGeometry(1, 4),
    }
  }, [detail])

  useEffect(
    () => () => {
      body.dispose()
      cage.dispose()
      bodyGeo.dispose()
      cageGeo.dispose()
    },
    [body, cage, bodyGeo, cageGeo],
  )

  useFrame(({ clock, camera }, dt) => {
    const g = group.current
    if (!g) return
    const t = frozen ? 8 : clock.elapsedTime

    // Blend the chapter forms.
    const c = Math.min(Math.max(motion.chapter, 0), FORMS.length - 1)
    const i = Math.min(Math.floor(c), FORMS.length - 2)
    const f = c - i
    const s = smoothed.current
    const k = 1 - Math.exp(-dt * 2.5)
    const lerp = (j: number) => FORMS[i][j] + (FORMS[i + 1][j] - FORMS[i][j]) * f
    s.morph += (lerp(0) - s.morph) * k
    s.amp += (lerp(1) + Math.min(Math.abs(motion.velocity) * 0.004, 0.12) - s.amp) * k
    s.freq += (lerp(2) - s.freq) * k
    s.cage += (lerp(3) - s.cage) * k
    s.veins += (lerp(4) - s.veins) * k

    g.position.copy(live.sculpt)
    // It leaves while the Works gallery is up (the selected project's icon takes its place).
    const gone = motion.works.on * (1 - motion.works.out)
    const keep = 1 - gone * gone * (3 - 2 * gone)
    g.scale.setScalar((portrait ? 1.05 : 1.55) * Math.max(0.0001, keep))
    // Hide the meshes, never the light: a light leaving the scene changes the
    // light count and forces every lit material to recompile (a long freeze).
    const show = keep > 0.01
    bodyMesh.current!.visible = show
    cageMesh.current!.visible = show
    glow.current!.intensity = 60 * keep
    g.position.y += Math.sin(t * 0.6) * 0.18
    g.rotation.y = t * 0.12
    g.rotation.x = Math.sin(t * 0.2) * 0.2
    g.updateMatrixWorld()

    // Pointer: find where the pointer ray passes nearest the sculpture.
    ndc.set(motion.pointer.x, motion.pointer.y)
    ray.origin.setFromMatrixPosition(camera.matrixWorld)
    ray.direction.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(ray.origin).normalize()
    ray.closestPointToPoint(g.position, closest)
    const miss = closest.distanceTo(g.position)
    const targetForce = frozen ? 0 : THREE.MathUtils.smoothstep(4.2, 1.2, miss)
    s.force += (targetForce - s.force) * (1 - Math.exp(-dt * 4))
    inv.copy(g.matrixWorld).invert()
    ;(body.uniforms.uPointerObj.value as THREE.Vector3).copy(closest).applyMatrix4(inv)

    sunDir.copy(SUN.pos).sub(g.position).normalize()
    ;(body.uniforms.uSunDir.value as THREE.Vector3).copy(sunDir)

    body.uniforms.uTime.value = t
    body.uniforms.uMorph.value = s.morph
    body.uniforms.uAmp.value = s.amp
    body.uniforms.uFreq.value = s.freq
    body.uniforms.uPointerForce.value = s.force
    body.uniforms.uVeins.value = s.veins
    body.uniforms.uIntensity.value = 0.25 + 0.75 * motion.intro
    cage.uniforms.uOpacity.value = s.cage * (0.2 + 0.8 * motion.intro)
  })

  return (
    <group ref={group} scale={portrait ? 1.05 : 1.55} renderOrder={60}>
      <mesh ref={bodyMesh} geometry={bodyGeo} material={body} />
      <mesh ref={cageMesh} geometry={cageGeo} material={cage} renderOrder={1} />
      <pointLight ref={glow} color="#ff2a33" intensity={60} distance={34} decay={1.6} position={[0, -0.6, 1.2]} />
    </group>
  )
}
