import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { projectIcon, projectName } from '../site/content'
import './internal-app.css'

type SectionId = 'dashboard' | 'bots' | 'withdraw' | 'partners' | 'transactions'
type IconName = SectionId | 'copy' | 'search' | 'menu' | 'close' | 'wallet' | 'arrow'

const sections: { id: SectionId; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'bots', label: 'Trading Bots', icon: 'bots' },
  { id: 'withdraw', label: 'Withdraw', icon: 'withdraw' },
  { id: 'partners', label: 'Partner Ecosystem', icon: 'partners' },
  { id: 'transactions', label: 'Transactions', icon: 'transactions' },
]

const bots = [
  { id: 'sports', name: 'Sports Bot', image: '/sports-strategy.jpeg', min: 25, max: 1_000, days: 30, dailyRate: 1, roi: 30, tone: 'rose' },
  { id: 'crypto', name: 'Crypto Bot', image: '/crypto-strategy.jpeg', min: 1_000, max: 5_000, days: 60, dailyRate: 1.5, roi: 90, tone: 'violet' },
  { id: 'politics', name: 'Politics Bot', image: '/politics-strategy.jpeg', min: 5_000, max: 25_000, days: 90, dailyRate: 2, roi: 180, tone: 'pink' },
  { id: 'world', name: 'World Events Bot', image: '/world-events-strategy.jpeg', min: 25_000, max: 100_000, days: 120, dailyRate: 3, roi: 360, tone: 'red' },
] as const

const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const formatUsdt = (value: number) => `${money.format(value)} USDT`

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    bots: <><path d="M12 3v3m-5 0h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z" /><path d="M8 11h.01M16 11h.01M9 15h6" /></>,
    withdraw: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
    partners: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1H3Zm13-9a3 3 0 1 0 0-6m1 9a5 5 0 0 1 4 5v1h-3" /></>,
    transactions: <><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 13h7M8 17h7" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 9h17m-4 5h2" /><path d="M6 5V4a2 2 0 0 1 2-2h10" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  }
  return <svg className="ia-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function PageTitle({ eyebrow, title, description, index }: { eyebrow: string; title: string; description: string; index: string }) {
  return <div className="ia-page-title"><div><span className="ia-eyebrow">{index} / {eyebrow}</span><h1>{title}</h1><p>{description}</p></div><span className="ia-demo-tag"><i /> DEMO DATA</span></div>
}

function MetricCard({ label, value, detail, icon, tone = 'rose' }: { label: string; value: string; detail: string; icon: IconName; tone?: string }) {
  return <article className={`ia-metric ia-tone-${tone}`}><div className="ia-metric-top"><span>{label}</span><span className="ia-icon-box"><Icon name={icon} /></span></div><strong>{value}</strong><small>{detail}</small></article>
}

