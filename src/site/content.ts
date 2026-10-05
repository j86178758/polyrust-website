export const navItems = [
  ['About Us', 'about'], ['Technology', 'technology'], ['Strategies', 'strategies'],
  ['Partner Ecosystem', 'partners'], ['Transparency & Web3', 'transparency'], ['Inspirations', 'inspirations'],
] as const

export const socials = [
  { label: 'Telegram Official Channel', href: 'https://t.me/polyrust_official', icon: 'telegram' },
  { label: 'Telegram Support', href: 'https://t.me/Anna_Polyrust_Support', icon: 'telegram' },
  { label: 'Instagram', href: 'https://www.instagram.com/polyrust_net', icon: 'instagram' },
] as const

export const strategies = [
  { name: 'Sports Bot', text: 'An adaptive strategy designed to analyze sports prediction markets and respond to changing probabilities and market activity.', icon: '◉', tag: 'SPORTS / SIGNAL', kind: 'sports' },
  { name: 'Crypto Bot', text: 'A strategy focused on cryptocurrency prediction markets, analyzing price movements, volatility and short-term market signals.', icon: '⌁', tag: 'CRYPTO / SIGNAL', kind: 'crypto' },
  { name: 'Politics Bot', text: 'An adaptive strategy designed to analyze political prediction markets and evaluate changing probabilities in response to new information.', icon: '◎', tag: 'POLITICS / SIGNAL', kind: 'politics' },
  { name: 'World Events Bot', text: 'A strategy focused on global events and prediction markets, adapting to changing probabilities and emerging market signals.', icon: '✳', tag: 'WORLD / SIGNAL', kind: 'world' },
]

export const partners = [8, 6, 4, 2, .5, .5, .5, .5, .5, .5]

export const inspirations = [
  { name: 'Robin Hanson', role: 'Foundations of Prediction Markets', text: 'An economist and researcher known for his work on prediction markets and the idea of using markets to aggregate information and forecasts.', tag: 'PREDICTION MARKET THEORY', imagePosition: '0%' },
  { name: 'Primo Data', role: 'Analytics and Market Insights', text: 'An independent analytics project associated with Polymarket data, providing tools and insights for exploring prediction-market activity.', tag: 'MARKET ANALYTICS', imagePosition: '-100%' },
  { name: 'Shayne Coplan', role: 'Polymarket and the Vision', text: 'Founder of Polymarket, a platform that has helped bring prediction markets to a broader audience through blockchain technology.', tag: 'PREDICTION MARKET INNOVATION', imagePosition: '-200%' },
]
