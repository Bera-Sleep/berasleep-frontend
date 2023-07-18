import { ChainId, ERC20Token } from '@pancakeswap/sdk'

import memoize from 'lodash/memoize'
import invert from 'lodash/invert'
import { Bera } from 'config/abi/types'
import { bsc, bscTestnet, goerli, mainnet, fantomTestnet } from 'wagmi/chains'
import { ethers, Signer } from 'ethers'
import { Provider } from '@ethersproject/abstract-provider'
import { getBeraBunnyFactoryAddress } from 'utils/addressHelpers'
import multicall3Abi from './abi/Multicall.json'
import bunnyAbi from './abi/bunnyFactory.json'
import beraAbi from './abi/bera.json'

export const CHAIN_QUERY_NAME = {
  [ChainId.ETHEREUM]: 'eth',
  [ChainId.GOERLI]: 'goerli',
  [ChainId.BSC]: 'bsc',
  [ChainId.BSC_TESTNET]: 'bscTestnet',
  4002: 'ftmTestnet',
}

const CHAIN_QUERY_NAME_TO_ID = invert(CHAIN_QUERY_NAME)

export const getChainId = memoize((chainName: string) => {
  if (!chainName) return undefined
  return CHAIN_QUERY_NAME_TO_ID[chainName] ? +CHAIN_QUERY_NAME_TO_ID[chainName] : undefined
})

export const CHAINS = [bsc, mainnet, bscTestnet, goerli, fantomTestnet]

export interface IBlockChainData {
  chainId: number
  rpc: string
  name: string
  symbol: string
  hexChainId: string
  blockExplorer: string
  decimal: number
}

export const ftmTest: IBlockChainData = {
  chainId: 4002,
  rpc: 'https://rpc.testnet.fantom.network',
  name: 'Fantom testnet',
  symbol: 'FTM',
  hexChainId: '0xfa2',
  blockExplorer: 'https://testnet.ftmscan.com',
  decimal: 18,
}

export const bscMainnet: IBlockChainData = {
  chainId: 56,
  rpc: 'https://bsc.rpc.blxrbdn.com',
  name: 'BSC Mainnet',
  symbol: 'BNB',
  hexChainId: '0x38',
  blockExplorer: 'https://bscscan.com/',
  decimal: 18,
}

export const blockChainData = {
  56: bscMainnet,
  4002: ftmTest,
}

export const beraNftMarketV1 = {
  4002: '0xF47Eb2Aa00f760Ab863f0fa00675e05785DA3A80',
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

export const beraBunnyFactoryAddress = {
  4002: '0xD7c6BE9b454C9a0fCd45462C0317F5e7fe630Fe9',
}

export const beraMasterChefV3Address = {
  4002: '0x70F3Db6104306c739Ee3fddc4cAbF1EE36fE9108',
  56: '0x556B9306565093C855AEA9AE92A594704c2Cd59e',
}

export const newProvider = {
  [ftmTest.chainId]: new ethers.providers.StaticJsonRpcProvider(ftmTest.rpc),
  [bscMainnet.chainId]: new ethers.providers.StaticJsonRpcProvider(bscMainnet.rpc),
}

export const getBeraMulticallContract = (chainId: number = ftmTest.chainId) => {
  const multicallAddress = beraMulticallAddress[chainId ?? ftmTest.chainId]
  return new ethers.Contract(multicallAddress, multicall3Abi, newProvider[chainId])
}

export const getBeraBunnyFactoryContract = (
  chainId: number = ftmTest.chainId,
  signerOrProvider?: Signer | Provider,
) => {
  const bunnyFactoryAddress = getBeraBunnyFactoryAddress(chainId)
  return new ethers.Contract(bunnyFactoryAddress, bunnyAbi, signerOrProvider ?? newProvider[chainId])
}

export const BERA_TOKEN_ADDRESS = {
  4002: '0xC938173CccA0f3C917A0dC799B3dbEF89626fE2B',
}

export const getBeraTokenContract = (chainId: number = ftmTest.chainId, signerOrProvider?: Signer | Provider) => {
  const address = BERA_TOKEN_ADDRESS[chainId]
  return new ethers.Contract(address, beraAbi, signerOrProvider ?? newProvider[chainId]) as Bera
}

export const beraApiCollection = {
  '0xd29B0c964638200b709e0558651a28Ac4bb16AF4': {
    active: true,
    address: '0xd29B0c964638200b709e0558651a28Ac4bb16AF4',
    avatar: 'https://static-nft.pancakeswap.com/mainnet/0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07/avatar.png',
    banner: {
      large: 'https://static-nft.pancakeswap.com/mainnet/0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07/banner-lg.png',
      small: '"https://static-nft.pancakeswap.com/mainnet/0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07/banner-sm.png"',
    },
    createdAt: '2020-12-11T02:32:55.000Z',
    creatorAddress: '0x0000000000000000000000000000000000000000',
    creatorFee: '0',
    description:
      'Pancake Bunnies are PancakeSwap’s first lovingly home-raised NFT collection. Earn bunnies by completing tasks, winning competitions, and more!',
    id: '0xd29B0c964638200b709e0558651a28Ac4bb16AF4',
    name: 'BeraSleep Bunnies',
    numberTokensListed: '24642',
    owner: '0x8016Eb5178d2b0a53d42Ed4D13A6a17C2078228a',
    symbol: 'BB',
    totalSupply: '968330',
    totalTrades: '113491',
    totalVolumeBNB: '34611.208827886752432609',
    tradingFee: '2',
    updatedAt: '2020-12-11T02:32:55.000Z',
    verified: true,
    whitelistChecker: '0x0000000000000000000000000000000000000000',
  },
}

export const getBeraNftMarketAddress = (chainId: number = ftmTest.chainId) => {
  return beraNftMarketV1[chainId]
}
