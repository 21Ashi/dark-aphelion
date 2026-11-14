import { projects } from '../content/projects'
import { GALLERY_ICON } from '../content/gallery'
import s from './PosterSheet.module.css'

/**
 * Development only (open the dev server with `?posters`). Renders each
 * project's real app icon (or site mark on a dark tile) as a full-bleed square,
 * so `scripts/capture-gallery.cjs` can photograph them into
 * /public/gallery/<id>-icon.webp: the pictures on the Works stage's 3D icon tiles.
 */
const BASE = import.meta.env.BASE_URL

export function PosterSheet() {
  return (
    <div className={s.sheet}>
      {projects.map((p) => {
        const icon = GALLERY_ICON[p.id]
        if (!icon) return null
        return (
          <div key={p.id} className={s.iconWrap} data-poster={`${p.id}-icon`}>
            <div className={`${s.icon} ${icon.mark ? s.mark : ''}`}>
              <img src={`${BASE}${icon.src}`} alt="" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
