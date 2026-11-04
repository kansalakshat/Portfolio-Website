// All the page-wide motion, wired by data attributes / class names.
// Returns a cleanup function. Call once after the page has mounted.
//
//   [data-reveal]     gets `.in` when it scrolls into view
//   [data-scramble]   text scrambles on hover (of itself, or its parent <a>)
//   [data-magnetic]   gets pulled toward the cursor
//   [data-tilt]       3D-tilts toward the cursor (sets --tx / --ty)
//   [data-scrollvar]  gets --sp: 0 -> 1 as it scrolls up into view
//   .tape-track       marquee, speed and direction follow your scrolling
//   .say-hi           letters dodge the cursor
//   :root             --v (scroll velocity, -1..1), --cx / --cy (cursor, -1..1)

const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const GLYPHS = '!<>-_/[]{}=+*^?#01'

export function initFx() {
  const root = document.documentElement
  const offs = []
  const on = (t, ev, fn, opts) => {
    t.addEventListener(ev, fn, opts)
    offs.push(() => t.removeEventListener(ev, fn, opts))
  }
  const $$ = (sel) => [...document.querySelectorAll(sel)]
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  // Reveal on enter (one-shot).
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in')
        io.unobserve(e.target)
      }
    }),
    { threshold: 0.15 },
  )
  $$('[data-reveal]').forEach((el) => (reduce ? el.classList.add('in') : io.observe(el)))
  offs.push(() => io.disconnect())

  if (reduce) return () => offs.forEach((f) => f())

  // Scramble: random glyphs that resolve left to right.
  $$('[data-scramble]').forEach((el) => {
    const text = el.textContent
    let raf
    on(el.closest('a') ?? el, 'mouseenter', () => {
      let f = 0
      cancelAnimationFrame(raf)
      const step = () => {
        el.textContent = [...text]
          .map((ch, i) => (ch === ' ' || i < f / 2 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join('')
        if (f++ < text.length * 2) raf = requestAnimationFrame(step)
        else el.textContent = text
      }
      step()
    })
    offs.push(() => cancelAnimationFrame(raf))
  })

  // Magnetic.
  $$('[data-magnetic]').forEach((el) => {
    on(el, 'pointermove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.4}px ${(e.clientY - r.top - r.height / 2) * 0.4}px`
    })
    on(el, 'pointerleave', () => (el.style.translate = ''))
  })

  // Tilt.
  $$('[data-tilt]').forEach((el) => {
    on(el, 'pointermove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--tx', `${((e.clientX - r.left) / r.width - 0.5) * 18}deg`)
      el.style.setProperty('--ty', `${((e.clientY - r.top) / r.height - 0.5) * -18}deg`)
    })
    on(el, 'pointerleave', () => {
      el.style.removeProperty('--tx')
      el.style.removeProperty('--ty')
    })
  })

  // SAY HI letters run away from the cursor. offsetLeft/Top ignore `translate`,
  // so the rest positions stay stable while letters move.
  const hi = document.querySelector('.say-hi')
  if (hi) {
    const letters = [...hi.children]
    const host = hi.parentElement
    on(host, 'pointermove', (e) => {
      const box = hi.getBoundingClientRect()
      letters.forEach((l) => {
        const dx = box.left + l.offsetLeft + l.offsetWidth / 2 - e.clientX
        const dy = box.top + l.offsetTop + l.offsetHeight / 2 - e.clientY
        const d = Math.hypot(dx, dy) || 1
        const f = Math.max(0, 1 - d / 380) ** 1.5
        l.style.translate = `${(dx / d) * f * 160}px ${(dy / d) * f * 160}px`
        l.style.rotate = `${(dx / d) * f * 40}deg`
      })
    })
    on(host, 'pointerleave', () => letters.forEach((l) => (l.style.translate = l.style.rotate = '')))
  }

  // One rAF loop for everything continuous.
  const tracks = $$('.tape-track')
  const scrollVars = $$('[data-scrollvar]')
  let halves = []
  const measure = () => (halves = tracks.map((t) => t.scrollWidth / 2))
  measure()
  document.fonts?.ready.then(measure)
  on(window, 'resize', measure)

  let mx = 0, my = 0, cx = 0, cy = 0, v = 0, lastY = scrollY, tx = 0, dir = 1, raf
  let prev = ''
  on(window, 'pointermove', (e) => {
    mx = (e.clientX / innerWidth) * 2 - 1
    my = (e.clientY / innerHeight) * 2 - 1
  })

  const loop = () => {
    // Reads first...
    const y = scrollY
    const sps = scrollVars.map((el) => {
      const top = el.getBoundingClientRect().top
      return clamp((innerHeight - top) / (innerHeight * 0.75), 0, 1)
    })
    // ...then writes.
    v = lerp(v, clamp((y - lastY) / 50, -1, 1), 0.12)
    lastY = y
    if (v > 0.03) dir = 1
    else if (v < -0.03) dir = -1
    cx = lerp(cx, mx, 0.08)
    cy = lerp(cy, my, 0.08)

    const vars = `${v.toFixed(3)}|${cx.toFixed(3)}|${cy.toFixed(3)}`
    if (vars !== prev) {
      prev = vars
      root.style.setProperty('--v', v.toFixed(3))
      root.style.setProperty('--cx', cx.toFixed(3))
      root.style.setProperty('--cy', cy.toFixed(3))
    }

    tx += (0.7 + Math.abs(v) * 16) * dir
    tracks.forEach((t, i) => {
      const w = halves[i]
      if (!w) return
      const x = ((tx % w) + w) % w
      t.style.transform = `translate3d(${i % 2 ? x - w : -x}px, 0, 0)`
    })
    scrollVars.forEach((el, i) => el.style.setProperty('--sp', sps[i].toFixed(3)))

    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  offs.push(() => cancelAnimationFrame(raf))

  return () => offs.forEach((f) => f())
}
