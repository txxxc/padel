import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const filePath = path.join(process.cwd(), 'src/data', 'tournaments.json')
const readTournaments = () => {
  try {
    const file = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(file)
  } catch (e) {
    return []
  }
}

const writeTournaments = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function GET() {
  const tournaments = readTournaments()
  return NextResponse.json(tournaments)
}

export async function POST(req) {
  const body = await req.json()
  const { tournamentId, gameData, fixedCourts } = body

  console.log(body)

  if (!tournamentId || !gameData) {
    return NextResponse.json({ error: 'Missing tournamentId or gameData' }, { status: 400 })
  }

  const tournaments = readTournaments()
  const existingIndex = tournaments.findIndex(t => t.tournamentId === tournamentId)

  if (existingIndex > -1) {
    tournaments[existingIndex] = { tournamentId, gameData, fixedCourts }
  } else {
    tournaments.push({ tournamentId, gameData, fixedCourts })
  }

  writeTournaments(tournaments)
  return NextResponse.json({ message: 'Tournament saved' })
}