import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { GR, navItems, partners, projectIcon, projectName, socials, strategies } from './content'

const videos = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_083515_290e5a10-0b95-41af-a5e2-32b6389baa4d.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_092455_089c54f8-3b03-4966-9df1-e9746063d0ef.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_095810_ecea3dd2-fc5e-4e41-8696-4219290b6589.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_095750_32a52ce0-2005-45c9-9093-41f03fde9530.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_080203_fd7f4f85-3a86-4837-8192-85e7bfe68e75.mp4',
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

function Mark() {
  return <span className="brand-mark" aria-hidden="true">{projectIcon}</span>
}

function Logo() {
  return <a className="logo" href="#top" aria-label={`${projectName} home`}><Mark /><span>{projectName}</span></a>
}

function Scramble({ text, delay = 0 }: { text: string; delay?: number }) {
  const [display, setDisplay] = useState(text)
  const [hovered, setHovered] = useState(false)
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect() }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!visible || reduced) { setDisplay(text); return }
    let interval: ReturnType<typeof setInterval> | undefined
    const timeout = setTimeout(() => {
      let cursor = 0
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      interval = setInterval(() => {
        cursor += hovered ? .25 : .5
        setDisplay(text.split('').map((char, index) => char === ' ' || index < cursor ? char : chars[Math.floor(Math.random() * chars.length)]).join(''))
        if (cursor >= text.length) clearInterval(interval)
      }, 25)
    }, hovered ? 0 : delay)
    return () => { clearTimeout(timeout); clearInterval(interval); setDisplay(text) }
  }, [visible, hovered, reduced, text, delay])
  return <span ref={ref} className="scramble" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}><span className="sr-only">{text}</span><span aria-hidden="true">{display}</span></span>
}

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { element.classList.add('revealed'); observer.disconnect() }
    }, { threshold: .12 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>
}

// Load media near the viewport; pause offscreen clips and honor motion preferences.
function VideoBackground({ index, scrub = false, paused }: { index: number; scrub?: boolean; paused: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [near, setNear] = useState(index === 0)
  const [failed, setFailed] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => {
    const video = ref.current
    if (!video) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setNear(true)
    }, { rootMargin: '200px' })
    observer.observe(video)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const video = ref.current
    if (!video || !near || failed) return
    let inView = false
    const update = () => {
      if (inView && !document.hidden && !scrub && !paused && !reduced) void video.play().catch(() => {})
      else video.pause()
    }
    const observer = new IntersectionObserver(entries => { inView = entries.some(entry => entry.isIntersecting); update() }, { threshold: .05 })
    observer.observe(video)
    video.addEventListener('loadeddata', update)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); video.pause(); video.removeEventListener('loadeddata', update); document.removeEventListener('visibilitychange', update) }
  }, [near, failed, scrub, paused, reduced])
  useEffect(() => {
    const video = ref.current
    const section = video?.parentElement
    if (!video || !section || !scrub || paused || reduced || failed) return
    let lastX: number | null = null
    let target = 0
    const seek = () => {
      if (!video.seeking && Number.isFinite(video.duration) && video.duration > 0 && video.readyState >= 2 && Math.abs(video.currentTime - target) > .04) video.currentTime = target
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      if (lastX !== null && Number.isFinite(video.duration)) {
        target = Math.max(0, Math.min(video.duration - .05, target + (event.clientX - lastX) / window.innerWidth * video.duration * .8))
        seek()
      }
      lastX = event.clientX
    }
    const leave = () => { lastX = null }
    video.addEventListener('seeked', seek)
    section.addEventListener('pointermove', move)
    section.addEventListener('pointerleave', leave)
    return () => { video.removeEventListener('seeked', seek); section.removeEventListener('pointermove', move); section.removeEventListener('pointerleave', leave) }
  }, [scrub, paused, reduced, failed])
  return <><video ref={ref} className={`scene-video${failed ? ' media-failed' : ''}`} src={near && !reduced && !failed ? videos[index] : undefined} muted loop playsInline preload={index === 0 ? 'auto' : 'metadata'} aria-hidden="true" tabIndex={-1} onError={() => setFailed(true)} /><div className="scene-overlay" aria-hidden="true" /></>
}

