import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from '../lib/motion'
import { live, samplePath } from './path'

const target = { pos: new THREE.Vector3(), look: new THREE.Vector3(), sculpt: new THREE.Vector3() }
const intro = new THREE.Vector3()
const gallery = new THREE.Vector3()
const galleryLook = new THREE.Vector3()

/**
 * Scroll moves the camera along the chapter path; the pointer adds a small,
 * damped parallax and roll. Everything eases with frame-rate-independent
 * damping, so a fast flick of the wheel still reads as a camera move.
 */
export function CameraRig({ still = false }: { still?: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const state = useRef({ chapter: 0, px: 0, py: 0, roll: 0, look: new THREE.Vector3(0, 7.5, -60), init: false })

  useFrame(({ clock }, dt) => {
    const s = state.current
    const d = Math.min(dt, 1 / 20)
    const k = 1 - Math.exp(-d * (still ? 50 : 2.6))
    s.chapter += (motion.chapter - s.chapter) * k

    samplePath(s.chapter, target)

    // Portrait screens: centre the sculpture and widen the lens.
    const aspect = size.width / size.height
    const portrait = aspect < 0.9
    if (portrait) target.sculpt.x *= 0.15
    live.sculpt.copy(target.sculpt)
    const fov = portrait ? 58 : aspect < 1.3 ? 48 : 40
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    // Works gallery: step back and face the sculpture, which the cards orbit.
    const g = motion.works.on * (1 - motion.works.out)
    if (g > 0.001) {
      const e = g * g * (3 - 2 * g)
      // Frame the selected project's screen, not the sculpture: aim to the right of it on wide screens.
      const aim = portrait ? 0 : 2.2
      gallery.set(live.sculpt.x + aim, live.sculpt.y + 0.6, live.sculpt.z + (portrait ? 36 : 34))
      target.pos.lerp(gallery, e)
      target.look.lerp(galleryLook.set(live.sculpt.x + aim, live.sculpt.y, live.sculpt.z), e)
    }

    // Opening move: start high and far back, settle as the intro plays.
    const io = 1 - motion.intro
    intro.set(0, io * io * 9, io * 26)
    target.pos.add(intro)
    target.look.y += io * 6

    if (!still) {
      const kp = 1 - Math.exp(-d * 3)
      // On portrait screens the Works stage fills the width: the pointer barely moves the camera there.
      const calm = portrait ? 1 - 0.8 * g : 1
      s.px += (motion.pointer.x * calm - s.px) * kp
      s.py += (motion.pointer.y * calm - s.py) * kp
      const t = clock.elapsedTime
      target.pos.x += s.px * 1.6 + Math.sin(t * 0.13) * 0.25
      target.pos.y += s.py * 0.7 + Math.sin(t * 0.17) * 0.15
      target.look.x += s.px * 2.4
      target.look.y += s.py * 1.2
      s.roll += (-s.px * 0.025 - motion.velocity * 0.0004 - s.roll) * kp
    }

    if (!s.init) {
      camera.position.copy(target.pos)
      s.look.copy(target.look)
      s.init = true
    }
    camera.position.lerp(target.pos, k)
    s.look.lerp(target.look, k)
    camera.lookAt(s.look)
    camera.rotateZ(s.roll)
  })

  return null
}