function EmptyState({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return <div className="ia-empty"><span className="ia-empty-icon"><Icon name={icon} /></span><h3>{title}</h3><p>{description}</p></div>
}

function Dashboard() {
  return <>
    <PageTitle index="01" eyebrow="ACCOUNT OVERVIEW" title="Dashboard" description="Your account at a glance. All figures shown are demo values." />
    <div className="ia-metrics-grid">
      <MetricCard label="Total invested" value="0 USDT" detail="Across all bots" icon="wallet" />
      <MetricCard label="Total withdrawn" value="0 USDT" detail="Completed withdrawals" icon="withdraw" tone="plum" />
      <MetricCard label="Active investments" value="0" detail="No active bot positions" icon="bots" tone="wine" />
      <MetricCard label="Available profit" value="0 USDT" detail="Ready for withdrawal" icon="arrow" tone="pink" />
      <MetricCard label="Referral rewards" value="0 USDT" detail="Partner balance" icon="partners" tone="rose" />
    </div>
    <section className="ia-panel ia-active-panel"><div className="ia-panel-heading"><div><span className="ia-eyebrow">PORTFOLIO</span><h2>Active bots</h2></div><span className="ia-count-chip">0 ACTIVE</span></div><EmptyState icon="bots" title="No active bots yet" description="When you activate a bot, its current position and progress will appear here." /></section>
  </>
}

function TradingBots() {
  const [selectedId, setSelectedId] = useState<(typeof bots)[number]['id']>('sports')
  const [amountInput, setAmountInput] = useState('')
  const selected = bots.find(bot => bot.id === selectedId) ?? bots[0]
  const amount = Number(amountInput)
  const validAmount = Number.isFinite(amount) && amount >= selected.min && amount <= selected.max
  const daily = validAmount ? amount * selected.dailyRate / 100 : 0
  const profit = validAmount ? amount * selected.roi / 100 : 0
  const total = validAmount ? amount + profit : 0

  return <>
    <PageTitle index="02" eyebrow="AUTOMATED STRATEGIES" title="Trading Bots" description="Choose a market strategy and review its investment conditions." />
    <div className="ia-chain-note"><span className="ia-chain-dot" /><span>USDT</span><b>·</b><span>BNB Smart Chain</span><b>·</b><span>BEP-20</span></div>
    <div className="ia-bots-layout">
      <div className="ia-bot-picker" role="group" aria-label="Select a trading bot">
        {bots.map((bot, index) => <button key={bot.id} type="button" className={`ia-bot-option ia-tone-${bot.tone}${selected.id === bot.id ? ' is-selected' : ''}`} aria-pressed={selected.id === bot.id} onClick={() => { setSelectedId(bot.id); setAmountInput('') }}>
          <span className="ia-bot-art"><img src={bot.image} alt="" /><span className="ia-bot-index">0{index + 1}</span><span className="ia-selected-indicator" /></span>
          <span className="ia-bot-label"><strong>{bot.name}</strong><small>{bot.days} days <i>·</i> {bot.dailyRate}% daily</small></span>
        </button>)}
      </div>
      <section className="ia-panel ia-bot-config"><div className="ia-panel-heading"><div><span className="ia-eyebrow">SELECTED STRATEGY</span><h2>{selected.name}</h2></div><span className="ia-risk-chip">{selected.days} DAYS</span></div>
        <div className="ia-conditions-grid">
          <div><span>Investment range</span><strong>{money.format(selected.min)}–{money.format(selected.max)} USDT</strong></div>
          <div><span>Duration</span><strong>{selected.days} days</strong></div>
          <div><span>Daily rate</span><strong>{selected.dailyRate}%</strong></div>
          <div><span>Total ROI</span><strong>{selected.roi}%</strong></div>
        </div>
        <label className="ia-field-label" htmlFor="investment-amount">Investment amount <span>USDT</span></label>
        <div className="ia-amount-field"><input id="investment-amount" type="number" inputMode="decimal" min={selected.min} max={selected.max} step="any" placeholder={`${money.format(selected.min)} – ${money.format(selected.max)}`} value={amountInput} onChange={event => setAmountInput(event.target.value)} /><span>USDT</span></div>
        {amountInput && !validAmount && <p className="ia-field-help ia-field-error">Enter an amount from {money.format(selected.min)} to {money.format(selected.max)} USDT.</p>}
        <div className="ia-projection"><div className="ia-projection-heading"><span>Projected return</span><small>Simple daily calculation · no compounding</small></div><div className="ia-projection-values"><div><span>Daily profit</span><strong>{formatUsdt(daily)}</strong></div><div><span>Profit over {selected.days} days</span><strong>{formatUsdt(profit)}</strong></div><div className="ia-projection-total"><span>Principal + profit</span><strong>{formatUsdt(total)}</strong></div></div></div>
        <button className="ia-primary-button" type="button" disabled><span>Activate Bot</span><Icon name="arrow" /></button>
        <p className="ia-placeholder-note">Activation is a visual placeholder in this prototype.</p>
      </section>
    </div>
  </>
}

function Withdraw() {
  const [amount, setAmount] = useState('')
  return <>
    <PageTitle index="03" eyebrow="BALANCE MANAGEMENT" title="Withdraw" description="Review your available balances and withdrawal details." />
    <div className="ia-balance-grid">
      <MetricCard label="Available profit" value="0 USDT" detail="Trading bot balance" icon="arrow" />
      <MetricCard label="Referral rewards" value="0 USDT" detail="Partner balance" icon="partners" tone="plum" />
      <MetricCard label="Total available" value="0 USDT" detail="USDT · BEP-20" icon="wallet" tone="pink" />
    </div>
    <section className="ia-panel ia-withdraw-panel"><div className="ia-panel-heading"><div><span className="ia-eyebrow">PAYOUT</span><h2>Withdrawal amount</h2></div><span className="ia-chain-pill">BNB SMART CHAIN</span></div>
      <label className="ia-field-label" htmlFor="withdraw-amount">Amount <span>USDT</span></label><div className="ia-amount-field"><input id="withdraw-amount" type="number" inputMode="decimal" min="0" step="any" placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)} /><span>USDT</span></div>
      <div className="ia-withdraw-summary"><div><span>Network</span><strong>BNB Smart Chain (BEP-20)</strong></div><div><span>Available to withdraw</span><strong>0 USDT</strong></div><div><span>Requested amount</span><strong>{amount && Number(amount) > 0 ? formatUsdt(Number(amount)) : '0 USDT'}</strong></div></div>
      <button className="ia-primary-button" type="button" disabled>Request withdrawal <Icon name="arrow" /></button><p className="ia-placeholder-note">Withdrawal actions are not connected in this prototype.</p>
    </section>
    <section className="ia-panel ia-history-panel"><div className="ia-panel-heading"><div><span className="ia-eyebrow">ACTIVITY</span><h2>Recent withdrawals</h2></div></div><EmptyState icon="transactions" title="No withdrawals yet" description="Completed withdrawals will be listed here." /></section>
  </>
}

