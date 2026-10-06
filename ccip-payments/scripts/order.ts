import { erc20Abi, parseUnits } from 'viem'
import { address, getToken } from '../src/config'
import { hubAbi } from '../src/abi'
import { confirmBroadcast, hubAddress, hubClients, orderId, required, validateHubChain } from './env'

confirmBroadcast()
await validateHubChain()
const { network, client, wallet } = hubClients('OWNER_PRIVATE_KEY')
if (!wallet) throw new Error('Missing owner wallet')
const hub = hubAddress()
const token = getToken(network, process.env.ORDER_TOKEN ?? 'USDC')
const tokenAddress = address(token.address)
const amount = parseUnits(required('ORDER_AMOUNT'), token.decimals)
if (amount <= 0n) throw new Error('ORDER_AMOUNT must be positive')
const mode = process.argv[2] ?? 'shop'
let hash
if (mode === 'fund') {
  const approve = await wallet.writeContract({ address: tokenAddress, abi: erc20Abi, functionName: 'approve', args: [hub, amount] })
  if ((await client.waitForTransactionReceipt({ hash: approve, timeout: 180_000 })).status !== 'success') throw new Error('Funding approval failed')
  hash = await wallet.writeContract({ address: hub, abi: hubAbi, functionName: 'fundRewards', args: [tokenAddress, amount] })
} else if (mode === 'stake') {
  const reward = parseUnits(required('REWARD_AMOUNT'), token.decimals)
  const lock = BigInt(process.env.LOCK_SECONDS ?? '604800')
  const beneficiary = address(required('BENEFICIARY_ADDRESS'))
  const { request } = await client.simulateContract({ address: hub, abi: hubAbi, functionName: 'createStakingOrder', args: [orderId(), tokenAddress, amount, beneficiary, reward, lock], account: wallet.account })
  hash = await wallet.writeContract(request)
} else if (mode === 'shop') {
  const { request } = await client.simulateContract({ address: hub, abi: hubAbi, functionName: 'createOrder', args: [orderId(), tokenAddress, amount], account: wallet.account })
  hash = await wallet.writeContract(request)
} else { throw new Error('Usage: order.ts shop|fund|stake') }
const receipt = await client.waitForTransactionReceipt({ hash, confirmations: 2, timeout: 180_000 })
if (receipt.status !== 'success') throw new Error(`Transaction reverted: ${hash}`)
console.log(`${mode}: ${network.explorer}/tx/${hash}`)
