import { useState } from 'react'
import { voteScore, cardStyle, inputStyle, btnPrimary, btnSecondary, C } from '../constants.js'
import { addHotel, voteHotel, confirmHotel, logAction, notifyTripMembers } from '../firebase.js'

export default function HotelsTab({ trip, hotels, uid, userName }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', link: '' })
  const [loading, setLoading] = useState(false)

  const handleVote = async (hotel, emoji) => {
    const prev = hotel.votes?.[uid]
    const newEmoji = prev === emoji ? null : emoji
    await voteHotel(trip.id, hotel.id, uid, newEmoji)
    await logAction(trip.id, {
      type: 'hotel_voted',
      actor: userName,
      summary: `${userName} โหวต ${newEmoji || 'ยกเลิก'} ที่พัก "${hotel.name}"`,
      refId: hotel.id,
    })
  }

  const handleAdd = async () => {
    if (!form.name || loading) return
    setLoading(true)
    try {
      const id = await addHotel(trip.id, {
        name: form.name,
        price: Number(form.price) || 0,
        link: form.link,
      })
      const summary = `${userName} เพิ่มที่พัก "${form.name}" ฿${form.price}/คืน`
      await logAction(trip.id, { type: 'hotel_added', actor: userName, summary, refId: id })
      notifyTripMembers(trip, userName, `[${trip.name}]\n${summary}`)
      setForm({ name: '', price: '', link: '' })
      setShowAdd(false)
    } catch (e) {
      console.error('handleAdd hotel error:', e)
    } finally {
      setLoading(false)
    }
  }

  const sorted = [...hotels].sort((a, b) => voteScore(b.votes) - voteScore(a.votes))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sorted.map((h, i) => {
        const score = voteScore(h.votes)
        const isWinner = i === 0 && score > 0
        return (
          <div key={h.id} style={{
            ...cardStyle,
            border: isWinner ? `1.5px solid ${trip.color}66` : cardStyle.border,
            position: 'relative',
          }}>
            {isWinner && (
              <div style={{
                position: 'absolute', top: -1, right: 12,
                background: trip.color, color: '#000',
                fontSize: 11, fontWeight: 800,
                padding: '2px 10px', borderRadius: '0 0 8px 8px',
              }}>🏆 ชนะโหวต</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{h.name}</div>
                <div style={{ color: trip.color, fontWeight: 800, fontSize: 15, marginTop: 2 }}>
                  ฿{(h.price || 0).toLocaleString()} / คืน
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + (trip.location ? ' ' + trip.location : ''))}`}
                  target="_blank" rel="noreferrer"
                  style={{
                    background: 'rgba(66,133,244,0.15)', color: '#4285f4',
                    fontSize: 12, fontWeight: 700,
                    padding: '5px 12px', borderRadius: 8, textDecoration: 'none',
                    border: '1px solid rgba(66,133,244,0.3)',
                  }}
                >Maps 📍</a>
                {h.link && (
                  <a href={h.link} target="_blank" rel="noreferrer" style={{
                    background: '#0070f3', color: '#fff',
                    fontSize: 12, fontWeight: 700,
                    padding: '5px 12px', borderRadius: 8, textDecoration: 'none',
                  }}>Agoda →</a>
                )}
              </div>
            </div>

            {/* โหวต */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(trip.members || []).map(m => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted2, width: 40, flexShrink: 0 }}>{m}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['❤️', '👍', '❌'].map(emoji => (
                      <button key={emoji} onClick={() => handleVote(h, emoji)} style={{
                        minWidth: 44, minHeight: 36, padding: '6px 10px',
                        borderRadius: 10, border: '1.5px solid',
                        borderColor: h.votes?.[uid] === emoji ? trip.color : 'rgba(255,255,255,0.1)',
                        background: h.votes?.[uid] === emoji ? `${trip.color}33` : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer', fontSize: 16, transition: 'all 0.15s',
                      }}>{emoji}</button>
                    ))}
                  </div>
                  <span style={{ fontSize: 13, marginLeft: 4 }}>{h.votes?.[m] || '—'}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: C.muted }}>
                คะแนน: <span style={{ color: trip.color, fontWeight: 700 }}>{score > 0 ? '+' : ''}{score}</span>
              </span>
              <button onClick={async () => {
                await confirmHotel(trip.id, h.id, !h.confirmed)
              }} style={{
                padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: h.confirmed ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: h.confirmed ? '#fff' : C.muted2,
                border: `1.5px solid ${h.confirmed ? '#10b981' : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
              }}>{h.confirmed ? '✅ เลือกที่นี่แล้ว' : '📌 เลือกที่นี่'}</button>
            </div>
          </div>
        )
      })}

      {/* ฟอร์มเพิ่ม */}
      {showAdd ? (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>🏨 เพิ่มที่พักใหม่</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
            💡 Maps จะค้นชื่อโรงแรมอัตโนมัติ — ใส่ลิงก์ Agoda เฉพาะถ้าอยากกดจองได้เลย
          </div>
          {[
            { key: 'name',  placeholder: 'ชื่อโรงแรม',          type: 'text' },
            { key: 'price', placeholder: 'ราคา/คืน (บาท)',       type: 'number' },
            { key: 'link',  placeholder: 'ลิงก์ Agoda/Booking (ถ้ามี)',  type: 'url' },
          ].map(({ key, placeholder, type }) => (
            <input key={key} type={type} placeholder={placeholder} value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              style={inputStyle}
            />
          ))}
          <button onClick={handleAdd} style={btnPrimary(trip.color)} disabled={loading}>
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button onClick={() => setShowAdd(false)} style={btnSecondary}>ยกเลิก</button>
        </div>
      ) : (
        <div onClick={() => setShowAdd(true)} style={{
          ...cardStyle,
          border: '1px dashed rgba(255,255,255,0.12)',
          textAlign: 'center', color: C.muted, cursor: 'pointer',
        }}>+ เพิ่มที่พัก</div>
      )}
    </div>
  )
}
