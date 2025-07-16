'use client'

import { useEffect, useState } from 'react'
import GROUPS from '../data/groups.json' with { type: 'json' }
import { v4 as uuidv4 } from 'uuid'

/** Helper component to display a player */
const Player = ({ name, isWinner, rounded }) => (
  <div className={`${rounded} text-gray-200 uppercase font-bold p-2.5 text-center relative z-2 ${isWinner ? 'text-white' : ''}`}>{name}</div>
)

/** Component to render a team with interaction and winner highlight */
const CreateTeam = ({ players, id, onClick, isWinner }) => (
  <div
    id={id}
    onClick={onClick}
    className={`cursor-pointer transition-all duration-300 ease-in-out p-0 rounded relative overflow-hidden ${isWinner ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}
  >
    <Player name={players[0]} isWinner={isWinner} rounded="rounded-t pb-1" />
    <div className={`transition-all duration-300 ease-in-out text-center ${isWinner ? 'text-green-600' : 'text-gray-600'} -top-20 h-0 relative scale-700 z-1 opacity-75`}>&</div>
    <Player name={players[1]} isWinner={isWinner} rounded="rounded-b pt-1" />
  </div>
)

/** Component to render a match between two teams */
const Match = ({ match, winner, onWinnerSelect }) => (
  <div id={`court_${match.court}`} className="bg-gray-900 mt-2.5 mx-2.5 rounded">
    <h1 className="font-bold px-2.5 pb-1 text-sm bg-gray-800 tracking-widest uppercase w-[120px] text-center rounded-b text-slate-400 mx-auto">Court #{match.court}</h1>
    <div className="grid grid-cols-3 gap-1 grid-cols-[1fr_30px_1fr] items-center p-2.5">
      <CreateTeam
        id="teamA"
        players={match.teams.teamA}
        onClick={onWinnerSelect ? () => onWinnerSelect(match.court, 'teamA') : undefined}
        isWinner={winner === 'teamA'}
      />
      <div className="text-center font-[100] text-gray-700 text-sm font-bold tracking-tighter">VS</div>
      <CreateTeam
        id="teamB"
        players={match.teams.teamB}
        onClick={onWinnerSelect ? () => onWinnerSelect(match.court, 'teamB') : undefined}
        isWinner={winner === 'teamB'}
      />
    </div>
  </div>
)

/** Shuffles an array in-place */
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generates initial tournament round from player list */
const generateTournament = (players) => {
  if (players.length < 12 || players.length % 4 !== 0) return null

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
export const createGame = (players) => {
  const tournament = generateTournament(players)
  if (!tournament) throw new Error('Player validation failed.')

  const tournament_id = uuidv4()

  return { tournament_id, rounds: [tournament] }
}

/** Generates next round of matches based on previous winners */
export const createNextRound = (fixedCourts, matches, winners) => {
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

/** Main Game component */
const Game = ({ initialPlayers, savedGameData }) => {
  const [gameData, setGameData] = useState(savedGameData || null)
  const [editableRoundIndex, setEditableRoundIndex] = useState(0)

  // fixedCourts derived dynamically from first round matches
  const fixedCourts = gameData?.rounds?.[0]?.matches.map(m => m.court).sort((a, b) => a - b) || []

  useEffect(() => {
    if (!savedGameData && initialPlayers) {
      const game = createGame(initialPlayers)
      const initializedRounds = game.rounds.map(round => ({
        matches: round.matches.map(match => ({ ...match, winners: null })),
        isComplete: false
      }))
      setGameData({ tournament_id: game.tournament_id, rounds: initializedRounds })
      setEditableRoundIndex(0)
      localStorage.setItem('lastTournamentId', game.tournament_id)
    } else if (savedGameData) {
      const index = savedGameData.rounds.findIndex(r => !r.isComplete)
      setEditableRoundIndex(index === -1 ? savedGameData.rounds.length - 1 : index)
    }
  }, [initialPlayers, savedGameData])

  useEffect(() => {
    if (gameData?.tournament_id) {
      localStorage.setItem(`gameData_${gameData.tournament_id}`, JSON.stringify(gameData))
    }
  }, [gameData])

  const canEditRound = (idx) => gameData?.rounds?.[idx] && !gameData.rounds[idx].isComplete && idx === editableRoundIndex

  const handleWinnerSelect = (court, team, roundIndex) => {
    if (!gameData || !canEditRound(roundIndex)) return

    setGameData(prev => {
      const rounds = prev.rounds.map((r, i) => ({
        ...r,
        matches: r.matches.map(m => ({ ...m }))
      }))
      const matchIdx = rounds[roundIndex].matches.findIndex(m => m.court === court)
      if (matchIdx !== -1) rounds[roundIndex].matches[matchIdx].winners = team
      return { ...prev, rounds }
    })
  }

  const handleCompleteRound = () => {
    const round = gameData?.rounds?.[editableRoundIndex]
    if (!round || !round.matches.every(m => m.winners)) return alert('Please select winners for all matches.')

    const winnersObj = {}
    round.matches.forEach(m => { winnersObj[m.court] = m.winners })

    const nextMatches = createNextRound(fixedCourts, round.matches, winnersObj)

    setGameData(prev => {
      const updatedRounds = [...prev.rounds]
      updatedRounds[editableRoundIndex] = { ...round, isComplete: true }
      updatedRounds.push({ matches: nextMatches, isComplete: false })
      return { ...prev, rounds: updatedRounds }
    })

    setEditableRoundIndex(editableRoundIndex + 1)
  }

  const getKingOfCourt = () => {
    if (!gameData?.rounds?.length) return null
    const completed = gameData.rounds.filter(r => r.isComplete)
    if (!completed.length) return null
    const last = completed[completed.length - 1]
    const match = last.matches[last.matches.length - 1]
    return match?.teams?.[match?.winners] || null
  }

  const kingOfCourt = getKingOfCourt()

  if (!gameData) return null

  return (
    <div id="matches">
      {kingOfCourt ? (
        <div className="bg-green-500 rounded font-bold uppercase text-center py-2.5">
          <h3 className="text-green-800 text-xs">Quings of the Court</h3>
          <p className="text-xl">{kingOfCourt.join(' & ')}</p>
        </div>
      ) : (
        <div className="bg-gray-950 rounded font-bold uppercase text-center py-2.5">
          <h3 className="text-gray-700 text-xs">Quings of the Court</h3>
          <p className="text-xl text-gray-600">No winner decided yet</p>
        </div>
      )}

      {gameData.rounds.map((round, idx) => (
        <div className="bg-gray-800 rounded mt-5 pb-5" key={idx}>
          <h2 className="text-gray-500 text-center border-b border-gray-800 uppercase font-bold py-2.5 mx-2.5">Round {idx + 1}</h2>
          {round.matches.map(match => (
            <Match
              key={match.court}
              match={match}
              winner={match.winners}
              onWinnerSelect={canEditRound(idx) ? (court, team) => handleWinnerSelect(court, team, idx) : undefined}
            />
          ))}

          {canEditRound(idx) && (
            <div className="pt-5">
              <button onClick={handleCompleteRound} className="p-2.5 bg-rose-500 mx-auto block rounded font-bold text-sm">
                COMPLETE ROUND
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export { Game }

/** Group selector for starting a new game */
const GroupSelector = ({ onStart }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(GROUPS[0]?.id || null)
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const group = GROUPS.find(g => g.id === selectedGroupId)

  const togglePlayer = (player) => {
    setSelectedPlayers(prev => prev.includes(player) ? prev.filter(p => p !== player) : [...prev, player])
  }

  const canStart = selectedPlayers.length >= 12 && selectedPlayers.length % 4 === 0

  return (
    <div className="space-y-4">
      <label>
        Pick a Group:
        <select className="ml-2 border p-1 rounded" value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
          {GROUPS.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </label>
      <div>
        <h3 className="mb-2 font-semibold uppercase">Players</h3>
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-auto">
          {group?.players.map(player => (
            <div
              key={player}
              className={`cursor-pointer p-2 rounded border text-center uppercase ${selectedPlayers.includes(player) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-500'}`}
              onClick={() => togglePlayer(player)}
            >
              {player}
            </div>
          ))}
        </div>
      </div>
      <button
        disabled={!canStart}
        className={`p-2 rounded mt-3 font-bold text-sm uppercase w-full ${canStart ? 'bg-green-600' : 'bg-gray-600 cursor-not-allowed'}`}
        onClick={() => onStart(selectedPlayers)}
      >
        Start Game
      </button>
    </div>
  )
}

