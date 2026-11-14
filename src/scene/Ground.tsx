import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { gridFragment, gridVertex } from './shaders/atmosphere'
import { motion } from '../lib/motion'
import { live } from './path'

/**
 * Polished black ground. High tier gets a real blurred reflection; everything
 * else relies on the star's specular streak, which costs nothing.
 * A luminous grid sits a hair above it, with a pulse leaving the sculpture.
 */
export function Ground({ reflect, frozen = false }: { reflect: boolean; frozen?: boolean }) {
  const grid = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: gridVertex,
        fragmentShader: gridFragment,
        uniforms: { uTime: { value: 0 }, uOrigin: { value: new THREE.Vector3(2, 0, 1) }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  const plane = useMemo(() => new THREE.PlaneGeometry(1400, 1400), [])

  useEffect(
    () => () => {
      grid.dispose()
      plane.dispose()
    },
    [grid, plane],
  )

  useFrame(({ clock }) => {
    grid.uniforms.uTime.value = frozen ? 4 : clock.elapsedTime
    grid.uniforms.uOpacity.value = 0.25 + 0.75 * motion.intro
    ;(grid.uniforms.uOrigin.value as THREE.Vector3).copy(live.sculpt)
  })

  return (
    <group position={[0, 0, -300]}>
      <mesh geometry={plane} rotation-x={-Math.PI / 2}>
        {reflect ? (
          <MeshReflectorMaterial
            resolution={512}
            blur={[420, 120]}
            mixBlur={1}
            mixStrength={0.6}
            mixContrast={1.25}
            mirror={0.85}
            depthScale={0.9}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.3}
            color="#0b0808"
            metalness={0.65}
            roughness={0.85}
          />
        ) : (
          <meshStandardMaterial color="#080606" metalness={0.25} roughness={0.72} />
        )}
      </mesh>
      <mesh geometry={plane} material={grid} rotation-x={-Math.PI / 2} position-y={0.03} position-z={300} renderOrder={1} />
    </group>
  )
}
