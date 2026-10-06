import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { readFileSync } from 'node:fs'
import ganache from 'ganache'
import { createPublicClient, createWalletClient, custom, defineChain, encodeAbiParameters, erc20Abi, padHex, parseEther, zeroAddress } from 'viem'
import type { Abi, Address, EIP1193Provider, Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const provider = ganache.provider({ logging: { quiet: true }, chain: { hardfork: 'shanghai', chainId: 1337 }, wallet: { totalAccounts: 3 } })
const rpc = provider as unknown as EIP1193Provider
// Ganache reports eth_call reverts as -32000; viem expects standard execution-reverted code 3.
const transport = custom({ request: async (args: { method: string; params?: unknown[] }) => {
  try { return await rpc.request(args as never) }
  catch (error) {
    const failure = error as { data?: string }
    if (args.method === 'eth_call' && typeof failure.data === 'string' && failure.data.startsWith('0x')) {
      throw Object.assign(new Error('execution reverted'), { code: 3, data: failure.data })
    }
    throw error
  }
} } as EIP1193Provider)
const chain = defineChain({ id: 1337, name: 'Local', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['http://unused.invalid'] } } })
const client = createPublicClient({ transport, chain, pollingInterval: 10 })
const accounts = Object.values(provider.getInitialAccounts()).map(account => privateKeyToAccount(account.secretKey as Hex))
const owner = createWalletClient({ transport, chain, account: accounts[0] })
const payer = createWalletClient({ transport, chain, account: accounts[1] })
const other = createWalletClient({ transport, chain, account: accounts[2] })
const load = (name: string) => JSON.parse(readFileSync(`artifacts/${name}.json`, 'utf8')) as { abi: Abi; bytecode: Hex }
const hubArtifact = load('PaymentHub'), tokenArtifact = load('MockToken'), routerArtifact = load('MockRouter')
const selector = 10344971235874465080n
const usdc = 1_000_000n
let hub: Address, token: Address, secondToken: Address, router: Address
let idCounter = 100n
let messageCounter = 0n

async function deploy(artifact: ReturnType<typeof load>, args: unknown[] = []) {
  const hash = await owner.deployContract({ ...artifact, args })
  const receipt = await client.waitForTransactionReceipt({ hash })
  assert.equal(receipt.status, 'success')
  return receipt.contractAddress!
}
async function write(target: Address, abi: Abi, functionName: string, args: readonly unknown[] = [], wallet = owner, value?: bigint) {
  const errors = hubArtifact.abi.filter(item => item.type === 'error')
    const { request } = await client.simulateContract({ address: target, abi: [...abi, ...errors], functionName, args, account: wallet.account, value })
  const hash = await wallet.writeContract(request)
  const receipt = await client.waitForTransactionReceipt({ hash })
  assert.equal(receipt.status, 'success')
  return receipt
}
const read = (functionName: string, args: readonly unknown[] = []) => client.readContract({ address: hub, abi: hubArtifact.abi, functionName, args })
const balance = (who: Address, target = token) => client.readContract({ address: target, abi: erc20Abi, functionName: 'balanceOf', args: [who] })
async function create(amount = 10n * usdc, target = token) {
  const id = ++idCounter
  await write(hub, hubArtifact.abi, 'createOrder', [id, target, amount])
  return id
}
function message(id: bigint, amount = 10n * usdc, overrides: Record<string, unknown> = {}) {
  return {
    messageId: padHex(`0x${(++messageCounter).toString(16)}` as Hex, { size: 32 }),
    sourceChainSelector: selector,
    sender: encodeAbiParameters([{ type: 'address' }], [payer.account.address]),
    data: encodeAbiParameters([{ type: 'uint256' }], [id]),
    destTokenAmounts: [{ token, amount }],
    ...overrides,
  }
}
const deliver = (msg: ReturnType<typeof message>) => write(router, routerArtifact.abi, 'deliver', [hub, msg])
async function revert(fn: () => Promise<unknown>, name: string) { await assert.rejects(fn, new RegExp(name)) }
async function advance(seconds: number) {
  await provider.request({ method: 'evm_increaseTime', params: [seconds] })
  await provider.request({ method: 'evm_mine', params: [] })
}
async function staking(reward = 10n * usdc) {
  const id = ++idCounter
  await write(token, tokenArtifact.abi, 'mint', [owner.account.address, reward])
  await write(token, tokenArtifact.abi, 'approve', [hub, reward])
  await write(hub, hubArtifact.abi, 'fundRewards', [token, reward])
  await write(hub, hubArtifact.abi, 'createStakingOrder', [id, token, 100n * usdc, payer.account.address, reward, 604800n])
  return id
}

