import { existsSync, readFileSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { createPublicClient, createWalletClient, http } from 'viem'
import type { Abi, Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { address, chain, getHubNetwork, getNetwork } from '../src/config'
import type { Environment } from '../src/config'

if (existsSync('.env')) loadEnvFile('.env')

export function required(name: string): string {
  const value = process.env[name]
  if (!value || value.startsWith('YOUR_')) throw new Error(`Set ${name} in ccip-payments/.env (never commit secrets)`)
  return value
}
export function environment(): Environment {
  const value = process.env.CHAIN_ENV ?? 'testnet'
  if (value !== 'testnet' && value !== 'mainnet') throw new Error('CHAIN_ENV must be testnet or mainnet')
  return value
}
export function confirmBroadcast() {
  if (environment() === 'mainnet') {
    if (process.env.ALLOW_MAINNET_TRANSACTIONS !== 'yes-i-understand') throw new Error('Mainnet disabled. Complete audit and route validation before setting ALLOW_MAINNET_TRANSACTIONS=yes-i-understand')
  } else if (process.env.ALLOW_TESTNET_TRANSACTIONS !== 'true') {
    throw new Error('Set ALLOW_TESTNET_TRANSACTIONS=true to explicitly enable testnet broadcasts')
  }
}
export function account(name: 'OWNER_PRIVATE_KEY' | 'PAYER_PRIVATE_KEY') {
  const key = required(name)
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error(`${name} must be a 32-byte hex private key`)
  return privateKeyToAccount(key as Hex)
}
export function hubClients(role?: 'OWNER_PRIVATE_KEY' | 'PAYER_PRIVATE_KEY') {
  const network = getHubNetwork(environment())
  const rpc = required('HUB_RPC_URL')
  const hubChain = chain(network, rpc)
  const client = createPublicClient({ chain: hubChain, transport: http(rpc, { timeout: 30_000 }) })
  const wallet = role ? createWalletClient({ chain: hubChain, account: account(role), transport: http(rpc, { timeout: 30_000 }) }) : undefined
  return { network, client, wallet }
}
export function sourceClients() {
  const network = getNetwork(process.env.SOURCE_NETWORK ?? (environment() === 'testnet' ? 'ethereum-testnet-sepolia-base-1' : 'ethereum-mainnet-base-1'))
  if (network.environment !== environment()) throw new Error('Source and Hub environment mismatch')
  const rpc = required('SOURCE_RPC_URL')
  const sourceChain = chain(network, rpc)
  return {
    network,
    client: createPublicClient({ chain: sourceChain, transport: http(rpc, { timeout: 30_000 }) }),
    wallet: createWalletClient({ chain: sourceChain, account: account('PAYER_PRIVATE_KEY'), transport: http(rpc, { timeout: 30_000 }) }),
  }
}
export function hubAddress() {
  if (process.env.HUB_ADDRESS) return address(process.env.HUB_ADDRESS)
  if (existsSync('deployments.local.json')) {
    const deployments = JSON.parse(readFileSync('deployments.local.json', 'utf8'))
    if (deployments[environment()]?.address) return address(deployments[environment()].address)
  }
  throw new Error('Deploy Hub first or set HUB_ADDRESS')
}
export function orderId() {
  const id = BigInt(required('ORDER_ID'))
  if (id <= 0n) throw new Error('ORDER_ID must be positive')
  return id
}
export function artifact(name: string) {
  const path = `artifacts/${name}.json`
  if (!existsSync(path)) throw new Error('Run npm run compile first')
  return JSON.parse(readFileSync(path, 'utf8')) as { abi: Abi; bytecode: Hex }
}
export async function validateHubChain() {
  const { network, client } = hubClients()
  if (await client.getChainId() !== network.chainId) throw new Error('HUB_RPC_URL uses wrong network')
}
