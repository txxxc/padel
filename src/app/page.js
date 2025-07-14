'use client'

import { useEffect, useState } from 'react'
import { createGame } from './_partials/game'
import { Match, Controls } from './_partials/ui'
import GROUPS from './_db/groups.json' with { type: 'json' }

// Utility to create next round based on winners
const createNextRound = (fixedCourts, matches, winners) => {
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
        teamA: players ? players[0] : [],
        teamB: players ? players[1] : [],
      },
      winners: null,
    }
  })
}

// Component to pick group and players
const GroupSelector = ({ onStart }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(GROUPS[0]?.id || null)
  const [selectedPlayers, setSelectedPlayers] = useState([])

  const group = GROUPS.find(g => g.id === selectedGroupId)

  const togglePlayer = (player) => {
    setSelectedPlayers(prev => {
      if (prev.includes(player)) return prev.filter(p => p !== player)
      else return [...prev, player]
    })
  }

  const canStart = selectedPlayers.length >= 12 && selectedPlayers.length % 4 === 0

  return (
    <div className="space-y-4">
      <label>
        Pick a Group:
        <select
          className="ml-2 border p-1"
          value={selectedGroupId}
          onChange={e => {
            setSelectedGroupId(Number(e.target.value))
            setSelectedPlayers([])
          }}
        >
          {GROUPS.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </label>

      <div>
        <h3>Pick players (min 12 and multiple of 4):</h3>
        <div className="grid grid-cols-4 gap-2 max-w-md">
          {group.players.map(player => (
            <button
              key={player}
              type="button"
              className={`p-2 border rounded ${
                selectedPlayers.includes(player)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-black'
              }`}
              onClick={() => togglePlayer(player)}
            >
              {player}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Selected: {selectedPlayers.length}
        </p>
      </div>

      <button
        disabled={!canStart}
        className={`px-4 py-2 rounded font-semibold ${
          canStart ? 'bg-green-600 text-white' : 'bg-gray-400 text-gray-700 cursor-not-allowed'
        }`}
        onClick={() => onStart(selectedPlayers)}
      >
        Start Game
      </button>
    </div>
  )
}

const Game = ({ initialPlayers, savedGameData, savedFixedCourts }) => {
  const [gameData, setGameData] = useState(savedGameData || null)
  const [fixedCourts, setFixedCourts] = useState(savedFixedCourts || [])

  useEffect(() => {
    if (!savedGameData && initialPlayers) {
      const game = createGame(initialPlayers)
      const initializedRounds = game.rounds.map(round => ({
        matches: round.matches.map(match => ({ ...match, winners: null })),
      }))
      setGameData({ rounds: initializedRounds })
      setFixedCourts(game.rounds[0].matches.map(m => m.court).sort((a, b) => a - b))

      // Clear old localStorage just in case
      localStorage.removeItem('gameData')
      localStorage.removeItem('fixedCourts')
    }
  }, [initialPlayers, savedGameData])

  useEffect(() => {
    if (gameData) localStorage.setItem('gameData', JSON.stringify(gameData))
  }, [gameData])

  useEffect(() => {
    if (fixedCourts.length > 0) localStorage.setItem('fixedCourts', JSON.stringify(fixedCourts))
  }, [fixedCourts])

  const canEditRound = (roundIndex) => {
    if (!gameData) return false
    const rounds = gameData.rounds
    if (roundIndex === rounds.length - 1) return true
    const nextRound = rounds[roundIndex + 1]
    return nextRound.matches.every(match => !match.winners)
  }

  const handleWinnerSelect = (court, team, roundIndex) => {
    if (!gameData) return

    setGameData(prevGame => {
      if (!prevGame) return prevGame

      const newRounds = prevGame.rounds.map(round => ({
        matches: round.matches.map(match => ({ ...match })),
      }))

      const roundMatches = newRounds[roundIndex].matches
      const matchIndex = roundMatches.findIndex(m => m.court === court)
      if (matchIndex === -1) return prevGame

      roundMatches[matchIndex].winners = team

      for (let i = roundIndex; i < newRounds.length - 1; i++) {
        const currentRound = newRounds[i]
        if (currentRound.matches.every(m => m.winners)) {
          const winnersObj = {}
          currentRound.matches.forEach(m => {
            winnersObj[m.court] = m.winners
          })
          const nextMatches = createNextRound(fixedCourts, currentRound.matches, winnersObj)
          newRounds[i + 1] = {
            matches: nextMatches.map(match => ({ ...match, winners: null })),
          }
        } else {
          newRounds.splice(i + 1)
          break
        }
      }

      if (roundIndex === newRounds.length - 1) {
        const lastRound = newRounds[roundIndex]
        if (lastRound.matches.every(m => m.winners)) {
          const winnersObj = {}
          lastRound.matches.forEach(m => {
            winnersObj[m.court] = m.winners
          })
          const nextMatches = createNextRound(fixedCourts, lastRound.matches, winnersObj)
          newRounds.push({
            matches: nextMatches.map(match => ({ ...match, winners: null })),
          })
        }
      }

      return { rounds: newRounds }
    })
  }

  const getKingOfCourt = () => {
    if (!gameData) return null
    const rounds = gameData.rounds
    let lastCompletedRound = null
    for (let i = rounds.length - 1; i >= 0; i--) {
      if (rounds[i].matches.every(match => match.winners)) {
        lastCompletedRound = rounds[i]
        break
      }
    }
    if (!lastCompletedRound) return null

    const lastMatch = lastCompletedRound.matches[lastCompletedRound.matches.length - 1]
    if (!lastMatch) return null

    const winningTeamKey = lastMatch.winners
    return lastMatch.teams[winningTeamKey]
  }

  const kingOfCourt = getKingOfCourt()

  if (!gameData) return null

  return (
    <div id="matches" className="p-4 space-y-8">
      {kingOfCourt ? (
        <div className="king-of-court mb-6 p-4 border rounded bg-yellow-600 text-center">
          <h3 className="text-lg font-semibold mb-2">King of the Court</h3>
          <p className="text-xl font-bold">{kingOfCourt.join(' & ')}</p>
        </div>
      ) : (
        <div className="king-of-court mb-6 p-4 border rounded bg-gray-100 text-center">
          <h3 className="text-lg font-semibold mb-2">King of the Court</h3>
          <p className="text-gray-500">No winner decided yet</p>
        </div>
      )}

      {gameData.rounds.map((round, idx) => (
        <div key={idx}>
          <h2 className="text-center font-semibold mb-2 text-zinc-700">Round {idx + 1}</h2>
          {round.matches.map(match => (
            <Match
              key={match.court}
              match={match}
              winner={match.winners}
              onWinnerSelect={
                canEditRound(idx)
                  ? (court, team) => handleWinnerSelect(court, team, idx)
                  : undefined
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}

const Home = () => {
  const [gamePlayers, setGamePlayers] = useState(null)
  const [savedGameData, setSavedGameData] = useState(null)
  const [savedFixedCourts, setSavedFixedCourts] = useState(null)
  const [gameKey, setGameKey] = useState(0)

  useEffect(() => {
    const savedDataStr = localStorage.getItem('gameData')
    const savedCourtsStr = localStorage.getItem('fixedCourts')

    if (savedDataStr && savedCourtsStr) {
      try {
        const parsedData = JSON.parse(savedDataStr)
        const parsedCourts = JSON.parse(savedCourtsStr)
        setSavedGameData(parsedData)
        setSavedFixedCourts(parsedCourts)
        setGameKey(prev => prev + 1)
      } catch {
        localStorage.removeItem('gameData')
        localStorage.removeItem('fixedCourts')
      }
    }
  }, [])

  const handleRestart = () => {
    localStorage.removeItem('gameData')
    localStorage.removeItem('fixedCourts')
    setSavedGameData(null)
    setSavedFixedCourts(null)
    setGamePlayers(null)
    setGameKey(prev => prev + 1)
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {savedGameData ? (
        <Game
          key={gameKey}
          savedGameData={savedGameData}
          savedFixedCourts={savedFixedCourts}
          initialPlayers={null}
        />
      ) : gamePlayers ? (
        <Game key={gameKey} initialPlayers={gamePlayers} />
      ) : (
        <GroupSelector
          onStart={(players) => {
            setGamePlayers(players)
            setGameKey(prev => prev + 1)
          }}
        />
      )}

      {(savedGameData || gamePlayers) && (
        <Controls onStart={handleRestart} started={true} />
      )}
    </div>
  )
}

export default Home
