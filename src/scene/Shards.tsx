import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from '../lib/motion'
import { live, seeded } from './path'

type Orbit = { r: number; speed: number; phase: number; tilt: number; yaw: number; size: number; spin: THREE.Vector3; ember: boolean }

const obj = new THREE.Object3D()
const ray = new THREE.Ray()
const p = new THREE.Vector3()
const closest = new THREE.Vector3()
const push = new THREE.Vector3()

/**
 * Obsidian fragments orbiting the sculpture. They scatter outward with
 * scroll speed and in the "works" chapter, and shy away from the pointer.
 */
export function Shards({ count, frozen = false }: { count: number; frozen?: boolean }) {
  const dark = useRef<THREE.InstancedMesh>(null)
  const embers = useRef<THREE.InstancedMesh>(null)
  const scatter = useRef(0)

  const orbits = useMemo<Orbit[]>(() => {
    const rand = seeded(42)
    return Array.from({ length: count }, () => ({
      r: 2.6 + rand() * 5.2,
      speed: (0.05 + rand() * 0.18) * (rand() > 0.5 ? 1 : -1),
      phase: rand() * Math.PI * 2,
      tilt: (rand() - 0.5) * 1.1,
      yaw: rand() * Math.PI * 2,
      size: 0.05 + Math.pow(rand(), 3) * 0.38,
      spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(1.6),
      ember: rand() > 0.86,
    }))
  }, [count])

  const darkList = useMemo(() => orbits.filter((o) => !o.ember), [orbits])
  const emberList = useMemo(() => orbits.filter((o) => o.ember), [orbits])
  const offsets = useMemo(() => orbits.map(() => new THREE.Vector3()), [orbits])

  const res = useMemo(
    () => ({
      geo: new THREE.TetrahedronGeometry(1, 0),
      darkMat: new THREE.MeshStandardMaterial({ color: '#1b1313', metalness: 0.9, roughness: 0.28, flatShading: true }),
      emberMat: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.18, 0.2), toneMapped: false }),
    }),
    [],
  )
  useEffect(
    () => () => {
      res.geo.dispose()
      res.darkMat.dispose()
      res.emberMat.dispose()
    },
    [res],
  )

  useFrame(({ clock, camera }, dt) => {
    const t = frozen ? 10 : clock.elapsedTime
    const chapterScatter = Math.max(0, 1 - Math.abs(motion.chapter - 2)) * 1.6 + motion.finale * 0.8
    const target = chapterScatter + Math.min(Math.abs(motion.velocity) * 0.02, 0.9)
    scatter.current += (target - scatter.current) * (1 - Math.exp(-dt * 2))
    const sc = scatter.current

    ray.origin.setFromMatrixPosition(camera.matrixWorld)
    ray.direction.set(motion.pointer.x, motion.pointer.y, 0.5).unproject(camera).sub(ray.origin).normalize()

    const write = (list: Orbit[], mesh: THREE.InstancedMesh | null, base: number) => {
      if (!mesh) return
      list.forEach((o, i) => {
        const a = o.phase + t * o.speed
        const r = o.r * (1 + sc * 0.9)
        p.set(Math.cos(a) * r, Math.sin(a * 1.3) * 0.6 + Math.sin(o.tilt) * Math.sin(a) * r * 0.5, Math.sin(a) * r)
        p.applyAxisAngle(THREE.Object3D.DEFAULT_UP, o.yaw)
        p.add(live.sculpt)

        // Ease away from the pointer ray.
        const off = offsets[base + i]
        ray.closestPointToPoint(p, closest)
        const d = closest.distanceTo(p)
        const f = frozen ? 0 : THREE.MathUtils.smoothstep(2.6, 0, d) * 2.2
        push.copy(p).sub(closest).normalize().multiplyScalar(f)
        off.lerp(push, 1 - Math.exp(-dt * 5))
        p.add(off)

        obj.position.copy(p)
        obj.rotation.set(o.spin.x * t, o.spin.y * t, o.spin.z * t)
        obj.scale.setScalar(o.size * (o.ember ? 0.55 : 1))
        obj.updateMatrix()
        mesh.setMatrixAt(i, obj.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    write(darkList, dark.current, 0)
    write(emberList, embers.current, darkList.length)
  })

  return (
    <>
      <instancedMesh ref={dark} args={[res.geo, res.darkMat, darkList.length]} frustumCulled={false} />
      <instancedMesh ref={embers} args={[res.geo, res.emberMat, emberList.length]} frustumCulled={false} />
    </>
  )
}
