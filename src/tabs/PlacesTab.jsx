import { useState } from 'react'
import { CATEGORY_COLOR, voteScore, cardStyle, inputStyle, btnPrimary, btnSecondary, C } from '../constants.js'
import { addPlace, votePlace, checkInPlace, confirmPlace, logAction, notifyTripMembers } from '../firebase.js'

const Pill = ({ children, color, bg, border, style = {} }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: bg || `${color}22`, color: color || '#94a3b8',
    border: `1px solid ${border || color || '#94a3b8'}44`,
    ...style,
  }}>{children}</span>
)

export default function PlacesTab({ trip, places, uid, userName }) {
  const [showAdd, setShowAdd] = useState(false)
  const [showVote, setShowVote] = useState(null)
  const [form, setForm] = useState({ name: '', category: 'เที่ยว', link: '' })
  const [filter, setFilter] = useState('ทั้งหมด')

  const handleVote = async (place, emoji) => {
    const prev = place.votes?.[uid]
    const newEmoji = prev === emoji ? null : emoji
    await votePlace(trip.id, place.id, uid, newEmoji)
    await logAction(trip.id, {
      type: 'place_voted', actor: userName,
      summary: `${userName} โหวต ${newEmoji || 'ยกเลิก'} "${place.name}"`,
      refId: place.id,
    })
  }

  const handleConfirm = async (place) => {
    await confirmPlace(trip.id, place.id, !place.confirmed)
  }

  const handleCheckin = async (place) => {
    const newDone = !place.done
    await checkInPlace(trip.id, place.id, newDone)
    if (newDone) {
      const summary = `${userName} เช็คอินที่ "${place.name}" ✅`
      await logAction(trip.id, {
        type: 'place_checkin', actor: userName,
        summary, refId: place.id,
      })
      notifyTripMembers(trip, userName, `[${trip.name}]\n${summary}`)
    }
  }

  const handleAdd = async () => {
    if (!form.name) return
    const id = await addPlace(trip.id, { name: form.name, category: form.category, link: form.link })
    const summary = `${userName} เพิ่มสถานที่ "${form.name}" (${form.category})`
    await logAction(trip.id, {
      type: 'place_added', actor: userName,
      summary, refId: id,
    })
    notifyTripMembers(trip, userName, `[${trip.name}]\n${summary}`)
    setForm({ name: '', category: 'เที่ยว', link: '' })
    setShowAdd(false)
  }

  const cats = ['ทั้งหมด', ...Object.keys(CATEGORY_COLOR)]
  const sorted = [...places].sort((a, b) => voteScore(b.votes) - voteScore(a.votes))
  const filtered = sorted.filter(p => filter === 'ทั้งหมด' || p.category === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            border: '1px solid', whiteSpace: 'nowrap', cursor: 'pointer',
            fontFamily: 'Sarabun, sans-serif',
            background: filter === c ? (CATEGORY_COLOR[c] || '#f1f5f9') : 'rgba(255,255,255,0.04)',
            color: filter === c ? '#fff' : C.muted,
            borderColor: filter === c ? (CATEGORY_COLOR[c] || '#94a3b8') : 'rgba(255,255,255,0.1)',
          }}>{c}</button>
        ))}
      </div>

      {filtered.map((p, i) => {
        const score = voteScore(p.votes)
        const isHot = i === 0 && score > 2
        return (
          <div key={p.id} style={{
            ...cardStyle,
            border: isHot ? `1.5px solid ${trip.color}66` : cardStyle.border,
            opacity: p.done ? 0.6 : 1,
            position: 'relative',
          }}>
            {isHot && (
              <div style={{
                position: 'absolute', top: -1, right: 12,
                background: trip.color, color: '#000',
                fontSize: 11, fontWeight: 800,
                padding: '2px 10px', borderRadius: '0 0 8px 8px',
              }}>🔥 ยอดนิยม</div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* ปุ่มเช็คอิน */}
              <button onClick={() => handleCheckin(p)} style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0, marginTop: 2,
                background: p.done ? trip.color : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${p.done ? trip.color : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer', fontSize: 14, color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{p.done ? '✓' : ''}</button>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 700, fontSize: 15,
                  textDecoration: p.done ? 'line-through' : 'none',
                  color: p.done ? C.muted : '#f1f5f9',
                }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <Pill color={CATEGORY_COLOR[p.category]}>{p.category}</Pill>
                  <span style={{ fontSize: 12, color: trip.color, fontWeight: 700 }}>
                    {score > 0 ? '+' : ''}{score} คะแนน
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <a
                  href={p.link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + (trip.location ? ' ' + trip.location : ''))}`}
                  target="_blank" rel="noreferrer"
                  style={{ fontSize: 18, textDecoration: 'none' }}
                  title="เปิด Google Maps"
                >📍</a>
                <button onClick={() => setShowVote(showVote === p.id ? null : p.id)} style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '4px 8px', fontSize: 12, color: C.muted2,
                  cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
                }}>โหวต</button>
              </div>
            </div>

            {/* Vote panel */}
            {showVote === p.id && (
              <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
                {(trip.members || []).map(m => (
                  <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.muted2, width: 40 }}>{m}</span>
                    {['❤️', '👍', '❌'].map(emoji => (
                      <button key={emoji} onClick={() => handleVote(p, emoji)} style={{
                        minWidth: 44, minHeight: 36, padding: '6px 10px',
                        borderRadius: 10, border: '1.5px solid',
                        borderColor: p.votes?.[uid] === emoji ? trip.color : 'rgba(255,255,255,0.1)',
                        background: p.votes?.[uid] === emoji ? `${trip.color}33` : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer', fontSize: 16,
                      }}>{emoji}</button>
                    ))}
                    <span style={{ fontSize: 13 }}>{p.votes?.[m] || '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ยืนยัน */}
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => handleConfirm(p)} style={{
                padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: p.confirmed ? '#6366f1' : 'rgba(255,255,255,0.06)',
                color: p.confirmed ? '#fff' : C.muted2,
                border: `1.5px solid ${p.confirmed ? '#6366f1' : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
              }}>{p.confirmed ? '📌 ไปที่นี่แน่นอน' : '📌 ไปที่นี่?'}</button>
            </div>
          </div>
        )
      })}

      {showAdd ? (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>📍 เพิ่มสถานที่</div>
          <input placeholder="ชื่อสถานที่" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {Object.keys(CATEGORY_COLOR).map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: form.category === c ? CATEGORY_COLOR[c] : 'rgba(255,255,255,0.06)',
                color: form.category === c ? '#fff' : C.muted2,
                border: 'none', cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
              }}>{c}</button>
            ))}
          </div>
          <input placeholder="ลิงก์ Google Maps (ถ้ามี — ถ้าไม่ใส่จะค้นชื่อสถานที่อัตโนมัติ)" value={form.link}
            onChange={e => setForm(f => ({ ...f, link: e.target.value }))} style={inputStyle} />
          <button onClick={handleAdd} style={btnPrimary(trip.color)}>บันทึก</button>
          <button onClick={() => setShowAdd(false)} style={btnSecondary}>ยกเลิก</button>
        </div>
      ) : (
        <div onClick={() => setShowAdd(true)} style={{
          ...cardStyle,
          border: '1px dashed rgba(255,255,255,0.12)',
          textAlign: 'center', color: C.muted, cursor: 'pointer',
        }}>+ เพิ่มสถานที่</div>
      )}
    </div>
  )
}
