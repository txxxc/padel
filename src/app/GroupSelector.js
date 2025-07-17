'use client'

import { useState } from 'react'
import GROUPS from '../data/groups.json' with { type: 'json' }
import { MIN_PLAYERS, GROUP_SIZE } from './gameLogic'
import { Dropdown } from '@/app/UI'

/**
 * GroupSelector component for selecting a group and players to start a game.
 * @param {Object} props
 * @param {Function} props.onStart - Callback to start the game with selected players.
 */
const GroupSelector = ({ onStart }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(GROUPS[0]?.id || null)
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const group = GROUPS.find(g => g.id === Number(selectedGroupId))

  /**
   * Toggles a player's selection.
   * @param {string} player
   */
  const togglePlayer = (player) => {
    setSelectedPlayers(prev =>
      prev.includes(player)
        ? prev.filter(p => p !== player)
        : [...prev, player]
    )
  }

  /**
   * Checks if the game can be started based on player count.
   * @returns {boolean}
   */
  const canStart = selectedPlayers.length >= MIN_PLAYERS && selectedPlayers.length % GROUP_SIZE === 0

  return (
    <div className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-md">

      <Dropdown
        label="Pick a Group:"
        id="groupSelector"
        options={GROUPS.map(g => ({ value: g.id, label: g.name }))}
        value={selectedGroupId}
        onChange={e => setSelectedGroupId(e.target.value)}
      />

      <div>
        <h3 className="mb-3 font-bold uppercase text-gray-400">Players</h3>
        <div className="grid grid-cols-3 gap-3 overflow-auto">
          {group?.players.map(player => (
            <div
              key={player}
              className={`cursor-pointer p-3 rounded-lg border text-center uppercase font-semibold transition-colors duration-200 ${selectedPlayers.includes(player)
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
        className={`p-3 rounded-lg mt-4 font-bold text-sm uppercase w-full transition-colors duration-200 ${canStart
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

export default GroupSelector