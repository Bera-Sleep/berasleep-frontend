import { useContext, useEffect, useState } from 'react'
import styled from 'styled-components'
import {
  AutoRenewIcon,
  Button,
  Card,
  CardBody,
  Heading,
  Skeleton,
  Text,
  useToast,
  NextLinkFromReactRouter,
} from '@pancakeswap/uikit'
import { useAccount, useSigner } from 'wagmi'
import { getBeraSleepProfileAddress } from 'utils/addressHelpers'
import { getErc721Contract } from 'utils/contractHelpers'
import { useTranslation } from '@pancakeswap/localization'
import { beraMulticall } from 'config/fn'
import { useBeraBunniesContract, useBeraProfileContract } from 'hooks/useContract'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'
import useCatchTxError from 'hooks/useCatchTxError'
import { nftsBaseUrl } from 'views/Nft/market/constants'
import { NftLocation } from 'state/nftMarket/types'
import { useProfile } from 'state/profile/hooks'
import SelectionCard from './SelectionCard'
import NextStepButton from './NextStepButton'
import { ProfileCreationContext } from './contexts/ProfileCreationProvider'
import multicall from '../../utils/multicall'
import profileABI from '../../config/abi/pancakeProfile.json'
import { useBeraNftsForAddress } from '../Nft/market/hooks/useNftsForAddress'

const Link = styled(NextLinkFromReactRouter)`
  color: ${({ theme }) => theme.colors.primary};
`

const NftWrapper = styled.div`
  margin-bottom: 24px;
`

