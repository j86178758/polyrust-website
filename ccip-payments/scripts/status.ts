import { getOrderStatus } from '../src/payment'
import { hubAddress, hubClients, orderId, validateHubChain } from './env'

await validateHubChain()
const { client } = hubClients()
const status = await getOrderStatus(client, hubAddress(), orderId())
console.log(JSON.stringify(status, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2))
if (status.stake.unlockAt > 0n) console.log('Unlocks:', new Date(Number(status.stake.unlockAt) * 1000).toISOString())
