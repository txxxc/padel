import GROUPS from '../_db/groups.json' with { type: "json" }
import GAMES from '../_db/games.json' with { type: "json" }

const generateTournament = (players) => {

    if (players.length < 12) {
        console.error('At least 12 players are required.');
        return null;
    }

    if (players.length % 4 !== 0) {
        console.error('Number of players must be a multiple of 4.');
        return null;
    }

    const shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const shuffledPlayers = shuffle([...players]);

    const teams = [];

    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        teams.push([shuffledPlayers[i], shuffledPlayers[i + 1]]);
    }

    const shuffledTeams = shuffle([...teams]);

    const numTeams = shuffledTeams.length;

    const matches = [];

    for (let i = 0; i < shuffledTeams.length; i += 2) {
        matches.push({
            court: i / 2 + 1,
            teams: {
                teamA: shuffledTeams[i],
                teamB: shuffledTeams[i + 1],
            },
            winners: Math.random() < 0.5 ? "teamA" : "teamB",
        });
    }

    return {
        matches,
    };
};

const createNextRound = (prevMatches, numCourts, currentRound) => {

    const courtsTeams = Array.from({ length: numCourts }, () => []);

    prevMatches.forEach(({ court, teams, winners }) => {
        const winnerTeam = teams[winners];
        const loserTeam = winners === 'teamA' ? teams.teamB : teams.teamA;

        const winnerCourt = court === numCourts ? court : court + 1;
        const loserCourt = court === 1 ? court : court - 1;

        courtsTeams[winnerCourt - 1].push(winnerTeam);
        courtsTeams[loserCourt - 1].push(loserTeam);
    });

    const shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const nextRoundMatches = [];

    courtsTeams.forEach((teamsOnCourt, index) => {
        if (teamsOnCourt.length < 2) return;

        const shuffledTeams = shuffle([...teamsOnCourt]);

        for (let i = 0; i < shuffledTeams.length; i += 2) {
            if (i + 1 >= shuffledTeams.length) break;

            nextRoundMatches.push({
                court: index + 1,
                teams: {
                    teamA: shuffledTeams[i],
                    teamB: shuffledTeams[i + 1],
                },
                winners: Math.random() < 0.5 ? "teamA" : "teamB",
            });
        }
    });

    return {
        round: currentRound + 1,
        numCourts,
        matches: nextRoundMatches,
    };
};

const createGame = (players) => {

    console.log(players)

    // Number of rounds to simulate
    const roundsToSimulate = 1;

    let tournament = generateTournament(players);
    if (!tournament) throw new Error('Player validation failed.');

    return { "rounds": [tournament] }

    // console.log(`Round ${tournament.round}:\n`, JSON.stringify(tournament, null, 2));

    // for (let round = 2; round <= roundsToSimulate; round++) {
    //     tournament = createNextRound(tournament.matches, tournament.numCourts, tournament.round);
    //     console.log(`Round ${tournament.round}:\n`, JSON.stringify(tournament, null, 2));
    // }

}

export { createGame }

