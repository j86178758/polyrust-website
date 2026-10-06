import { formatEther, formatUnits } from 'viem'
import { payOrder, quotePayment, waitForPayment } from '../src/payment'
import { confirmBroadcast, hubAddress, hubClients, orderId, sourceClients } from './env'

const source = sourceClients()
const hub = hubClients()
const context = { source: source.network, hub: hub.network, hubAddress: hubAddress(), sourceClient: source.client, hubClient: hub.client, wallet: source.wallet }
const id = orderId()
const quote = await quotePayment(context, id)
const decimals = source.network.tokens.find(token => token.symbol === quote.symbol)!.decimals
console.log(`Order ${id}: ${formatUnits(quote.amount, decimals)} ${quote.symbol}`)
console.log(`CCIP fee estimate: ${formatEther(quote.fee)} ${source.network.nativeSymbol}; source transaction gas is additional.`)
if (process.argv.includes('--quote')) {
  console.log('Quote only: no transaction sent.')
} else {
  confirmBroadcast()
  const payment = await payOrder(context, id, (step, hash) => console.log(step, hash ?? ''))
  console.log(JSON.stringify(payment, null, 2))
  console.log('Source confirmed; order is NOT fulfilled until delivery on Hub.')
  if (process.argv.includes('--wait')) {
    const status = await waitForPayment(hub.client, hubAddress(), id)
    console.log(JSON.stringify(status, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2))
  }
}
