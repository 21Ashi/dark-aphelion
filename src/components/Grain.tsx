import { useEffect, useState } from 'react'
import { useStore } from '../hooks/useStore'
import { quality } from '../lib/quality'
import s from './Grain.module.css'

/**
 * Film grain from a tiny generated noise tile, stepped with CSS. Cheap on a good GPU, but
 * it is a full-screen blended layer: on a machine that has fallen to the lowest quality
 * level it is left out.
 */
export function Grain() {
  const [url, setUrl] = useState<string | null>(null)
  const level = useStore(quality)
  useEffect(() => {
    const size = 160
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')
    if (!ctx) return
    const img = ctx.createImageData(size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 22
    }
    ctx.putImageData(img, 0, 0)
    setUrl(c.toDataURL('image/png'))
  }, [])
  if (!url || level === 'low') return null
  return <div className={s.grain} style={{ backgroundImage: `url(${url})` }} aria-hidden />
}
