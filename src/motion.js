// GSAP-powered page motion: smooth scrolling, the hero's exit, click bursts.
// Returns a cleanup function. Call once after the page has mounted.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Physics2DPlugin } from 'gsap/Physics2DPlugin'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger, Physics2DPlugin)

const GLYPHS = ['{ }', '</>', ';', '=>', '0', '1', '[ ]', '( )', '&&', '!=', '#', '*', '200', 'ok']
const COLORS = ['var(--lime)', 'var(--cyan)', 'var(--yellow)', 'var(--orange)', 'var(--mint)', 'var(--red)']

export function initMotion() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const offs = []

  // Smooth, weighty scrolling. Native scroll underneath, so sticky still works.
  const lenis = new Lenis({ anchors: true, lerp: 0.09 })
  lenis.on('scroll', ScrollTrigger.update)
  const raf = (t) => lenis.raf(t * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
  offs.push(() => {
    gsap.ticker.remove(raf)
    lenis.destroy()
  })

  // Hero: as it scrolls away, the whole stage shrinks into a tilted card.
  const stage = document.querySelector('.stage')
  const tween = stage && gsap.to(stage, {
    scale: 0.8,
    rotation: -4,
    borderRadius: 48,
    ease: 'none',
    scrollTrigger: { trigger: stage.parentElement, start: 'bottom bottom', end: 'bottom top', scrub: true },
  })
  offs.push(() => tween?.revert())

  // Click anywhere: a burst of code glyphs with gravity.
  const layer = Object.assign(document.createElement('div'), { className: 'bursts' })
  layer.setAttribute('aria-hidden', 'true')
  document.body.appendChild(layer)
  offs.push(() => layer.remove())
  const burst = (e) => {
    if (e.button !== 0 || e.target.closest('.sticker-wrap, button, a')) return
    for (let i = 0; i < 12; i++) {
      const el = Object.assign(document.createElement('span'), { textContent: gsap.utils.random(GLYPHS) })
      el.style.color = gsap.utils.random(COLORS)
      layer.appendChild(el)
      gsap.set(el, { x: e.clientX, y: e.clientY, xPercent: -50, yPercent: -50 })
      gsap.to(el, {
        physics2D: { velocity: gsap.utils.random(320, 720), angle: gsap.utils.random(-165, -15), gravity: 1500 },
        rotation: gsap.utils.random(-300, 300),
        duration: 1.3,
        onComplete: () => el.remove(),
      })
      gsap.to(el, { opacity: 0, delay: 0.8, duration: 0.5 })
    }
  }
  addEventListener('pointerdown', burst)
  offs.push(() => removeEventListener('pointerdown', burst))

  // Child components created their triggers first; put them in page order.
  ScrollTrigger.sort()
  ScrollTrigger.refresh()
  document.fonts?.ready.then(() => ScrollTrigger.refresh())

  return () => offs.forEach((f) => f())
}
