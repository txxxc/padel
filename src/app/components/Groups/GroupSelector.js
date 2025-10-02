'use client'

import { useEffect, useState } from 'react'
import { useUser } from "@auth0/nextjs-auth0"
// import GROUPS from '../data/groups.json' with { type: 'json' }
import { MIN_PLAYERS, GROUP_SIZE } from '../Game/gameLogic'
import { Button, Dropdown } from '../UI'

const GroupSelector = ({
  onStart,
  onGroupChange,
  groupId,
  savedTournaments,
  handleSelectSavedTournament
}) => {
  const { user } = useUser()
  const [groups, setGroups] = useState([])
  // const [selectedGroupId, setSelectedGroupId] = useState(groupId || GROUPS[0]?.id || 0)
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || 0)
  const [selectedPlayers, setSelectedPlayers] = useState([])
  // const group = GROUPS.find(g => g.id === Number(selectedGroupId))

  // Fetch groups from DynamoDB
  useEffect(() => {
    const fetchGroups = async () => {
      const res = await fetch('/api/dynamodb/groups')
      const data = await res.json()
      setGroups(data)
    }
    fetchGroups()
  }, [])

  const group = groups.find(g => g.id === Number(selectedGroupId))
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
    if (!user) {
      alert('Please authenticate to create a game.')
      return
    }
    setSelectedPlayers(prev =>
      prev.includes(player)
        ? prev.filter(p => p !== player)
        : [...prev, player]
    )
  }

  const canStart = selectedPlayers.length >= MIN_PLAYERS && selectedPlayers.length % GROUP_SIZE === 0

  return (
    <div className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-md">
      <Dropdown
        label="Pick a Group:"
        id="groupSelector"
        options={groups.map(g => ({ value: g.id, label: g.name }))}
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
                  } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => togglePlayer(player)}
                title={!user ? 'Log in to select players' : ''}
              >
                {player}
              </div>
            ))}
        </div>
      </div>

      <Button
        disabled={!user || !canStart}
        className=""
        onClick={() => user && onStart(selectedPlayers, selectedGroupId, user)}
      >
        {user ? 'Start Game' : 'Log in to Start Game'}
      </Button>
    </div>
  )
}
export default GroupSelector