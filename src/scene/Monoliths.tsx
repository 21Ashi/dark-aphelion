import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { seeded } from './path'

type Block = { pos: THREE.Vector3; scale: THREE.Vector3; rot: THREE.Euler; seam: boolean }

/**
 * A colonnade of monoliths receding toward the star, with three lintel gates.
 * Two instanced draw calls total: the stone, and the thin light seams cut into
 * some of the faces.
 */
export function Monoliths({ count }: { count: number }) {
  const stone = useRef<THREE.InstancedMesh>(null)
  const seams = useRef<THREE.InstancedMesh>(null)

  const blocks = useMemo<Block[]>(() => {
    const rand = seeded(7)
    const out: Block[] = []
    const perSide = Math.floor(count / 2)
    for (let i = 0; i < perSide; i++) {
      for (const side of [-1, 1]) {
        const depth = i / perSide
        const z = 4 - i * (230 / perSide) - rand() * 4
        const x = side * (13 + rand() * 9 + depth * 22)
        const h = 7 + rand() * 22 + depth * 26
        const w = 1.6 + rand() * 3.6
        const d = 1.6 + rand() * 3.4
        const fallen = rand() > 0.88
        out.push({
          pos: new THREE.Vector3(x, fallen ? h * 0.35 : h / 2, z),
          scale: new THREE.Vector3(w, h, d),
          rot: new THREE.Euler(0, (rand() - 0.5) * 0.5, fallen ? side * (0.25 + rand() * 0.35) : (rand() - 0.5) * 0.04),
          seam: rand() > 0.8,
        })
      }
    }
    // One colossal gate deep in the colonnade, its lintel well above the star.
    for (const [z, y, span] of [[-236, 68, 92]] as const) {
      out.push({ pos: new THREE.Vector3(0, y, z), scale: new THREE.Vector3(span + 10, 5, 6), rot: new THREE.Euler(0, 0, 0), seam: false })
      for (const side of [-1, 1]) {
        out.push({
          pos: new THREE.Vector3(side * (span / 2 - 2), y / 2, z),
          scale: new THREE.Vector3(5, y, 6),
          rot: new THREE.Euler(0, 0, 0),
          seam: true,
        })
      }
    }
    return out
  }, [count])

  const seamCount = blocks.filter((b) => b.seam).length

  const { boxGeo, seamGeo, stoneMat, seamMat } = useMemo(
    () => ({
      boxGeo: new THREE.BoxGeometry(1, 1, 1),
      seamGeo: new THREE.PlaneGeometry(1, 1),
      stoneMat: new THREE.MeshStandardMaterial({ color: '#140f0f', roughness: 0.62, metalness: 0.55 }),
      seamMat: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.08, 0.1), toneMapped: false }),
    }),
    [],
  )

  useEffect(
    () => () => {
      boxGeo.dispose()
      seamGeo.dispose()
      stoneMat.dispose()
      seamMat.dispose()
    },
    [boxGeo, seamGeo, stoneMat, seamMat],
  )

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const local = new THREE.Matrix4()
    let s = 0
    blocks.forEach((b, i) => {
      q.setFromEuler(b.rot)
      m.compose(b.pos, q, b.scale)
      stone.current?.setMatrixAt(i, m)
      if (b.seam && seams.current) {
        // A thin vertical slit on the face that looks back toward the visitor.
        const block = new THREE.Matrix4().compose(b.pos, q, new THREE.Vector3(1, 1, 1))
        local.compose(
          new THREE.Vector3(0, b.scale.y * 0.05, b.scale.z / 2 + 0.02),
          new THREE.Quaternion(),
          new THREE.Vector3(0.07, b.scale.y * 0.72, 1),
        )
        seams.current.setMatrixAt(s++, block.multiply(local))
      }
    })
    if (stone.current) stone.current.instanceMatrix.needsUpdate = true
    if (seams.current) seams.current.instanceMatrix.needsUpdate = true
  }, [blocks])

  return (
    <>
      <instancedMesh ref={stone} args={[boxGeo, stoneMat, blocks.length]} frustumCulled={false} />
      <instancedMesh ref={seams} args={[seamGeo, seamMat, seamCount]} frustumCulled={false} />
    </>
  )
}
