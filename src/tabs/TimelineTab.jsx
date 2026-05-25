import { useState } from 'react'
import { TIMELINE_LABEL, formatTime, C } from '../constants.js'

const IMPORTANT_TYPES = new Set([
  'trip_created', 'hotel_added', 'place_added', 'place_checkin',
  'expense_added', 'fuel_added', 'checklist_done',
])

export default function TimelineTab({ timeline }) {
  const [filter, setFilter] = useState('all')

  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>ยังไม่มีกิจกรรม</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>เริ่มเพิ่มที่พัก สถานที่ หรือค่าใช้จ่าย</div>
      </div>
    )
  }

  const shown = filter === 'important'
    ? timeline.filter(i => IMPORTANT_TYPES.has(i.type))
    : timeline

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['all', 'ทั้งหมด'], ['important', 'สำคัญ']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            border: '1px solid', cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
            background: filter === val ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
            color: filter === val ? '#f1f5f9' : C.muted,
            borderColor: filter === val ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 19, top: 0, bottom: 0,
          width: 2, background: 'rgba(255,255,255,0.06)',
        }} />

        {shown.map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: 12, marginBottom: 16, position: 'relative' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: '#1e293b', border: '2px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, position: 'relative', zIndex: 1,
            }}>
              {TIMELINE_LABEL[item.type]?.split(' ')[0] || '📌'}
            </div>

            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '10px 14px', marginTop: 4,
            }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                {TIMELINE_LABEL[item.type] || item.type}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
                {item.summary}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                🕐 {formatTime(item.timestamp) || 'เพิ่งบันทึก'}
              </div>
            </div>
          </div>
        ))}

        {shown.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: C.muted, fontSize: 13 }}>
            ยังไม่มีกิจกรรมสำคัญ
          </div>
        )}
      </div>
    </div>
  )
}
