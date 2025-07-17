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
const updateUrlTournamentId = (tournamentId, groupId) => {
  const url = new URL(window.location)
  if (tournamentId) {
    url.searchParams.set('tournament_id', tournamentId)
    url.searchParams.set('groupId', groupId)
  } else {
    url.searchParams.delete('tournament_id')
    url.searchParams.delete('groupId')
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

export function formatEuropeanDate(isoString) {
  const date = new Date(isoString)
  const dayOfWeek = date.toLocaleString('en-GB', { weekday: 'long' })
  const day = date.getDate()
  const month = date.toLocaleString('en-GB', { month: 'long' })
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  // Get ordinal suffix
  const suffix = (d) => {
    if (d > 3 && d < 21) return 'th'
    switch (d % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  return `${dayOfWeek}, ${day}${suffix(day)} of ${month} ${year} at ${hours}:${minutes}`
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
  const [selectedGroupId, setSelectedGroupId] = useState(1)

  /**
   * Fetches saved tournaments from DynamoDB and sets state.
   */
  useEffect(() => {
    const fetchSavedTournaments = async () => {
      console.log('selectedGroupId:', selectedGroupId)
      try {
        const response = await fetch(`/api/dynamodb?groupId=${selectedGroupId}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to fetch tournaments')

        const tournaments = await response.json()

        // const tournamentIds = tournaments.map(tournament => tournament.tournament_id)

        const tournamentIds = tournaments.map(tournament => ({
          tournament_id: tournament.tournament_id,
          tournament_name: tournament.name
        }))

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
  }, [selectedGroupId])
  const setGroupIdfromPicker = (groupId) => {
    setSelectedGroupId(groupId)
  }
  /**
   * Starts a new game and saves it to DynamoDB.
   * @param {Array} players
   */
  const handleStartGame = async (players, groupId) => {
    try {
      const newGame = createGame(players)
      setSelectedGroupId(groupId)
      const group_id = groupId
      const createdAt = new Date().toISOString()

      const gameDataWithKeys = {
        PK: `GROUP#${group_id}`,
        SK: `GAME#${newGame.tournament_id}`,
        group_id,
        tournament_id: newGame.tournament_id,
        rounds: newGame.rounds,
        created_at: createdAt,
        updated_at: createdAt,
        name: formatEuropeanDate(createdAt)
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
      updateUrlTournamentId(newGame.tournament_id, group_id)
      setSavedTournaments(prev => [...prev, { tournament_id: newGame.tournament_id, tournament_name: gameDataWithKeys.name }])
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
      const response = await fetch(`/api/dynamodb?tournament_id=${tournamentId}&groupId=${selectedGroupId}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch the tournament')
      const savedGame = await response.json()
      if (savedGame) {
        setSavedGameData(savedGame)
        setGamePlayers(savedGame.rounds[0]?.matches.flatMap(m => [...m.teams.teamA, ...m.teams.teamB]))
        setSelectedTournamentId(tournamentId)
        setGameKey(prev => prev + 1)
        updateUrlTournamentId(tournamentId, selectedGroupId)
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


      {!gamePlayers ? (
        <GroupSelector onStart={handleStartGame} setSelectedGroupId2={setGroupIdfromPicker} />
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

      {savedTournaments.length > 0 && (
        <Dropdown
          id="savedTournament"
          options={[
            { value: '', label: 'Select a previous group game' },
            ...savedTournaments.map(tid => ({ value: tid.tournament_id, label: tid.tournament_name }))
          ]}
          value={selectedTournamentId || ''}
          className={`mt-6`}
          onChange={e => handleSelectSavedTournament(e.target.value)}
        />
      )}
    </main>
  )
}