'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@auth0/nextjs-auth0'
import { Button, Dropdown } from '../UI'
import { MIN_PLAYERS, GROUP_SIZE } from '../Game/gameLogic'

const GroupPanel = ({
    mode = 'select', // 'select' or 'manage'
    onStartGame,     // function(selectedPlayers, groupId, user)
    savedTournaments,
    handleSelectSavedTournament,
    onGroupChange,
    groupId
}) => {
    const { user } = useUser()
    const [groups, setGroups] = useState([])
    const [selectedGroupId, setSelectedGroupId] = useState('')
    const [selectedPlayers, setSelectedPlayers] = useState([])
    const [newPlayer, setNewPlayer] = useState('')
    const [newGroupName, setNewGroupName] = useState('')
    const [creatingGroup, setCreatingGroup] = useState(false)
    const [newOwner, setNewOwner] = useState('')
    const [ownerSuggestions, setOwnerSuggestions] = useState([])
    const [ownerLoading, setOwnerLoading] = useState(false)
    const [panelMode, setPanelMode] = useState(mode)

    useEffect(() => {
        const fetchGroups = async () => {
            const res = await fetch('/api/dynamodb/groups')
            const data = await res.json()
            setGroups(data)
        }
        fetchGroups()
    }, [])

    useEffect(() => {
        if (groupId && groupId !== selectedGroupId) {
            setSelectedGroupId(groupId)
        }
    }, [groupId])

    const selectedGroup = groups.find(g => g.id === Number(selectedGroupId) || g.id === selectedGroupId)
    const isOwner = user && selectedGroup?.owners?.includes(user.sub)

    const handleGroupSelect = (e) => {
        const newGroupId = e.target.value
        setSelectedGroupId(newGroupId)
        setSelectedPlayers([])
        if (onGroupChange) onGroupChange(newGroupId)
    }

    // --- Management handlers ---
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
            owners: [user.sub]
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
        if (!ownerToAdd || selectedGroup.owners.includes(ownerToAdd)) return

        const updatedOwners = [...selectedGroup.owners, ownerToAdd]
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

    // --- Selection logic ---
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
                        <Button onClick={handleCreateGroup}>Save</Button>
                        <Button onClick={() => { setCreatingGroup(false); setNewGroupName('') }}>Cancel</Button>
                    </div>
                ) : (
                    user && panelMode === 'manage' && (
                        <Button onClick={() => setCreatingGroup(true)}>
                            + Create New Group
                        </Button>
                    )
                )}
            </div>
            <Dropdown
                label="Your groups"
                id="groupPanelSelector"
                options={[
                    { value: '', label: 'Select a group' },
                    ...groups.map(g => ({ value: g.id, label: g.name }))
                ]}
                value={selectedGroupId || ''}
                onChange={handleGroupSelect}
            />
            {selectedGroup && (
                <>
                    {/* Owners */}
                    {panelMode === 'manage' &&
                        <div className="mb-2">
                            <h3 className="font-bold uppercase text-gray-400 mb-1 mt-4">Owner{selectedGroup.owners?.length > 1 ? 's' : ''}</h3>
                            <div className="text-sm text-gray-300 flex flex-wrap gap-2">
                                {selectedGroup.owners && selectedGroup.owners.length > 0
                                    ? selectedGroup.owners.map(ownerId => (
                                        <span key={ownerId} className="bg-gray-700 text-white px-2 py-1 rounded flex items-center">
                                            {ownerId}
                                            {panelMode === 'manage' && isOwner && ownerId !== user.sub && selectedGroup.owners.length > 1 && (
                                                <Button className="" onClick={() => handleRemoveOwner(ownerId)}>✖</Button>
                                            )}
                                        </span>
                                    ))
                                    : <span className="italic text-gray-500">No owner info</span>
                                }
                            </div>
                            {panelMode === 'manage' && isOwner && (
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
                                    <Button className="" onClick={handleAddOwner}>Add Owner</Button>
                                </div>
                            )}
                        </div>
                    }
                    {/* Players */}
                    <div className="mb-0">
                        <h3 className="font-bold uppercase text-gray-400 mb-2 mt-4">Players</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {panelMode === 'manage' && isOwner
                                ? [...selectedGroup.players].sort((a, b) => a.localeCompare(b)).map(player => (
                                    <div key={player} className="flex items-center justify-between bg-gray-900 p-2 rounded">
                                        <span>{player}</span>
                                        <Button className="" onClick={() => handleRemovePlayer(player)}>✖</Button>
                                    </div>
                                ))
                                : [...selectedGroup.players].sort((a, b) => a.localeCompare(b)).map(player => (
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
                                ))
                            }
                        </div>
                    </div>
                    {/* Add player (manage mode) */}
                    {panelMode === 'manage' && isOwner && (
                        <div className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={newPlayer}
                                onChange={e => setNewPlayer(e.target.value.toUpperCase())}
                                placeholder="Add player"
                                className="p-2 rounded bg-gray-700 text-white"
                            />
                            <Button className="" onClick={handleAddPlayer}>Add</Button>
                        </div>
                    )}
                    {/* Start Game (select mode) */}
                    {panelMode === 'select' && (
                        <Button
                            className="w-full mt-4"
                            disabled={!user || !canStart}
                            onClick={() => user && onStartGame && onStartGame(selectedPlayers, selectedGroupId, user)}
                        >
                            {user ? 'Start Game' : 'Log in to Start Game'}
                        </Button>
                    )}
                    {/* Delete group (manage mode) */}
                    {panelMode === 'manage' && isOwner && (
                        <Button className="" onClick={handleDeleteGroup}>Delete Group</Button>
                    )}
                    {isOwner && (
                        <Button
                            className=""
                            onClick={() => setPanelMode(panelMode === 'manage' ? 'select' : 'manage')}
                        >
                            {panelMode === 'manage' ? 'Save' : 'Manage your groups'}
                        </Button>
                    )}
                    {/* Info for non-owners */}
                    {panelMode === 'manage' && !isOwner && (
                        <div className="text-gray-400 mt-2 text-sm italic">
                            Only group owner(s) can add or remove players or owners.
                        </div>
                    )}

                </>
            )}
            {!user && <div className="text-gray-400 mt-4">Please log in to manage or select players and groups.</div>}
            {/* Saved tournaments dropdown (if needed) */}
            {panelMode === 'select' && savedTournaments && savedTournaments.length > 0 && (
                <Dropdown
                    id="savedTournament"
                    options={[
                        { value: '', label: 'Select a previous group game' },
                        ...savedTournaments.map(tid => ({ value: tid.tournament_id, label: tid.tournament_name }))
                    ]}
                    className="mt-0"
                    onChange={e => handleSelectSavedTournament(e.target.value)}
                />
            )}
        </div>
    )
}

export default GroupPanel