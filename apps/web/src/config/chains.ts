import { ChainId } from '@pancakeswap/sdk'
import { MultiCallV2 } from '@pancakeswap/multicall'
import memoize from 'lodash/memoize'
import invert from 'lodash/invert'
import { bsc, bscTestnet, goerli, mainnet } from 'wagmi/chains'
import { ethers } from 'ethers'
import { Interface, Fragment } from '@ethersproject/abi'
import { MulticallV3Params } from 'config'
import multicall3Abi from './abi/Multicall.json'

export const CHAIN_QUERY_NAME = {
  [ChainId.ETHEREUM]: 'eth',
  [ChainId.GOERLI]: 'goerli',
  [ChainId.BSC]: 'bsc',
  [ChainId.BSC_TESTNET]: 'bscTestnet',
} as const satisfies Record<ChainId, string>

const CHAIN_QUERY_NAME_TO_ID = invert(CHAIN_QUERY_NAME)

export const getChainId = memoize((chainName: string) => {
  if (!chainName) return undefined
  return CHAIN_QUERY_NAME_TO_ID[chainName] ? +CHAIN_QUERY_NAME_TO_ID[chainName] : undefined
})

export const CHAINS = [bsc, mainnet, bscTestnet, goerli]

export const ftmTest = {
  chainId: 4002,
  rpc: 'https://rpc.testnet.fantom.network',
  name: 'Fantom testnet',
  symbol: 'FTM',
  hexChainId: '0xfa2',
  blockExplorer: 'https://testnet.ftmscan.com',
  decimal: 18,
}

export const cakeVaultV2Address = {
  4002: '0xAE06cF3a2247aea8217e95E2e26b440bfB7C9b99',
}

export const beraTokenAddress = {
  4002: '0xC938173CccA0f3C917A0dC799B3dbEF89626fE2B',
}

export const beraSleepProfileAddress = {
  4002: '0xAec50Cc30f13Ce836c81314f83486a6A06D75BD2',
}

export const beraMulticallAddress = {
  4002: '0xE4019DfBc58f54fa4CE48EE90220FAd328A1A93c',
}

export const getBeraMulticallContract = (chainId: number = ftmTest.chainId) => {
  const multicallAddress = beraMulticallAddress[chainId ?? ftmTest.chainId]
  const ftmProvider = new ethers.providers.StaticJsonRpcProvider(ftmTest.rpc)
  return new ethers.Contract(multicallAddress, multicall3Abi, ftmProvider)
}

export const beraMulticallv3 = async ({
  calls,
  chainId = ftmTest.chainId,
  allowFailure,
  overrides,
}: MulticallV3Params) => {
  const multi = getBeraMulticallContract()
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

export const beraMulticallv2: MultiCallV2 = async ({ abi, calls, chainId = ftmTest.chainId, options }) => {
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
