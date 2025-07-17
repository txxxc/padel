export const fetchSavedTournaments2 = async () => {
    try {
      const response = await fetch('/api/dynamodb?groupId=GROUP%231')
      if (!response.ok) throw new Error('Failed to fetch tournaments')
      const tournaments = await response.json()
      return tournaments.map(t => t.tournament_id)
    } catch (error) {
      console.error('Error fetching saved tournaments:', error)
      return []
    }
  }
  
  export const saveGame = async (gameData) => {
    try {
      const response = await fetch('/api/dynamodb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      })
      if (!response.ok) throw new Error('Failed to save game')
      return await response.json()
    } catch (error) {
      console.error('Error saving game:', error)
      throw error
    }
  }
  
  export const fetchTournamentById = async (tournamentId) => {
    try {
      const response = await fetch('/api/dynamodb?groupId=GROUP#1')
      if (!response.ok) throw new Error('Failed to fetch tournaments')
      const tournaments = await response.json()
      return tournaments.find(t => t.tournament_id === tournamentId)
    } catch (error) {
      console.error('Error fetching tournament:', error)
      return null
    }
  }