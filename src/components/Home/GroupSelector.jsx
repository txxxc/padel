import { useEffect, useState } from 'react'
import GROUPS from '../../data/groups.json' with { type: 'json' }

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

  export { GroupSelector }