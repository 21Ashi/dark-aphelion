import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Shared, per-frame state of the Works stage. The always-mounted shell
 * (Showcase.tsx) writes it first each frame; the lazily loaded models
 * (Stage.tsx) read it.
 */
export const stage = {
  /** 0 → 1: the chapter's room is on screen. */
  present: 0,
  /** The room's palette, eased toward the selected project's. */
  accent: new THREE.Color('#e63946'),
  deep: new THREE.Color('#8b1a1a'),
  /** Portrait screens get their own composition. */
  portrait: false,
  /** Studio reflections for the stage's metal and glass (made by the shell at start-up). */
  env: null as THREE.Texture | null,
}

/** A soft studio room, pre-filtered for reflections. GPU work: do it while the preloader is up. */
export function studioEnvironment(gl: THREE.WebGLRenderer) {
  const pm = new THREE.PMREMGenerator(gl)
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture
  pm.dispose()
  return env
}
