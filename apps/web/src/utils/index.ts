import type { Signer } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { BigNumber, Contract } from 'ethers'
import { AddressZero } from '@ethersproject/constants'
import { ftmTest } from 'config/chains'
import type { Provider } from '@ethersproject/providers'
import { ChainId, Currency } from '@pancakeswap/sdk'
import { bsc } from 'wagmi/chains'
import memoize from 'lodash/memoize'
import { TokenAddressMap } from '@pancakeswap/token-lists'
import { chains } from './wagmi'

// returns the checksummed address if the address is valid, otherwise returns false
export const isAddress = memoize((value: any): string | false => {
  try {
    return getAddress(value)
  } catch {
    return false
  }
})

export function getBlockExploreLink(
  data: string | number,
  type: 'transaction' | 'token' | 'address' | 'block' | 'countdown',
  chainIdOverride?: number,
): string {
  const chain = ftmTest

  // if (!chain) return ftmTest.blockExplorer
  switch (type) {
    case 'transaction': {
      return `${chain.blockExplorer}/tx/${data}`
    }
    case 'token': {
      return `${chain.blockExplorer}/token/${data}`
    }
    case 'block': {
      return `${chain.blockExplorer}/block/${data}`
    }
    case 'countdown': {
      return `${chain.blockExplorer}/block/countdown/${data}`
    }
    default: {
      return `${chain.blockExplorer}/address/${data}`
    }
  }
}

export function getBlockExploreName(chainIdOverride?: number) {
  const chainId = chainIdOverride || ChainId.BSC
  const chain = chains.find((c) => c.id === chainId)

  return chain?.blockExplorers?.default.name || bsc.blockExplorers.default.name
}

export function getBscScanLinkForNft(collectionAddress: string, tokenId: string): string {
  return `${bsc.blockExplorers.default.url}/token/${collectionAddress}?a=${tokenId}`
}

// add 10%
export function calculateGasMargin(value: BigNumber, margin = 1000): BigNumber {
  return value.mul(BigNumber.from(10000).add(BigNumber.from(margin))).div(BigNumber.from(10000))
}

// account is optional
export function getContract(address: string, ABI: any, signer?: Signer | Provider): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, signer)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(defaultTokens: TokenAddressMap<ChainId>, currency?: Currency): boolean {
  if (currency?.isNative) return true
  return Boolean(currency?.isToken && defaultTokens[currency.chainId]?.[currency.address])
}
