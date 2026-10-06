import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decodeAbiParameters, zeroAddress } from 'viem'
import type { Address, PublicClient, WalletClient } from 'viem'
import { address, catalog, getHubNetwork, getNetwork } from '../src/config'
import { buildMessage, payOrder, quotePayment } from '../src/payment'
import type { PaymentContext } from '../src/payment'

const receiver = '0x1111111111111111111111111111111111111111' as Address
const payer = '0x2222222222222222222222222222222222222222' as Address
const txHash = `0x${'a'.repeat(64)}` as const

test('encodes receiver, uint256 order, exact token base units and native fee token', () => {
  const message = buildMessage(receiver, 1001n, receiver, 10_000_000n)
  assert.deepEqual(decodeAbiParameters([{ type: 'address' }], message.receiver), [receiver])
  assert.deepEqual(decodeAbiParameters([{ type: 'uint256' }], message.data), [1001n])
  assert.equal(message.feeToken, zeroAddress)
  assert.deepEqual(message.tokenAmounts, [{ token: receiver, amount: 10_000_000n }])
  assert.equal(message.extraArgs.slice(0, 10), '0x181dcf10')
  assert.deepEqual(decodeAbiParameters([{ type: 'uint256' }, { type: 'bool' }], `0x${message.extraArgs.slice(10)}`), [300_000n, true])
  assert.throws(() => buildMessage(receiver, 0n, receiver, 10n), /positive/)
})
test('catalog has 10+ distinct mainnet spoke routes and verified testnet selectors as strings', () => {
  const mainSources = catalog.networks.filter(network => network.environment === 'mainnet' && network.tokens.some(token => token.routeToHub))
  assert.ok(mainSources.length >= 10)
  assert.equal(new Set(catalog.networks.map(network => network.chainId)).size, catalog.networks.length)
  for (const network of catalog.networks) {
    assert.equal(typeof network.chainSelector, 'string')
    assert.ok(BigInt(network.chainSelector) < 2n ** 64n)
    assert.ok(BigInt(network.chainSelector) > 0n)
    address(network.router)
    for (const token of network.tokens) { address(token.address); address(token.hubToken) }
  }
  assert.equal(getNetwork('ethereum-testnet-sepolia-base-1').chainSelector, '10344971235874465080')
  assert.equal(getHubNetwork('testnet').chainSelector, '3478487238524512106')
  assert.throws(() => address(zeroAddress), /Invalid/)
})

function context(options: { paid?: boolean; walletChain?: number; wrongToken?: boolean; disallowed?: boolean; stakeOtherWallet?: boolean } = {}) {
  const source = getNetwork('ethereum-testnet-sepolia-base-1'), hub = getHubNetwork('testnet')
  const writes: { functionName: string; value?: bigint; args: readonly unknown[] }[] = []
  const sourceClient = {
    getChainId: async () => source.chainId,
    getCode: async () => '0x1234',
    getBalance: async () => 1_000_000n,
    readContract: async ({ functionName }: { functionName: string }) => {
      if (functionName === 'decimals') return 6
      if (functionName === 'isChainSupported') return true
      if (functionName === 'balanceOf') return 100_000_000n
      if (functionName === 'getFee') return 100n
      if (functionName === 'allowance') return 0n
      if (functionName === 'getOnRamp') return receiver
      throw new Error(functionName)
    },
    simulateContract: async (request: unknown) => ({ request }),
    waitForTransactionReceipt: async () => ({ status: 'success', logs: [] }),
  } as unknown as PublicClient
  const hubClient = {
    getChainId: async () => hub.chainId,
    getCode: async () => '0x1234',
    readContract: async ({ functionName }: { functionName: string }) => {
      if (functionName === 'orderAmounts') return 10_000_000n
      if (functionName === 'orderTokens') return options.wrongToken ? receiver : hub.tokens[0].address
      if (functionName === 'isOrderPaid') return options.paid ?? false
      if (functionName === 'allowedSourceChains') return !options.disallowed
      if (functionName === 'stakes') return [options.stakeOtherWallet ? receiver : zeroAddress, 0n, 0n, 0n, 0n, false]
      if (functionName === 'getRouter') return hub.router
      if (functionName === 'decimals') return 6
      throw new Error(functionName)
    },
  } as unknown as PublicClient
  const wallet = {
    getChainId: async () => options.walletChain ?? source.chainId,
    getAddresses: async () => [payer],
    writeContract: async (request: typeof writes[number]) => { writes.push(request); return txHash },
  } as unknown as WalletClient
  return { context: { source, hub, hubAddress: receiver, sourceClient, hubClient, wallet } satisfies PaymentContext, writes }
}

test('frontend approve then ccipSend uses exact amount, current fee and source official router', async () => {
  const { context: input, writes } = context()
  const result = await payOrder(input, 1001n)
  assert.deepEqual(writes.map(request => request.functionName), ['approve', 'ccipSend'])
  assert.equal(writes[0].args[0], address(input.source.router))
  assert.equal(writes[0].args[1], 10_000_000n)
  assert.equal(writes[1].value, 100n)
  assert.equal(writes[1].args[0], BigInt(input.hub.chainSelector))
  assert.equal(result.hash, txHash)
  assert.equal(result.destinationPaid, false)
})
test('frontend prevents wrong-chain, already-paid, unsupported-token and disallowed-chain sends', async () => {
  for (const [options, error] of [
    [{ walletChain: 1 }, /chain does not match/],
    [{ paid: true }, /already been paid/],
    [{ wrongToken: true }, /No configured token route/],
    [{ disallowed: true }, /not been enabled/],
    [{ stakeOtherWallet: true }, /different wallet/],
  ] as const) {
    const { context: input, writes } = context(options)
    await assert.rejects(() => quotePayment(input, 1001n), error)
    assert.equal(writes.length, 0)
  }
})
