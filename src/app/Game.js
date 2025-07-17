import { useEffect, useState } from 'react'
import { Match } from '@/app/UI'
import { createGame, createNextRound } from './gameLogic'

/** Main Game component */
const Game = ({ initialPlayers, savedGameData }) => {
    const [gameData, setGameData] = useState(savedGameData || null)
    const [editableRoundIndex, setEditableRoundIndex] = useState(0)
  
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
        const saveGameData = async () => {
          if (gameData?.tournament_id && gameData?.PK && gameData?.SK) {
            try {
              const response = await fetch('/api/dynamodb', {
                method: 'POST', // Use PUT for update
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData),
              })
              console.log('saveGameData',gameData)
              if (!response.ok) throw new Error('Failed to update game data in DynamoDB')
            } catch (error) {
              console.error('Error updating game data in DynamoDB:', error)
            }
          }
        }
      
        saveGameData()
      }, [gameData])
  
    // useEffect(() => {
    //   const saveGameData = async () => {
    //     if (gameData?.tournament_id) {
    //       // Save to localStorage
    //       // localStorage.setItem(`gameData_${gameData.tournament_id}`, JSON.stringify(gameData))
  
    //       // Save to tournaments.json via API
    //       try {
    //         const response = await fetch('/api/tournament', {
    //           method: 'POST',
    //           headers: { 'Content-Type': 'application/json' },
    //           body: JSON.stringify(gameData),
    //         })
    //         if (!response.ok) throw new Error('Failed to save game data to server')
    //       } catch (error) {
    //         console.error('Error saving game data to server:', error)
    //       }
    //     }
    //   }
  
    //   saveGameData()
    // }, [gameData])
  
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
  
    const handleCompleteRound = async () => {
      const round = gameData?.rounds?.[editableRoundIndex]
      if (!round || !round.matches.every((m) => m.winners)) {
        return alert('Please select winners for all matches.')
      }
  
      const winnersObj = {}
      round.matches.forEach((m) => {
        winnersObj[m.court] = m.winners
      })
  
      const nextMatches = createNextRound(fixedCourts, round.matches, winnersObj)
  
      const updatedGameData = {
        ...gameData,
        rounds: [
          ...gameData.rounds.slice(0, editableRoundIndex),
          { ...round, isComplete: true },
          { matches: nextMatches, isComplete: false },
        ],
      }
  
      setGameData(updatedGameData)
      setEditableRoundIndex(editableRoundIndex + 1)
  
      // Save to localStorage
      // localStorage.setItem(`gameData_${updatedGameData.tournament_id}`, JSON.stringify(updatedGameData))
  
      // Save to tournaments.json via API
      try {
        console.log('handleCompleteRound', updatedGameData)
        const dynamoResponse = await fetch('/api/dynamodb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedGameData),
          })
          if (!dynamoResponse.ok) throw new Error('Failed to update game data in DynamoDB')
        
      } catch (error) {
        console.error('Error saving updated game data to server:', error)
      }
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
            <h3 className="text-green-800 text-xs">Kings of the Court</h3>
            <p className="text-xl">{kingOfCourt.join(' & ')}</p>
          </div>
        ) : (
          <div className="bg-gray-950 rounded font-bold uppercase text-center py-2.5">
            <h3 className="text-gray-700 text-xs">Kings of the Court</h3>
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