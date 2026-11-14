import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './lib/gsap'
import App from './App'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

const root = createRoot(document.getElementById('root')!)

// Development only: `?posters` shows the app icon tiles for scripts/capture-gallery.cjs.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('posters')) {
  import('./dev/PosterSheet').then((m) => root.render(<m.PosterSheet />))
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
