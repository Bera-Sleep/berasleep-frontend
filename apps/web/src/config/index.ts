import { getFullDecimalMultiplier } from '@pancakeswap/utils/getFullDecimalMultiplier'
import { BigNumberish } from 'ethers'
import { AccessListish } from '@ethersproject/transactions'
import { Provider } from '@ethersproject/providers'
import { BlockTag } from '@ethersproject/abstract-provider'

export const BSC_BLOCK_TIME = 3

// CAKE_PER_BLOCK details
// 40 CAKE is minted per block
// 20 CAKE per block is sent to Burn pool (A farm just for burning cake)
// 10 CAKE per block goes to CAKE syrup pool
// 9 CAKE per block goes to Yield farms and lottery
// CAKE_PER_BLOCK in config/index.ts = 40 as we only change the amount sent to the burn pool which is effectively a farm.
// CAKE/Block in src/views/Home/components/CakeDataRow.tsx = 15 (40 - Amount sent to burn pool)
export const CAKE_PER_BLOCK = 40
export const BLOCKS_PER_DAY = (60 / BSC_BLOCK_TIME) * 60 * 24
export const BLOCKS_PER_YEAR = BLOCKS_PER_DAY * 365 // 10512000
export const CAKE_PER_YEAR = CAKE_PER_BLOCK * BLOCKS_PER_YEAR
export const BASE_URL = 'https://pancakeswap.finance'
export const BASE_ADD_LIQUIDITY_URL = `${BASE_URL}/add`
export const DEFAULT_TOKEN_DECIMAL = getFullDecimalMultiplier(18)
export const DEFAULT_GAS_LIMIT = 250000
export const BOOSTED_FARM_GAS_LIMIT = 500000
export const AUCTION_BIDDERS_TO_FETCH = 500
export const RECLAIM_AUCTIONS_TO_FETCH = 500
export const AUCTION_WHITELISTED_BIDDERS_TO_FETCH = 500
export const IPFS_GATEWAY = 'https://ipfs.io/ipfs'

export interface CallV3 extends Call {
  abi: any[] | any
  allowFailure?: boolean
}
export interface Overrides {
  gasLimit?: BigNumberish | Promise<BigNumberish>
  gasPrice?: BigNumberish | Promise<BigNumberish>
  maxFeePerGas?: BigNumberish | Promise<BigNumberish>
  maxPriorityFeePerGas?: BigNumberish | Promise<BigNumberish>
  nonce?: BigNumberish | Promise<BigNumberish>
  type?: number
  accessList?: AccessListish
  customData?: Record<string, any>
  ccipReadEnabled?: boolean
}

export interface PayableOverrides extends Overrides {
  value?: BigNumberish | Promise<BigNumberish>
}

export interface CallOverrides extends PayableOverrides {
  blockTag?: BlockTag | Promise<BlockTag>
  from?: string | Promise<string>
}
export interface Call {
  address: string // Address of the contract
  name: string // Function name on the contract (example: balanceOf)
  params?: any[] // Function params
}

export interface MulticallOptions extends CallOverrides {
  requireSuccess?: boolean
}

export interface MulticallV3Params {
  calls: CallV3[]
  chainId?: number
  allowFailure?: boolean
  overrides?: CallOverrides
}
