import { ComputedFarmConfigV3, FarmV3DataWithPrice } from '@pancakeswap/farms'
import { CommonPrice, getCakeApr, LPTvl } from '@pancakeswap/farms/src/fetchFarmsV3'
import { Call, MultiCall, MultiCallV2 } from '@pancakeswap/multicall'
import { beraMasterChefV3Address, bscMainnet, ftmTest, getBeraMulticallContract } from 'config/chains'
import BigNumber from 'bignumber.js'
import { Interface, Fragment } from '@ethersproject/abi'
import { MulticallV3Params } from 'config'
import masterchefV3Abi from './abi/masterChefV3.json'

const supportedChainIdV3 = [ftmTest.chainId, bscMainnet.chainId]

export const DEFAULT_COMMON_PRICE = {
  56: {},
  4002: {
    '0x26d8777A043BE096cB212deA533D101750d9C272': '1',
  },
}

export function createMulticall() {
  const beraMulticallv3 = async ({ calls, chainId = ftmTest.chainId, allowFailure, overrides }: MulticallV3Params) => {
    const multi = getBeraMulticallContract(chainId)
    if (!multi) throw new Error(`Multicall Provider missing for ${chainId}`)
    const interfaceCache = new WeakMap()
    const _calls = calls.map(({ abi, address, name, params, allowFailure: _allowFailure }) => {
      let itf = interfaceCache.get(abi)
      if (!itf) {
        itf = new Interface(abi)
        interfaceCache.set(abi, itf)
      }
      if (!itf.fragments.some((fragment: Fragment) => fragment.name === name))
        console.error(`${name} missing on ${address}`)
      const callData = itf.encodeFunctionData(name, params ?? [])
      return {
        target: address.toLowerCase(),
        allowFailure: allowFailure || _allowFailure,
        callData,
      }
    })

    const result = await multi.callStatic.aggregate3(_calls, ...(overrides ? [overrides] : []))

    return result.map((call: any, i: number) => {
      const { returnData, success } = call
      if (!success || returnData === '0x') return null
      const { abi, name } = calls[i]
      const itf = interfaceCache.get(abi)
      const decoded = itf?.decodeFunctionResult(name, returnData)
      return decoded
    })
  }
  const beraMulticallv2: MultiCallV2 = async ({ abi, calls, chainId = ftmTest.chainId, options }) => {
    const { requireSuccess = true, ...overrides } = options || {}
    const multi = getBeraMulticallContract()
    if (!multi) throw new Error(`Multicall Provider missing for ${chainId}`)
    const itf = new Interface(abi)

    const calldata = calls.map((call) => ({
      target: call.address.toLowerCase(),
      callData: itf.encodeFunctionData(call.name, call.params),
    }))

    const returnData = await multi.callStatic.tryAggregate(requireSuccess, calldata, overrides)
    const res = returnData.map((call: any, i: number) => {
      const [result, data] = call
      return result && data !== '0x' ? itf.decodeFunctionResult(calls[i].name, data) : null
    })

    return res as any
  }

  const beraMulticall: MultiCall = async (abi: any[], calls: Call[], chainId = ftmTest.chainId) => {
    const multi = getBeraMulticallContract()
    if (!multi) throw new Error(`Multicall Provider missing for ${chainId}`)
    const itf = new Interface(abi)

    const calldata = calls.map((call) => ({
      target: call.address.toLowerCase(),
      callData: itf.encodeFunctionData(call.name, call.params),
    }))
    const { returnData } = await multi.callStatic.aggregate(calldata)

    const res = returnData.map((call: any, i: number) => itf.decodeFunctionResult(calls[i].name, call))

    return res as any
  }
  return {
    beraMulticall,
    beraMulticallv2,
    beraMulticallv3,
  }
}

export const { beraMulticall, beraMulticallv2, beraMulticallv3 } = createMulticall()
