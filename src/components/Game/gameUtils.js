export const createNextRound = (fixedCourts, matches, winners) => {
    const minCourt = Math.min(...fixedCourts)
    const maxCourt = Math.max(...fixedCourts)
  
    const courtMap = {}
    fixedCourts.forEach(court => {
      courtMap[court] = []
    })
  
    matches.forEach(match => {
      const { court, teams } = match
      const winningTeamKey = winners[court]
      const losingTeamKey = winningTeamKey === 'teamA' ? 'teamB' : 'teamA'
  
      const winner = teams[winningTeamKey]
      const loser = teams[losingTeamKey]
  
      // Winner moves UP (+1) unless at max court
      const winnerCourt = court === maxCourt ? court : court + 1
      // Loser moves DOWN (-1) unless at min court
      const loserCourt = court === minCourt ? court : court - 1
  
      courtMap[winnerCourt].push(winner)
      courtMap[loserCourt].push(loser)
    })
  
    const shuffleArray = arr => arr.sort(() => Math.random() - 0.5)
  
    Object.entries(courtMap).forEach(([court, teams]) => {
      const [team1, team2] = teams
      if (!team1 || !team2) return
  
      const [p1a, p1b] = team1
      const shuffledTeam2 = shuffleArray([...team2])
      const [p2a, p2b] = shuffledTeam2
  
      courtMap[court] = [
        [p1a, p2a],
        [p1b, p2b],
      ]
    })
  
    return fixedCourts.map(court => {
      const players = courtMap[court]
  
      return {
        court,
        teams: {
          teamA: players[0] || [],
          teamB: players[1] || []
        },
        winners: null
      }
    })
  }
  