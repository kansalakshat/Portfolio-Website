import { useEffect, useRef, useState } from 'react'

// Safari (incl. every iOS browser) plays WebM but ignores its alpha channel.
export const isWebKit = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

// Scroll-scrubbed video: scrolling through the section moves the video frame.
//
// Loads in three steps so something is on screen almost immediately:
//   1. `poster` (one still frame)    shows instantly
//   2. `lo` (small preview video)    downloads in ~1 MB, scrubbing starts
//   3. `hi` (full quality video)     downloads next and swaps in on the same frame
// Each of lo/hi is { webm, mp4 }: transparent VP9, or an MP4 composited on a
// light background for Safari.
//
// Scroll progress (0..1) is exposed as the CSS var `--p` on the section, so
// `children` (rendered in the sticky stage) can animate from CSS alone.
export default function ScrollVideo({ lo, hi, poster, height = '500vh', children }) {
  const loSrc = isWebKit ? lo.mp4 : lo.webm
  const hiSrc = isWebKit ? hi.mp4 : hi.webm
  const sectionRef = useRef(null)
  const loRef = useRef(null)
  const hiRef = useRef(null)
  const hiReady = useRef(false)
  const [loUrl, setLoUrl] = useState(null)
  const [hiUrl, setHiUrl] = useState(null)
  const [showHi, setShowHi] = useState(false)

  // Whole files as blobs, so seeks never wait on the network mid-scroll.
  // Preview first, then full quality, one after the other so they don't compete.
  useEffect(() => {
    const ctrl = new AbortController()
    const urls = []
    const load = (src) =>
      fetch(src, { signal: ctrl.signal })
        .then((r) => {
          if (!r.ok) throw new Error(r.status)
          return r.blob()
        })
        .then((b) => {
          const url = URL.createObjectURL(b)
          urls.push(url)
          return url
        })
    load(loSrc)
      .catch(() => (ctrl.signal.aborted ? null : loSrc)) // stream it instead
      .then((url) => {
        if (!url) return
        setLoUrl(url)
        return load(hiSrc).then(setHiUrl)
      })
      .catch(() => {}) // no full-quality file: keep the preview
    return () => {
      ctrl.abort()
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [loSrc, hiSrc])

  useEffect(() => {
    const section = sectionRef.current
    let raf
    let current = 0
    const tick = () => {
      const { top, height: h } = section.getBoundingClientRect()
      const scrollable = h - window.innerHeight
      const progress = Math.min(Math.max(-top / scrollable, 0), 1)
      section.style.setProperty('--p', progress.toFixed(4))
      const video = hiReady.current ? hiRef.current : loRef.current
      if (video?.duration) {
        // Ease toward target so fast scrolls stay smooth, not jumpy.
        current += (progress * video.duration - current) * 0.15
        // Skip seeking while the previous seek is still decoding.
        if (!video.seeking && Math.abs(video.currentTime - current) > 0.01) {
          video.currentTime = current
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Full quality arrived: jump it to the preview's frame, then swap.
  const syncHi = () => {
    hiRef.current.currentTime = loRef.current?.currentTime ?? 0
  }
  const swapToHi = () => {
    if (hiReady.current) return
    hiReady.current = true
    setShowHi(true)
  }

  const style = {
    // Box hugs the video's own aspect (2552x2160), bottom-anchored.
    position: 'absolute',
    zIndex: 1,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    height: 'min(100%, 130vw)',
    aspectRatio: '2552 / 2160',
    display: 'block',
    // The MP4 is opaque: multiply lets the layers behind show through.
    mixBlendMode: isWebKit ? 'multiply' : undefined,
  }

  return (
    <section ref={sectionRef} style={{ height, position: 'relative', '--p': 0 }}>
      <div
        className="stage"
        data-webkit={isWebKit || undefined}
        style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
      >
        {children}
        <video
          ref={loRef}
          src={loUrl ?? undefined}
          poster={poster}
          muted
          playsInline
          preload="auto"
          style={{ ...style, visibility: showHi ? 'hidden' : undefined }}
        />
        {hiUrl && (
          <video
            ref={hiRef}
            src={hiUrl}
            muted
            playsInline
            preload="auto"
            onLoadedData={syncHi}
            onSeeked={swapToHi}
            style={{ ...style, visibility: showHi ? undefined : 'hidden' }}
          />
        )}
      </div>
    </section>
  )
}
