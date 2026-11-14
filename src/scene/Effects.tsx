import { useMemo } from 'react'
import { Bloom, ChromaticAberration, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

/**
 * One composer, three cheap passes merged into a single effect pass by
 * postprocessing: bloom (mip-mapped), a whisper of chromatic aberration at
 * the edges, and a vignette. Film grain is a CSS overlay — free on the GPU.
 */
export function Effects({ aberration }: { aberration: boolean }) {
  const offset = useMemo(() => new THREE.Vector2(0.0009, 0.0006), [])
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.78} luminanceSmoothing={0.18} radius={0.72} />
      {aberration ? (
        <ChromaticAberration
          offset={offset}
          radialModulation
          modulationOffset={0.35}
          blendFunction={BlendFunction.NORMAL}
        />
      ) : (
        <></>
      )}
      <Vignette offset={0.18} darkness={0.9} eskil={false} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
