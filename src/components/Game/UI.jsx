const Player = ({ name, isWinner, rounded }) => (
    <div className={`${rounded} text-gray-200 uppercase font-bold p-2.5 py-2.5 text-center relative z-2
        ${isWinner ? ' text-white' : ''}`}>
        {name}
    </div>
)

const CreateTeam = ({ players, id, onClick, isWinner }) => (
    <div
        id={id}
        onClick={onClick}
        className={`
        cursor-pointer transition-all duration-300 ease-in-out p-0 rounded relative overflow-hidden
        ${isWinner ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}
      `}
    >
        <Player name={players[0]} isWinner={isWinner} rounded="rounded-t pb-1" />
        <div className={`transition-all duration-300 ease-in-out text-center ${isWinner ? 'text-green-600 ' : 'text-gray-600'} -top-20 h-0 relative scale-700 z-1 opacity-75`}>&</div>
        <Player name={players[1]} isWinner={isWinner} rounded="rounded-b pt-1" />
        {/* {isWinner && (
            <div className="text-emerald-700 font-bold text-center mt-1 animate-bounce">🏆 Winner</div>
        )} */}
    </div>
)

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

const Controls = ({ onStart, started }) => (
    <div className="controls my-4 text-center">
      {!started ? (
        <button onClick={onStart} className="uppercase p-2.5 bg-rose-500 mx-auto block rounded font-bold text-sm">
          Start Game
        </button>
      ) : (
        <button onClick={onStart} className="uppercase p-2.5 bg-teal-800 mx-auto block rounded font-bold text-sm">
          Restart Game
        </button>
      )}
    </div>
  )

export { Match, Controls }