/**
 * Photographs the projects' app icons (square, full-bleed) into
 * /public/gallery/<id>-icon.webp, for the Works stage.
 *
 *   npm run dev        (in another terminal; the page is read from the dev server)
 *   npm run gallery
 *
 * Needs `playwright-core` and Google Chrome. If playwright-core is not
 * installed here, point NODE_PATH at a node_modules folder that has it.
 * Options: PORT (default 3030), CHROME (path to the browser).
 */
const fs = require('fs')
const path = require('path')
const { encodeWebp } = require('./webp.cjs')
let chromium
try {
  ;({ chromium } = require('playwright-core'))
} catch {
  console.error('playwright-core not found. Run `npm i -D playwright-core`, or set NODE_PATH to a node_modules that has it.')
  process.exit(1)
}
const OUT = path.join(__dirname, '..', 'public', 'gallery')
const URL = `http://localhost:${process.env.PORT || 3030}/dark-aphelion/?posters`
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1500)
  const posters = await page.$$('[data-poster]')
  if (!posters.length) throw new Error('No posters found. Is the dev server running on this port?')
  for (const el of posters) {
    const name = await el.getAttribute('data-poster')
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(250)
    const shot = await el.screenshot({ type: 'png' })
    fs.writeFileSync(path.join(OUT, `${name}.webp`), await encodeWebp(page, shot, { quality: 0.9 }))
  }
  console.log(`${posters.length} icons written to public/gallery`)
  await browser.close()
})()
