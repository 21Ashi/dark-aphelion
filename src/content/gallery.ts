/**
 * The project's real app icon (or site mark), shown as a 3D tile on the Works
 * stage. Only projects that have one: no stand-ins. `mark` is a logo drawn on
 * a dark tile; otherwise the image is the icon itself.
 *
 * After changing this list or the images, regenerate the tiles:
 *   npm run dev            (leave it running)
 *   npm run gallery        (writes /public/gallery/<id>-icon.webp)
 */
export const GALLERY_ICON: Record<string, { src: string; mark?: boolean }> = {
  'alhammadi-hajj': { src: 'projects/alhammadi-hajj/icon.webp' },
  'mzad-al-fakher': { src: 'projects/mzad-al-fakher/icon.svg' },
  es7a: { src: 'projects/es7a/icon.webp' },
  jola: { src: 'projects/jola/icon.webp' },
  'qatar-gates': { src: 'projects/qatar-gates/mark.svg', mark: true },
  'mudaraj-al-anabi': { src: 'projects/mudaraj-al-anabi/icon.webp' },
}

export const iconSrc = (id: string) => `${import.meta.env.BASE_URL}gallery/${id}-icon.webp`
