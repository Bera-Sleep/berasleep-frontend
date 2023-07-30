import { useMemo, useRef } from 'react'
import isEmpty from 'lodash/isEmpty'
import { useGetCollections } from 'state/nftMarket/hooks'
import { NftLocation, ApiCollections } from 'state/nftMarket/types'
import { Profile } from 'state/types'
import { getBeraCompleteAccountNftData, getCompleteAccountNftData } from 'state/nftMarket/helpers'
import useSWR from 'swr'
import { FetchStatus } from 'config/constants/types'
import { usePreviousValue } from '@pancakeswap/hooks'
import { isAddress } from 'utils'
import { beraApiCollection } from 'config/chains'
import { useBeraBunniesContract } from 'hooks/useContract'

export const useNftsForAddress = (account: string, profile: Profile, isProfileFetching: boolean) => {
  const { data: collections } = useGetCollections()
  console.log('collections', collections)

  const { nfts, isLoading, refresh } = useCollectionsNftsForAddress(account, profile, isProfileFetching, collections)
  console.log('🚀 ~ file: useNftsForAddress.tsx:17 ~ useNftsForAddress ~ nfts:', nfts)

  return { nfts, isLoading, refresh }
}

export const useBeraNftsForAddress = (account: string, profile: Profile, isProfileFetching: boolean) => {
  const collections = { ...beraApiCollection }
  console.log('collections', collections)

  const { nfts, isLoading, refresh } = useBeraCollectionsNftsForAddress(
    account,
    profile,
    isProfileFetching,
    collections,
  )
  console.log('🚀 ~ file: useNftsForAddress.tsx:17 ~ useNftsForAddress ~ nfts:', nfts)

  return { nfts, isLoading, refresh }
}

export const useCollectionsNftsForAddress = (
  account: string,
  profile: Profile,
  isProfileFetching: boolean,
  collections: ApiCollections,
) => {
  console.log('🚀 ~ file: useNftsForAddress.tsx:28 ~ profile:', profile)
  const resetLaggyRef = useRef(null)
  const previousAccount = usePreviousValue(account)
  console.log('🚀 ~ file: useNftsForAddress.tsx:30 ~ previousAccount:', previousAccount)

  if (resetLaggyRef.current && previousAccount !== account) {
    resetLaggyRef.current()
  }
  const hasProfileNft = profile?.tokenId
  const profileNftTokenId = profile?.tokenId?.toString()
  const profileNftCollectionAddress = profile?.collectionAddress

  const profileNftWithCollectionAddress = useMemo(() => {
    if (hasProfileNft) {
      return {
        tokenId: profileNftTokenId,
        collectionAddress: profileNftCollectionAddress,
        nftLocation: NftLocation.PROFILE,
      }
    }
    return null
  }, [profileNftTokenId, profileNftCollectionAddress, hasProfileNft])

  // @ts-ignore
  const { status, data, mutate, resetLaggy } = useSWR(
    !isProfileFetching && !isEmpty(collections) && isAddress(account) ? [account, 'userNfts'] : null,
    async () => getCompleteAccountNftData(account, collections, profileNftWithCollectionAddress),
    {
      keepPreviousData: true,
    },
  )

  resetLaggyRef.current = resetLaggy

  return { nfts: data ?? [], isLoading: status !== FetchStatus.Fetched, refresh: mutate }
}

export const useBeraCollectionsNftsForAddress = (
  account: string,
  profile: Profile,
  isProfileFetching: boolean,
  collections: ApiCollections,
) => {
  const resetLaggyRef = useRef(null)
  const previousAccount = usePreviousValue(account)
  const beraBunniesContract = useBeraBunniesContract()

  if (resetLaggyRef.current && previousAccount !== account) {
    resetLaggyRef.current()
  }
  const hasProfileNft = profile?.isActive
  console.log('🚀 ~ file: useNftsForAddress.tsx:96 ~ hasProfileNft:', hasProfileNft)
  const profileNftTokenId = profile?.tokenId?.toString()
  const profileNftCollectionAddress = profile?.collectionAddress

  const profileNftWithCollectionAddress = useMemo(() => {
    if (hasProfileNft) {
      return {
        tokenId: profileNftTokenId,
        collectionAddress: profileNftCollectionAddress,
        nftLocation: NftLocation.PROFILE,
      }
    }
    return null
  }, [profileNftTokenId, profileNftCollectionAddress, hasProfileNft])

  // @ts-ignore
  const { status, data, mutate, resetLaggy } = useSWR(
    !isProfileFetching && !isEmpty(collections) && isAddress(account) ? [account, 'userNfts'] : null,
    async () =>
      getBeraCompleteAccountNftData(account, collections, beraBunniesContract, profileNftWithCollectionAddress),
    {
      keepPreviousData: true,
    },
  )

  resetLaggyRef.current = resetLaggy

  return { nfts: data ?? [], isLoading: status !== FetchStatus.Fetched, refresh: mutate }
}