function PartnerEcosystem() {
  const [copied, setCopied] = useState(false)
  const [levelFilter, setLevelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const referralLink = 'https://polyrust.net/?ref=DEMO'

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(referralLink); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }
    catch { setCopied(false) }
  }

  return <>
    <PageTitle index="04" eyebrow="NETWORK & REWARDS" title="Partner Ecosystem" description="Review your referral network and the ten-level program structure." />
    <section className="ia-panel ia-referral-link"><div><span className="ia-eyebrow">YOUR DEMO REFERRAL LINK</span><strong>{referralLink}</strong><small>Preview only · referral tracking is not connected</small></div><button className="ia-secondary-button" type="button" onClick={copyLink}><Icon name="copy" />{copied ? 'Copied' : 'Copy link'}</button></section>
    <div className="ia-partner-metrics">
      <MetricCard label="Direct partners" value="0" detail="Level 1" icon="partners" />
      <MetricCard label="Network partners" value="0" detail="Across 10 levels" icon="dashboard" tone="plum" />
      <MetricCard label="Team investment volume" value="0 USDT" detail="Demo value" icon="wallet" tone="wine" />
      <MetricCard label="Referral rewards" value="0 USDT" detail="Available balance" icon="arrow" tone="pink" />
    </div>
    <section className="ia-panel ia-levels-panel"><div className="ia-panel-heading"><div><span className="ia-eyebrow">PROGRAM STRUCTURE</span><h2>10 referral levels</h2></div><span className="ia-count-chip">RATES PENDING</span></div><p className="ia-panel-intro">Commission rates will be shown when the final program terms are approved.</p><div className="ia-level-list">{Array.from({ length: 10 }, (_, i) => <div className="ia-level-row" key={i}><span className="ia-level-num">{String(i + 1).padStart(2, '0')}</span><strong>Level {i + 1}</strong><span className="ia-level-track"><i /></span><span className="ia-pending-rate">Rate pending</span></div>)}</div></section>
    <section className="ia-panel ia-partner-list"><div className="ia-panel-heading"><div><span className="ia-eyebrow">YOUR NETWORK</span><h2>Partner list</h2></div><span className="ia-count-chip">0 PARTNERS</span></div>
      <div className="ia-filters"><label className="ia-filter-control"><span>Level</span><select value={levelFilter} onChange={event => setLevelFilter(event.target.value)}><option value="all">All levels</option>{Array.from({ length: 10 }, (_, i) => <option value={String(i + 1)} key={i}>Level {i + 1}</option>)}</select></label><label className="ia-filter-control"><span>Status</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option></select></label><label className="ia-filter-control ia-filter-search"><span>Search wallet</span><div className="ia-search-input"><Icon name="search" /><input placeholder="Search address…" value={search} onChange={event => setSearch(event.target.value)} /></div></label></div>
      <div className="ia-table-scroll"><table className="ia-table"><thead><tr><th>Partner wallet</th><th>Level</th><th>Status</th><th>Team investment</th><th>Rewards</th></tr></thead><tbody><tr><td colSpan={5} className="ia-table-empty"><EmptyState icon="partners" title="No partners yet" description="Your partner list will appear here when referrals join." /></td></tr></tbody></table></div>
      <span className="ia-filter-state" aria-live="polite">Filters ready{search ? ` · searching “${search}”` : ''}{levelFilter !== 'all' ? ` · Level ${levelFilter}` : ''}{statusFilter !== 'all' ? ` · ${statusFilter}` : ''}</span>
    </section>
  </>
}

