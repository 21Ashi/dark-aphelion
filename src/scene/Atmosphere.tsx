import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from '../lib/motion'
import { seeded } from './path'
import {
  dustFragment,
  dustVertex,
  shaftFragment,
  shaftVertex,
  smokeFragment,
  smokeVertex,
} from './shaders/atmosphere'

/** Fine dust along the whole camera path; animated entirely in the vertex shader. */
export function Dust({ count, frozen = false }: { count: number; frozen?: boolean }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const { geo, mat } = useMemo(() => {
    const rand = seeded(3)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 90
      pos[i * 3 + 1] = rand() * 34
      pos[i * 3 + 2] = 30 - rand() * 260
      seed[i] = rand()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const mat = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uSize: { value: 5 },
        uPointer: { value: new THREE.Vector2() },
        uScatter: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geo, mat }
  }, [count])

  useEffect(
    () => () => {
      geo.dispose()
      mat.dispose()
    },
    [geo, mat],
  )

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = frozen ? 20 : clock.elapsedTime
    mat.uniforms.uPixelRatio.value = dpr
    ;(mat.uniforms.uPointer.value as THREE.Vector2).set(motion.pointer.x, motion.pointer.y)
    mat.uniforms.uScatter.value = motion.finale
  })

  return <points geometry={geo} material={mat} frustumCulled={false} />
}

/** Low banks of smoke between the monoliths. */
export function Smoke({ frozen = false }: { frozen?: boolean }) {
  const sheets = useMemo(() => {
    const rand = seeded(11)
    const geo = new THREE.PlaneGeometry(1, 1)
    const items = Array.from({ length: 6 }, (_, i) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: smokeVertex,
        fragmentShader: smokeFragment,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: rand() * 10 },
          uOpacity: { value: 0.16 + rand() * 0.1 },
          uColor: { value: new THREE.Color(i % 2 ? '#2a1112' : '#1c1414') },
        },
        transparent: true,
        depthWrite: false,
      })
      return {
        mat,
        position: [(rand() - 0.5) * 30, 3 + rand() * 6, -14 - i * 34] as [number, number, number],
        scale: [140 + rand() * 60, 16 + rand() * 10, 1] as [number, number, number],
      }
    })
    return { geo, items }
  }, [])

  useEffect(
    () => () => {
      sheets.geo.dispose()
      sheets.items.forEach((s) => s.mat.dispose())
    },
    [sheets],
  )

  useFrame(({ clock }) => {
    const t = frozen ? 30 : clock.elapsedTime
    sheets.items.forEach((s) => (s.mat.uniforms.uTime.value = t))
  })

  return (
    <group>
      {sheets.items.map((s, i) => (
        <mesh key={i} geometry={sheets.geo} material={s.mat} position={s.position} scale={s.scale} renderOrder={4} />
      ))}
    </group>
  )
}

/** Shafts of light falling through the gates. */
export function Shafts({ frozen = false }: { frozen?: boolean }) {
  const shafts = useMemo(() => {
    const geo = new THREE.CylinderGeometry(1.2, 9, 60, 32, 1, true)
    geo.translate(0, -30, 0)
    const spots: [number, number, number, number][] = [
      [-6, 58, -40, 0.06],
      [9, 62, -70, 0.05],
      [-3, 70, -104, 0.07],
      [12, 74, -150, 0.045],
    ]
    const items = spots.map(([x, y, z, tilt], i) => ({
      mat: new THREE.ShaderMaterial({
        vertexShader: shaftVertex,
        fragmentShader: shaftFragment,
        uniforms: { uTime: { value: 0 }, uSeed: { value: i * 3.1 }, uOpacity: { value: 0.07 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
      position: [x, y, z] as [number, number, number],
      rotation: [tilt, 0, tilt * (i % 2 ? 1 : -1)] as [number, number, number],
    }))
    return { geo, items }
  }, [])

  useEffect(
    () => () => {
      shafts.geo.dispose()
      shafts.items.forEach((s) => s.mat.dispose())
    },
    [shafts],
  )

  useFrame(({ clock }) => {
    const t = frozen ? 5 : clock.elapsedTime
    shafts.items.forEach((s) => {
      s.mat.uniforms.uTime.value = t
      s.mat.uniforms.uOpacity.value = 0.07 * motion.intro
    })
  })

  return (
    <group>
      {shafts.items.map((s, i) => (
        <mesh key={i} geometry={shafts.geo} material={s.mat} position={s.position} rotation={s.rotation} renderOrder={5} />
      ))}
    </group>
  )
}
