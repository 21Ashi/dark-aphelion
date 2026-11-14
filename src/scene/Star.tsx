import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from '../lib/motion'
import { SUN } from './path'
import { haloFragment, haloVertex, skyFragment, skyVertex, sunFragment, sunVertex } from './shaders/sun'

const tmp = new THREE.Vector3()
const right = new THREE.Vector3()
const projected = new THREE.Vector3()

/**
 * The crimson star, its corona, two slow gyroscope rings, the sky dome, and
 * the eclipse body that slides across it in the finale.
 */
export function Star({ frozen = false }: { frozen?: boolean }) {
  const group = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Mesh>(null)
  const occluder = useRef<THREE.Mesh>(null)
  const rings = useRef<THREE.Group>(null)

  const mats = useMemo(() => {
    const sun = new THREE.ShaderMaterial({
      vertexShader: sunVertex,
      fragmentShader: sunFragment,
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 0.1 }, uRadius: { value: SUN.radius } },
    })
    const halo = new THREE.ShaderMaterial({
      vertexShader: haloVertex,
      fragmentShader: haloFragment,
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 0.1 }, uCorona: { value: 0.35 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const sky = new THREE.ShaderMaterial({
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      uniforms: {
        uSunDir: { value: SUN.pos.clone().normalize() },
        uIntensity: { value: 0.1 },
        uTime: { value: 0 },
      },
      side: THREE.BackSide,
      depthWrite: false,
    })
    const ring = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.9, 0.08, 0.1),
      transparent: true,
      opacity: 0.55,
      toneMapped: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const occluder = new THREE.MeshBasicMaterial({ color: '#030202', fog: false })
    return { sun, halo, sky, ring, occluder }
  }, [])

  const geos = useMemo(
    () => ({
      sun: new THREE.SphereGeometry(SUN.radius, 96, 64),
      halo: new THREE.PlaneGeometry(SUN.radius * 6, SUN.radius * 6),
      sky: new THREE.SphereGeometry(900, 48, 24),
      ringA: new THREE.TorusGeometry(SUN.radius * 1.55, 0.22, 6, 220),
      ringB: new THREE.TorusGeometry(SUN.radius * 1.9, 0.14, 6, 220),
      occluder: new THREE.SphereGeometry(1, 48, 32),
    }),
    [],
  )

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose())
      Object.values(geos).forEach((g) => g.dispose())
    },
    [mats, geos],
  )

  useFrame(({ camera, clock, size }) => {
    const t = frozen ? 12 : clock.elapsedTime
    const ignite = 0.08 + 0.92 * motion.intro
    const finale = motion.finale

    // The star climbs as the visitor reaches the end.
    const sunY = SUN.pos.y + finale * 24
    if (group.current) group.current.position.set(SUN.pos.x, sunY, SUN.pos.z)

    mats.sun.uniforms.uTime.value = t
    mats.sun.uniforms.uIntensity.value = ignite * (1 + finale * 0.25)
    mats.halo.uniforms.uTime.value = t
    mats.halo.uniforms.uIntensity.value = ignite
    mats.halo.uniforms.uCorona.value = 0.35 + finale * 1.4
    mats.sky.uniforms.uIntensity.value = ignite * (1 + finale * 0.4)
    mats.sky.uniforms.uTime.value = t
    ;(mats.sky.uniforms.uSunDir.value as THREE.Vector3).set(SUN.pos.x, sunY, SUN.pos.z).normalize()
    mats.ring.opacity = 0.18 + 0.4 * ignite + finale * 0.3

    if (halo.current) halo.current.quaternion.copy(camera.quaternion)
    if (rings.current) {
      rings.current.rotation.y = t * 0.03
      rings.current.children[1].rotation.z = -t * 0.02
    }

    // Eclipse: a body on the camera→star line, sized to cover it exactly,
    // sliding in from the right as `finale` approaches 1.
    const occ = occluder.current
    if (occ) {
      occ.visible = finale > 0.01
      if (occ.visible) {
        tmp.set(SUN.pos.x, sunY, SUN.pos.z)
        const f = 0.62
        const r = SUN.radius * f * 0.985
        right.set(1, 0, 0).applyQuaternion(camera.quaternion)
        const slide = Math.pow(1 - Math.min(finale * 1.15, 1), 1.6) * SUN.radius * f * 2.6
        occ.position.copy(camera.position).lerp(tmp, f).addScaledVector(right, slide)
        occ.scale.setScalar(r)
      }
    }

    // Publish the star's screen position, apparent radius and the horizon
    // line so the hero typography can be lit by it.
    if (motion.chapter < 1.4) {
      const cam = camera as THREE.PerspectiveCamera
      tmp.set(SUN.pos.x, sunY, SUN.pos.z)
      projected.copy(tmp).project(cam)
      motion.sun.x = ((projected.x + 1) / 2) * size.width
      motion.sun.y = ((1 - projected.y) / 2) * size.height
      motion.sun.r = (SUN.radius / (cam.position.distanceTo(tmp) * Math.tan((cam.fov * Math.PI) / 360))) * size.height * 0.5
      projected.set(cam.position.x, 0, -1000).project(cam)
      motion.sun.horizon = ((1 - projected.y) / 2) * size.height
      motion.sun.ready = true
    }
  })

  return (
    <>
      <mesh geometry={geos.sky} material={mats.sky} renderOrder={-10} frustumCulled={false} />
      <group ref={group} position={SUN.pos}>
        <mesh geometry={geos.sun} material={mats.sun} />
        <mesh ref={halo} geometry={geos.halo} material={mats.halo} renderOrder={2} />
        <group ref={rings}>
          <mesh geometry={geos.ringA} material={mats.ring} rotation={[Math.PI * 0.43, 0.12, 0]} />
          <mesh geometry={geos.ringB} material={mats.ring} rotation={[Math.PI * 0.46, -0.2, 0.3]} />
        </group>
      </group>
      <mesh ref={occluder} geometry={geos.occluder} material={mats.occluder} visible={false} renderOrder={3} />
    </>
  )
}
