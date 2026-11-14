/**
 * One-off: convert the JPEG/PNG screens in /public/projects to WebP and delete
 * the originals. Code references must point at the .webp files.
 *   NODE_PATH=<node_modules with playwright-core> node scripts/convert-images.cjs
 */
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright-core')
const { encodeWebp } = require('./webp.cjs')

const ROOT = path.join(__dirname, '..', 'public', 'projects')
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const page = await browser.newPage()
  await page.setContent('<html></html>')
  let before = 0
  let after = 0
  for (const dir of fs.readdirSync(ROOT)) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) {
      if (!/\.(jpe?g|png)$/i.test(f)) continue
      const src = path.join(ROOT, dir, f)
      const buf = fs.readFileSync(src)
      const icon = /^icon\./.test(f)
      const out = await encodeWebp(page, buf, { quality: icon ? 0.9 : 0.82, max: icon ? 512 : 1600 })
      fs.writeFileSync(src.replace(/\.(jpe?g|png)$/i, '.webp'), out)
      fs.unlinkSync(src)
      before += buf.length
      after += out.length
      console.log(`${dir}/${f}: ${(buf.length / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB`)
    }
  }
  console.log(`total ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`)
  await browser.close()
})()
