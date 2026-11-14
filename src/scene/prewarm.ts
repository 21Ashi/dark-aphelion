import * as THREE from 'three'

/**
 * Objects that start hidden (the Works gallery) are skipped by the start-up
 * shader compile, so their programs would be built the first time they appear:
 * a stall right in the middle of a scroll. Mark them with
 * `userData={PREWARM}` and they are compiled in the background after start-up.
 */
export const PREWARM = { prewarm: true }

/**
 * Compile hidden, marked objects without drawing them, one object per idle
 * slot (a few ms each) instead of one long block. With post-processing on, the
 * scene is drawn into a render target (linear output, no tone mapping), so
 * compile against one too; otherwise the programs would not match and be built again.
 */
export function precompileHidden(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  intoTarget: boolean,
  schedule: (task: () => void) => void,
  done: () => void,
  /** Only look under this object (something mounted later); the whole scene by default. */
  root: THREE.Object3D = scene,
) {
  const items: THREE.Object3D[] = []
  root.traverse((o) => {
    if (!o.userData.prewarm) return
    o.traverse((c) => {
      if ((c as THREE.Mesh).material) items.push(c)
    })
  })
  const target = intoTarget ? new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }) : null
  let left = items.length
  const finish = () => {
    if (--left > 0) return
    target?.dispose()
    done()
  }
  if (!left) return done()
  items.forEach((obj) =>
    schedule(() => {
      const previous = gl.getRenderTarget()
      gl.setRenderTarget(target)
      // The object itself is the root: its own (hidden) ancestors don't matter, the scene supplies the lights.
      const wasVisible = obj.visible
      obj.visible = true
      const p = gl.compileAsync(obj, camera, scene).catch(() => {})
      obj.visible = wasVisible
      gl.setRenderTarget(previous)
      p.finally(finish)
    }),
  )
}