const ProfilePicture: React.FC = () => {
  const { address: account } = useAccount()
  const [isApproved, setIsApproved] = useState(false)
  const [isProfileNftsLoading, setIsProfileNftsLoading] = useState(true)
  const [userProfileCreationNfts, setUserProfileCreationNfts] = useState(null)
  const bunnyContract = useBeraBunniesContract()
  const { selectedNft, actions } = useContext(ProfileCreationContext)
  console.log('🚀 ~ file: ProfilePicture.tsx:45 ~ selectedNft:', selectedNft)

  const profileContract = useBeraProfileContract(false)
  const { isLoading: isProfileLoading, profile } = useProfile()
  console.log('🚀 ~ file: ProfilePicture.tsx:50 ~ profile:', profile)
  const { nfts, isLoading: isUserNftLoading } = useBeraNftsForAddress(account, profile, isProfileLoading)
  console.log('🚀 ~ file: ProfilePicture.tsx:51 ~ nfts:', nfts)

  useEffect(() => {
    const fetchUserPancakeCollectibles = async () => {
      try {
        const nftsByCollection = Array.from(
          nfts.reduce((acc, value) => {
            acc.add(value.collectionAddress)
            return acc
          }, new Set<string>()),
        )
        console.log(
          '🚀 ~ file: ProfilePicture.tsx:62 ~ fetchUserPancakeCollectibles ~ nftsByCollection:',
          nftsByCollection,
        )

        if (nftsByCollection.length > 0) {
          const nftRole = await profileContract.NFT_ROLE()
          const collectionsNftRoleCalls = nftsByCollection.map((collectionAddress) => {
            return {
              address: profileContract.address,
              name: 'hasRole',
              params: [nftRole, collectionAddress],
            }
          })
          const collectionRolesRaw = await beraMulticall(profileABI, collectionsNftRoleCalls)
          console.log(
            '🚀 ~ file: ProfilePicture.tsx:78 ~ fetchUserPancakeCollectibles ~ collectionRolesRaw:',
            collectionRolesRaw,
          )
          const collectionRoles = collectionRolesRaw.flat()
          console.log(
            '🚀 ~ file: ProfilePicture.tsx:83 ~ fetchUserPancakeCollectibles ~ collectionRoles:',
            collectionRoles,
          )
          setUserProfileCreationNfts(
            nfts.filter((nft) => collectionRoles[nftsByCollection.indexOf(nft.collectionAddress)]),
          )
        } else {
          setUserProfileCreationNfts(null)
        }
      } catch (e) {
        console.error(e)
        setUserProfileCreationNfts(null)
      } finally {
        setIsProfileNftsLoading(false)
      }
    }
    if (!isUserNftLoading) {
      setIsProfileNftsLoading(true)
      fetchUserPancakeCollectibles()
    }
  }, [nfts, profileContract, isUserNftLoading])

  useEffect(() => {
    const checkNftIsAprrove = async () => {
      if (selectedNft?.tokenId) {
        const nftApprovedAddress = await bunnyContract.getApproved(selectedNft.tokenId)
        const beraSleepProfileAddress = getBeraSleepProfileAddress()
        if (nftApprovedAddress === beraSleepProfileAddress) {
          setIsApproved(true)
        }
      }
    }
    checkNftIsAprrove()
  }, [selectedNft, bunnyContract])

  const { t } = useTranslation()
  const { toastSuccess } = useToast()
  const { fetchWithCatchTxError, loading: isApproving } = useCatchTxError()
  const { callWithGasPrice } = useCallWithGasPrice()
  const { data: signer } = useSigner()

  const handleApprove = async () => {
    const contract = getErc721Contract(selectedNft.collectionAddress, signer)
    const receipt = await fetchWithCatchTxError(() => {
      return callWithGasPrice(contract, 'approve', [getBeraSleepProfileAddress(), selectedNft.tokenId])
    })
    if (receipt?.status) {
      toastSuccess(t('Enabled'), t('Please progress to the next step.'))
      setIsApproved(true)
    }
  }

  if (!userProfileCreationNfts?.length && !isProfileNftsLoading) {
    return (
      <>
        <Heading scale="xl" mb="24px">
          {t('Oops!')}
        </Heading>
        <Text bold fontSize="20px" mb="24px">
          {t('We couldn’t find any Pancake Collectibles in your wallet.')}
        </Text>
        <Text as="p" mb="24px">
          {t('Only approved Pancake Collectibles can be used.')}
          <Link to={`${nftsBaseUrl}/profile/pancake-collectibles`} style={{ marginLeft: '4px' }}>
            {t('See the list >')}
          </Link>
        </Text>
        <Text as="p">
          {t(
            'You need a Pancake Collectible to finish setting up your profile. If you sold or transferred your starter collectible to another wallet, you’ll need to get it back or acquire a new one somehow. You can’t make a new starter with this wallet address.',
          )}
        </Text>
      </>
    )
  }

  return (
    <>
      <Text fontSize="20px" color="textSubtle" bold>
        {t('Step %num%', { num: 2 })}
      </Text>
      <Heading as="h3" scale="xl" mb="24px">
        {t('Set Profile Picture')}
      </Heading>
      <Card mb="24px">
        <CardBody>
          <Heading as="h4" scale="lg" mb="8px">
            {t('Choose collectible')}
          </Heading>
          <Text as="p" color="textSubtle">
            {t('Choose a profile picture from the eligible collectibles (NFT) in your wallet, shown below.')}
          </Text>
          <Text as="p" color="textSubtle" mb="24px">
            {t('Only approved Pancake Collectibles can be used.')}
            <Link to={`${nftsBaseUrl}/collections`} style={{ marginLeft: '4px' }}>
              {t('See the list >')}
            </Link>
          </Text>
          <NftWrapper>
            {userProfileCreationNfts?.length ? (
              userProfileCreationNfts
                // .filter((walletNft) => walletNft.location === NftLocation.WALLET)
                .map((walletNft) => {
                  return (
                    <SelectionCard
                      name="profilePicture"
                      key={`${walletNft.collectionAddress}#${walletNft.tokenId}`}
                      value={walletNft.tokenId}
                      image={walletNft.image.thumbnail}
                      isChecked={walletNft.tokenId === selectedNft.tokenId}
                      onChange={(value: string) => actions.setSelectedNft(value, walletNft.collectionAddress)}
                    >
                      <Text bold>{walletNft.name}</Text>
                    </SelectionCard>
                  )
                })
            ) : (
              <Skeleton width="100%" height="64px" />
            )}
          </NftWrapper>
          <Heading as="h4" scale="lg" mb="8px">
            {t('Allow collectible to be locked')}
          </Heading>
          <Text as="p" color="textSubtle" mb="16px">
            {t(
              "The collectible you've chosen will be locked in a smart contract while it’s being used as your profile picture. Don't worry - you'll be able to get it back at any time.",
            )}
          </Text>
          <Button
            isLoading={isApproving}
            disabled={isApproved || isApproving || selectedNft.tokenId === null}
            onClick={handleApprove}
            endIcon={isApproving ? <AutoRenewIcon spin color="currentColor" /> : undefined}
            id="approveStarterCollectible"
          >
            {t('Enable')}
          </Button>
        </CardBody>
      </Card>
      <NextStepButton onClick={actions.nextStep} disabled={selectedNft.tokenId === null || !isApproved || isApproving}>
        {t('Next Step')}
      </NextStepButton>
    </>
  )
}

export default ProfilePicture
