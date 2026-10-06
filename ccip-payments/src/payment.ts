import { concat, decodeEventLog, encodeAbiParameters, erc20Abi, zeroAddress } from 'viem'
import type { Address, Hex, PublicClient, WalletClient } from 'viem'
import { address } from './config'
import type { Network } from './config'
import { hubAbi, onRampAbi, routerAbi } from './abi'

export type PaymentContext = {
  source: Network
  hub: Network
  hubAddress: Address
  sourceClient: PublicClient
  hubClient: PublicClient
  wallet: WalletClient
}

export function buildMessage(receiver: Address, orderId: bigint, token: Address, amount: bigint, gasLimit = 300_000n) {
  if (orderId <= 0n || amount <= 0n) throw new Error('Order ID and amount must be positive')
  return {
    receiver: encodeAbiParameters([{ type: 'address' }], [receiver]),
    data: encodeAbiParameters([{ type: 'uint256' }], [orderId]),
    tokenAmounts: [{ token, amount }],
    feeToken: zeroAddress,
    extraArgs: concat(['0x181dcf10', encodeAbiParameters([{ type: 'uint256' }, { type: 'bool' }], [gasLimit, true])]),
  } as const
}

export async function quotePayment(context: PaymentContext, orderId: bigint) {
  const { source, hub, sourceClient, hubClient, wallet, hubAddress } = context
  if (source.environment !== hub.environment || source.chainId === hub.chainId) throw new Error('Choose a source network distinct from the Hub in the same environment')
  const [sourceId, hubId, walletId, accounts] = await Promise.all([sourceClient.getChainId(), hubClient.getChainId(), wallet.getChainId(), wallet.getAddresses()])
  if (sourceId !== source.chainId || walletId !== source.chainId || hubId !== hub.chainId) throw new Error('RPC or wallet chain does not match the configuration; switch network first')
  const payer = accounts[0]
  if (!payer) throw new Error('Connect a wallet first')
  const router = address(source.router)
  for (const [client, target] of [[sourceClient, router], [hubClient, hubAddress]] as const) {
    if (!await client.getCode({ address: target })) throw new Error(`No contract deployed at ${target}`)
  }
  const [amount, destinationToken, paid, allowed, stake, configuredRouter] = await Promise.all([
    hubClient.readContract({ address: hubAddress, abi: hubAbi, functionName: 'orderAmounts', args: [orderId] }),
    hubClient.readContract({ address: hubAddress, abi: hubAbi, functionName: 'orderTokens', args: [orderId] }),
    hubClient.readContract({ address: hubAddress, abi: hubAbi, functionName: 'isOrderPaid', args: [orderId] }),
    hubClient.readContract({ address: hubAddress, abi: hubAbi, functionName: 'allowedSourceChains', args: [BigInt(source.chainSelector)] }),
    hubClient.readContract({ address: hubAddress, abi: hubAbi, functionName: 'stakes', args: [orderId] }),
    hubClient.readContract({ address: hubAddress, abi: hubAbi, functionName: 'getRouter' }),
  ])
  if (configuredRouter.toLowerCase() !== hub.router.toLowerCase()) throw new Error('Hub uses a different CCIP router')
  if (amount === 0n) throw new Error('Order is not registered on the Hub')
  if (paid) throw new Error('Order has already been paid; do not send again')
  if (!allowed) throw new Error('Source network has not been enabled on the Hub')
  if (stake[0] !== zeroAddress && stake[0].toLowerCase() !== payer.toLowerCase()) throw new Error('This staking order belongs to a different wallet')
  const token = source.tokens.find(token => token.hubToken.toLowerCase() === destinationToken.toLowerCase() && token.routeToHub)
  if (!token) throw new Error('No configured token route for this order; choose another network or register an order in another supported token')
  const tokenAddress = address(token.address)
  const [sourceDecimals, hubDecimals, supported, balance] = await Promise.all([
    sourceClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'decimals' }),
    hubClient.readContract({ address: destinationToken, abi: erc20Abi, functionName: 'decimals' }),
    sourceClient.readContract({ address: router, abi: routerAbi, functionName: 'isChainSupported', args: [BigInt(hub.chainSelector)] }),
    sourceClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'balanceOf', args: [payer] }),
  ])
  if (sourceDecimals !== token.decimals || sourceDecimals !== hubDecimals) throw new Error('Token decimals do not match; base-unit amounts cannot be transferred unchanged')
  if (!supported) throw new Error('Router does not support this destination')
  if (balance < amount) throw new Error(`Insufficient ${token.symbol} balance`)
  const message = buildMessage(hubAddress, orderId, tokenAddress, amount)
  const fee = await sourceClient.readContract({ address: router, abi: routerAbi, functionName: 'getFee', args: [BigInt(hub.chainSelector), message] })
  return { payer, router, token: tokenAddress, symbol: token.symbol, amount, fee, message }
}

export type PaymentStep = 'approval' | 'sending' | 'submitted'