function Transactions() {
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')
  return <>
    <PageTitle index="05" eyebrow="ACCOUNT ACTIVITY" title="Transactions" description="Review deposits, bot activations, withdrawals and referral rewards." />
    <div className="ia-transaction-summary"><MetricCard label="Total deposited" value="0 USDT" detail="Deposits and activations" icon="wallet" /><MetricCard label="Total withdrawn" value="0 USDT" detail="Profit withdrawals" icon="withdraw" tone="plum" /><MetricCard label="Referral rewards" value="0 USDT" detail="Partner rewards" icon="partners" tone="pink" /></div>
    <section className="ia-panel ia-transactions-panel"><div className="ia-panel-heading"><div><span className="ia-eyebrow">LEDGER</span><h2>Transaction history</h2></div><span className="ia-count-chip">0 RECORDS</span></div>
      <div className="ia-filters ia-transaction-filters"><label className="ia-filter-control ia-filter-search"><span>Search</span><div className="ia-search-input"><Icon name="search" /><input placeholder="Search category or transaction hash…" value={search} onChange={event => setSearch(event.target.value)} /></div></label><label className="ia-filter-control"><span>Transaction type</span><select value={type} onChange={event => setType(event.target.value)}><option value="all">All types</option><option value="deposit">Deposits</option><option value="activation">Bot activations</option><option value="withdrawal">Withdrawals</option><option value="reward">Referral rewards</option></select></label></div>
      <div className="ia-table-scroll"><table className="ia-table ia-transactions-table"><thead><tr><th>Date &amp; time</th><th>Type</th><th>Bot / category</th><th>Amount</th><th>Status</th><th>Transaction hash</th></tr></thead><tbody><tr><td colSpan={6} className="ia-table-empty"><EmptyState icon="transactions" title="No transactions yet" description="Transactions will appear here after activity is recorded." /></td></tr></tbody></table></div>
      <span className="ia-filter-state" aria-live="polite">Filters ready{type !== 'all' ? ` · ${type}` : ''}{search ? ` · searching “${search}”` : ''}</span>
    </section>
  </>
}

export default function InternalApp() {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  useEffect(() => { document.title = `${projectName} | Internal Application` }, [])
  const active = useMemo(() => sections.find(section => section.id === activeSection) ?? sections[0], [activeSection])
  const content: Record<SectionId, ReactNode> = {
    dashboard: <Dashboard />,
    bots: <TradingBots />,
    withdraw: <Withdraw />,
    partners: <PartnerEcosystem />,
    transactions: <Transactions />,
  }

  return <div className="internal-app">
    {mobileNavOpen && <button className="ia-nav-scrim" type="button" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />}
    <aside className={`ia-sidebar${mobileNavOpen ? ' is-open' : ''}`}>
      <a className="ia-brand" href="/" aria-label={`${projectName} public site`}><span className="ia-brand-icon" aria-hidden="true">{projectIcon}</span><span><strong>{projectName}</strong><small>WEB3 APPLICATION</small></span></a>
      <div className="ia-sidebar-caption">WORKSPACE</div>
      <nav className="ia-side-nav" aria-label="Application navigation">{sections.map((section, index) => <button key={section.id} type="button" className={`ia-nav-item${section.id === activeSection ? ' is-active' : ''}`} aria-current={section.id === activeSection ? 'page' : undefined} onClick={() => { setActiveSection(section.id); setMobileNavOpen(false) }}><span className="ia-nav-icon"><Icon name={section.icon} /></span><span>{section.label}</span><small>0{index + 1}</small></button>)}</nav>
      <div className="ia-sidebar-bottom"><span className="ia-status-dot" /> <span>Prototype mode</span><span className="ia-version">V 0.1</span></div>
    </aside>
    <div className="ia-main-column">
      <header className="ia-topbar"><button className="ia-mobile-menu" type="button" aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(value => !value)}><Icon name={mobileNavOpen ? 'close' : 'menu'} /></button><div className="ia-breadcrumb"><span>POLYRUST / APP</span><b>/</b><strong>{active.label}</strong></div><div className="ia-wallet"><span className="ia-wallet-status"><i />DEMO</span><Icon name="wallet" /><code>0x0000…0000</code><button type="button" disabled>Disconnect</button></div></header>
      <main className="ia-page-content" key={activeSection}>{content[activeSection]}</main>
      <footer className="ia-app-footer"><span>POLYRUST · INTERNAL APPLICATION</span><span>VISUAL PROTOTYPE <i /> NO ON-CHAIN ACTIONS</span></footer>
    </div>
  </div>
}
