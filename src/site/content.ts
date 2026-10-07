export const navItems = [
  ['About', 'about'], ['Technology', 'technology'], ['Markets', 'strategies'],
  ['Partners', 'partners'], ['Transparency', 'transparency'], ['Inspirations', 'inspirations'],
] as const

export const socials = [
  { label: 'Telegram', href: 'https://t.me/polyrust_official' },
  { label: 'Support', href: 'https://t.me/Anna_Polyrust_Support' },
  { label: 'Instagram', href: 'https://www.instagram.com/polyrust_net' },
] as const

export const strategies = [
  { name: 'Sports Bot', kind: 'sports', text: 'Responds to changing outcome probabilities and trading activity in sports prediction markets.', focus: 'Focus: probabilities and market activity' },
  { name: 'Crypto Bot', kind: 'crypto', text: 'Analyzes price movements, volatility and short-term signals in cryptocurrency prediction markets.', focus: 'Focus: momentum and volatility' },
  { name: 'Politics Bot', kind: 'politics', text: 'Evaluates how new information shifts probabilities in political prediction markets.', focus: 'Focus: information and probability shifts' },
  { name: 'World events Bot', kind: 'world', text: 'Tracks emerging market signals as global developments change expectations and probabilities.', focus: 'Focus: events and changing expectations' },
] as const

export const partners = [8, 6, 4, 2, .5, .5, .5, .5, .5, .5]

export const inspirations = [
  { name: 'Robin Hanson', role: 'Prediction market theory', text: 'An economist and researcher whose work explores how markets aggregate dispersed information into forecasts.' },
  { name: 'Primo Data', role: 'Market analytics', text: 'An independent analytics project providing tools and insights for exploring Polymarket activity.' },
  { name: 'Shayne Coplan', role: 'Polymarket founder', text: 'Founder of Polymarket, bringing blockchain-based prediction markets to a broader audience.' },
] as const