function Header() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); ref.current?.querySelector<HTMLButtonElement>('.menu-toggle')?.focus() } }
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside) }
  }, [open])
  return <header ref={ref} className="site-header"><div className="header-left"><button type="button" className={`menu-toggle${open ? ' is-open' : ''}`} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}><span /><span /><span /></button><Logo /><nav id="navigation" className={`main-nav${open ? ' is-open' : ''}`} aria-label="Main navigation" inert={!open}>{navItems.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}><Scramble text={label} /></a>)}</nav></div><a className="header-action" href="#technology">Connect wallet</a></header>
}

function Hero({ paused }: { paused: boolean }) {
  return <section className="scene hero" id="top"><VideoBackground index={0} scrub paused={paused} /><div className="dot-grid" aria-hidden="true" /><div className="hero-watermark" aria-hidden="true">{projectName}</div><div className="scene-content hero-content"><div className="hero-bottom"><div className="hero-copy"><h1><Scramble text="Market" delay={800} /><br /><Scramble text="Intelligence" delay={1000} /></h1><p>Real-time market analysis, adaptive trading strategies and Web3 infrastructure. One platform for a world of changing probabilities.</p><div className="hero-actions"><a className="button button-primary" href="#technology">Meet {GR}</a><a className="button button-ghost" href="#strategies">Explore markets</a></div></div><div className="hero-right"><h2><Scramble text="One engine." delay={1200} /><br /><Scramble text="Every signal." delay={1400} /></h2></div></div></div></section>
}

function About({ paused }: { paused: boolean }) {
  return <section className="scene about-section" id="about"><VideoBackground index={1} paused={paused} /><div className="scene-content about-content"><Reveal><p className="cinematic-copy">Markets turn information into probabilities.<br /><span>{projectName} turns market signals into a structured trading process.</span></p><div className="about-details"><p>Built on Web3 infrastructure and integrated with Polymarket, the platform brings market analysis and automated execution together.</p><p>Its trading engine evaluates liquidity, momentum and volatility across sports, crypto, politics and world events.</p><p>Wallet-based interaction replaces traditional registration. Key operational processes follow predefined smart contract logic.</p></div></Reveal></div></section>
}

function Capabilities({ paused }: { paused: boolean }) {
  const items = [['04', 'Distinct markets', 'Sports, crypto, politics and world events.'], ['One', 'Adaptive engine', `${GR} connects analysis, strategy and execution.`], ['Web3', 'Wallet-based access', 'Interaction through a crypto wallet, without a traditional account.']]
  return <section className="scene capabilities-section" aria-label="Platform at a glance"><VideoBackground index={2} paused={paused} /><div className="scene-content capabilities-content"><Reveal><div className="capability-grid">{items.map(([value, title, text]) => <article key={title}><div className="capability-value">{value}</div><h3>{title}</h3><p>{text}</p></article>)}</div></Reveal></div></section>
}

