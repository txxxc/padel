'use client'

import { useState } from 'react'
import GROUPS from '../data/groups.json' with { type: 'json' }
import { MIN_PLAYERS, GROUP_SIZE } from './gameLogic'

console.log(GROUPS)
/** Group selector for starting a new game */
const GroupSelector = ({ onStart }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(GROUPS[0]?.id || null)
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const group = GROUPS.find(g => g.id === Number(selectedGroupId))

  const togglePlayer = (player) => {
    setSelectedPlayers(prev => prev.includes(player) ? prev.filter(p => p !== player) : [...prev, player])
  }

  const canStart = selectedPlayers.length >= MIN_PLAYERS && selectedPlayers.length % GROUP_SIZE === 0

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

export { GroupSelector }