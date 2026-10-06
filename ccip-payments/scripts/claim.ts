import { claimStake } from '../src/payment'
import { confirmBroadcast, hubAddress, hubClients, orderId } from './env'

confirmBroadcast()
const { network, client, wallet } = hubClients('PAYER_PRIVATE_KEY')
if (!wallet) throw new Error('Missing payer wallet')
const crossChain = process.argv.includes('--cross-chain')
const result = await claimStake(client, wallet, network, hubAddress(), orderId(), crossChain)
console.log(`${network.explorer}/tx/${result.hash}`)
if (result.messageId) console.log(`Return transfer: https://ccip.chain.link/msg/${result.messageId}`)
console.log(result.delivered ? 'Paid to the beneficiary on Hub.' : 'Return transfer submitted. Wait for destination delivery; claimed=true means submitted, not delivered.')
