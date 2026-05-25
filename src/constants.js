// ── Constants ─────────────────────────────────────────────────

export const CAR_OPTIONS = [
  { id: 'mg5',    name: 'MG5 Turbo',    efficiency: 15 },
  { id: 'click',  name: 'Honda Click',  efficiency: 40 },
]

export const MEMBER_OPTIONS = ['คุณ', 'แฟน', 'พ่อ', 'แม่', 'น้อง']

export const STATUS_OPTIONS = ['วางแผน', 'ยืนยัน', 'กำลังเดินทาง', 'เสร็จแล้ว']

export const STATUS_CONFIG = {
  'วางแผน':         { bg: '#fef3c722', text: '#fbbf24', border: '#fbbf2444' },
  'ยืนยัน':         { bg: '#d1fae522', text: '#10b981', border: '#10b98144' },
  'กำลังเดินทาง':   { bg: '#dbeafe22', text: '#60a5fa', border: '#60a5fa44' },
  'เสร็จแล้ว':      { bg: '#f1f5f915', text: '#64748b', border: '#64748b44' },
}

export const CATEGORY_COLOR = {
  'เที่ยว':    '#6366f1',
  'กิน':       '#f59e0b',
  'คาเฟ่':     '#ec4899',
  'ช้อปปิ้ง': '#10b981',
}

export const EXPENSE_CATEGORY = {
  'น้ำมัน':   '⛽',
  'อาหาร':    '🍜',
  'ที่พัก':   '🏨',
  'ทางด่วน':  '🛣️',
  'อื่นๆ':    '💸',
}

export const CHECKLIST_CATEGORY = {
  'เอกสาร':   '📄',
  'เสื้อผ้า': '👕',
  'ยา':       '💊',
  'อุปกรณ์':  '🎒',
}

export const TRIP_EMOJIS = ['✈️','🏔️','🌿','🏖️','🏙️','🌸','🎡','🛖','🏕️','🗺️']

export const TRIP_COLORS = [
  '#10b981','#6366f1','#f59e0b','#ef4444',
  '#ec4899','#06b6d4','#8b5cf6','#f97316',
]

// ── Utils ─────────────────────────────────────────────────────

export const fuelCost = (distance, efficiency, price = 42) =>
  distance && efficiency
    ? Math.round(((distance * 2) / efficiency) * price)
    : 0

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: '2-digit',
  }) : ''

export const formatTime = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('th-TH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export const countDays = (s, e) => {
  if (!s || !e) return 0
  return Math.round((new Date(e) - new Date(s)) / 86400000) + 1
}

export const totalAmt = (arr) => arr.reduce((s, x) => s + (x.amount || 0), 0)

export const voteScore = (votes = {}) => {
  let score = 0
  Object.values(votes).forEach(v => {
    if (v === '❤️') score += 2
    else if (v === '👍') score += 1
    else if (v === '❌') score -= 1
  })
  return score
}

// ── Shared Styles ─────────────────────────────────────────────

export const C = {
  bg:      '#0f172a',
  card:    'rgba(255,255,255,0.04)',
  border:  'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.12)',
  text:    '#f1f5f9',
  muted:   '#64748b',
  muted2:  '#94a3b8',
}

export const inputStyle = {
  width: '100%', padding: '10px 12px', marginBottom: 8,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10, color: '#f1f5f9', fontSize: 15,
  fontFamily: 'Sarabun, sans-serif', outline: 'none', boxSizing: 'border-box',
}

export const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16, padding: 16, marginBottom: 10,
}

export const btnPrimary = (color) => ({
  width: '100%', padding: '11px 16px', marginTop: 4,
  background: color || '#6366f1', color: '#000',
  border: 'none', borderRadius: 12, fontSize: 15,
  fontWeight: 700, cursor: 'pointer',
  fontFamily: 'Sarabun, sans-serif',
})

export const btnSecondary = {
  width: '100%', padding: '11px 16px', marginTop: 4,
  background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, fontSize: 15, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
}

// ── Timeline type → label ─────────────────────────────────────
export const TIMELINE_LABEL = {
  hotel_added:    '🏨 เพิ่มที่พัก',
  hotel_voted:    '🗳️ โหวตที่พัก',
  place_added:    '📍 เพิ่มสถานที่',
  place_voted:    '🗳️ โหวตสถานที่',
  place_checkin:  '✅ เช็คอินสถานที่',
  expense_added:  '💰 บันทึกค่าใช้จ่าย',
  fuel_added:     '⛽ เติมน้ำมัน',
  checklist_done: '☑️ จัดของเสร็จ',
  trip_created:   '🗺️ สร้างทริป',
}
