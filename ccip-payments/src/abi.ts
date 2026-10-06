import { parseAbi } from 'viem'

export const routerAbi = parseAbi([
  'function getFee(uint64 destinationChainSelector, (bytes receiver, bytes data, (address token, uint256 amount)[] tokenAmounts, address feeToken, bytes extraArgs) message) view returns (uint256)',
  'function ccipSend(uint64 destinationChainSelector, (bytes receiver, bytes data, (address token, uint256 amount)[] tokenAmounts, address feeToken, bytes extraArgs) message) payable returns (bytes32)',
  'function isChainSupported(uint64 chainSelector) view returns (bool)',
  'function getOnRamp(uint64 chainSelector) view returns (address)',
])

export const hubAbi = parseAbi([
  'function getRouter() view returns (address)',
  'function paymentToken() view returns (address)',
  'function acceptedTokens(address token) view returns (bool)',
  'function allowedSourceChains(uint64 selector) view returns (bool)',
  'function orderAmounts(uint256 orderId) view returns (uint256)',
  'function orderTokens(uint256 orderId) view returns (address)',
  'function isOrderPaid(uint256 orderId) view returns (bool)',
  'function stakes(uint256 orderId) view returns (address beneficiary, uint256 reward, uint64 lockDuration, uint64 unlockAt, uint64 sourceChainSelector, bool claimed)',
  'function rewardPool(address token) view returns (uint256)',
  'function reservedBalances(address token) view returns (uint256)',
  'function createOrder(uint256 orderId, address token, uint256 amount)',
  'function createStakingOrder(uint256 orderId, address token, uint256 principal, address beneficiary, uint256 reward, uint64 lockDuration)',
  'function setTokenAllowed(address token, bool allowed)',
  'function setSourceChainAllowed(uint64 selector, bool allowed)',
  'function fundRewards(address token, uint256 amount)',
  'function withdraw(address token, address recipient, uint256 amount)',
  'function claim(uint256 orderId)',
  'function claimCrossChain(uint256 orderId) payable returns (bytes32)',
  'function quoteClaimFee(uint256 orderId) view returns (uint256)',
  'event OrderPaid(uint256 indexed orderId, bytes32 indexed messageId, uint64 indexed sourceChainSelector, address payer, address token, uint256 amount)',
  'event StakeClaimed(uint256 indexed orderId, uint256 amount, bytes32 messageId)',
])

// Official CCIP 2.0 OnRamp event. Legacy lanes may require explorer lookup by tx hash.
export const onRampAbi = parseAbi([
  'event CCIPMessageSent(uint64 indexed destChainSelector, address indexed sender, bytes32 indexed messageId, address feeToken, uint256 tokenAmountBeforeTokenPoolFees, bytes encodedMessage, (address issuer, uint32 destGasLimit, uint32 destBytesOverhead, uint256 feeTokenAmount, bytes extraArgs)[] receipts, bytes[] verifierBlobs)',
])
