import { useEffect } from 'react'
import type { RefObject } from 'react'

/** Progressive enhancement: content stays visible until a supported observer is ready. */
export function useHomepageMotion(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const page = root.current
    if (!page) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const header = page.querySelector<HTMLElement>('.site-header')
    const targets = page.querySelectorAll<HTMLElement>('.section-heading, .feature-card, .preview-copy, .how-section .steps li')
    let observer: IntersectionObserver | undefined
    let frame = 0
    let activeCard: HTMLElement | null = null

    const resetTilt = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      activeCard?.style.removeProperty('--tilt-x')
      activeCard?.style.removeProperty('--tilt-y')
      activeCard = null
    }
    const configure = () => {
      observer?.disconnect()
      targets.forEach(target => target.classList.remove('reveal-pending'))
      page.classList.toggle('motion-enabled', !reduced.matches)
      resetTilt()
      if (reduced.matches || !('IntersectionObserver' in window)) return
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const target = entry.target as HTMLElement
          target.classList.remove('reveal-pending')
          target.classList.add('reveal-entered')
          observer?.unobserve(target)
        })
      }, { threshold: 0.12 })
      targets.forEach(target => {
        if (target.classList.contains('reveal-entered')) return
        // Above-the-fold content is never concealed after the initial paint.
        if (target.getBoundingClientRect().top < window.innerHeight) return
        target.classList.add('reveal-pending')
        observer?.observe(target)
      })
    }
    const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 16)
    const onPointerMove = (event: PointerEvent) => {
      if (reduced.matches || !finePointer.matches || event.pointerType !== 'mouse') return
      const card = (event.target as Element).closest<HTMLElement>('.feature-card')
      if (!card) { resetTilt(); return }
      if (activeCard !== card) resetTilt()
      activeCard = card
      const bounds = card.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / bounds.width - 0.5
      const y = (event.clientY - bounds.top) / bounds.height - 0.5
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--tilt-x', `${-y * 3}deg`)
        card.style.setProperty('--tilt-y', `${x * 3}deg`)
        frame = 0
      })
    }
    configure()
    onScroll()
    reduced.addEventListener('change', configure)
    finePointer.addEventListener('change', resetTilt)
    window.addEventListener('scroll', onScroll, { passive: true })
    page.addEventListener('pointermove', onPointerMove, { passive: true })
    page.addEventListener('pointerleave', resetTilt)
    return () => {
      observer?.disconnect()
      resetTilt()
      reduced.removeEventListener('change', configure)
      finePointer.removeEventListener('change', resetTilt)
      window.removeEventListener('scroll', onScroll)
      page.removeEventListener('pointermove', onPointerMove)
      page.removeEventListener('pointerleave', resetTilt)
      page.classList.remove('motion-enabled')
      targets.forEach(target => target.classList.remove('reveal-pending'))
    }
  }, [root])
}

