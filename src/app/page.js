'use client'

import { useEffect, useState } from 'react'
import { createGame } from './gameLogic'
import GroupSelector from '@/app/GroupSelector'
import Game from './Game'
import { Dropdown } from '@/app/UI'
import { useUser } from "@auth0/nextjs-auth0"
import Image from 'next/image'

const updateUrlTournamentId = (tournamentId, groupId) => {
  const url = new URL(window.location)
  if (tournamentId) url.searchParams.set('tournament_id', tournamentId)
  else url.searchParams.delete('tournament_id')
  if (groupId) url.searchParams.set('groupId', groupId)
  else url.searchParams.delete('groupId')
  window.history.replaceState(null, '', url.toString())
}

const getTournamentIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  return { tournament_id: params.get('tournament_id'), group_id: params.get('groupId') }
}

export function formatEuropeanDate(isoString) {
  const date = new Date(isoString)
  const dayOfWeek = date.toLocaleString('en-GB', { weekday: 'long' })
  const day = date.getDate()
  const month = date.toLocaleString('en-GB', { month: 'long' })
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
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

export default function Home() {
  const { user, error, isLoading } = useUser()
  const [savedGameData, setSavedGameData] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [gamePlayers, setGamePlayers] = useState(null)
  const [savedTournaments, setSavedTournaments] = useState([])
  const [selectedTournamentId, setSelectedTournamentId] = useState(null)
  const [selectedGroupId, setSelectedGroupId] = useState(null)



  // On initial load, set group and tournament from URL if present
  useEffect(() => {
    const { group_id, tournament_id } = getTournamentIdFromUrl()
    if (group_id) setSelectedGroupId(group_id)
    if (tournament_id) setSelectedTournamentId(tournament_id)
  }, [])

  // Fetch tournaments for the selected group
  useEffect(() => {
    if (!selectedGroupId) return
    const fetchSavedTournaments = async () => {
      try {
        const response = await fetch(`/api/dynamodb?groupId=${selectedGroupId}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to fetch tournaments')
        const tournaments = await response.json()
        const tournamentIds = tournaments.map(tournament => ({
          tournament_id: tournament.tournament_id,
          tournament_name: tournament.name
        }))
        setSavedTournaments(tournamentIds)

        // If tournament_id is in URL, load that game
        const { tournament_id } = getTournamentIdFromUrl()
        if (tournament_id) {
          const savedGame = tournaments.find(t => t.tournament_id === tournament_id)
          if (savedGame) {
            setSavedGameData(savedGame)
            setGamePlayers(savedGame.rounds[0]?.matches.flatMap(m => [...m.teams.teamA, ...m.teams.teamB]))
            setSelectedTournamentId(tournament_id)
            setGameKey(prev => prev + 1)
          }
        }
      } catch (error) {
        console.error('Error fetching saved tournaments or loading game data:', error)
      }
    }
    fetchSavedTournaments()
  }, [selectedGroupId])

  // Called when user picks a group in GroupSelector
  const handleGroupChange = (groupId) => {
    setSelectedGroupId(groupId)
    setSelectedTournamentId(null)
    setSavedGameData(null)
    setGamePlayers(null)
    setGameKey(prev => prev + 1)
    updateUrlTournamentId(null, groupId)
  }

  // Called when user starts a new game
  const handleStartGame = async (players, groupId, user) => {
    console.log("user",user)
    try {
      const newGame = createGame(players)
      const createdAt = new Date().toISOString()
      const courtNumbers = newGame.rounds[0].matches.map(m => m.court)
      const court_aliases = {}
      courtNumbers.forEach(court => { court_aliases[court] = '' })
  
      const gameDataWithKeys = {
        PK: `GROUP#${groupId}`,
        SK: `GAME#${newGame.tournament_id}`,
        group_id: groupId,
        tournament_id: newGame.tournament_id,
        rounds: newGame.rounds,
        created_at: createdAt,
        updated_at: createdAt,
        name: formatEuropeanDate(createdAt),
        court_aliases,
        created_by: user?.sub,
        created_by_email: user?.email
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
      setGameKey(prev => prev + 1)
      updateUrlTournamentId(newGame.tournament_id, groupId)
      setSavedTournaments(prev => [...prev, { tournament_id: newGame.tournament_id, tournament_name: gameDataWithKeys.name }])
    } catch (error) {
      console.error('Error starting game:', error)
    }
  }

  // Reset game state
  const handleResetGame = () => {
    setSavedGameData(null)
    setGamePlayers(null)
    setSelectedTournamentId(null)
    setGameKey(prev => prev + 1)
    updateUrlTournamentId(null, selectedGroupId)
  }

  // Load a saved tournament from DynamoDB by ID
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
      updateUrlTournamentId(null, selectedGroupId)
    }
  }


  return (
    <main className="container mx-auto max-w-4xl p-2.5 min-h-screen">
      <div className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-md mb-2.5 uppercase font-bold">
        {isLoading ?
          (<div>Loading</div>) :
          (user ? (<div><img alt="<>" width="32" height="32" className="rounded-full w-[32px] inline mr-5" src={user.picture} />{user.name}. <a className="text-green-600" href="/auth/logout">Log out</a></div>) :
            (<a href="/auth/login">Log in</a>))
        }
      </div>
      {!gamePlayers ? (

        <GroupSelector
          onStart={handleStartGame}
          onGroupChange={handleGroupChange}
          groupId={selectedGroupId}
          savedTournaments={savedTournaments}
          handleSelectSavedTournament={handleSelectSavedTournament}
        />


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
        </>
      )}




    </main>
  )
}