before(async () => {
  token = await deploy(tokenArtifact)
  secondToken = await deploy(tokenArtifact)
  router = await deploy(routerArtifact)
  hub = await deploy(hubArtifact, [router, token, owner.account.address])
  await write(token, tokenArtifact.abi, 'mint', [router, 100_000n * usdc])
  await write(secondToken, tokenArtifact.abi, 'mint', [router, 100_000n * usdc])
  await write(hub, hubArtifact.abi, 'setSourceChainAllowed', [selector, true])
})
after(async () => { await provider.disconnect() })

test('10 USDC delivery atomically funds Hub and marks registered order paid', async () => {
  const id = await create(), msg = message(id)
  const before = await balance(hub)
  const receipt = await deliver(msg)
  assert.equal(await read('isOrderPaid', [id]), true)
  assert.equal(await read('processedMessages', [msg.messageId]), true)
  assert.equal(await balance(hub), before + 10n * usdc)
  assert.ok(receipt.logs.some(log => log.address.toLowerCase() === hub.toLowerCase()))
})
test('only the configured router can call ccipReceive', async () => {
  await revert(() => write(hub, hubArtifact.abi, 'ccipReceive', [message(1n)], payer), 'InvalidRouter')
})
test('rejects unknown orders and unapproved source chain; no partial token delivery', async () => {
  const before = await balance(hub)
  await revert(() => deliver(message(99999n)), 'UnknownOrder')
  await revert(() => deliver(message(1000n, 10n * usdc, { sourceChainSelector: 12n })), 'SourceChainNotAllowed')
  assert.equal(await balance(hub), before)
})


