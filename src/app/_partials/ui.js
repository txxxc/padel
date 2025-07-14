const Player = ({ name }) => (
    <div className="bg-zinc-500 rounded text-zinc-100 uppercase font-bold p-2.5 m-1 text-center">
      {name}
    </div>
  )
  
  const CreateTeam = ({ players, id, onClick, isWinner }) => (
    <div
      id={id}
      onClick={onClick}
      className={`
        cursor-pointer transition-all duration-300 ease-in-out p-2 rounded-lg shadow
        ${isWinner ? 'bg-green-400 scale-105 ring-2 ring-green-600' : 'bg-zinc-300 hover:bg-zinc-200 hover:scale-105'}
      `}
    >
      <Player name={players[0]} />
      <Player name={players[1]} />
      {isWinner && (
        <div className="text-green-700 font-bold text-center mt-1 animate-bounce">🏆 Winner</div>
      )}
    </div>
  )
  
  const Match = ({ match, winner, onWinnerSelect }) => (
    <div id={`court_${match.court}`} className="bg-zinc-100 rounded-xl p-4 my-4 shadow-md">
      <h1 className="text-xl font-bold mb-2 text-zinc-800">Court: {match.court}</h1>
      <div className="grid grid-cols-3 gap-4 items-center">
        <CreateTeam
          id="teamA"
          players={match.teams.teamA}
          onClick={onWinnerSelect ? () => onWinnerSelect(match.court, 'teamA') : undefined}
          isWinner={winner === 'teamA'}
        />
        <div className="text-center text-xl font-bold text-zinc-700">VS</div>
        <CreateTeam
          id="teamB"
          players={match.teams.teamB}
          onClick={onWinnerSelect ? () => onWinnerSelect(match.court, 'teamB') : undefined}
          isWinner={winner === 'teamB'}
        />
      </div>
    </div>
  )

  const Controls = ({ onStart, started }) => (
    <button
      id="start"
      onClick={onStart}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mt-4 transition-all"
    >
      {started ? 'RESTART' : 'START'}
    </button>
  )

  export { Player, CreateTeam, Match, Controls}