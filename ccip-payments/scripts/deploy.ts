import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { address, getToken } from '../src/config'
import { hubAbi } from '../src/abi'
import { artifact, confirmBroadcast, environment, hubClients, validateHubChain } from './env'
import catalog from '../config/networks.json'

confirmBroadcast()
await validateHubChain()
const { network, client, wallet } = hubClients('OWNER_PRIVATE_KEY')
if (!wallet) throw new Error('Missing deployer wallet')
const token = getToken(network, 'USDC')
const hubArtifact = artifact('PaymentHub')
const hash = await wallet.deployContract({ ...hubArtifact, args: [address(network.router), address(token.address), wallet.account.address] })
const receipt = await client.waitForTransactionReceipt({ hash, confirmations: 2, timeout: 180_000 })
if (receipt.status !== 'success' || !receipt.contractAddress) throw new Error(`Deployment failed: ${hash}`)
const hub = receipt.contractAddress
const deployments = existsSync('deployments.local.json') ? JSON.parse(readFileSync('deployments.local.json', 'utf8')) : {}
deployments[environment()] = { address: hub, chainId: network.chainId, router: network.router, token: token.address, owner: wallet.account.address, hash }
writeFileSync('deployments.local.json', JSON.stringify(deployments, null, 2) + '\n')
console.log(`Deployed ONE Hub on ${network.name}: ${hub}`)
console.log(`Transaction: ${network.explorer}/tx/${hash}`)
// Enable only catalogued, token-supported sources in the same environment.
for (const source of catalog.networks.filter(source => source.environment === environment() && source.tokens.some(token => token.routeToHub))) {
  const tx = await wallet.writeContract({ address: hub, abi: hubAbi, functionName: 'setSourceChainAllowed', args: [BigInt(source.chainSelector), true] })
  const result = await client.waitForTransactionReceipt({ hash: tx, timeout: 180_000 })
  if (result.status !== 'success') throw new Error(`Source setup failed: ${source.name}. Hub deployment is saved; enable remaining chains manually.`)
  console.log(`Enabled source: ${source.name}`)
}
for (const extra of network.tokens.filter(token => token.symbol !== 'USDC')) {
  const tx = await wallet.writeContract({ address: hub, abi: hubAbi, functionName: 'setTokenAllowed', args: [address(extra.address), true] })
  const result = await client.waitForTransactionReceipt({ hash: tx, timeout: 180_000 })
  if (result.status !== 'success') throw new Error(`Token setup failed: ${extra.symbol}`)
  console.log(`Enabled token: ${extra.symbol}`)
}
