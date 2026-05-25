import { TIMELINE_LABEL, formatTime, C } from '../constants.js'

export default function TimelineTab({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>ยังไม่มีกิจกรรม</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>เริ่มเพิ่มที่พัก สถานที่ หรือค่าใช้จ่าย</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 19, top: 0, bottom: 0,
        width: 2, background: 'rgba(255,255,255,0.06)',
      }} />

      {timeline.map((item) => (
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
    </div>
  )
}
