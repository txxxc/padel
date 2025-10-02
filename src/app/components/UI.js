import React, { useState } from 'react'

const commonClass = `bg-cyan-700 hover:bg-cyan-600 h-10 px-3 py-2 rounded font-bold transition-colors duration-200 uppercase focus:outline-none cursor-pointer`

export const Button = ({
  children,
  className = '',
  type = 'button',
  disabled = false,
  onClick,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`${commonClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
)

export const LinkButton = ({
  children,
  className = '',
  onClick,
  ...props
}) => (
  <a
    onClick={onClick}
    className={`${commonClass} ${className}`}
    {...props}
  >
    {children}
  </a>
)

/** Helper component to display a player */
const Player = ({ name, isWinner, rounded }) => (
  <div className={`${rounded} text-gray-200 uppercase font-bold p-2.5 text-center relative z-2 ${isWinner ? 'text-white' : ''}`}>{name}</div>
)

/** Component to render a team with interaction and winner highlight */
const CreateTeam = ({ players, id, onClick, isWinner }) => (
  <div
    id={id}
    onClick={onClick}
    className={`cursor-pointer transition-all duration-300 ease-in-out p-0 rounded relative overflow-hidden ${isWinner ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}
  >
    <Player name={players[0]} isWinner={isWinner} rounded="rounded-t pb-1" />
    <div className={`transition-all duration-300 ease-in-out text-center ${isWinner ? 'text-green-600' : 'text-gray-600'} -top-20 h-0 relative scale-700 z-1 opacity-75`}>&</div>
    <Player name={players[1]} isWinner={isWinner} rounded="rounded-b pt-1" />
  </div>
)

/** Component to render a match between two teams */
const Match = ({
  match,
  winner,
  onWinnerSelect,
  highestCourt,
  onCourtAliasChange,
  courtAliases
}) => {
  const [editing, setEditing] = useState(false)
  // Prefer root-level alias if provided, else match.court_alias, else empty string
  const aliasValue = (courtAliases && courtAliases[match.court]) || match.court_alias || ''
  const [alias, setAlias] = useState(aliasValue)

  // Keep alias in sync if prop changes (e.g. after update)
  // (Optional: uncomment if you want to sync input with external changes)
  // useEffect(() => {
  //   setAlias(aliasValue)
  // }, [aliasValue])

  const handleAliasSave = () => {
    setEditing(false)
    if (onCourtAliasChange && alias.trim() && alias !== aliasValue) {
      onCourtAliasChange(match.court, alias.trim())
    }
  }

  console.log("aliasValue", aliasValue)

  return (
    <div id={`court_${match.court}`} className="bg-gray-900 mt-2.5 mx-2.5 rounded">
      <h1
        className="font-bold px-2.5 pb-1 text-sm bg-gray-800 tracking-widest uppercase w-[140px] text-center rounded-b text-slate-400 mx-auto flex items-center justify-center gap-1"
        onDoubleClick={() => setEditing(true)}
        style={{ cursor: 'pointer' }}
        title="Double-click to rename court"
      >
        {editing ? (
          <input
            type="text"
            value={alias}
            autoFocus
            onChange={e => setAlias(e.target.value)}
            onBlur={handleAliasSave}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAliasSave()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="bg-gray-700 text-white rounded px-1 text-center w-[90px]"
          />
        ) : (
          <>
            
            {match.court === highestCourt ? 
            (<span title="King Court" className="mr-2">👑</span>) :
            (<span title="Followers Court" className="mr-2">🤞</span>)
            }
            {aliasValue || `Court #${match.court}`}
          </>
        )}
      </h1>
      <div className="grid grid-cols-3 gap-1 grid-cols-[1fr_30px_1fr] items-center p-2.5">
        <CreateTeam
          id="teamA"
          players={match.teams.teamA}
          onClick={onWinnerSelect ? () => onWinnerSelect(match.court, 'teamA') : undefined}
          isWinner={winner === 'teamA'}
        />
        <div className="text-center font-[100] text-gray-700 text-sm font-bold tracking-tighter">VS</div>
        <CreateTeam
          id="teamB"
          players={match.teams.teamB}
          onClick={onWinnerSelect ? () => onWinnerSelect(match.court, 'teamB') : undefined}
          isWinner={winner === 'teamB'}
        />
      </div>
    </div>
  )
}

const Dropdown = ({ label, id, options, value, onChange, className = '' }) => (

  <div className="mb-0">
    {label && (
      <label htmlFor={id} className="block font-bold uppercase text-gray-300 mb-2">
        {label}
      </label>
    )}
    <select
      id={id}
      value={value}
      onChange={onChange}
      className={`border border-gray-600 bg-gray-900 uppercase text-gray-200 rounded px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 w-full ${className}`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
)

export { Match, Dropdown }