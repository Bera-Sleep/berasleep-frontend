import { ComputedFarmConfigV3, FarmV3DataWithPrice } from '@pancakeswap/farms'
import {
  CommonPrice,
  farmV3FetchFarms,
  fetchMasterChefV3Data,
  getCakeApr,
  LPTvl,
} from '@pancakeswap/farms/src/fetchFarmsV3'
import { MultiCallV2 } from '@pancakeswap/multicall'
import { beraMasterChefV3Address, bscMainnet, ftmTest } from 'config/chains'
import BigNumber from 'bignumber.js'

const supportedChainIdV3 = [ftmTest.chainId, bscMainnet.chainId]

export function beraCreateFarmFetcherV3(multicallv2: MultiCallV2) {
  const fetchFarms = async ({
    farms,
    chainId,
    commonPrice,
  }: {
    chainId: any
    farms: ComputedFarmConfigV3[]
    commonPrice: CommonPrice
  }) => {
    const masterChefAddress = beraMasterChefV3Address[chainId]
    if (!masterChefAddress) {
      throw new Error('Unsupported chain')
    }

    try {
      const { poolLength, totalAllocPoint, latestPeriodCakePerSecond } = await fetchMasterChefV3Data({
        multicallv2,
        masterChefAddress,
        chainId,
      })

      const cakePerSecond = new BigNumber(latestPeriodCakePerSecond.toString()).div(1e18).div(1e12).toString()

      const farmsWithPrice = await farmV3FetchFarms({
        farms,
        chainId,
        multicallv2,
        masterChefAddress,
        totalAllocPoint,
        commonPrice,
      })

      return {
        poolLength: poolLength.toNumber(),
        farmsWithPrice,
        cakePerSecond,
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const getCakeAprAndTVL = (farm: FarmV3DataWithPrice, lpTVL: LPTvl, cakePrice: string, cakePerSecond: string) => {
    const [token0Price, token1Price] = farm.token.sortsBefore(farm.quoteToken)
      ? [farm.tokenPriceBusd, farm.quoteTokenPriceBusd]
      : [farm.quoteTokenPriceBusd, farm.tokenPriceBusd]
    const tvl = new BigNumber(token0Price).times(lpTVL.token0).plus(new BigNumber(token1Price).times(lpTVL.token1))

    const cakeApr = getCakeApr(farm.poolWeight, tvl, cakePrice, cakePerSecond)

    return {
      activeTvlUSD: tvl.toString(),
      activeTvlUSDUpdatedAt: lpTVL.updatedAt,
      cakeApr,
    }
  }

  return {
    fetchFarms,
    getCakeAprAndTVL,
    isChainSupported: (chainId: number) => supportedChainIdV3.includes(chainId),
    supportedChainId: supportedChainIdV3,
    isTestnet: (chainId: number) => [ftmTest.chainId].includes(chainId),
  }
}
