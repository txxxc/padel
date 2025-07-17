'use client'

import { useEffect, useState } from 'react'
import { createGame } from './gameLogic'
import { GroupSelector } from '@/app/GroupSelector'
import { Game } from './Game'
import { fetchSavedTournaments2 } from '@/utils/api'

/** Main Home component */
export default function Home() {
  const [savedGameData, setSavedGameData] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [gamePlayers, setGamePlayers] = useState(null)
  const [savedTournaments, setSavedTournaments] = useState([])
  const [selectedTournamentId, setSelectedTournamentId] = useState(null)

  const updateUrlTournamentId = (tournamentId) => {
    const url = new URL(window.location)
    if (tournamentId) {
      url.searchParams.set('tournament_id', tournamentId)
    } else {
      url.searchParams.delete('tournament_id')
    }
    window.history.replaceState(null, '', url.toString())
  }

  const getTournamentIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tournament_id')
  }

  useEffect(() => {
    const fetchSavedTournaments = async () => {
      try {
        // Fetch tournaments from DynamoDB via your API route
        const response = await fetch('/api/dynamodb', { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to fetch tournaments')

        const tournaments = await response.json()
        const tournamentIds = tournaments.map(tournament => tournament.tournament_id)

        setSavedTournaments(tournamentIds)
        console.log(`DynamoDB::`, tournamentIds)

        // Get the tournament ID from the URL or fallback to the last saved tournament ID
        const urlTournamentId = getTournamentIdFromUrl()
        const tournamentId = urlTournamentId

        if (tournamentId) {
          // Find the tournament with the matching ID
          const savedGame = tournaments.find(t => t.tournament_id === tournamentId)

          if (savedGame) {
            console.log(`DynamoDB`, savedGame)
            setSavedGameData(savedGame)
            setGamePlayers(savedGame.rounds[0]?.matches.flatMap(m => [...m.teams.teamA, ...m.teams.teamB]))
            setSelectedTournamentId(urlTournamentId)
            setGameKey(prev => prev + 1)
          } else {
            console.warn('No saved game found for the given tournament ID')
          }
        }
      } catch (error) {
        console.error('Error fetching saved tournaments or loading game data:', error)
      }
    }

    fetchSavedTournaments()
  }, [])

  const handleStartGame = async (players) => {
    try {
      const newGame = createGame(players)
      const group_id = '1' // Replace with your actual group_id logic
      const createdAt = new Date().toISOString()

      const gameDataWithKeys = {
        PK: `GROUP#${group_id}`,
        SK: `GAME#${newGame.tournament_id}`,
        group_id,
        tournament_id: newGame.tournament_id,
        rounds: newGame.rounds,
        created_at: createdAt,
        updated_at: createdAt
      }

      // Save to DynamoDB via API
      const response = await fetch('/api/dynamodb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameDataWithKeys),
      })
      if (!response.ok) throw new Error('Failed to save tournament to DynamoDB')

      // Update state
      setSavedGameData(gameDataWithKeys)
      setGamePlayers(players)
      setSelectedTournamentId(newGame.tournament_id)
      setGameKey((prev) => prev + 1)
      updateUrlTournamentId(newGame.tournament_id)
    } catch (error) {
      console.error('Error starting game:', error)
    }
  }

  const handleResetGame = () => {
    setSavedGameData(null)
    setGamePlayers(null)
    setSelectedTournamentId(null)
    setGameKey(prev => prev + 1)
    updateUrlTournamentId(null)
  }

  const handleSelectSavedTournament = async (tournamentId) => {
    console.log(`Selected Tournament ID:`, tournamentId)
    if (!tournamentId) return
    try {
      // Fetch from DynamoDB via API
      const response = await fetch(`/api/dynamodb?tournament_id=${tournamentId}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch the tournament')
      const savedGame = await response.json()
      console.log(`DynamoDB::`, savedGame)
      if (savedGame) {
        setSavedGameData(savedGame)
        setGamePlayers(savedGame.rounds[0]?.matches.flatMap(m => [...m.teams.teamA, ...m.teams.teamB]))
        setSelectedTournamentId(tournamentId)
        setGameKey(prev => prev + 1)
        updateUrlTournamentId(tournamentId)
      }
    } catch {
      setSavedGameData(null)
      setGamePlayers(null)
      setSelectedTournamentId(null)
      updateUrlTournamentId(null)
    }
  }

  return (
    <main className="container mx-auto max-w-4xl px-5 py-5 min-h-screen">

      {savedTournaments.length > 0 && (
        <div className="mb-6 flex justify-center">
          <label htmlFor="savedTournament" className="mr-3 font-bold uppercase text-gray-300">
            Load Saved Tournament:
          </label>
          <select
            id="savedTournament"
            value={selectedTournamentId || ''}
            onChange={e => handleSelectSavedTournament(e.target.value)}
            className="border border-gray-600 bg-gray-900 text-gray-200 rounded px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Select Tournament --</option>
            {savedTournaments.map(tid => (
              <option key={tid} value={tid}>
                {tid}
              </option>
            ))}
          </select>
        </div>
      )}

      {!gamePlayers ? (
        <GroupSelector onStart={handleStartGame} />
      ) : (
        <>
          <button
            onClick={handleResetGame}
            className="mb-5 text-red-600 font-bold underline text-center block mx-auto"
          >
            Reset Game
          </button>
          <Game
            key={gameKey}
            initialPlayers={gamePlayers}
            savedGameData={savedGameData}
          />
        </>
      )}
    </main>
  )
}