import { defineChain, getAddress, isAddress } from 'viem'
import type { Address } from 'viem'
import catalog from '../config/networks.json'

export type Environment = 'testnet' | 'mainnet'
export type Network = typeof catalog.networks[number]
export type Token = Network['tokens'][number]
export { catalog }

export function getNetwork(key: string): Network {
  const network = catalog.networks.find(network => network.key === key)
  if (!network) throw new Error(`Unknown CCIP network: ${key}`)
  return network
}
export function getHubNetwork(environment: Environment) { return getNetwork(catalog.hubs[environment]) }
export function getToken(network: Network, symbol = 'USDC'): Token {
  const token = network.tokens.find(token => token.symbol === symbol)
  if (!token) throw new Error(`${symbol} is not configured on ${network.name}`)
  return token
}
export function address(value: string): Address {
  if (!isAddress(value, { strict: false }) || /^0x0{40}$/i.test(value)) throw new Error(`Invalid or zero address: ${value}`)
  return getAddress(value.toLowerCase())
}
export function chain(network: Network, rpcUrl: string) {
  return defineChain({
    id: network.chainId, name: network.name,
    nativeCurrency: { name: network.nativeSymbol, symbol: network.nativeSymbol, decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: { default: { name: network.name, url: network.explorer } },
    testnet: network.environment === 'testnet',
  })
}
