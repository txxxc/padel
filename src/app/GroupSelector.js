'use client'

import { useEffect, useState } from 'react'
import GROUPS from '../data/groups.json' with { type: 'json' }
import { MIN_PLAYERS, GROUP_SIZE } from './gameLogic'
import { Dropdown } from './UI'

const GroupSelector = ({ onStart, onGroupChange, groupId, savedTournaments, handleSelectSavedTournament }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || GROUPS[0]?.id || 0)
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const group = GROUPS.find(g => g.id === Number(selectedGroupId))

  // Sync local state with prop only when prop changes
  useEffect(() => {
    if (groupId && groupId !== selectedGroupId) {
      setSelectedGroupId(groupId)
    }
    // eslint-disable-next-line
  }, [groupId])

  // Notify parent only when user changes group (not on mount)
  const handleGroupChange = (e) => {
    const newGroupId = e.target.value
    setSelectedGroupId(newGroupId)
    setSelectedPlayers([])
    if (onGroupChange) onGroupChange(newGroupId)
  }

  const togglePlayer = (player) => {
    setSelectedPlayers(prev =>
      prev.includes(player)
        ? prev.filter(p => p !== player)
        : [...prev, player]
    )
  }

  const canStart = selectedPlayers.length >= MIN_PLAYERS && selectedPlayers.length % GROUP_SIZE === 0
  console.log('selectedGroupId:', selectedGroupId)
  return (
    <div className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-md">
      <Dropdown
        label="Pick a Group:"
        id="groupSelector"
        options={GROUPS.map(g => ({ value: g.id, label: g.name }))}
        value={selectedGroupId}
        onChange={handleGroupChange}
      />

      {savedTournaments.length > 0 && (
        <Dropdown
          id="savedTournament"
          options={[
            { value: '', label: 'Select a previous group game' },
            ...savedTournaments.map(tid => ({ value: tid.tournament_id, label: tid.tournament_name }))
          ]}

          className={`mt-0`}
          onChange={e => handleSelectSavedTournament(e.target.value)}
        />
      )}

      <div>
        <h3 className="mb-3 font-bold uppercase text-gray-400">Players</h3>
        <div className="grid grid-cols-3 gap-3 overflow-auto">
          {[...(group?.players || [])]
            .sort((a, b) => a.localeCompare(b))
            .map(player => (
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
        onClick={() => onStart(selectedPlayers, selectedGroupId)}
      >
        Start Game
      </button>
    </div>
  )
}

export default GroupSelector