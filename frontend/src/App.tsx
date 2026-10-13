import { useRef, useState } from 'react'
import { AnimatedStatistic } from './components/AnimatedStatistic'
import { useHomepageMotion } from './components/useHomepageMotion'
import { PuttingScene } from './components/PuttingScene'
import './App.css'

const rounds = {
  'Last round': { score: 82, fairways: 64, greens: 50, putting: 32, note: 'Approach shots are your biggest opportunity.', detail: 'Focus your next practice session on distance control from 100–150 yards.' },
  'Last 5 rounds': { score: 85, fairways: 58, greens: 44, putting: 34, note: 'Your consistency is heading in the right direction.', detail: 'Keep working on your tee-shot routine and short putts to build on that progress.' },
}

type RoundPeriod = keyof typeof rounds

function Brand() {
  return <a className="brand" href="#home" aria-label="Fairway IQ home"><span className="brand-mark" aria-hidden="true">⚑</span> FAIRWAY<span className="brand-iq">IQ</span></a>
}

function App() {
  const pageRef = useRef<HTMLDivElement>(null)
  useHomepageMotion(pageRef)
  const [period, setPeriod] = useState<RoundPeriod>('Last round')
  const [menuOpen, setMenuOpen] = useState(false)
  const round = rounds[period]

  return (
    <div className="homepage" id="home" ref={pageRef}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header container">
        <Brand />
        <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close menu' : 'Menu'}</button>
        <nav id="main-navigation" className={menuOpen ? 'navigation is-open' : 'navigation'} aria-label="Main navigation">
          <a href="#platform" onClick={() => setMenuOpen(false)}>The platform</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a className="button button-small" href="#preview" onClick={() => setMenuOpen(false)}>Explore the demo <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <main id="main">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> AI-POWERED GOLF ANALYTICS</p>
            <h1 id="hero-title"><span className="hero-line">Know your game.</span><br /><span className="hero-line">Find your <em>edge.</em></span></h1>
            <p className="hero-description">Turn your rounds into a clearer picture of your game. Discover where you’re gaining strokes, where you’re losing them, and what to work on next.</p>
            <div className="hero-actions"><a className="button" href="#preview">Explore your potential <span aria-hidden="true">↗</span></a><a className="text-link" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a></div>
            <div className="hero-caption"><span className="caption-line" /> BETTER INSIGHTS. MORE INTENTIONAL GOLF.</div>
          </div>
          <div className="course-art" role="img" aria-label="Illustrated overhead view of a golf fairway with a green and flag">
            <div className="course-grid" /><div className="fairway fairway-back" /><div className="fairway fairway-front" /><div className="bunker bunker-one" /><div className="bunker bunker-two" /><div className="green"><div className="flagstick"><span /></div><div className="hole" /></div>
            <div className="course-label">A SMARTER WAY<br />TO PLAY THE GAME.</div><div className="yardage"><span className="status-dot" /> YOUR NEXT SHOT, WITH CLARITY</div>
            <div className="shot-path" /><span className="golf-ball" />
          </div>
        </section>

        <PuttingScene />

        <section className="platform-section" id="platform" aria-labelledby="platform-title">
          <div className="container"><div className="section-heading"><div><p className="eyebrow">THE BIG PICTURE</p><h2 id="platform-title">Less guesswork.<br />More game.</h2></div><p>Every round tells a story. FAIRWAY IQ helps you connect the dots and make your next practice count.</p></div>
            <div className="feature-grid">
              {[{ number: '01', title: 'Understand your rounds', text: 'See your scoring, fairways, greens, and putting together in one clear view.', icon: '↗' }, { number: '02', title: 'Spot the patterns', text: 'Look beyond a single score to understand the strengths and gaps in your game.', icon: '◎' }, { number: '03', title: 'Practice with purpose', text: 'Turn performance insights into a focused plan for your next session.', icon: '⚑' }].map(feature => <article className="feature-card" key={feature.number}><div className="feature-top"><span>{feature.number}</span><span className="feature-icon" aria-hidden="true">{feature.icon}</span></div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="preview-section container" id="preview" aria-labelledby="preview-title">
          <div className="preview-copy"><p className="eyebrow">FROM DATA TO DIRECTION</p><h2 id="preview-title">A little insight.<br />A better next round.</h2><p>Get a feel for what a clearer view of your performance can look like. Switch between sample rounds to explore the insights.</p><span className="demo-label">Interactive preview · Sample data</span></div>
          <div className="dashboard-card"><div className="dashboard-header"><div><p className="eyebrow">PERFORMANCE OVERVIEW</p><h3>Your game at a glance</h3></div><label className="period-label"><span className="sr-only">Round period</span><select value={period} onChange={event => setPeriod(event.target.value as RoundPeriod)}>{Object.keys(rounds).map(key => <option key={key}>{key}</option>)}</select></label></div>
            <div className="round-metrics" aria-live="polite"><div className="score"><span>Average score</span><strong><AnimatedStatistic value={round.score} /></strong><small>Sample par 72 course</small></div><div className="metric-bars">{[{ label: 'Fairways hit', value: round.fairways }, { label: 'Greens in regulation', value: round.greens }].map(metric => <div className="metric" key={metric.label}><div><span>{metric.label}</span><strong><AnimatedStatistic value={metric.value} suffix="%" /></strong></div><div className="bar-track"><div style={{ transform: `scaleX(${metric.value / 100})` }} /></div></div>)}<div className="putting"><span>Putts per round</span><strong><AnimatedStatistic value={round.putting} /></strong></div></div></div>
            <div className="insight" aria-live="polite"><span className="insight-icon" aria-hidden="true">✦</span><div><span className="eyebrow">YOUR PRACTICE FOCUS</span><h4>{round.note}</h4><p>{round.detail}</p></div></div>
          </div>
        </section>

        <section className="how-section container" id="how-it-works" aria-labelledby="how-title"><div className="section-heading"><div><p className="eyebrow">A SIMPLE ROUTINE</p><h2 id="how-title">Play. Reflect. Improve.</h2></div><p>A thoughtful approach to getting more out of the game you love.</p></div><ol className="steps"><li><span>01</span><h3>Start with your round</h3><p>Your on-course performance is the starting point.</p></li><li><span>02</span><h3>Find what matters</h3><p>Review the numbers that reveal where to focus.</p></li><li><span>03</span><h3>Take it to the range</h3><p>Bring a clearer purpose to your next practice.</p></li></ol></section>
      </main>
      <footer className="site-footer container"><Brand /><p>AI-Powered Golf Analytics Platform</p><span className="online-badge"><span className="status-dot" /> Frontend Online</span></footer>
    </div>
  )
}

export default App
