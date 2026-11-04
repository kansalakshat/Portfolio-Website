import { Fragment, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { useGSAP } from '@gsap/react'
import ScrollVideo from './ScrollVideo.jsx'
import System from './System.jsx'
import { initFx } from './fx.js'
import { initMotion } from './motion.js'

gsap.registerPlugin(Draggable, InertiaPlugin, useGSAP)

// ---- Edit your content here -------------------------------------------
const ME = {
  name: 'Akshat Kansal',
  initials: 'AK',
  email: 'hello@yourname.dev',
  city: 'IIT Bhilai, India',
  socials: [
    ['GitHub', 'https://github.com/'],
    ['LinkedIn', 'https://linkedin.com/'],
    ['Dribbble', 'https://dribbble.com/'],
    ['X', 'https://x.com/'],
  ],
}

const WORK = [
  // fill = row hover color, fg = text on it, roll = letter-roll color, card = hover card color
  { title: 'Nightshift', kind: 'Payments API', year: '2026', fill: '#c6ff3a', fg: '#111311', roll: '#ff4d4d', card: '#00e5ff', tags: ['Go', 'Postgres', 'Kafka'] },
  { title: 'Paper Planes', kind: 'Realtime Sync Engine', year: '2025', fill: '#ff6b3d', fg: '#111311', roll: '#fffdf6', card: '#2bffb0', tags: ['Node', 'WebSockets', 'Redis'] },
  { title: 'Hairline', kind: 'Multi-tenant SaaS', year: '2025', fill: '#00e5ff', fg: '#111311', roll: '#ff4d4d', card: '#ffe14d', tags: ['TypeScript', 'Postgres', 'AWS'] },
  { title: 'Okay Computer', kind: 'Observability + UI', year: '2024', fill: '#ffe14d', fg: '#111311', roll: '#ff4d4d', card: '#c6ff3a', tags: ['Python', 'ClickHouse', 'React'] },
]

const TOOLS = ['Node', 'Go', 'Python', 'Postgres', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'AWS', 'GraphQL', 'React', 'Figma']

const ABOUT =
  "I'm a 2nd-year BTech student at IIT Bhilai and a backend engineer first: APIs, databases, queues, auth, the stuff that has to keep working at 3am. I go full stack when the product needs it, and the designer in me makes sure the frontend never embarrasses the backend. Then I do something with my hair."
// -----------------------------------------------------------------------

const BUBBLES = [
  // [text, start, end] in scroll progress (0..1)
  ['oh. hi.', 0.04, 0.2],
  ['backend engineer by trade.', 0.25, 0.44],
  ['full stack when it ships.', 0.49, 0.68],
  ["designer when nobody's looking.", 0.73, 0.9],
  ['keep scrolling ↓', 0.94, 1.1],
]

// Per-letter spans for letter animations. Words stay unbreakable; the parent
// should carry the readable text (aria-label) since these are aria-hidden.
function Split({ text, from = 0 }) {
  let i = from
  return text.split(' ').map((word, w) => (
    <Fragment key={w}>
      {w > 0 && ' '}
      <span className="w" aria-hidden="true">
        {[...word].map((ch) => {
          const n = i++
          return <span key={n} className="c" style={{ '--i': n, '--r': `${((n * 53) % 50) - 25}deg` }}>{ch}</span>
        })}
      </span>
    </Fragment>
  ))
}

function SecHead({ n, top, em, note }) {
  return (
    <header className="sec-head" data-reveal>
      <span className="tag" data-scramble>({n})</span>
      <h2 aria-label={`${top} ${em}`}>
        <Split text={top} /><br /><em><Split text={em} from={top.length} /></em>
      </h2>
      {note && <span className="tag" data-scramble>{note}</span>}
    </header>
  )
}

function Hero() {
  return (
    <ScrollVideo
      lo={{ webm: '/mascot/lo.webm', mp4: '/mascot/lo.mp4' }}
      hi={{ webm: '/mascot/hi.webm', mp4: '/mascot/hi.mp4' }}
      poster="/mascot/poster.webp"
      height="500vh"
    >
      {/* Behind the mascot */}
      <div className="hero-words" aria-hidden="true">
        <span className="hw hw-1">BACKEND BACKEND BACKEND BACKEND</span>
        <span className="hw hw-2">FULL STACK FULL STACK FULL STACK</span>
      </div>

      {/* In front of the mascot */}
      <div className="hero-ui">
        <h1 className="sr-only">{ME.name}, backend engineer, full-stack developer and designer</h1>
        <p className="tag tl">(01) Portfolio / 2026</p>
        <p className="tag tr">{ME.city}</p>
        <p className="tag bl hint">Scroll to meet him</p>
        <p className="tag br">Open to internships <i className="dot" /></p>
        {BUBBLES.map(([text, a, b]) => (
          <p key={text} className="bubble" style={{ '--a': a, '--b': b }}>
            {text}
          </p>
        ))}
        <div className="hero-bar">
          {['orange', 'yellow', 'lime', 'mint', 'cyan', 'red'].map((c) => (
            <i key={c} style={{ background: `var(--${c})` }} />
          ))}
        </div>
      </div>
    </ScrollVideo>
  )
}

function Tape() {
  const words = ['BACKEND', 'APIS', 'DATABASES', 'QUEUES', 'SCALE', 'FULL STACK', 'DESIGN']
  const line = words.flatMap((w) => [w, '✦'])
  return (
    <div className="tapes" aria-hidden="true">
      {['tape-a', 'tape-b'].map((c) => (
        <div key={c} className={`tape ${c}`}>
          <div className="tape-track">
            {[...line, ...line, ...line, ...line].map((w, i) => <span key={i}>{w}</span>)}
          </div>
        </div>
      ))}
    </div>
  )
}

function Work() {
  const listRef = useRef(null)
  const settle = useRef(0)
  const onMove = (e) => {
    const el = listRef.current
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
    // The preview card swings with mouse speed, then settles.
    el.style.setProperty('--swing', `${Math.max(-30, Math.min(30, e.movementX * 1.5))}deg`)
    clearTimeout(settle.current)
    settle.current = setTimeout(() => el.style.setProperty('--swing', '0deg'), 90)
  }
  return (
    <section id="work" className="work">
      <SecHead n="02" top="Selected" em="work" note={`${WORK.length} projects, 0 boring ones`} />
      <ul className="work-list" ref={listRef} onMouseMove={onMove}>
        {WORK.map((p, i) => (
          <li key={p.title} className="work-row" data-reveal style={{ '--c': p.fill, '--fg': p.fg, '--roll': p.roll, '--card': p.card, '--card-fg': '#111311', '--row': i }}>
            <a href="#contact" data-cursor="View" aria-label={`${p.title}, ${p.kind}, ${p.year}`}>
              <span className="w-num" data-scramble>0{i + 1}</span>
              <span className="w-title"><Split text={p.title} /></span>
              <span className="w-kind" data-scramble>{p.kind}</span>
              <span className="w-year" data-scramble>{p.year}</span>
            </a>
            <div className="w-preview" aria-hidden="true">
              <span className="wp-num">0{i + 1}</span>
              <span className="wp-title">{p.title}</span>
              <span className="wp-tags">{p.tags.join(' / ')}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Fake API about yourself. Edit freely; it's plain data.
const API = {
  '/me': {
    name: ME.name,
    role: 'Backend engineer',
    education: 'BTech, IIT Bhilai (2nd year)',
    also: ['full-stack developer', 'designer'],
    hair: 'curly, non-negotiable',
    dress_code: 'black, always',
  },
  '/stack': {
    languages: ['TypeScript', 'Go', 'Python', 'SQL'],
    data: ['Postgres', 'Redis', 'Kafka'],
    infra: ['Docker', 'Kubernetes', 'AWS'],
    frontend: ['React', 'Next.js'],
    design: ['Figma'],
  },
  '/status': {
    status: 'open_to_internships',
    uptime: '99.9%',
    p99_latency_ms: 42,
    known_bugs: ['will refactor your 404 page', 'then redesign it'],
  },
}

function ApiConsole() {
  const [path, setPath] = useState('/me')
  const [ms, setMs] = useState(12)
  // Pretty JSON, but keep arrays of plain values on one line.
  const lines = JSON.stringify(API[path], null, 2)
    .replace(/\[\n\s+([^[\]{}]*?)\n\s*\]/g, (_, items) => `[${items.split(/,\n\s*/).join(', ')}]`)
    .split('\n')
  return (
    <div className="api" data-tilt data-reveal>
      <div className="api-bar">
        {Object.keys(API).map((p) => (
          <button
            key={p}
            data-magnetic
            data-cursor="GET"
            aria-pressed={p === path}
            onClick={() => { setPath(p); setMs(4 + Math.floor(Math.random() * 30)) }}
          >
            GET {p}
          </button>
        ))}
      </div>
      <p className="api-status"><b>200 OK</b> · {ms}ms · application/json</p>
      <pre aria-live="polite">
        {lines.map((line, i) => {
          const m = line.match(/^(\s*)"([^"]+)":(.*)$/)
          return (
            <span key={`${path}-${i}`} style={{ '--i': i }}>
              {m ? <>{m[1]}<i>"{m[2]}"</i>:{m[3]}</> : line}
              {'\n'}
            </span>
          )
        })}
      </pre>
    </div>
  )
}

function About() {
  return (
    <section id="about" className="about">
      <SecHead n="04" top="About the" em="guy in the suit" />
      <div className="about-grid">
        <p className="about-text">
          {ABOUT.split(' ').map((w, i) => <span key={i}>{w} </span>)}
        </p>
        <ApiConsole />
      </div>
    </section>
  )
}

// Starting [left, top] % for each sticker, hand-scattered so none overlap.
const SPOTS = [[5, 8], [38, 6], [70, 12], [18, 30], [52, 28], [78, 36], [6, 56], [34, 52], [60, 58], [20, 80], [46, 82], [74, 78]]

function Toolbox() {
  const boxRef = useRef(null)
  // Throw the stickers around: drag with momentum, kept inside the board.
  useGSAP(
    () => {
      const drags = Draggable.create('.sticker-wrap', {
        bounds: boxRef.current,
        inertia: true,
        edgeResistance: 0.75,
        onPress() { this.target.firstChild.classList.add('held') },
        onRelease() { this.target.firstChild.classList.remove('held') },
      })
      return () => drags.forEach((d) => d.kill())
    },
    { scope: boxRef },
  )
  return (
    <section className="toolbox">
      <SecHead n="05" top="The" em="toolbox" note="Go on, throw them." />
      <ul className="stickers" ref={boxRef} data-reveal>
        {TOOLS.map((t, i) => (
          <li
            key={t}
            className="sticker-wrap"
            data-cursor="Throw"
            style={{ '--x': `${SPOTS[i % SPOTS.length][0]}%`, top: `${SPOTS[i % SPOTS.length][1]}%` }}
          >
            <span className={`sticker s${i % 8}`} style={{ '--i': i, '--r': `${((i * 47) % 30) - 15}deg` }}>
              {t}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="contact" data-scrollvar>
      <span className="tag" data-scramble>(06) Contact</span>
      <h2 className="say-hi" aria-label="Say hi">
        {'SAY HI'.split('').map((ch, i) => (
          <span key={i} className={ch === ' ' ? 'sp' : undefined} style={{ '--i': i }}>{ch}</span>
        ))}
      </h2>
      <a className="mail" href={`mailto:${ME.email}`} data-magnetic data-cursor="Write">
        {ME.email} <span aria-hidden="true">↗</span>
      </a>
      <footer className="foot">
        <span>© 2026 {ME.name}</span>
        <nav>
          {ME.socials.map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" data-scramble data-magnetic>{label}</a>
          ))}
        </nav>
        <span>Built by hand. Hair by physics.</span>
      </footer>
    </section>
  )
}

// Dot sticks to the pointer; ring lags behind and shows [data-cursor] labels.
function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    let x = -100, y = -100, rx = x, ry = y, raf
    const label = (target) => {
      const text = target?.closest?.('[data-cursor]')?.dataset.cursor ?? ''
      ring.current.dataset.label = text
      ring.current.classList.toggle('big', !!text)
    }
    const move = (e) => {
      x = e.clientX
      y = e.clientY
      dot.current.style.transform = `translate(${x}px, ${y}px)`
      label(e.target)
    }
    // Content slides under a still pointer while scrolling.
    const scroll = () => label(document.elementFromPoint(x, y))
    const down = () => ring.current.classList.add('press')
    const up = () => ring.current.classList.remove('press')
    const loop = () => {
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      ring.current.style.transform = `translate(${rx}px, ${ry}px)`
      raf = requestAnimationFrame(loop)
    }
    addEventListener('pointermove', move)
    addEventListener('scroll', scroll, { passive: true })
    addEventListener('pointerdown', down)
    addEventListener('pointerup', up)
    raf = requestAnimationFrame(loop)
    return () => {
      removeEventListener('pointermove', move)
      removeEventListener('scroll', scroll)
      removeEventListener('pointerdown', down)
      removeEventListener('pointerup', up)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  )
}

// index.html sets data-theme before first paint (saved choice, else OS setting).
function ThemeButton() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'light')
  const next = theme === 'dark' ? 'light' : 'dark'
  const toggle = (e) => {
    const apply = () => {
      document.documentElement.dataset.theme = next
      try { localStorage.setItem('theme', next) } catch {}
      setTheme(next)
    }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce) return apply()
    // Circle wipe out from the button.
    const r = e.currentTarget.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    document.startViewTransition(() => flushSync(apply)).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 800, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
  }
  return (
    <button className="theme-btn" onClick={toggle} aria-label={`Switch to ${next} mode`} data-magnetic>
      <i aria-hidden="true" />{theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}

export default function App() {
  useEffect(() => {
    const stopFx = initFx()
    const stopMotion = initMotion()
    return () => {
      stopMotion()
      stopFx()
    }
  }, [])
  return (
    <>
      <nav className="nav">
        <a href="#" className="logo" data-magnetic>{ME.initials}<sup>©</sup></a>
        <div>
          <a href="#work" data-scramble data-magnetic>Work</a>
          <a href="#system" data-scramble data-magnetic>System</a>
          <a href="#about" data-scramble data-magnetic>About</a>
          <a href="#contact" data-scramble data-magnetic>Contact</a>
          <ThemeButton />
        </div>
      </nav>
      <main>
        <Hero />
        <Tape />
        <Work />
        <System>
          <SecHead n="03" top="How it's" em="wired" note="Scroll to build it." />
        </System>
        <About />
        <Toolbox />
        <Contact />
      </main>
      <Cursor />
      {/* Wobbly "liquid" distortion, used via CSS filter: url(#liquid) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="liquid">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="3">
            <animate attributeName="baseFrequency" dur="5s" values="0.012 0.02;0.02 0.012;0.012 0.02" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="22" />
        </filter>
      </svg>
    </>
  )
}
