# Aphelion — Abood Ashi's portfolio

A scroll-driven WebGL experience: a crimson star rising behind a colonnade, a
morphing sculpture, and five chapters the camera flies through as you scroll
(about 16 screens of scroll: Arrival, Origin, Works, Trajectory, Aphelion).

React 19 · Vite · TypeScript · Three.js / React Three Fiber · GSAP (ScrollTrigger,
SplitText, ScrambleText) · Lenis · custom GLSL.

```bash
npm install
npm run dev       # http://localhost:5173/dark-aphelion/
npm run build     # typecheck + production build into dist/
npm run preview
```

## Editing content

Everything personal is in `src/content/` — no component needs touching:

| File | What |
| --- | --- |
| `profile.ts` | name, tagline, location, email, socials, About copy, principles, stats |
| `projects.ts` | the Works chapter and case studies |
| `experience.ts` | the Trajectory timeline |

**The Works stage** shows one project at a time as the chapter's scroll moves on
(`src/sections/Work.tsx` drives it; the type column is `src/sections/work/Slide.tsx`).
On the left: the name, a one-line tagline, three feature tiles, *Explore project* and the
stack with official logos. On the right, in the 3D scene (`src/scene/showcase/`), built from
the supplied GLB models in `public/models/`: the obsidian pedestal is the floor, one
smartphone mockup stands centred on it with the project's real screenshot on its glass, the
app icon floats beside it as a 3D tile, the orbital sculpture turns in the background, with
orbits of light and a few rocks. A project without screenshots puts its icon on the pedestal
instead.

*Explore project* opens the case study (`src/sections/work/CaseStudy.tsx`): a panel with
Overview, Features and Gallery tabs over the live stage, which moves right to make room and
shows the screenshot picked in Features or Gallery on its phone (`motion.works.cs`). Without
WebGL, or with reduced motion, the same panel stands beside the screenshots themselves.

Each slide is described in `src/content/showcase.ts`: its title lines, tagline, features
(Phosphor icon names), stack, screens and an optional **backdrop photo** (the owner's own,
as WebP in `public/projects/<id>/`). A backdrop's `focus` keeps the important part of the
photo beside the stage; `anchor: 'stage'` is for a photo with a pedestal of its own, which
is then placed right behind the 3D one. Without a photo the room is smoke in the project's
colours. The stage's icon tiles are photographed from `src/dev/PosterSheet.tsx`
into `public/gallery/`; after changing an icon, regenerate them:

```bash
npm run dev       # leave running
npm run gallery   # needs playwright-core (npm i -D playwright-core) and Google Chrome
```

Without WebGL, or with reduced motion, the chapter falls back to
`src/sections/journey/JourneyWork.tsx` (one full-screen DOM composition per project,
plus the index list).

**Real project media:** drop a file in `public/projects/` and set
`media: { type: 'image', src: 'projects/cri.jpg' }` (or `type: 'video'` with an
optional `poster`). The procedural preview is replaced automatically.

## How it fits together

```
src/
├── content/        editable copy
├── lib/            motion store, GSAP setup, Lenis, loader, device tiers
├── components/     preloader, cursor, magnetic, nav, chapter rail, grain
├── sections/       Hero, About, Work (+ case study), Experience, Contact
└── scene/          the 3D world (lazy-loaded chunk)
    ├── shaders/    GLSL: star, corona, sky, sculpture, dust, grid, smoke, shafts
    ├── path.ts     camera keyframes per chapter
    ├── showcase/   the Works stage: backdrop, lights, GLB models, screens, icon tiles
    └── *.tsx       Star, Monoliths, Ground, Sculpture, Shards, Atmosphere, Effects
```

- `src/lib/motion.ts` is a mutable store: the DOM writes scroll/pointer state,
  the scene reads it in `useFrame`. No React re-renders per frame.
- The star's projected screen position is published back to the DOM, which is
  how the hero name is silhouetted and rim-lit by it.
- Camera, sculpture form and the eclipse are all functions of a continuous
  `chapter` value derived from scroll.

## Performance & accessibility

- **Quality manager** (`src/lib/quality.ts`): four levels (`ultra`, `high`, `medium`,
  `low`) picked from the GPU renderer string, cores, memory and screen type (never the
  user-agent). At runtime it watches frame times against the display's own refresh
  interval and steps down after sustained slow frames, back up only after a long stable
  stretch, with a cooldown and at most two drops. Runtime steps change resolution,
  particles, reflections and chromatic aberration; post-processing stays as the
  starting level set it (switching it recompiles every shader). Force a level with
  `?quality=low|medium|high|ultra`.
- **Dev panel**: Shift+P or `?perf` in development shows fps, frame-time percentiles,
  long frames, draw calls, GPU memory, the level and its changes. It is not in
  production builds.
- **No shader compiles mid-scroll**: the light count never changes (lights are dimmed,
  never added or removed; the Works stage's key and rim lights exist from the start, dark).
  The stage's models load after the intro and are compiled one object per idle slot
  (`src/scene/prewarm.ts`); its studio reflections are rendered behind the preloader. Its
  screenshots, icons and backdrops load after the intro and upload to the GPU in idle time
  (`src/scene/idle.ts`).
- **Main thread**: per-frame DOM work reads layout before writing and writes only
  changed values; loops stop when their part of the page is off screen.
- **Power**: rendering drops to 30 fps after 20 s without input, stops while an opaque
  overlay covers the canvas or the tab is hidden.
- **Loading**: Three.js is its own chunk behind the preloader; the Works stage's models
  (and the glTF loader) are a separate chunk fetched after the intro; the slide column with
  its icons and logos, the case study and the no-WebGL fallback load on demand (prefetched
  when idle). Images are WebP (`scripts/convert-images.cjs`, `npm run gallery`).
- `prefers-reduced-motion`: native scrolling, no pinning or scrubbing, a still scene
  rendered on demand, content shown without entrance animation. Without WebGL, the
  Works chapter falls back to plain DOM compositions.
- Touch devices get no custom cursor and no hover-only behaviour.

## Deploying

`vite.config.ts` sets `base: '/dark-aphelion/'` for GitHub Pages, which serves
the `gh-pages` branch. Publish the contents of `dist/` there after `npm run build`.

## Pacing

Each pinned chapter's length is a set of constants in viewport heights, and every
timing inside it is derived from them: `About.tsx` (`STATEMENT`, `STAT`),
`work/track.ts` (`BUILD`, `STEP`, `TAIL`, `OUT`) and `Experience.tsx` (`HOLD`, `SWAP`).
Shorten or lengthen a chapter there, not in the CSS. The About numbers roll to their
real value on a clock once they arrive, so a paused scroll never shows a wrong figure.
