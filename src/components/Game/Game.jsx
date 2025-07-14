import { useEffect, useState } from 'react'
import { Match } from './UI'
import { createNextRound } from './gameUtils'
import { createGame } from '@/utils/createGame'

const Game = ({ initialPlayers, savedGameData, savedFixedCourts }) => {
  const [gameData, setGameData] = useState(savedGameData || null)
  const [fixedCourts, setFixedCourts] = useState(savedFixedCourts || [])
  const [editableRoundIndex, setEditableRoundIndex] = useState(0)

  // Initialize game
  useEffect(() => {
    if (!savedGameData && initialPlayers) {
      const game = createGame(initialPlayers)
      const initializedRounds = game.rounds.map(round => ({
        matches: round.matches.map(match => ({ ...match, winners: null })),
        isComplete: false,
      }))
      setGameData({ rounds: initializedRounds })
      setFixedCourts(game.rounds[0].matches.map(m => m.court).sort((a, b) => a - b))
      setEditableRoundIndex(0)
      localStorage.removeItem('gameData')
      localStorage.removeItem('fixedCourts')
    } else if (savedGameData) {
      // Determine editable round from saved data
      const index = savedGameData.rounds.findIndex(r => !r.isComplete)
      setEditableRoundIndex(index === -1 ? savedGameData.rounds.length : index)
    }
  }, [initialPlayers, savedGameData])

  // Persist game state
  useEffect(() => {
    if (gameData) localStorage.setItem('gameData', JSON.stringify(gameData))
  }, [gameData])

  useEffect(() => {
    if (fixedCourts.length > 0) localStorage.setItem('fixedCourts', JSON.stringify(fixedCourts))
  }, [fixedCourts])

  const canEditRound = (roundIndex) => {
    if (!gameData) return false
    return gameData.rounds[roundIndex] && !gameData.rounds[roundIndex].isComplete && roundIndex === editableRoundIndex
  }

  const handleWinnerSelect = (court, team, roundIndex) => {
    if (!gameData || !canEditRound(roundIndex)) return

    setGameData(prevGame => {
      const newRounds = prevGame.rounds.map(round => ({
        ...round,
        matches: round.matches.map(match => ({ ...match })),
      }))

      const roundMatches = newRounds[roundIndex].matches
      const matchIndex = roundMatches.findIndex(m => m.court === court)
      if (matchIndex === -1) return prevGame

      roundMatches[matchIndex].winners = team

      return { rounds: newRounds }
    })
  }

  const handleCompleteRound = () => {
    if (!gameData) return

    const currentRound = gameData.rounds[editableRoundIndex]
    if (!currentRound.matches.every(m => m.winners)) {
      alert('Please select winners for all matches before completing the round.')
      return
    }

    const winnersObj = {}
    currentRound.matches.forEach(m => {
      winnersObj[m.court] = m.winners
    })

    const nextMatches = createNextRound(fixedCourts, currentRound.matches, winnersObj)

    setGameData(prev => {
      const newRounds = [...prev.rounds]
      newRounds[editableRoundIndex] = {
        ...newRounds[editableRoundIndex],
        isComplete: true,
      }

      newRounds.push({
        matches: nextMatches.map(match => ({ ...match, winners: null })),
        isComplete: false,
      })

      return { rounds: newRounds }
    })

    setEditableRoundIndex(editableRoundIndex + 1)
  }

  const getKingOfCourt = () => {
    if (!gameData) return null
    const completedRounds = gameData.rounds.filter(r => r.isComplete)
    const lastCompletedRound = completedRounds[completedRounds.length - 1]
    if (!lastCompletedRound) return null
    const lastMatch = lastCompletedRound.matches[lastCompletedRound.matches.length - 1]
    if (!lastMatch) return null
    return lastMatch.teams[lastMatch.winners]
  }

  const kingOfCourt = getKingOfCourt()
  console.log(gameData)

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
          <h2 className="text-gray-500 text-center border-b border-gray-800 uppercase font-bold py-2.5 mx-2.5">
            Round {idx + 1}
          </h2>

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

          {canEditRound(idx) && (
            <div className="pt-5">
              <button
                onClick={handleCompleteRound}
                className="p-2.5 bg-rose-500 mx-auto block rounded font-bold text-sm"
              >
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
