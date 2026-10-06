import { createPublicClient, createWalletClient, custom, http } from 'viem'
import type { EIP1193Provider } from 'viem'
import { address, chain, getHubNetwork, getNetwork } from './config'
import type { PaymentContext } from './payment'

/** Use an injected/WalletConnect EIP-1193 wallet; never put private keys in frontend code. */
export async function connectPaymentWallet(provider: EIP1193Provider, options: {
  sourceKey: string
  hubAddress: string
  sourceRpcUrl: string
  hubRpcUrl: string
}): Promise<PaymentContext> {
  const source = getNetwork(options.sourceKey)
  const hub = getHubNetwork(source.environment as 'testnet' | 'mainnet')
  const sourceChain = chain(source, options.sourceRpcUrl)
  const hubChain = chain(hub, options.hubRpcUrl)
  const wallet = createWalletClient({ chain: sourceChain, transport: custom(provider) })
  await wallet.requestAddresses()
  if (await wallet.getChainId() !== source.chainId) await wallet.switchChain({ id: source.chainId })
  return {
    source, hub, hubAddress: address(options.hubAddress), wallet,
    sourceClient: createPublicClient({ chain: sourceChain, transport: http(options.sourceRpcUrl, { timeout: 30_000 }) }),
    hubClient: createPublicClient({ chain: hubChain, transport: http(options.hubRpcUrl, { timeout: 30_000 }) }),
  }
}
