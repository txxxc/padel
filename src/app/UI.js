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
const Match = ({ match, winner, onWinnerSelect }) => (
    <div id={`court_${match.court}`} className="bg-gray-900 mt-2.5 mx-2.5 rounded">
        <h1 className="font-bold px-2.5 pb-1 text-sm bg-gray-800 tracking-widest uppercase w-[120px] text-center rounded-b text-slate-400 mx-auto">Court #{match.court}</h1>
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


const Dropdown = ({ label, id, options, value, onChange, className = '' }) => (
  
  <div className="mb-4">
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