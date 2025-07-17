import { v4 as uuidv4 } from 'uuid'

/** Minimum number of players required for a tournament */
export const MIN_PLAYERS = 12
/** Number of players per group */
export const GROUP_SIZE = 4

/**
 * Shuffles an array in-place using Fisher-Yates algorithm.
 * @param {Array} arr
 * @returns {Array}
 */
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Generates the initial tournament round from a player list.
 * @param {Array} players
 * @returns {Object|null}
 */
const generateTournament = (players) => {
  if (players.length < MIN_PLAYERS || players.length % GROUP_SIZE !== 0) return null

  const shuffledPlayers = shuffle([...players])
  const teams = []
  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    teams.push([shuffledPlayers[i], shuffledPlayers[i + 1]])
  }
  const shuffledTeams = shuffle(teams)

  const matches = []
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    matches.push({
      court: i / 2 + 1,
      teams: {
        teamA: shuffledTeams[i],
        teamB: shuffledTeams[i + 1]
      },
      winners: null
    })
  }

  return { matches }
}

/**
 * Initializes the game structure with a tournament_id.
 * @param {Array} players
 * @returns {Object}
 */
export const createGame = (players) => {
  const tournament = generateTournament(players)
  if (!tournament) throw new Error('Player validation failed.')
  return { tournament_id: uuidv4(), rounds: [tournament] }
}

/**
 * Generates the next round of matches based on previous winners.
 * @param {Array<number>} fixedCourts
 * @param {Array<Object>} matches
 * @param {Object} winners
 * @returns {Array<Object>}
 */
export const createNextRound = (fixedCourts, matches, winners) => {
  const courtMap = Object.fromEntries(fixedCourts.map(court => [court, []]))

  matches.forEach(({ court, teams }) => {
    const winKey = winners[court]
    const loseKey = winKey === 'teamA' ? 'teamB' : 'teamA'
    const winTeam = teams[winKey]
    const loseTeam = teams[loseKey]
    const winCourt = court === Math.max(...fixedCourts) ? court : court + 1
    const loseCourt = court === Math.min(...fixedCourts) ? court : court - 1
    courtMap[winCourt].push(winTeam)
    courtMap[loseCourt].push(loseTeam)
  })

  const shuffleArray = arr => [...arr].sort(() => Math.random() - 0.5)

  Object.entries(courtMap).forEach(([court, teams]) => {
    if (teams.length < 2) return
    const [a1, a2] = teams[0]
    const [b1, b2] = shuffleArray(teams[1])
    courtMap[court] = [[a1, b1], [a2, b2]]
  })

  return fixedCourts.map(court => ({
    court,
    teams: {
      teamA: courtMap[court]?.[0] || [],
      teamB: courtMap[court]?.[1] || []
    },
    winners: null
  }))
}