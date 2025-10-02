'use client'

import { useEffect, useState } from 'react'
// filepath: /Users/art/Documents/GitHub/padel/src/app/GroupManager.js
import { useUser } from '@auth0/nextjs-auth0'
import { Button, Dropdown } from '../UI'

export const GroupManager = () => {
  const { user } = useUser()
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [newPlayer, setNewPlayer] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newOwner, setNewOwner] = useState('')
  const [ownerSuggestions, setOwnerSuggestions] = useState([])
  const [ownerLoading, setOwnerLoading] = useState(false)

  // Fetch groups from DynamoDB
  useEffect(() => {
    const fetchGroups = async () => {
      const res = await fetch('/api/dynamodb/groups')
      const data = await res.json()
      setGroups(data)
    }
    fetchGroups()
  }, [])

  const selectedGroup = groups.find(g => g.id === Number(selectedGroupId))
  const isOwner = user && selectedGroup?.owners?.includes(user.sub)

  const handleAddPlayer = async () => {
    if (!user || !isOwner) {
      alert('Only group owners can add players.')
      return
    }
    if (!newPlayer.trim()) return
    const updatedPlayers = [...(selectedGroup.players || []), newPlayer.trim()]
    await fetch('/api/dynamodb/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedGroup.id,
        players: updatedPlayers,
        name: selectedGroup.name,
        owners: selectedGroup.owners
      })
    })
    setGroups(groups.map(g =>
      g.id === selectedGroup.id ? { ...g, players: updatedPlayers } : g
    ))
    setNewPlayer('')
  }

  const handleRemovePlayer = async (player) => {
    if (!user || !isOwner) {
      alert('Only group owners can remove players.')
      return
    }
    const updatedPlayers = selectedGroup.players.filter(p => p !== player)
    await fetch('/api/dynamodb/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedGroup.id,
        players: updatedPlayers,
        name: selectedGroup.name,
        owners: selectedGroup.owners
      })
    })
    setGroups(groups.map(g =>
      g.id === selectedGroup.id ? { ...g, players: updatedPlayers } : g
    ))
  }

  const handleCreateGroup = async () => {
    if (!user) {
      alert('Please log in to create a group.')
      return
    }
    if (!newGroupName.trim()) return

    const maxId = groups.length ? Math.max(...groups.map(g => g.id)) : 0
    const newGroup = {
      id: maxId + 1,
      name: newGroupName.trim(),
      players: [],
      owners: [user.sub] // Add the creator's Auth0 ID as the first owner
    }

    await fetch('/api/dynamodb/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroup)
    })

    setGroups([...groups, newGroup])
    setNewGroupName('')
    setCreatingGroup(false)
    setSelectedGroupId(newGroup.id)
  }

  const handleDeleteGroup = async () => {
    if (!user || !isOwner) {
      alert('Only group owners can delete the group.')
      return
    }
    const confirmed = window.confirm('Are you sure you want to delete this group? This action cannot be undone.')
    if (!confirmed) return

    await fetch('/api/dynamodb/groups', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedGroup.id })
    })
    setGroups(groups.filter(g => g.id !== selectedGroup.id))
    setSelectedGroupId('')
  }

  const fetchOwnerSuggestions = async (query) => {
    if (!query) {
      setOwnerSuggestions([])
      return
    }
    setOwnerLoading(true)
    const res = await fetch(`/api/auth0-users?q=${encodeURIComponent(query)}`)
    const users = await res.json()
    setOwnerSuggestions(users)
    setOwnerLoading(false)
  }

  const handleAddOwner = async () => {
    if (!user || !isOwner) {
      alert('Only group owners can add owners.')
      return
    }
    const ownerToAdd = newOwner.trim()
    console.log(`ownerToAdd: `,ownerToAdd)
    if (!ownerToAdd || selectedGroup.owners.includes(ownerToAdd)) return

    const updatedOwners = [...selectedGroup.owners, ownerToAdd]

    console.log(updatedOwners)
    
    await fetch('/api/dynamodb/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedGroup.id,
        players: selectedGroup.players,
        name: selectedGroup.name,
        owners: updatedOwners
      })
    })
    setGroups(groups.map(g =>
      g.id === selectedGroup.id ? { ...g, owners: updatedOwners } : g
    ))
    setNewOwner('')
  }

  const handleRemoveOwner = async (ownerId) => {
    if (!user || !isOwner) {
      alert('Only group owners can remove owners.')
      return
    }
    // Prevent removing the last owner
    if (selectedGroup.owners.length === 1) {
      alert('A group must have at least one owner.')
      return
    }
    const updatedOwners = selectedGroup.owners.filter(o => o !== ownerId)
    await fetch('/api/dynamodb/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedGroup.id,
        players: selectedGroup.players,
        name: selectedGroup.name,
        owners: updatedOwners
      })
    })
    setGroups(groups.map(g =>
      g.id === selectedGroup.id ? { ...g, owners: updatedOwners } : g
    ))
  }

  return (
    <div className="space-y-6 bg-gray-800 rounded-lg p-6 shadow-md mb-2.5">
      <div className="mb-4">
        {creatingGroup ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="Group name"
              className="p-2 rounded bg-gray-700 text-white"
            />
            <Button
              className=""
              onClick={handleCreateGroup}
            >
              Save
            </Button>
            <Button
              className=""
              onClick={() => { setCreatingGroup(false); setNewGroupName('') }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          user && (
            <Button
              onClick={() => setCreatingGroup(true)}
            >
              + Create New Group
            </Button>
          )
        )}
      </div>
      <Dropdown
        label="Your groups"
        id="groupManagerSelector"
        options={[
          { value: '', label: 'Select a group' },
          ...groups.map(g => ({ value: g.id, label: g.name }))
        ]}
        value={selectedGroupId || ''}
        onChange={e => setSelectedGroupId(e.target.value)}
      />
      {selectedGroup && (
        <>
          <div className="mb-2">
            <h3 className="font-bold uppercase text-gray-400 mb-1">Owner{selectedGroup.owners?.length > 1 ? 's' : ''}</h3>
            <div className="text-sm text-gray-300 flex flex-wrap gap-2">
              {selectedGroup.owners && selectedGroup.owners.length > 0
                ? selectedGroup.owners.map(ownerId => (
                  <span key={ownerId} className="bg-gray-700 text-white px-2 py-1 rounded flex items-center">
                    {ownerId}
                    {isOwner && ownerId !== user.sub && selectedGroup.owners.length > 1 && (
                      <Button
                        className=""
                        onClick={() => handleRemoveOwner(ownerId)}
                      >
                        ✖
                      </Button>
                    )}
                  </span>
                ))
                : <span className="italic text-gray-500">No owner info</span>
              }
            </div>
            {isOwner && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newOwner}
                  onChange={e => {
                    setNewOwner(e.target.value)
                    fetchOwnerSuggestions(e.target.value)
                  }}
                  placeholder="Add owner (Auth0 user id or email)"
                  className="p-2 rounded bg-gray-700 text-white"
                  autoComplete="off"
                />
                {ownerLoading && <div className="text-xs text-gray-400">Loading...</div>}
                {ownerSuggestions.length > 0 && (
                  <ul className="bg-gray-700 rounded mt-1 max-h-40 overflow-y-auto text-white text-sm">
                    {ownerSuggestions.map(u => (
                      <li
                        key={u.user_id}
                        className="px-2 py-1 hover:bg-green-700 cursor-pointer"
                        onClick={() => {
                          setNewOwner(u.user_id)
                          setOwnerSuggestions([])
                        }}
                      >
                        {u.name || u.email || u.user_id}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  className=""
                  onClick={handleAddOwner}
                >
                  Add Owner
                </Button>
              </div>
            )}
          </div>
          <div className="mb-0">
            <h3 className="font-bold uppercase text-gray-400 mb-2">Players</h3>
            <div className="grid grid-cols-3 gap-3">
              {[...selectedGroup.players].sort((a, b) => a.localeCompare(b)).map(player => (
                <div key={player} className="flex items-center justify-between bg-gray-900 p-2 rounded">
                  <span>{player}</span>
                  {isOwner && (
                    <Button
                      className=""
                      onClick={() => handleRemovePlayer(player)}
                    >
                      ✖
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newPlayer}
                onChange={e => setNewPlayer(e.target.value.toUpperCase())}
                placeholder="Add player"
                className="p-2 rounded bg-gray-700 text-white"
              />
              <Button
                className=""
                onClick={handleAddPlayer}
              >
                Add
              </Button>
            </div>
          )}
          {!isOwner && (
            <div className="text-gray-400 mt-2 text-sm italic">
              Only group owner(s) can add or remove players or owners.
            </div>
          )}
          {isOwner && (
            <Button
              className=""
              onClick={handleDeleteGroup}
            >
              Delete Group
            </Button>
          )}
        </>
      )}
      {!user && <div className="text-gray-400 mt-4">Please log in to manage players and groups.</div>}
    </div>
  )
}

export default GroupManager