/** Main Home component */
export default function Home() {
  const [savedGameData, setSavedGameData] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [gamePlayers, setGamePlayers] = useState(null)
  const [savedTournaments, setSavedTournaments] = useState([])
  const [selectedTournamentId, setSelectedTournamentId] = useState(null)

  // Helper functions
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

  const getAllSavedTournaments = () => {
    const tournaments = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('gameData_')) {
        tournaments.push(key.replace('gameData_', ''))
      }
    }
    return tournaments
  }

  // Load saved tournaments list on mount
  useEffect(() => {
    const tournaments = getAllSavedTournaments()
    setSavedTournaments(tournaments)

    const urlTournamentId = getTournamentIdFromUrl()
    if (urlTournamentId && tournaments.includes(urlTournamentId)) {
      try {
        const savedGame = localStorage.getItem(`gameData_${urlTournamentId}`)
        if (savedGame) {
          const parsedGame = JSON.parse(savedGame)
          setSavedGameData(parsedGame)
          setGamePlayers(parsedGame.rounds[0]?.matches.flatMap(m => [...m.teams.teamA, ...m.teams.teamB]))
          setSelectedTournamentId(urlTournamentId)
          setGameKey(prev => prev + 1)
        }
      } catch (e) {
        // Remove corrupted data
        localStorage.removeItem(`gameData_${urlTournamentId}`)
        setSavedGameData(null)
        setGamePlayers(null)
        setSelectedTournamentId(null)
        updateUrlTournamentId(null)
      }
    }
  }, [])

  // Start new game with players
  const handleStartGame = (players) => {
    setSavedGameData(null)
    setGamePlayers(players)
    setSelectedTournamentId(null)
    setGameKey(prev => prev + 1)
    updateUrlTournamentId(null)
  }

  // Reset game & clear url param
  const handleResetGame = () => {
    setSavedGameData(null)
    setGamePlayers(null)
    setSelectedTournamentId(null)
    setGameKey(prev => prev + 1)
    updateUrlTournamentId(null)
  }

  // Load a saved tournament from dropdown select
  const handleSelectSavedTournament = (tournamentId) => {
    if (!tournamentId) return
    try {
      const savedGame = localStorage.getItem(`gameData_${tournamentId}`)
      if (savedGame) {
        const parsedGame = JSON.parse(savedGame)
        setSavedGameData(parsedGame)
        setGamePlayers(parsedGame.rounds[0]?.matches.flatMap(m => [...m.teams.teamA, ...m.teams.teamB]))
        setSelectedTournamentId(tournamentId)
        setGameKey(prev => prev + 1)
        updateUrlTournamentId(tournamentId)
      }
    } catch {
      // corrupted data cleanup
      localStorage.removeItem(`gameData_${tournamentId}`)
      setSavedGameData(null)
      setGamePlayers(null)
      setSelectedTournamentId(null)
      updateUrlTournamentId(null)
    }
  }

  return (
    <main className="container mx-auto max-w-4xl px-5 py-5 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-4">Pickleball Tournament</h1>

      {/* Saved Games Dropdown */}
      {savedTournaments.length > 0 && (
        <div className="mb-4 flex justify-center">
          <label htmlFor="savedTournament" className="mr-2 font-semibold">
            Load Saved Tournament:
          </label>
          <select
            id="savedTournament"
            value={selectedTournamentId || ''}
            onChange={e => handleSelectSavedTournament(e.target.value)}
            className="border rounded px-2 py-1"
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
