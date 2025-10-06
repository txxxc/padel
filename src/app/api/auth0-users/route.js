import { NextResponse } from 'next/server'

let cachedToken = null
let tokenExpiresAt = 0 // Unix timestamp in ms

async function getManagementToken() {
  const now = Date.now()
  if (cachedToken && tokenExpiresAt > now + 60000) { // 60s early refresh
    console.log('CACHED TOKEN STILL VALID')
    return cachedToken
  }

  console.log('NOT CACHED - fetching new token')

  const domain = process.env.AUTH0_DOMAIN
  const clientId = process.env.AUTH0_MGMT_CLIENT_ID
  const clientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET
  const audience = `https://${domain}/api/v2/`

  const tokenRes = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience
    })
  })
  const tokenData = await tokenRes.json()
  cachedToken = tokenData.access_token
  // expires_in is in seconds
  tokenExpiresAt = now + (tokenData.expires_in * 1000)
  return cachedToken
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const domain = process.env.AUTH0_DOMAIN

  const access_token = await getManagementToken()

  const queryString = `https://${domain}/api/v2/users?q=${encodeURIComponent(query)}&search_engine=v3`

  const usersRes = await fetch(queryString, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })
  const users = await usersRes.json()
  return NextResponse.json(users)
}