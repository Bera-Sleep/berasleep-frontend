import { Profile } from 'state/types'
import { PancakeProfile } from 'config/abi/types/PancakeProfile'
import profileABI from 'config/abi/pancakeProfile.json'
import { API_PROFILE } from 'config/constants/endpoints'
import { getTeam } from 'state/teams/helpers'
import { NftToken } from 'state/nftMarket/types'
import { getBeraNftApi, getNftApi } from 'state/nftMarket/helpers'
import { multicallv2 } from 'utils/multicall'
import { getBeraSleepProfileAddress, getPancakeProfileAddress } from 'utils/addressHelpers'
import { beraMulticallv2 } from 'config/fn'
import { BERA_API } from 'config/chains'

export interface GetProfileResponse {
  hasRegistered: boolean
  profile?: Profile
}

const transformProfileResponse = (
  profileResponse: Awaited<ReturnType<PancakeProfile['getUserProfile']>>,
): Partial<Profile> => {
  const { 0: userId, 1: numberPoints, 2: teamId, 3: collectionAddress, 4: tokenId, 5: isActive } = profileResponse

  return {
    userId: userId.toNumber(),
    points: numberPoints.toNumber(),
    teamId: teamId.toNumber(),
    tokenId: tokenId.toNumber(),
    collectionAddress,
    isActive,
  }
}

export const getUsername = async (address: string): Promise<string> => {
  try {
    const response = await fetch(`${API_PROFILE}/api/users/${address.toLowerCase()}`)

    if (!response.ok) {
      return ''
    }

    const { username = '' } = await response.json()

    return username
  } catch (error) {
    return ''
  }
}

export const getBeraUsername = async (address: string): Promise<string> => {
  try {
    const response = await fetch(`${BERA_API}/api/v1/profile/${address.toLowerCase()}`)

    if (!response.ok) {
      return ''
    }

    const { username = '' } = await response.json()

    return username
  } catch (error) {
    return ''
  }
}

export const getProfile = async (address: string): Promise<GetProfileResponse> => {
  try {
    const profileCalls = ['hasRegistered', 'getUserProfile'].map((method) => {
      return { address: getBeraSleepProfileAddress(), name: method, params: [address] }
    })
    const profileCallsResult = await beraMulticallv2({
      abi: profileABI,
      calls: profileCalls,
      options: { requireSuccess: false },
    })
    const [[hasRegistered], profileResponse] = profileCallsResult
    console.log('🚀 ~ file: helpers.ts:76 ~ getProfile ~ hasRegistered:', hasRegistered)
    if (!hasRegistered) {
      return { hasRegistered, profile: null }
    }

    const { userId, points, teamId, tokenId, collectionAddress, isActive } = transformProfileResponse(profileResponse)
    console.log('🚀 ~ file: helpers.ts:82 ~ getProfile ~ teamId:', teamId)
    console.log('isActive', isActive)
    const [team, username, nftRes] = await Promise.all([
      getTeam(teamId),
      getBeraUsername(address),
      isActive ? getBeraNftApi(collectionAddress, tokenId.toString()) : Promise.resolve(null),
    ])
    let nftToken: NftToken
    console.log('🚀 ~ file: helpers.ts:85 ~ getProfile ~ nftRes:', nftRes)

    // If the profile is not active the tokenId returns 0, which is still a valid token id
    // so only fetch the nft data if active
    if (nftRes) {
      console.log('testsssss')
      nftToken = {
        tokenId: nftRes.tokenId,
        name: nftRes.name,
        collectionName: nftRes?.collection?.name || nftRes?.name,
        collectionAddress,
        description: nftRes.description,
        attributes: nftRes.attributes,
        createdAt: nftRes.createdAt,
        updatedAt: nftRes.updatedAt,
        image: {
          original: nftRes.image?.original,
          thumbnail: nftRes.image?.thumbnail,
        },
      }
    }

    const profile = {
      userId,
      points,
      teamId,
      tokenId,
      username,
      collectionAddress,
      isActive,
      nft: nftToken,
      team,
    } as Profile
    console.log('🚀 ~ file: helpers.ts:122 ~ getProfile ~ profile:', profile)

    return { hasRegistered, profile }
  } catch (e) {
    return null
  }
}
