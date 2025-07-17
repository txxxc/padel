'use client'

import { useState } from 'react'
import GROUPS from '../data/groups.json' with { type: 'json' }
import { MIN_PLAYERS, GROUP_SIZE } from './gameLogic'

const GroupSelector = ({ onStart }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(GROUPS[0]?.id || null)
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const group = GROUPS.find(g => g.id === Number(selectedGroupId))

  const togglePlayer = (player) => {
    setSelectedPlayers(prev =>
      prev.includes(player)
        ? prev.filter(p => p !== player)
        : [...prev, player]
    )
  }

  const canStart = selectedPlayers.length >= MIN_PLAYERS && selectedPlayers.length % GROUP_SIZE === 0

  return (
    <div className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-md">
      <label className="block font-bold uppercase text-gray-300 mb-2">
        Pick a Group:
        <select
          className="ml-2 border border-gray-600 bg-gray-900 text-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={selectedGroupId}
          onChange={e => setSelectedGroupId(e.target.value)}
        >
          {GROUPS.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </label>
      <div>
        <h3 className="mb-3 font-bold uppercase text-gray-400">Players</h3>
        <div className="grid grid-cols-3 gap-3 overflow-auto">
          {group?.players.map(player => (
            <div
              key={player}
              className={`cursor-pointer p-3 rounded-lg border text-center uppercase font-semibold transition-colors duration-200 ${
                selectedPlayers.includes(player)
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => togglePlayer(player)}
            >
              {player}
            </div>
          ))}
        </div>
      </div>
      <button
        disabled={!canStart}
        className={`p-3 rounded-lg mt-4 font-bold text-sm uppercase w-full transition-colors duration-200 ${
          canStart
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
        onClick={() => onStart(selectedPlayers)}
      >
        Start Game
      </button>
    </div>
  )
}

export { GroupSelector }