// Caller should persist the source transaction hash; do NOT blindly retry while delivery is pending.
export async function payOrder(context: PaymentContext, orderId: bigint, onStep?: (step: PaymentStep, hash?: Hex) => void) {
  let quote = await quotePayment(context, orderId)
  const { sourceClient, wallet, hub } = context
  const allowance = await sourceClient.readContract({ address: quote.token, abi: erc20Abi, functionName: 'allowance', args: [quote.payer, quote.router] })
  if (allowance < quote.amount) {
    // Supports ERC20s requiring zero allowance before a nonzero replacement.
    for (const amount of allowance > 0n ? [0n, quote.amount] : [quote.amount]) {
      onStep?.('approval')
      const { request } = await sourceClient.simulateContract({ address: quote.token, abi: erc20Abi, functionName: 'approve', args: [quote.router, amount], account: quote.payer })
      const hash = await wallet.writeContract({ ...request, chain: wallet.chain })
      onStep?.('approval', hash)
      const receipt = await sourceClient.waitForTransactionReceipt({ hash, confirmations: 2, timeout: 180_000 })
      if (receipt.status !== 'success') throw new Error(`Approve reverted: ${hash}`)
    }
  }
  // Approval may take minutes: refresh fee, wallet, order and lane checks before sending.
  quote = await quotePayment(context, orderId)
  if (await sourceClient.getBalance({ address: quote.payer }) <= quote.fee) throw new Error('Insufficient native balance for CCIP fee plus transaction gas')
  onStep?.('sending')
  const destination = BigInt(hub.chainSelector)
  const onRamp = await sourceClient.readContract({ address: quote.router, abi: routerAbi, functionName: 'getOnRamp', args: [destination] })
  const { request } = await sourceClient.simulateContract({ address: quote.router, abi: routerAbi, functionName: 'ccipSend', args: [destination, quote.message], account: quote.payer, value: quote.fee })
  const hash = await wallet.writeContract({ ...request, chain: wallet.chain })
  onStep?.('submitted', hash)
  const receipt = await sourceClient.waitForTransactionReceipt({ hash, confirmations: 2, timeout: 180_000 })
  if (receipt.status !== 'success') throw new Error(`ccipSend reverted: ${hash}`)
  let messageId: Hex | undefined
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== onRamp.toLowerCase()) continue
    try {
      const event = decodeEventLog({ abi: onRampAbi, data: log.data, topics: log.topics })
      if (event.args.destChainSelector === destination && event.args.sender.toLowerCase() === quote.payer.toLowerCase()) messageId = event.args.messageId
    } catch { /* Legacy OnRamp: use transaction hash search in CCIP Explorer. */ }
  }
  return { hash, messageId, explorer: messageId ? `https://ccip.chain.link/msg/${messageId}` : 'https://ccip.chain.link', sourceExplorer: `${context.source.explorer}/tx/${hash}`, destinationPaid: false as const }
}

export async function getOrderStatus(client: PublicClient, hubAddress: Address, orderId: bigint) {
  const [paid, stake] = await Promise.all([
    client.readContract({ address: hubAddress, abi: hubAbi, functionName: 'isOrderPaid', args: [orderId] }),
    client.readContract({ address: hubAddress, abi: hubAbi, functionName: 'stakes', args: [orderId] }),
  ])
  return { paid, stake: { beneficiary: stake[0], reward: stake[1], lockDuration: stake[2], unlockAt: stake[3], sourceChainSelector: stake[4], claimed: stake[5] } }
}

export async function waitForPayment(client: PublicClient, hubAddress: Address, orderId: bigint, timeoutMs = 1_800_000, signal?: AbortSignal) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (signal?.aborted) throw new Error('Status polling cancelled; the payment itself is not cancelled')
    const status = await getOrderStatus(client, hubAddress, orderId)
    if (status.paid) return status
    await new Promise(resolve => setTimeout(resolve, 15_000))
  }
  throw new Error('Payment still pending or failed at destination. Inspect CCIP Explorer; do not send a duplicate payment.')
}

export async function claimStake(client: PublicClient, wallet: WalletClient, hub: Network, hubAddress: Address, orderId: bigint, crossChain = false) {
  if (await wallet.getChainId() !== hub.chainId || await client.getChainId() !== hub.chainId) throw new Error('Switch wallet and RPC to the Hub network to withdraw')
  const [account] = await wallet.getAddresses()
  if (!account) throw new Error('Connect a wallet')
  const fee = crossChain ? await client.readContract({ address: hubAddress, abi: hubAbi, functionName: 'quoteClaimFee', args: [orderId] }) : 0n
  let hash: Hex
  if (crossChain) {
    const { request } = await client.simulateContract({ address: hubAddress, abi: hubAbi, functionName: 'claimCrossChain', args: [orderId], account, value: fee })
    hash = await wallet.writeContract({ ...request, chain: wallet.chain })
  } else {
    const { request } = await client.simulateContract({ address: hubAddress, abi: hubAbi, functionName: 'claim', args: [orderId], account })
    hash = await wallet.writeContract({ ...request, chain: wallet.chain })
  }
  const receipt = await client.waitForTransactionReceipt({ hash, confirmations: 2, timeout: 180_000 })
  if (receipt.status !== 'success') throw new Error(`Claim reverted: ${hash}`)
  const event = receipt.logs.filter(log => log.address.toLowerCase() === hubAddress.toLowerCase()).flatMap(log => {
    try { return [decodeEventLog({ abi: hubAbi, eventName: 'StakeClaimed', data: log.data, topics: log.topics })] } catch { return [] }
  })[0]
  return { hash, messageId: crossChain ? event?.args.messageId : undefined, delivered: !crossChain }
}
