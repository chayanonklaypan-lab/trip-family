import webPush from 'web-push'

webPush.setVapidDetails(
  'mailto:chayanon.klaypan@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { subscriptions, title, body } = req.body
  if (!subscriptions?.length) return res.status(400).json({ error: 'no subscriptions' })

  const payload = JSON.stringify({ title: title || 'ทริปครอบครัว', body: body || '' })
  const results = await Promise.allSettled(
    subscriptions.map(sub => webPush.sendNotification(sub, payload))
  )
  const failed = results.filter(r => r.status === 'rejected').length
  res.status(200).json({ sent: results.length - failed, failed })
}
