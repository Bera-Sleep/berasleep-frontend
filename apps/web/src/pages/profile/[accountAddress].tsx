import { useAccount } from 'wagmi'
import { useRouter } from 'next/router'
import { useProfileForAddress } from 'state/profile/hooks'
import { NftProfileLayout } from 'views/Profile'
import SubMenu from 'views/Profile/components/SubMenu'
import UnconnectedProfileNfts from 'views/Profile/components/UnconnectedProfileNfts'
import UserNfts from 'views/Profile/components/UserNfts'
import { useBeraNftsForAddress, useNftsForAddress } from 'views/Nft/market/hooks/useNftsForAddress'

const NftProfilePage = () => {
  const { address: account } = useAccount()
  const accountAddress = useRouter().query.accountAddress as string
  const isConnectedProfile = account?.toLowerCase() === accountAddress?.toLowerCase()
  const {
    profile,
    isValidating: isProfileFetching,
    refresh: refreshProfile,
  } = useProfileForAddress(accountAddress, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const {
    nfts,
    isLoading: isNftLoading,
    refresh: refreshUserNfts,
  } = useBeraNftsForAddress(accountAddress, profile, isProfileFetching)
  console.log('🚀 ~ file: [accountAddress].tsx:29 ~ NftProfilePage ~ nfts:', nfts)

  return (
    <>
      <SubMenu />
      {isConnectedProfile ? (
        <UserNfts
          nfts={nfts}
          isLoading={isNftLoading}
          onSuccessSale={refreshUserNfts}
          onSuccessEditProfile={async () => {
            await refreshProfile()
            refreshUserNfts()
          }}
        />
      ) : (
        <UnconnectedProfileNfts nfts={nfts} isLoading={isNftLoading} />
      )}
    </>
  )
}

NftProfilePage.Layout = NftProfileLayout

export default NftProfilePage
