import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, DeleteCommand} from '@aws-sdk/lib-dynamodb'

// Configure DynamoDB client
const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})
const dynamoDb = DynamoDBDocumentClient.from(client)

/** GET: Fetch saved tournaments */
export async function GET(req) {
    try {

        const groupId = `GROUP#${req.nextUrl.searchParams.get('groupId')}` || 'GROUP#1'
        const tournamentId = req.nextUrl.searchParams.get('tournament_id')

        console.log(tournamentId, groupId)
        if (tournamentId) {
            // Fetch a single tournament by PK and SK
            const params = {
                TableName: 'SavedGames',
                Key: {
                    PK: groupId,
                    SK: `GAME#${tournamentId}`
                }
            }
            const { Item } = await dynamoDb.send(new GetCommand(params))
            console.log (Item)
            return NextResponse.json(Item || {})
        } else {
            // Fetch all tournaments for the group
            const params = {
                TableName: 'SavedGames',
                KeyConditionExpression: 'PK = :groupId',
                ExpressionAttributeValues: {
                    ':groupId': groupId
                }
            }
            const response = await dynamoDb.send(new QueryCommand(params))
            return NextResponse.json(response.Items || [])
        }
    } catch (error) {
        console.error('Error fetching tournaments:', error)
        return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 })
    }
}

/** POST: Save a new game */
export async function POST(req) {
    try {
        const body = await req.json()
        const params = {
            TableName: 'SavedGames',
            Item: body
        }
        await dynamoDb.send(new PutCommand(params))
        return NextResponse.json({ message: 'Game saved successfully' })
    } catch (error) {
        console.error('Error saving game:', error)
        return NextResponse.json({ error: 'Failed to save game' }, { status: 500 })
    }
}


export async function DELETE(req) {
    try {
      const body = await req.json()
      const { PK, SK } = body
      if (!PK || !SK) {
        return NextResponse.json({ error: 'Missing PK or SK' }, { status: 400 })
      }
      const params = {
        TableName: 'SavedGames',
        Key: { PK, SK }
      }
      await dynamoDb.send(new DeleteCommand(params))
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting tournament:', error)
      return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 })
    }
  }