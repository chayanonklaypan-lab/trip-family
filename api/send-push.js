import { createSign } from 'node:crypto'

async function getFCMToken(serviceAccount) {
  const { client_email, private_key, project_id } = serviceAccount
  const now = Math.floor(Date.now() / 1000)
  const hdr = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const pay = Buffer.from(JSON.stringify({
    iss: client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url')
  const sign = createSign('RSA-SHA256')
  sign.update(`${hdr}.${pay}`)
  const sig = sign.sign(private_key, 'base64url')
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${hdr}.${pay}.${sig}`,
    }),
  })
  const { access_token } = await r.json()
  return { access_token, project_id }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { tokens, title, body } = req.body
  if (!tokens?.length) return res.status(400).json({ error: 'no tokens' })

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!saJson) return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT not set' })

  const serviceAccount = JSON.parse(saJson)
  const { access_token, project_id } = await getFCMToken(serviceAccount)

  const results = await Promise.allSettled(
    tokens.map(token =>
      fetch(`https://fcm.googleapis.com/v1/projects/${project_id}/messages:send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            webpush: { notification: { icon: '/icon.svg', badge: '/icon.svg' } },
          },
        }),
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  res.status(200).json({ sent, failed })
}
