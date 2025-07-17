'use client'

import { useEffect, useState } from 'react'
import { createGame } from './gameLogic'
import GroupSelector from '@/app/GroupSelector'
import Game from './Game'
import { Dropdown } from '@/app/UI'

/**
 * Updates the tournament_id in the browser URL.
 * @param {string|null} tournamentId
 */
const updateUrlTournamentId = (tournamentId) => {
  const url = new URL(window.location)
  if (tournamentId) {
    url.searchParams.set('tournament_id', tournamentId)
  } else {
    url.searchParams.delete('tournament_id')
  }
  window.history.replaceState(null, '', url.toString())
}

/**
 * Gets the tournament_id from the browser URL.
 * @returns {string|null}
 */
const getTournamentIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('tournament_id')
}

/**
 * Main Home component.
 * Handles tournament selection, game creation, and state management.
 */
export default function Home() {
  const [savedGameData, setSavedGameData] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [gamePlayers, setGamePlayers] = useState(null)
  const [savedTournaments, setSavedTournaments] = useState([])
  const [selectedTournamentId, setSelectedTournamentId] = useState(null)

  /**
   * Fetches saved tournaments from DynamoDB and sets state.
   */
  useEffect(() => {
    const fetchSavedTournaments = async () => {
      try {
        const response = await fetch('/api/dynamodb', { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to fetch tournaments')

        const tournaments = await response.json()
        const tournamentIds = tournaments.map(tournament => tournament.tournament_id)

        setSavedTournaments(tournamentIds)
        // Get the tournament ID from the URL
        const urlTournamentId = getTournamentIdFromUrl()
        const tournamentId = urlTournamentId

        if (tournamentId) {
          const savedGame = tournaments.find(t => t.tournament_id === tournamentId)
          if (savedGame) {
            setSavedGameData(savedGame)
            setGamePlayers(savedGame.rounds[0]?.matches.flatMap(m => [...m.teams.teamA, ...m.teams.teamB]))
            setSelectedTournamentId(urlTournamentId)
            setGameKey(prev => prev + 1)
          }
        }
      } catch (error) {
        console.error('Error fetching saved tournaments or loading game data:', error)
      }
    }
    fetchSavedTournaments()
  }, [])

  /**
   * Starts a new game and saves it to DynamoDB.
   * @param {Array} players
   */
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

      const response = await fetch('/api/dynamodb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameDataWithKeys),
      })
      if (!response.ok) throw new Error('Failed to save tournament to DynamoDB')

      setSavedGameData(gameDataWithKeys)
      setGamePlayers(players)
      setSelectedTournamentId(newGame.tournament_id)
      setGameKey((prev) => prev + 1)
      updateUrlTournamentId(newGame.tournament_id)
    } catch (error) {
      console.error('Error starting game:', error)
    }
  }

  /**
   * Resets the current game state.
   */
  const handleResetGame = () => {
    setSavedGameData(null)
    setGamePlayers(null)
    setSelectedTournamentId(null)
    setGameKey(prev => prev + 1)
    updateUrlTournamentId(null)
  }

  /**
   * Loads a saved tournament from DynamoDB by ID.
   * @param {string} tournamentId
   */
  const handleSelectSavedTournament = async (tournamentId) => {
    if (!tournamentId) return
    try {
      const response = await fetch(`/api/dynamodb?tournament_id=${tournamentId}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch the tournament')
      const savedGame = await response.json()
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
        <Dropdown
        label="Load Saved Tournament:"
        id="savedTournament"
        options={[
          { value: '', label: 'Select Game' },
          ...savedTournaments.map(tid => ({ value: tid, label: tid }))
        ]}
        value={selectedTournamentId || ''}
        onChange={e => handleSelectSavedTournament(e.target.value)}
      />
      )}

      {!gamePlayers ? (
        <GroupSelector onStart={handleStartGame} />
      ) : (
        <>
          
          <Game
            key={gameKey}
            initialPlayers={gamePlayers}
            savedGameData={savedGameData}
          />
          <button
            onClick={handleResetGame}
            className="mt-5 p-3 rounded-lg mb-5 font-bold text-sm uppercase w-full bg-rose-600 text-white hover:bg-rose-700 transition-colors duration-200"
          >
            New game
          </button>
        </>
      )}
    </main>
  )
}