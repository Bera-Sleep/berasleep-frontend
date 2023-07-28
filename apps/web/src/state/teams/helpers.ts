import merge from 'lodash/merge'
import teamsList from 'config/constants/teams'
import { getProfileContract } from 'utils/contractHelpers'
import { Team } from 'config/constants/types'
import { multicallv2 } from 'utils/multicall'
import { TeamsById } from 'state/types'
import profileABI from 'config/abi/pancakeProfile.json'
import { getBeraSleepProfileAddress, getPancakeProfileAddress } from 'utils/addressHelpers'
import fromPairs from 'lodash/fromPairs'
import { beraMulticallv2 } from 'config/fn'

const profileContract = getProfileContract()

export const getTeam = async (teamId: number): Promise<Team> => {
  try {
    const { 0: teamName, 2: numberUsers, 3: numberPoints, 4: isJoinable } = await profileContract.getTeamProfile(teamId)
    const staticTeamInfo = teamsList.find((staticTeam) => staticTeam.id === teamId)

    return merge({}, staticTeamInfo, {
      isJoinable,
      name: teamName,
      users: numberUsers.toNumber(),
      points: numberPoints.toNumber(),
    })
  } catch (error) {
    return null
  }
}

/**
 * Gets on-chain data and merges it with the existing static list of teams
 */
export const getTeams = async (): Promise<TeamsById> => {
  try {
    const teamsById = fromPairs(teamsList.map((team) => [team.id, team]))
    const nbTeams = await profileContract.numberTeams()

    const calls = []
    for (let i = 1; i <= nbTeams.toNumber(); i++) {
      calls.push({
        address: getPancakeProfileAddress(),
        name: 'getTeamProfile',
        params: [i],
      })
    }
    const teamData = await multicallv2({ abi: profileABI, calls })

    const onChainTeamData = fromPairs(
      teamData.map((team, index) => {
        const { 0: teamName, 2: numberUsers, 3: numberPoints, 4: isJoinable } = team

        return [
          index + 1,
          {
            name: teamName,
            users: numberUsers.toNumber(),
            points: numberPoints.toNumber(),
            isJoinable,
          },
        ]
      }),
    )

    return merge({}, teamsById, onChainTeamData)
  } catch (error) {
    return null
  }
}

export const getBeraTeams = async (): Promise<TeamsById> => {
  try {
    const teamsById = fromPairs(teamsList.map((team) => [team.id, team]))
    const nbTeams = await profileContract.numberTeams()

    const calls = []
    for (let i = 1; i <= nbTeams.toNumber(); i++) {
      calls.push({
        address: getBeraSleepProfileAddress(),
        name: 'getTeamProfile',
        params: [i],
      })
    }
    const teamData = await beraMulticallv2({ abi: profileABI, calls })
    console.log('🚀 ~ file: helpers.ts:84 ~ getBeraTeams ~ teamData:', teamData)

    const onChainTeamData = fromPairs(
      teamData.map((team, index) => {
        const { 0: teamName, 2: numberUsers, 3: numberPoints, 4: isJoinable } = team

        return [
          index + 1,
          {
            name: teamName,
            users: numberUsers.toNumber(),
            points: numberPoints.toNumber(),
            isJoinable,
          },
        ]
      }),
    )
    console.log('meraaaaa', merge({}, teamsById, onChainTeamData))

    return merge({}, teamsById, onChainTeamData)
  } catch (error) {
    return null
  }
}
