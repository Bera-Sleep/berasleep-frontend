import { ChainId } from '@pancakeswap/sdk'

import { SupportedChainId } from './supportedChains'

export type ContractAddresses<T extends ChainId = SupportedChainId> = {
  [chainId in T]: string
}

export const ICAKE = {
  [ChainId.BSC]: '0x3C458828D1622F5f4d526eb0d24Da8C4Eb8F07b1',
  [ChainId.BSC_TESTNET]: '',
  4002: '0x96bB02c9786DE2cb9FF6b650DA29f7FA7F21BDEE',
} as ContractAddresses

export const CAKE_VAULT = {
  [ChainId.BSC]: '0x45c54210128a065de780C4B0Df3d16664f7f859e',
  [ChainId.BSC_TESTNET]: '0x683433ba14e8F26774D43D3E90DA6Dd7a22044Fe',
  4002: '0xAE06cF3a2247aea8217e95E2e26b440bfB7C9b99',
} as ContractAddresses

export const CAKE_FLEXIBLE_SIDE_VAULT = {
  [ChainId.BSC]: '0x615e896A8C2CA8470A2e9dc2E9552998f8658Ea0',
  [ChainId.BSC_TESTNET]: '',
  4002: '0xFb9e73081EF7AF9E61E736226ac3B7f3d387C772',
} as ContractAddresses
