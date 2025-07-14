import { useEffect, useState } from 'react'
import { GroupSelector } from './GroupSelector' 
import { Game } from '../Game/Game'
import { Controls } from '../Game/UI'

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
      <div className="mx-auto p-5">
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

  export { Home }