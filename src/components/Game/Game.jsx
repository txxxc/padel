import { useEffect, useState } from 'react'
// import { Match } from '@/app/_partials/DELETE_ui'
import { Match } from './UI'
import { createNextRound } from './gameUtils'
import { createGame } from '@/utils/createGame'

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
      <div id="matches" className="">
        {kingOfCourt ? (
          <div className="bg-green-500 rounded font-bold uppercase text-center py-2.5">
            <h3 className="text-green-800 text-xs">Kings/Queens of the Court</h3>
            <p className="text-xl">{kingOfCourt.join(' & ')}</p>
          </div>
        ) : (
          <div className="bg-gray-950 rounded font-bold uppercase text-center py-2.5">
            <h3 className="text-gray-700 text-xs">Kings/Queens of the Court</h3>
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
                onWinnerSelect={
                  canEditRound(idx)
                    ? (court, team) => handleWinnerSelect(court, team, idx)
                    : undefined
                }
              />
            ))}
            <div className="pt-5">
                <button className="p-2.5 bg-rose-500 mx-auto block rounded font-bold text-sm">COMPLETE ROUND</button>
            </div>
            
          </div>
        ))}
      </div>
    )
  }

  export { Game }