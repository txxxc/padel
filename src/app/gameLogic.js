import { v4 as uuidv4 } from 'uuid'
/** Constants for configuration */
const MIN_PLAYERS = 12
const GROUP_SIZE = 4

/** Shuffles an array in-place */
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Generates initial tournament round from player list */
const generateTournament = (players) => {
  if (players.length < MIN_PLAYERS || players.length % GROUP_SIZE !== 0) return null

  const shuffledPlayers = shuffle([...players])
  const teams = []
  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    teams.push([shuffledPlayers[i], shuffledPlayers[i + 1]])
  }
  const shuffledTeams = shuffle([...teams])

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

/** Initializes the game structure with tournament_id */
const createGame = (players) => {
  const tournament = generateTournament(players)
  if (!tournament) throw new Error('Player validation failed.')

  const tournament_id = uuidv4()

  return { tournament_id, rounds: [tournament] }
}

/** Generates next round of matches based on previous winners */
const createNextRound = (fixedCourts, matches, winners) => {
  const courtMap = {}
  fixedCourts.forEach(court => { courtMap[court] = [] })

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

  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5)

  Object.entries(courtMap).forEach(([court, teams]) => {
    const [t1, t2] = teams
    if (!t1 || !t2) return

    const [a1, a2] = t1
    const [b1, b2] = shuffleArray([...t2])

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

export { MIN_PLAYERS, GROUP_SIZE, shuffle, generateTournament, createGame, createNextRound }