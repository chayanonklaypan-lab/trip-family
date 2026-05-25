export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { token, message } = req.body
  if (!token || !message) return res.status(400).json({ error: 'missing params' })
  try {
    const r = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `message=${encodeURIComponent(message)}`,
    })
    res.status(r.ok ? 200 : 500).json({ ok: r.ok })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
