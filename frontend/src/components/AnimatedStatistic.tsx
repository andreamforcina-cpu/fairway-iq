import { useEffect, useRef } from 'react'

/** Animate a visual copy only; assistive technology always receives the exact value. */
export function AnimatedStatistic({ value, suffix = '' }: { value: number; suffix?: string }) {
  const visual = useRef<HTMLSpanElement>(null)
  const previous = useRef(value)
  const hasEntered = useRef(false)

  useEffect(() => {
    const element = visual.current
    if (!element) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let observer: IntersectionObserver | undefined
    const finish = () => {
      cancelAnimationFrame(frame)
      element.textContent = `${value}${suffix}`
      previous.current = value
    }
    const animate = () => {
      hasEntered.current = true
      if (reduced.matches) { finish(); return }
      const from = previous.current
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 850, 1)
        const current = Math.round(from + (value - from) * (1 - (1 - progress) ** 3))
        element.textContent = `${current}${suffix}`
        if (progress < 1) frame = requestAnimationFrame(tick)
        else previous.current = value
      }
      frame = requestAnimationFrame(tick)
    }
    if (reduced.matches || !('IntersectionObserver' in window)) finish()
    else if (hasEntered.current) animate()
    else {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          previous.current = 0
          animate()
          observer?.disconnect()
        }
      }, { threshold: 0.5 })
      observer.observe(element)
    }
    const onPreferenceChange = () => { if (reduced.matches) { observer?.disconnect(); finish() } }
    reduced.addEventListener('change', onPreferenceChange)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      reduced.removeEventListener('change', onPreferenceChange)
    }
  }, [value, suffix])

  return <><span aria-hidden="true" ref={visual}>{value}{suffix}</span><span className="sr-only">{value}{suffix}</span></>
}