function Technology({ paused }: { paused: boolean }) {
  const items = [['Rust architecture', 'Built for efficient resource use and high-performance market processing.'], ['Real-time analysis', 'Evaluates liquidity, trading flows, momentum and volatility as conditions change.'], ['Adaptive execution', 'Adjusts trade direction, position size and frequency to current market signals.'], ['Risk controls', 'Filters signals, manages exposure and responds to unfavorable market conditions.']]
  return <section className="scene technology-section" id="technology"><VideoBackground index={3} paused={paused} /><div className="scene-content technology-content"><Reveal className="technology-top"><div><h2>Adaptive<br />by design.</h2></div><p>A trading engine built with Rust and oriented toward high-frequency trading. It analyzes Polymarket data and adapts decisions to changing conditions.</p></Reveal><Reveal className="technology-bottom"><div className="engine-flow" aria-label="Engine workflow">{['Market data', 'Signal analysis', 'Risk evaluation', 'Execution'].map(x => <div key={x}><h3>{x}</h3></div>)}</div><div className="technology-features">{items.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></Reveal></div></section>
}

const strategyArtwork: Record<(typeof strategies)[number]['kind'], string> = {
  sports: '/sports-strategy.png',
  crypto: '/crypto-strategy.png',
  politics: '/politics-strategy.png',
  world: '/world-events-strategy.png',
}

function Strategies() {
  return <section className="editorial-section" id="strategies"><Reveal className="section-header"><div><h2>Not every market<br />moves the same.</h2></div><p>Four purpose-built approaches. Each responds to the information, probabilities and activity of its own market.</p></Reveal><div className="strategy-grid">{strategies.map(strategy => <Reveal key={strategy.kind}><article className="strategy-card strategy-card-illustrated"><div className="strategy-visual" aria-hidden="true"><img src={strategyArtwork[strategy.kind]} alt="" /></div><div className="strategy-info"><h3>{strategy.name}</h3><p>{strategy.text}</p></div></article></Reveal>)}</div></section>
}

function Partners() {
  return <section className="editorial-section partners-section" id="partners"><div className="partners-layout"><Reveal className="partner-copy"><h2>Built to grow.<br />Together.</h2><p>A five-level referral program with all levels available from the start.</p><p>Rewards are calculated from the investment of a partner at the corresponding level. They are funded by a dedicated partner balance, replenished from a portion of trading bot profits.</p><p className="partner-note">Referral percentages describe the program structure, not investment returns.</p></Reveal><Reveal><div className="levels-card"><div className="levels-heading"><h3>Referral structure</h3><span>5 levels</span></div>{partners.map((reward, i) => <div className="level-row" key={i}><span className="level-num">{String(i + 1).padStart(2, '0')}</span><span className="level-name">Level {i + 1}</span><span className="level-track" aria-hidden="true"><i style={{ width: `${reward / 6 * 100}%` }} /></span><span className="level-reward">{reward}%</span></div>)}</div></Reveal></div></section>
}

function VerificationVisual() {
  const nodes = [[110, 115], [300, 55], [490, 115], [490, 325], [300, 385], [110, 325]]
  return <div className="verification-visual" aria-hidden="true">
    <svg viewBox="0 0 600 440" focusable="false">
      <g className="verification-orbits">
        <circle cx="300" cy="220" r="105" />
        <circle cx="300" cy="220" r="155" />
        <ellipse cx="300" cy="220" rx="240" ry="195" />
      </g>
      <path className="verification-perimeter" d="M110 115 300 55 490 115 490 325 300 385 110 325Z" />
      {nodes.map(([x, y], i) => <g key={i}>
        <path className="verification-link" d={`M300 220 L${x} ${y}`} />
        <path className="verification-signal" pathLength="100" d={`M${x} ${y} L300 220`} style={{ animationDelay: `${i * -.8}s` }} />
        <circle className="verification-node-halo" cx={x} cy={y} r="15" style={{ animationDelay: `${i * -.8}s` }} />
        <circle className="verification-node" cx={x} cy={y} r="5" />
      </g>)}
      <circle className="verification-core-ring" cx="300" cy="220" r="55" />
    </svg>
    <div className="verification-core"><Mark /></div>
  </div>
}

function Transparency() {
  return <section className="editorial-section" id="transparency"><div className="transparency-layout"><Reveal className="transparency-copy"><h2>Transparency & Web3</h2><p>{projectName} is built on Web3 principles, featuring direct interaction via crypto wallets and logic defined by smart contracts.</p><p>Key operational parameters are embedded in the code and can be verified directly on the blockchain. Users can independently check the contract address, its code, and the transaction history.</p><p className="transparency-note">Transparency begins with the ability to verify the system independently.</p></Reveal><Reveal><VerificationVisual /></Reveal></div></section>
}

function Footer({ paused }: { paused: boolean }) {
  return <footer className="footer"><div className="scene footer-visual"><VideoBackground index={4} paused={paused} /></div><div className="footer-content"><div className="footer-lockup"><div className="footer-brand"><Logo /><p className="footer-description">Algorithmic intelligence for prediction markets.</p><div className="social-links">{socials.map(social => <a href={social.href} key={social.href} target="_blank" rel="noopener noreferrer">{social.label}</a>)}</div></div></div><div className="footer-bottom">© 2026 {projectName}</div></div></footer>
}

export default function App() {
  const paused = false
  useEffect(() => { document.title = `${projectName} — Algorithmic Intelligence for Prediction Markets` }, [])
  return <><a className="skip-link" href="#about">Skip introduction</a><Header /><main><Hero paused={paused} /><About paused={paused} /><Capabilities paused={paused} /><Technology paused={paused} /><Strategies /><Partners /><Transparency /></main><Footer paused={paused} /></>
}
