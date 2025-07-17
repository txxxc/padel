import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const filePath = path.join(process.cwd(), 'src/data/tournaments.json')

/** GET: Fetch all tournaments */
export async function GET(req) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    const tournaments = JSON.parse(data)

    // Check if a tournament_id query parameter is provided
    const tournamentId = req.nextUrl.searchParams.get('tournament_id')
    if (tournamentId) {
      const tournament = tournaments.find(t => t.tournament_id === tournamentId)
      if (!tournament) {
        return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
      }
      return NextResponse.json(tournament)
    }

    // If no tournament_id is provided, return all tournaments
    return NextResponse.json(tournaments)
  } catch (error) {
    console.error('Error reading tournaments:', error)
    return NextResponse.json({ error: 'Failed to read tournaments' }, { status: 500 })
  }
}

/** POST: Save a new tournament */
export async function POST(req) {
  try {
    const newTournament = await req.json()
    const data = fs.readFileSync(filePath, 'utf-8')
    const tournaments = JSON.parse(data)

    // Check if the tournament already exists
    const existingIndex = tournaments.findIndex(t => t.tournament_id === newTournament.tournament_id)

    if (existingIndex !== -1) {
      // Update the existing tournament
      tournaments[existingIndex] = newTournament
    } else {
      // Add a new tournament
      tournaments.push(newTournament)
    }

    // Save the updated tournaments list back to the file
    fs.writeFileSync(filePath, JSON.stringify(tournaments, null, 2), 'utf-8')

    return NextResponse.json({ message: 'Tournament saved successfully' })
  } catch (error) {
    console.error('Error writing tournaments:', error)
    return NextResponse.json({ error: 'Failed to save tournament' }, { status: 500 })
  }
}