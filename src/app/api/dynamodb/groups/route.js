import { NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'

const REGION = process.env.AWS_REGION || 'eu-west-1'
const TABLE_NAME = 'Groups'

const client = new DynamoDBClient({ region: REGION })
const docClient = DynamoDBDocumentClient.from(client)

// GET: Fetch all groups
export async function GET() {
    try {
        const command = new ScanCommand({ TableName: TABLE_NAME })
        const data = await docClient.send(command)
        return NextResponse.json(data.Items)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Create or update a group
export async function POST(request) {
    try {
        const body = await request.json()
        const { id, name, players, owners } = body

        console.log(owners)

        // Check if group exists
        const getCommand = new GetCommand({
            TableName: TABLE_NAME,
            Key: { id }
        })
        const existing = await docClient.send(getCommand)

        if (!existing.Item) {
            // Creating a new group: require owners
            if (!name || typeof id === 'undefined' || !Array.isArray(players) || !Array.isArray(owners)) {
                return NextResponse.json({ error: 'Invalid payload for group creation' }, { status: 400 })
            }
            const putCommand = new PutCommand({
                TableName: TABLE_NAME,
                Item: { id, name, players, owners }
            })
            await docClient.send(putCommand)
            return NextResponse.json({ success: true, action: 'created' })
        } else {
            console.log('Updating existing group', existing.Item)
            if (!name || typeof id === 'undefined' || !Array.isArray(players)) {
                return NextResponse.json({ error: 'Invalid payload for group update' }, { status: 400 })
            }
            const updatedGroup = {
                ...existing.Item,
                name,
                players,
                owners: Array.isArray(body.owners) ? body.owners : existing.Item.owners
            }
            const putCommand = new PutCommand({
                TableName: TABLE_NAME,
                Item: updatedGroup
            })
            await docClient.send(putCommand)
            return NextResponse.json({ success: true, action: 'updated' })
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const body = await request.json()
        const { id } = body
        if (typeof id === 'undefined') {
            return NextResponse.json({ error: 'Missing group id' }, { status: 400 })
        }
        const deleteCommand = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id }
        })
        await docClient.send(deleteCommand)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}