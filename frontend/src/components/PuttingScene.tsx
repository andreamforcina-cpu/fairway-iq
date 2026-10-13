import { useId, useRef } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import './PuttingScene.css'

/** Fixed camera, reversible scroll timeline, and a front-rim mask for the cup drop. */
export function PuttingScene() {
  const section = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const visible = useInView(section, { amount: 0.1 })
  const id = useId().replaceAll(':', '')
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const smoothed = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.2 })
  const progress = useTransform(smoothed, value => reduced ? 1 : value)
  const timeline = [0, 0.1, 0.3, 0.6, 0.8, 0.88, 0.95, 1]
  const x = useTransform(progress, timeline, [235, 240, 303, 432, 544, 544, 544, 544])
  const y = useTransform(progress, timeline, [389, 387, 361, 303, 242, 257, 290, 302])
  const scale = useTransform(progress, timeline, [1, 1, 0.92, 0.77, 0.6, 0.6, 0.6, 0.6])
  const rotate = useTransform(progress, [0, 0.8, 1], [0, 390, 390])
  const shadowOpacity = useTransform(progress, [0, 0.8, 0.88, 0.95], [0.3, 0.3, 0.12, 0])
  const shadowY = useTransform(progress, [0, 0.8, 1], [411, 257, 257])
  const mask = useTransform(progress, value => value < 0.8 ? 'none' : `url(#${id}-cup-mask)`)
  const success = useTransform(progress, [0.95, 1], [0, 1])

  return <section ref={section} className={`putting-section${reduced ? ' putting-reduced' : ''}${visible ? ' putting-in-view' : ''}`} aria-labelledby="putting-title">
    <div className="putting-stage">
      <div className="container putting-content">
        <div className="putting-heading"><p className="eyebrow">PRECISION IN EVERY MOMENT</p><h2 id="putting-title">Every shot.<br />Every detail.<br />Every <em>advantage.</em></h2></div>
        <div className="putting-visual" role="img" aria-label="A white golf ball rolls across a softly lit putting green and drops into the cup beside a metallic flagstick with a gently moving lime-green flag as you scroll. Scroll upward to reverse the putt.">
          <svg viewBox="0 0 800 540" aria-hidden="true">
            <defs>
              <radialGradient id={`${id}-green`} cx="68%" cy="42%" r="85%"><stop stopColor="#476746" /><stop offset=".5" stopColor="#274c37" /><stop offset="1" stopColor="#163629" /></radialGradient>
              <radialGradient id={`${id}-ball`} cx="30%" cy="22%" r="80%"><stop stopColor="#fff" /><stop offset=".55" stopColor="#f1f3ec" /><stop offset=".85" stopColor="#b9c4b4" /><stop offset="1" stopColor="#7a8975" /></radialGradient>
              <radialGradient id={`${id}-shadow`}><stop stopColor="#06130b" stopOpacity=".8" /><stop offset="1" stopColor="#06130b" stopOpacity="0" /></radialGradient>
              <linearGradient id={`${id}-cup`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#030a06" /><stop offset="1" stopColor="#102419" /></linearGradient>
              <linearGradient id={`${id}-pole`}><stop stopColor="#8e9b8b" /><stop offset=".4" stopColor="#f5f6ef" /><stop offset=".7" stopColor="#d2d9ca" /><stop offset="1" stopColor="#81917b" /></linearGradient>
              <linearGradient id={`${id}-flag`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e0f2a6" /><stop offset=".5" stopColor="#d8ee92" /><stop offset="1" stopColor="#a2bf6d" /></linearGradient>
              <linearGradient id={`${id}-pole-shadow`}><stop stopColor="#06130b" stopOpacity=".22" /><stop offset="1" stopColor="#06130b" stopOpacity="0" /></linearGradient>
              <clipPath id={`${id}-cup-mask`}><rect x="0" y="0" width="800" height="264" /></clipPath>
              <clipPath id={`${id}-ball-clip`}><circle r="24" /></clipPath>
            </defs>
            <path d="M0 100 Q400 15 800 80V540H0Z" fill={`url(#${id}-green)`} />
            <path d="M0 100 Q400 15 800 80" fill="none" stroke="#7b9770" strokeOpacity=".14" />
            {/* Ground shadow is behind the cup and rolling ball. */}
            <path d="M560 256L659 294" stroke={`url(#${id}-pole-shadow)`} strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="560" cy="254" rx="42" ry="20" fill={`url(#${id}-shadow)`} opacity=".35" />
            <ellipse cx="560" cy="250" rx="33" ry="15" fill="#122b1b" stroke="#78936b" strokeOpacity=".45" strokeWidth="1.2" />
            <ellipse cx="560" cy="250" rx="30.5" ry="13.5" fill={`url(#${id}-cup)`} />
            <motion.g style={{ x, y: shadowY, scale, opacity: shadowOpacity }}><ellipse rx="36" ry="11" fill={`url(#${id}-shadow)`} /></motion.g>
            <motion.g style={{ clipPath: mask, display: reduced ? 'none' : undefined }}>
              <motion.g style={{ x, y }}>
                <motion.g style={{ scale }}>
                  <circle r="24" fill={`url(#${id}-ball)`} />
                  <motion.g style={{ rotate }} clipPath={`url(#${id}-ball-clip)`}>
                    {Array.from({ length: 7 }, (_, row) => Array.from({ length: 7 }, (_, col) => {
                      const dx = (col - 3) * 6 + (row % 2 ? 3 : 0)
                      const dy = (row - 3) * 6
                      if (dx * dx + dy * dy > 470) return null
                      return <g key={`${row}-${col}`}><ellipse cx={dx} cy={dy} rx="1.55" ry="1.3" fill="#72806d" opacity=".14" /><path d={`M${dx - 1.1} ${dy + 0.6}q1.1 .9 2.2 0`} stroke="#fff" strokeOpacity=".45" strokeWidth=".55" /></g>
                    }))}
                  </motion.g>
                  <circle r="23.5" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth=".5" />
                </motion.g>
              </motion.g>
            </motion.g>
            {/* Pole sits inside the cup; the ball clears its left edge by 0.8 SVG units. */}
            <g className="putting-flagstick">
              <rect x="559.2" y="107" width="1.6" height="151" rx=".8" fill={`url(#${id}-pole)`} />
              <circle cx="560" cy="107" r="1.25" fill="#e4e8dc" />
              <g className="putting-flag-fabric">
                <path d="M561 110C571 108 577 115 586 115L603 121C587 123 577 134 561 135Z" fill={`url(#${id}-flag)`} />
                <path d="M562 111C572 110 578 117 588 117" fill="none" stroke="#f1f9cf" strokeOpacity=".4" strokeWidth=".6" />
                <path d="M571 112Q577 123 571 132" fill="none" stroke="#718d49" strokeOpacity=".18" strokeWidth=".7" />
                <path d="M561 110V135" stroke="#f1f9cf" strokeOpacity=".6" strokeWidth=".7" />
              </g>
            </g>
            {/* Foreground cup edge remains above the dropping ball. */}
            <path d="M527 250a33 15 0 0 0 66 0" fill="none" stroke="#69855c" strokeOpacity=".65" strokeWidth="1.4" />
          </svg>
        </div>
        <div className="putting-caption"><span>{reduced ? 'A moment of precision' : 'Scroll to follow the putt'}</span><motion.span style={{ opacity: reduced ? 1 : success }}>In the cup.</motion.span></div>
      </div>
    </div>
  </section>
}