test('rejects malformed payload or sender', async () => {
  const id = await create()
  await revert(() => deliver(message(id, 10n * usdc, { data: '0x' })), 'InvalidMessageData')
  await revert(() => deliver(message(id, 10n * usdc, { sender: '0x1234' })), 'InvalidSender')
  await revert(() => deliver(message(id, 10n * usdc, { sender: encodeAbiParameters([{ type: 'address' }], [zeroAddress]) })), 'InvalidSender')
})
test('rejects zero or multiple tokens, wrong token, underpayment and overpayment', async () => {
  const id = await create()
  await revert(() => deliver(message(id, 10n * usdc, { destTokenAmounts: [] })), 'InvalidTokenCount')
  await revert(() => deliver(message(id, 10n * usdc, { destTokenAmounts: [{ token, amount: 5n * usdc }, { token, amount: 5n * usdc }] })), 'InvalidTokenCount')
  await revert(() => deliver(message(id, 10n * usdc, { destTokenAmounts: [{ token: secondToken, amount: 10n * usdc }] })), 'WrongToken')
  for (const amount of [0n, 9n * usdc, 11n * usdc]) await revert(() => deliver(message(id, amount)), 'WrongAmount')
  assert.equal(await read('isOrderPaid', [id]), false)
})
test('rejects message replay and a new payment for an already paid order', async () => {
  const id = await create(), msg = message(id)
  await deliver(msg)
  await revert(() => deliver(msg), 'MessageAlreadyProcessed')
  await revert(() => deliver(message(id)), 'OrderAlreadyPaid')
})
test('order registration and configuration require owner; IDs and prices are immutable', async () => {
  await revert(() => write(hub, hubArtifact.abi, 'createOrder', [900n, token, usdc], payer), 'OwnableUnauthorizedAccount')
  await revert(() => write(hub, hubArtifact.abi, 'setSourceChainAllowed', [55n, true], payer), 'OwnableUnauthorizedAccount')
  await revert(() => write(hub, hubArtifact.abi, 'setTokenAllowed', [secondToken, true], payer), 'OwnableUnauthorizedAccount')
  await revert(() => write(hub, hubArtifact.abi, 'createOrder', [0n, token, usdc]), 'InvalidOrder')
  await revert(() => write(hub, hubArtifact.abi, 'createOrder', [900n, token, 0n]), 'InvalidOrder')
  const id = await create()
  await revert(() => write(hub, hubArtifact.abi, 'createOrder', [id, token, 20n * usdc]), 'OrderAlreadyExists')
})
test('multiple tokens are opt-in; disabling prevents new orders but preserves in-flight ones', async () => {
  await revert(() => create(10n * usdc, secondToken), 'WrongToken')
  await write(hub, hubArtifact.abi, 'setTokenAllowed', [secondToken, true])
  const id = await create(10n * usdc, secondToken)
  await write(hub, hubArtifact.abi, 'setTokenAllowed', [secondToken, false])
  await deliver(message(id, 10n * usdc, { destTokenAmounts: [{ token: secondToken, amount: 10n * usdc }] }))
  assert.equal(await read('isOrderPaid', [id]), true)
  await revert(() => create(10n * usdc, secondToken), 'WrongToken')
})
test('stake cannot promise unfunded rewards or accept another wallet deposit', async () => {
  await revert(() => write(hub, hubArtifact.abi, 'createStakingOrder', [990n, token, 100n * usdc, payer.account.address, 100000n * usdc, 604800n]), 'InsufficientRewardPool')
  const id = await staking()
  await revert(() => deliver(message(id, 100n * usdc, { sender: encodeAbiParameters([{ type: 'address' }], [other.account.address]) })), 'InvalidSender')
  assert.equal(await read('isOrderPaid', [id]), false)
})
test('100 USDC stake returns 110 after 7 days; principal and reward cannot be withdrawn by admin', async () => {
  const id = await staking()
  await deliver(message(id, 100n * usdc))
  const reserved = await read('reservedBalances', [token]) as bigint
  const available = await balance(hub) - reserved
  await revert(() => write(hub, hubArtifact.abi, 'withdraw', [token, owner.account.address, available + 1n]), 'ReservedFunds')
  await revert(() => write(hub, hubArtifact.abi, 'claim', [id], payer), 'StakeNotClaimable')
  await advance(604801)
  await revert(() => write(hub, hubArtifact.abi, 'claim', [id], other), 'StakeNotClaimable')
  const before = await balance(payer.account.address)
  await write(hub, hubArtifact.abi, 'claim', [id], payer)
  assert.equal(await balance(payer.account.address), before + 110n * usdc)
  assert.equal(await read('reservedBalances', [token]), reserved - 110n * usdc)
  await revert(() => write(hub, hubArtifact.abi, 'claim', [id], payer), 'StakeNotClaimable')
})
test('cross-chain claim returns to original source; fee/send failure rolls back claim', async () => {
  const id = await staking()
  await deliver(message(id, 100n * usdc))
  await advance(604801)
  const fee = await read('quoteClaimFee', [id]) as bigint
  await revert(() => write(hub, hubArtifact.abi, 'claimCrossChain', [id], payer, fee - 1n), 'InsufficientFee')
  await write(router, routerArtifact.abi, 'setFailSend', [true])
  await revert(() => write(hub, hubArtifact.abi, 'claimCrossChain', [id], payer, fee), 'Send failed')
  const stakeBefore = await read('stakes', [id]) as readonly unknown[]
  assert.equal(stakeBefore[5], false)
  await write(router, routerArtifact.abi, 'setFailSend', [false])
  const before = await balance(router)
  await write(hub, hubArtifact.abi, 'claimCrossChain', [id], payer, fee + parseEther('.001'))
  assert.equal(await balance(router), before + 110n * usdc)
  assert.equal(await client.readContract({ address: token, abi: erc20Abi, functionName: 'allowance', args: [hub, router] }), 0n)
  const stake = await read('stakes', [id]) as readonly unknown[]
  assert.equal(stake[4], selector)
  assert.equal(stake[5], true)
})
test('shop proceeds can be settled, but only by owner', async () => {
  await revert(() => write(hub, hubArtifact.abi, 'withdraw', [token, payer.account.address, usdc], payer), 'OwnableUnauthorizedAccount')
  const before = await balance(owner.account.address)
  await write(hub, hubArtifact.abi, 'withdraw', [token, owner.account.address, usdc])
  assert.equal(await balance(owner.account.address), before + usdc)
})
test('ownership transfer is two-step', async () => {
  await write(hub, hubArtifact.abi, 'transferOwnership', [other.account.address])
  assert.equal(await read('owner'), owner.account.address)
  await write(hub, hubArtifact.abi, 'acceptOwnership', [], other)
  assert.equal(await read('owner'), other.account.address)
})
