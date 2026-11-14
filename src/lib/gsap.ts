import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, ScrambleTextPlugin, useGSAP)

// The house curves. "cine" is a long, confident ease-out used for reveals;
// "snap" is for small UI responses.
CustomEase.create('cine', 'M0,0 C0.16,1 0.3,1 1,1')
CustomEase.create('cineInOut', 'M0,0 C0.76,0 0.24,1 1,1')
CustomEase.create('snap', 'M0,0 C0.3,0.9 0.2,1 1,1')

gsap.defaults({ ease: 'cine', duration: 1 })
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, SplitText, useGSAP }
