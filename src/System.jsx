import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, useGSAP)

// The architecture you build. Edit freely: x/y are centers in a 1200x640 canvas.
const NODES = {
  client: { x: 110, y: 320, label: 'Client', sub: 'web · mobile', c: '#fffdf6' },
  edge: { x: 320, y: 320, label: 'Edge', sub: 'CDN · TLS', c: 'var(--cyan)' },
  api: { x: 540, y: 320, label: 'API', sub: 'Go · 12k rps', c: 'var(--lime)' },
  auth: { x: 540, y: 110, label: 'Auth', sub: 'JWT · OAuth', c: 'var(--yellow)' },
  cache: { x: 800, y: 110, label: 'Redis', sub: 'p99 2ms', c: 'var(--orange)' },
  queue: { x: 800, y: 320, label: 'Kafka', sub: 'events', c: 'var(--mint)' },
  db: { x: 800, y: 530, label: 'Postgres', sub: 'primary + replica', c: 'var(--cyan)' },
  hooks: { x: 1060, y: 110, label: 'Webhooks', sub: 'with retries', c: 'var(--yellow)' },
  workers: { x: 1060, y: 320, label: 'Workers', sub: 'jobs · email', c: 'var(--red)' },
  stats: { x: 1060, y: 530, label: 'Analytics', sub: 'ClickHouse', c: 'var(--lime)' },
}
const EDGES = [
  ['client', 'edge'], ['edge', 'api'], ['api', 'auth'], ['api', 'cache'], ['api', 'queue'],
  ['api', 'db'], ['queue', 'workers'], ['workers', 'hooks'], ['workers', 'db'], ['db', 'stats'],
]
const PACKET_COLORS = ['var(--lime)', 'var(--cyan)', 'var(--yellow)', 'var(--orange)', 'var(--mint)', 'var(--red)']

// Straight line when aligned, otherwise an elbow through the midpoint.
const pathFor = ([a, b]) => {
  const p = NODES[a], q = NODES[b]
  if (p.x === q.x || p.y === q.y) return `M${p.x} ${p.y} L${q.x} ${q.y}`
  const mx = (p.x + q.x) / 2
  return `M${p.x} ${p.y} H${mx} V${q.y} H${q.x}`
}

const ROUTES = ['GET /v1/orders', 'POST /v1/payments', 'GET /v1/me', 'PUT /v1/cart', 'GET /v1/search?q=hair', 'POST /v1/webhooks', 'GET /healthz']
const STATUS = [200, 200, 200, 201, 200, 304, 200, 429]

export default function System({ children }) {
  const root = useRef(null)

  useGSAP(
    () => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      const edges = gsap.utils.toArray('.edge')
      const packets = gsap.utils.toArray('.packet')

      // Packets loop along every wire forever (hidden until the diagram is built).
      packets.forEach((dot, i) => {
        gsap.to(dot, {
          motionPath: { path: edges[i], align: edges[i], alignOrigin: [0.5, 0.5] },
          duration: gsap.utils.random(1.1, 2.2),
          delay: gsap.utils.random(0, 1.5),
          repeat: -1,
          ease: 'none',
        })
      })

      // Live access log while the section is on screen.
      const log = root.current.querySelector('.log ol')
      let tick
      const addLine = () => {
        const status = gsap.utils.random(STATUS)
        const li = document.createElement('li')
        const cell = (tag, text) => li.appendChild(Object.assign(document.createElement(tag), { textContent: text }))
        cell('b', status).dataset.s = String(status)[0]
        cell('span', gsap.utils.random(ROUTES))
        cell('i', `${gsap.utils.random(2, 48, 1)}ms`)
        log.prepend(li)
        gsap.from(li, { x: -20, opacity: 0, duration: 0.3 })
        while (log.children.length > 9) log.lastChild.remove()
        tick = gsap.delayedCall(gsap.utils.random(0.25, 0.7), addLine)
      }
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => (self.isActive && !reduce ? addLine() : tick?.kill()),
      })

      if (reduce) {
        gsap.set(packets, { autoAlpha: 1 })
        return
      }

      // Build the diagram column by column as you scroll (pinned on wide screens).
      const mm = gsap.matchMedia()
      mm.add({ wide: '(min-width: 721px)', narrow: '(max-width: 720px)' }, ({ conditions }) => {
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: conditions.wide
            ? { trigger: '.wire-stage', start: 'top 10%', end: '+=1600', pin: true, scrub: 1 }
            : { trigger: '.wire-stage', start: 'top 80%', end: 'bottom 60%', scrub: 1 },
        })
        const columns = [...new Set(Object.values(NODES).map((n) => n.x))].sort((a, b) => a - b)
        columns.forEach((x) => {
          const wires = EDGES.map((e, i) => (NODES[e[1]].x === x ? edges[i] : null)).filter(Boolean)
          const boxes = Object.entries(NODES).filter(([, n]) => n.x === x).map(([id]) => `.node-${id}`)
          if (wires.length) tl.from(wires, { drawSVG: 0, duration: 0.6, stagger: 0.1 })
          tl.from(boxes, { scale: 0, rotation: -25, transformOrigin: '50% 50%', duration: 0.5, stagger: 0.1, ease: 'back.out(2.2)' })
        })
        tl.to(packets, { autoAlpha: 1, duration: 0.3 })
      })
      return () => {
        tick?.kill()
        mm.revert()
      }
    },
    { scope: root },
  )

  return (
    <section id="system" className="wire" ref={root}>
      {children}
      <div className="wire-stage">
        <div className="wire-canvas">
          <svg viewBox="0 0 1200 640" role="img" aria-label="System diagram: client, edge, API, auth, Redis, Kafka, Postgres, workers, webhooks, analytics">
            {EDGES.map((e) => (
              <path key={e.join('-')} className="edge" d={pathFor(e)} />
            ))}
            {EDGES.map((e, i) => (
              <circle key={`p-${e.join('-')}`} className="packet" r="7" style={{ fill: PACKET_COLORS[i % PACKET_COLORS.length] }} />
            ))}
            {Object.entries(NODES).map(([id, n]) => (
              <g key={id} transform={`translate(${n.x} ${n.y})`}>
                <g className={`node node-${id}`}>
                  <rect className="node-shadow" x="-80" y="-34" width="170" height="76" rx="14" />
                  <rect className="node-box" x="-86" y="-40" width="170" height="76" rx="14" style={{ fill: n.c }} />
                  <text className="node-label" x="-1" y="-6" textAnchor="middle">{n.label}</text>
                  <text className="node-sub" x="-1" y="18" textAnchor="middle">{n.sub}</text>
                </g>
              </g>
            ))}
          </svg>
        </div>
        <div className="log" aria-hidden="true">
          <p className="log-head"><i className="dot" /> live · access.log</p>
          <ol />
        </div>
      </div>
    </section>
  )
}
