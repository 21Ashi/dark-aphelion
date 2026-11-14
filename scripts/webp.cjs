/**
 * WebP encoding through the browser's own encoder (canvas.toBlob), so the
 * project needs no image tooling. `page` is any open Playwright page.
 * Images wider or taller than `max` are scaled down first.
 */
async function encodeWebp(page, buffer, { quality = 0.82, max = 1600 } = {}) {
  const b64 = await page.evaluate(
    async ({ src, quality, max }) => {
      const img = new Image()
      img.src = src
      await img.decode()
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(img.naturalWidth * k)
      c.height = Math.round(img.naturalHeight * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      const blob = await new Promise((r) => c.toBlob(r, 'image/webp', quality))
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let s = ''
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      return btoa(s)
    },
    { src: 'data:image/png;base64,' + Buffer.from(buffer).toString('base64'), quality, max },
  )
  return Buffer.from(b64, 'base64')
}

module.exports = { encodeWebp }
