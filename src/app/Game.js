import { useEffect, useState, useCallback } from 'react'
import { Match } from '@/app/UI'
import { createGame, createNextRound } from './gameLogic'

/**
 * Initializes player stats object.
 * @param {Array} players
 * @returns {Object}
 */
const initializePlayerStats = (players) => {
    const stats = {}
    players.forEach(p => {
        stats[p] = { wins: 0, losses: 0 }
    })
    return stats
}

/**
 * Main Game component for managing tournament rounds and state.
 * @param {Object} props
 * @param {Array} props.initialPlayers - Initial list of players.
 * @param {Object} props.savedGameData - Previously saved game data.
 */
const Game = ({ initialPlayers, savedGameData }) => {
    const [gameData, setGameData] = useState(savedGameData || null)
    const [editableRoundIndex, setEditableRoundIndex] = useState(0)

    // Get sorted list of courts for the current round
    const fixedCourts = gameData?.rounds?.[0]?.matches.map(m => m.court).sort((a, b) => a - b) || []

    /**
     * Initializes game data on mount or when initialPlayers/savedGameData changes.
     */
    useEffect(() => {
        if (!savedGameData && initialPlayers) {
            const game = createGame(initialPlayers)
            const initializedRounds = game.rounds.map(round => ({
                matches: round.matches.map(match => ({ ...match, winners: null })),
                isComplete: false
            }))
            setGameData({
                tournament_id: game.tournament_id,
                rounds: initializedRounds,
                playerStats: initializePlayerStats(initialPlayers)
            })
            setEditableRoundIndex(0)
            localStorage.setItem('lastTournamentId', game.tournament_id)
        } else if (savedGameData) {
            const index = savedGameData.rounds.findIndex(r => !r.isComplete)
            setEditableRoundIndex(index === -1 ? savedGameData.rounds.length - 1 : index)
        }
    }, [initialPlayers, savedGameData])

    /**
     * Persists game data to DynamoDB whenever gameData changes.
     */
    useEffect(() => {
        const saveGameData = async () => {
            if (gameData?.tournament_id && gameData?.PK && gameData?.SK) {
                try {
                    const response = await fetch('/api/dynamodb', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(gameData),
                    })
                    if (!response.ok) throw new Error('Failed to update game data in DynamoDB')
                } catch (error) {
                    console.error('Error updating game data in DynamoDB:', error)
                }
            }
        }
        saveGameData()
    }, [gameData])

    /**
     * Checks if the round at index idx is editable.
     * @param {number} idx
     * @returns {boolean}
     */
    const canEditRound = useCallback(
        (idx) => gameData?.rounds?.[idx] && !gameData.rounds[idx].isComplete && idx === editableRoundIndex,
        [gameData, editableRoundIndex]
    )

    /**
     * Handles winner selection for a match.
     * @param {number} court
     * @param {string} team
     * @param {number} roundIndex
     */
    const handleWinnerSelect = useCallback((court, team, roundIndex) => {
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
    }, [gameData, canEditRound])

    /**
     * Completes the current round, generates the next round, and saves to DynamoDB.
     * Also updates player stats.
     */
    const handleCompleteRound = useCallback(async () => {
        const round = gameData?.rounds?.[editableRoundIndex]
        if (!round || !round.matches.every((m) => m.winners)) {
            alert('Please select winners for all matches.')
            return
        }

        const winnersObj = {}
        round.matches.forEach((m) => {
            winnersObj[m.court] = m.winners
        })

        const nextMatches = createNextRound(fixedCourts, round.matches, winnersObj)

        // Update player stats
        const updatedStats = { ...gameData.playerStats }

        round.matches.forEach(match => {
            const winnerTeam = match.teams[match.winners]
            const loserTeam = match.teams[match.winners === 'teamA' ? 'teamB' : 'teamA']
            winnerTeam.forEach(player => {
                if (!updatedStats[player]) {
                    updatedStats[player] = { wins: 0, losses: 0 }
                }
                updatedStats[player].wins += 1
            })
            loserTeam.forEach(player => {
                if (!updatedStats[player]) {
                    updatedStats[player] = { wins: 0, losses: 0 }
                }
                updatedStats[player].losses += 1
            })
        })

        const updatedGameData = {
            ...gameData,
            rounds: [
                ...gameData.rounds.slice(0, editableRoundIndex),
                { ...round, isComplete: true },
                { matches: nextMatches, isComplete: false },
            ],
            playerStats: updatedStats
        }

        setGameData(updatedGameData)
        setEditableRoundIndex(editableRoundIndex + 1)

        try {
            const dynamoResponse = await fetch('/api/dynamodb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedGameData),
            })
            if (!dynamoResponse.ok) throw new Error('Failed to update game data in DynamoDB')
        } catch (error) {
            console.error('Error saving updated game data to server:', error)
        }
    }, [gameData, editableRoundIndex, fixedCourts])

    /**
     * Returns the current "King of the Court" team.
     * @returns {Array|null}
     */
    const getKingOfCourt = useCallback(() => {
        if (!gameData?.rounds?.length) return null
        const completed = gameData.rounds.filter(r => r.isComplete)
        if (!completed.length) return null
        const last = completed[completed.length - 1]
        const match = last.matches[last.matches.length - 1]
        return match?.teams?.[match?.winners] || null
    }, [gameData])

    const kingOfCourt = getKingOfCourt()

    if (!gameData) return null

    console.log(gameData)

    return (
        <div id="matches">

            {/* Rounds and Matches */}
            {gameData.rounds.map((round, idx) => (
                <div key={idx}>
                    {/* Complete Tournament Button */}
                    {idx === gameData.rounds.length - 1 && !gameData.tournamentComplete && gameData.rounds.length > 1 && (
                    <div className="pb-5 pt-2.5 flex flex-col gap-3">
                    
                            <button
                                onClick={async () => {
                                    // Mark tournament as complete
                                    const updatedGameData = {
                                        ...gameData,
                                        rounds: gameData.rounds.slice(0, idx), // Remove the last round
                                        tournamentComplete: true
                                      }
                                    setGameData(updatedGameData)
                                    try {
                                        await fetch('/api/dynamodb', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(updatedGameData),
                                        })
                                    } catch (error) {
                                        console.error('Error completing tournament:', error)
                                    }
                                }}
                                className="p-2.5 bg-indigo-500 mx-auto block rounded font-bold text-sm text-white hover:bg-indigo-600 transition-colors duration-200"
                            >
                                FINISH TOURNAMENT HERE
                            </button>
                        
                    </div>
                    )}

                    <div className="bg-gray-800 rounded pb-5 mb-2.5">
                        <h2 className="text-gray-500 text-center border-b border-gray-800 uppercase font-bold py-2.5 mx-2.5">
                            Round {idx + 1}
                        </h2>
                        {round.matches.map(match => (
                            <Match
                                key={match.court}
                                match={match}
                                winner={match.winners}
                                onWinnerSelect={canEditRound(idx) ? (court, team) => handleWinnerSelect(court, team, idx) : undefined}
                            />
                        ))}

                        {canEditRound(idx) && (
                            <div className="pt-5 flex flex-col gap-3">
                                <button
                                    onClick={handleCompleteRound}
                                    className="p-2.5 bg-rose-500 mx-auto block rounded font-bold text-sm"
                                >
                                    COMPLETE ROUND
                                </button>

                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* King of the Court */}
            {kingOfCourt ? (
                <div className="bg-green-500 rounded font-bold uppercase text-center py-2.5 mt-6">
                    <h3 className="text-green-800 text-xs">Quings of the Court</h3>
                    <p className="text-xl">{kingOfCourt.join(' & ')}</p>
                </div>
            ) : (
                <div className="bg-gray-950 rounded font-bold uppercase text-center py-2.5 mt-6">
                    <h3 className="text-gray-700 text-xs">Quings of the Court</h3>
                    <p className="text-xl text-gray-600">No winner decided yet</p>
                </div>
            )}

            {/* Player Stats */}
            {gameData.playerStats && (
                <div className="mt-6">
                    <h3 className="font-bold uppercase text-gray-400 mb-2">Player Stats</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {Object.entries(gameData.playerStats)
                            .sort(([, a], [, b]) => {
                                // Sort by wins descending, then losses ascending
                                if (b.wins !== a.wins) return b.wins - a.wins
                                return a.losses - b.losses
                            })
                            .map(([player, stats]) => (
                                <div key={player} className="bg-gray-900 rounded p-2 text-gray-200 font-semibold flex justify-between">
                                    <span>{player}</span>
                                    <span>Wins: {stats.wins} | Losses: {stats.losses}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

        </div>
    )
}

export default Game