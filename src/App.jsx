import { useState, useEffect, useRef } from 'react'
import {
  auth, loginWithGoogle, logout, onAuthStateChanged,
  listenTrips, listenHotels, listenPlaces, listenExpenses,
  listenTimeline, listenChecklist,
  createTrip, updateTrip, logAction, saveUser, getCarOdometer, listenMemories,
  subscribePush,
} from './firebase.js'
import {
  CAR_OPTIONS, MEMBER_OPTIONS, STATUS_OPTIONS, STATUS_CONFIG,
  TRIP_EMOJIS, TRIP_COLORS, fuelCost, formatDate, countDays, C,
} from './constants.js'
import OverviewTab   from './tabs/OverviewTab.jsx'
import HotelsTab     from './tabs/HotelsTab.jsx'
import PlacesTab     from './tabs/PlacesTab.jsx'
import ExpensesTab   from './tabs/ExpensesTab.jsx'
import ChecklistTab  from './tabs/ChecklistTab.jsx'
import TimelineTab   from './tabs/TimelineTab.jsx'
import FAB           from './components/FAB.jsx'

const TABS = [
  { id: 'overview',  label: '🗺️ ภาพรวม' },
  { id: 'hotels',    label: '🏨 ที่พัก' },
  { id: 'places',    label: '📍 สถานที่' },
  { id: 'expenses',  label: '💰 ค่าใช้จ่าย' },
  { id: 'checklist', label: '📋 จัดของ' },
  { id: 'timeline',  label: '⏱️ Timeline' },
]

// ── Thai Date Picker ─────────────────────────────────────────
const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function ThaiDateInput({ value, onChange, style = {} }) {
  const [y, m, d] = value ? value.split('-') : ['', '', '']
  const SS = {
    padding: '10px 8px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
    color: '#f1f5f9', fontSize: 14, fontFamily: 'Sarabun, sans-serif',
    outline: 'none', appearance: 'none', cursor: 'pointer',
    colorScheme: 'dark', ...style,
  }
  const update = (ny, nm, nd) => {
    if (ny && nm && nd) onChange(`${ny}-${nm}-${nd}`)
  }
  const now = new Date().getFullYear()
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <select value={d || ''} onChange={e => update(y, m, e.target.value)} style={{ ...SS, flex: 1 }}>
        <option value="">วัน</option>
        {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(v => (
          <option key={v} value={v}>{Number(v)}</option>
        ))}
      </select>
      <select value={m || ''} onChange={e => update(y, e.target.value, d)} style={{ ...SS, flex: 2 }}>
        <option value="">เดือน</option>
        {MONTHS_TH.map((name, i) => (
          <option key={i} value={String(i + 1).padStart(2, '0')}>{name}</option>
        ))}
      </select>
      <select value={y || ''} onChange={e => update(e.target.value, m, d)} style={{ ...SS, flex: 2 }}>
        <option value="">ปี (พ.ศ.)</option>
        {Array.from({ length: 5 }, (_, i) => now + i).map(yr => (
          <option key={yr} value={String(yr)}>{yr + 543}</option>
        ))}
      </select>
    </div>
  )
}

// ── Create / Edit Trip Modal ──────────────────────────────────
function CreateModal({ onClose, onSave, color: defaultColor, uid, editData }) {
  const [odometer, setOdometer] = useState(null)
  const [form, setForm] = useState(editData ? {
    name: editData.name || '', img: editData.img || '✈️', color: editData.color || defaultColor || '#6366f1',
    start: editData.dates?.start || '', end: editData.dates?.end || '',
    location: editData.location || '', members: editData.members || [],
    carId: editData.car?.id || 'mg5', distance: editData.distance || '',
    fuelPrice: editData.fuelPrice || 42, budgetTotal: editData.budgetTotal || '',
    status: editData.status || 'วางแผน',
  } : {
    name: '', img: '✈️', color: defaultColor || '#6366f1',
    start: '', end: '', location: '',
    members: [], carId: 'mg5',
    distance: '', fuelPrice: 42,
    budgetTotal: '', status: 'วางแผน',
  })

  useEffect(() => {
    if (uid) getCarOdometer(uid).then(setOdometer)
  }, [uid])

  const car = CAR_OPTIONS.find(c => c.id === form.carId)
  const fuel = fuelCost(Number(form.distance), car?.efficiency, form.fuelPrice)

  const handleSave = () => {
    if (!form.name) return
    onSave({
      name: form.name, img: form.img, color: form.color,
      dates: { start: form.start, end: form.end },
      location: form.location,
      status: form.status, members: form.members,
      car: CAR_OPTIONS.find(c => c.id === form.carId),
      distance: Number(form.distance), fuelPrice: Number(form.fuelPrice),
      budgetTotal: Number(form.budgetTotal) || 0,
    })
    onClose()
  }

  const IS = { // input style inline
    width: '100%', padding: '10px 12px', marginBottom: 8,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: '#f1f5f9', fontSize: 15,
    fontFamily: 'Sarabun, sans-serif', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)', zIndex: 300,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1e293b', borderRadius: '24px 24px 0 0',
        padding: '24px 20px 40px',
        width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
      }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>
          {editData ? '✏️ แก้ไขทริป' : '✈️ สร้างทริปใหม่'}
        </div>

        {/* Emoji */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {TRIP_EMOJIS.map(e => (
            <button key={e} onClick={() => setForm(f => ({ ...f, img: e }))} style={{
              width: 40, height: 40, borderRadius: 10, fontSize: 20, cursor: 'pointer',
              background: form.img === e ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${form.img === e ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
            }}>{e}</button>
          ))}
        </div>

        {/* Color */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {TRIP_COLORS.map(c => (
            <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
              width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
              border: form.color === c ? '3px solid #fff' : '2px solid transparent',
            }} />
          ))}
        </div>

        <input placeholder="ชื่อทริป เช่น เชียงใหม่ มิ.ย. 69" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={IS} />

        <input placeholder="🌍 เมืองปลายทาง เช่น Chiang Mai, Thailand" value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={IS} />

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>วันเริ่มต้น</div>
        <ThaiDateInput value={form.start} onChange={v => setForm(f => ({ ...f, start: v }))} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 12, color: C.muted, margin: '10px 0 6px' }}>วันสิ้นสุด</div>
        <ThaiDateInput value={form.end} onChange={v => setForm(f => ({ ...f, end: v }))} style={{ marginBottom: 10 }} />

        <div style={{ fontSize: 12, color: C.muted, margin: '12px 0 8px' }}>สมาชิก</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {MEMBER_OPTIONS.map(m => (
            <button key={m} onClick={() => setForm(f => ({
              ...f,
              members: f.members.includes(m) ? f.members.filter(x => x !== m) : [...f.members, m],
            }))} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: form.members.includes(m) ? form.color : 'rgba(255,255,255,0.06)',
              color: form.members.includes(m) ? '#000' : C.muted2,
              border: 'none', cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
            }}>{m}</button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>รถ</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {CAR_OPTIONS.map(c => (
            <button key={c.id} onClick={() => setForm(f => ({ ...f, carId: c.id }))} style={{
              flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              lineHeight: 1.6, background: form.carId === c.id ? form.color : 'rgba(255,255,255,0.06)',
              color: form.carId === c.id ? '#000' : C.muted2,
              border: 'none', cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
            }}>{c.name}<div style={{ fontSize: 10, fontWeight: 400 }}>{c.efficiency} km/L</div></button>
          ))}
        </div>

        {odometer && odometer.length > 0 && (
          <div style={{
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 10, padding: '8px 12px', marginBottom: 10,
            display: 'flex', flexWrap: 'wrap', gap: 8,
          }}>
            {odometer.map((c, i) => (
              <div key={i} style={{ fontSize: 12, color: '#a5b4fc' }}>
                🚗 {c.brand} — <span style={{ fontWeight: 700 }}>{(c.km || 0).toLocaleString()} km</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <input type="number" placeholder="ระยะทาง (km)" value={form.distance}
            onChange={e => setForm(f => ({ ...f, distance: e.target.value }))}
            style={{ ...IS, marginBottom: 0 }} />
          <input type="number" placeholder="ราคาน้ำมัน ฿/L" value={form.fuelPrice}
            onChange={e => setForm(f => ({ ...f, fuelPrice: e.target.value }))}
            style={{ ...IS, marginBottom: 0 }} />
        </div>

        <input type="number" placeholder="งบประมาณรวม (บาท) เช่น 15000" value={form.budgetTotal}
          onChange={e => setForm(f => ({ ...f, budgetTotal: e.target.value }))} style={{ ...IS, marginTop: 8 }} />

        {fuel > 0 && (
          <div style={{
            background: '#fbbf2415', border: '1px solid #fbbf2440',
            borderRadius: 12, padding: '10px 14px', marginBottom: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: '#fbbf24' }}>⛽ ค่าน้ำมันไปกลับ</span>
            <span style={{ fontWeight: 800, color: '#fbbf24' }}>฿{fuel.toLocaleString()}</span>
          </div>
        )}

        <button onClick={handleSave} style={{
          width: '100%', padding: 14, background: form.color, color: '#000',
          border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16,
          cursor: 'pointer', fontFamily: 'Sarabun, sans-serif', marginBottom: 8,
        }}>{editData ? `บันทึก ${form.img}` : `สร้างทริป ${form.img}`}</button>
        <button onClick={onClose} style={{
          width: '100%', padding: 12, background: 'rgba(255,255,255,0.05)', color: C.muted2,
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
          cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
        }}>ยกเลิก</button>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [trips, setTrips]         = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab]             = useState('overview')
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  // subcollections ของทริปที่เลือก
  const [hotels,    setHotels]    = useState([])
  const [places,    setPlaces]    = useState([])
  const [expenses,  setExpenses]  = useState([])
  const [timeline,  setTimeline]  = useState([])
  const [checklist, setChecklist] = useState([])
  const [memories,  setMemories]  = useState([])
  const [showMemories, setShowMemories] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [myName, setMyName] = useState(() => localStorage.getItem('myName') || '')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  const trip = trips.find(t => t.id === selectedId)

  // ── Auth listener ──────────────────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      setUser(u)
      setLoading(false)
      if (u) {
        await saveUser(u.uid, {
          displayName: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
        })
      }
    })
  }, [])

  // ── Trips listener ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    return listenTrips(data => {
      setTrips(data)
      if (!selectedId && data.length > 0) setSelectedId(data[0].id)
    })
  }, [user])

  // ── Memories listener ──────────────────────────────────────
  useEffect(() => {
    if (!user) return
    return listenMemories(setMemories)
  }, [user])


  // ── Subcollections listener ────────────────────────────────
  useEffect(() => {
    if (!selectedId) return
    const unsubHotels    = listenHotels(selectedId,    setHotels)
    const unsubPlaces    = listenPlaces(selectedId,    setPlaces)
    const unsubExpenses  = listenExpenses(selectedId,  setExpenses)
    const unsubTimeline  = listenTimeline(selectedId,  setTimeline)
    const unsubChecklist = listenChecklist(selectedId, setChecklist)
    return () => {
      unsubHotels(); unsubPlaces(); unsubExpenses()
      unsubTimeline(); unsubChecklist()
    }
  }, [selectedId])

  const handleCreateTrip = async (data) => {
    if (!user) return
    const id = await createTrip(data, user.uid)
    await logAction(id, {
      type: 'trip_created', actor: user.displayName || 'คุณ',
      summary: `สร้างทริป "${data.name}" ${formatDate(data.dates?.start)} – ${formatDate(data.dates?.end)}`,
    })
    setSelectedId(id)
    setTab('overview')
  }

  const handleEditTrip = async (data) => {
    if (!selectedId) return
    await updateTrip(selectedId, data)
    setShowEdit(false)
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a', color: '#f1f5f9', fontSize: 18,
    }}>
      🗺️ กำลังโหลด...
    </div>
  )

  // ── Login screen ───────────────────────────────────────────
  if (!user) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f1f5f9', textAlign: 'center', padding: 20,
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🗺️</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>ทริปครอบครัว</div>
      <div style={{ fontSize: 15, color: C.muted, marginBottom: 40 }}>
        วางแผนเที่ยวกับครอบครัว ง่ายๆ ในที่เดียว
      </div>
      <button onClick={loginWithGoogle} style={{
        padding: '14px 32px', borderRadius: 14,
        background: '#fff', color: '#0f172a',
        border: 'none', fontSize: 16, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'Sarabun, sans-serif',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        <span style={{ fontSize: 20 }}>G</span> เข้าสู่ระบบด้วย Google
      </button>
    </div>
  )

  const tripColor = trip?.color || '#6366f1'
  const userName = user.displayName?.split(' ')[0] || 'คุณ'

  return (
    <div style={{
      minHeight: '100vh', maxWidth: 480, margin: '0 auto',
      background: '#0f172a', color: '#f1f5f9',
      position: 'relative',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)',
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>🗺️ ทริปครอบครัว</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
            สวัสดี {userName} · {trips.length} ทริป{myName ? ` · 🔔 ${myName}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {memories.length > 0 && (
            <div onClick={() => setShowMemories(true)} style={{
              background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
              borderRadius: 20, padding: '6px 12px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: '1px solid rgba(99,102,241,0.3)',
            }}>🎞️ {memories.length}</div>
          )}
          <div onClick={() => setShowSettings(true)} style={{
            background: myName ? 'rgba(255,255,255,0.06)' : 'rgba(251,191,36,0.15)',
            color: myName ? C.muted2 : '#fbbf24',
            borderRadius: 20, padding: '6px 12px',
            fontSize: 13, cursor: 'pointer',
            border: `1px solid ${myName ? 'rgba(255,255,255,0.1)' : 'rgba(251,191,36,0.4)'}`,
            position: 'relative',
          }}>
            ⚙️{!myName && <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 8, height: 8, borderRadius: '50%',
              background: '#fbbf24', border: '2px solid #0f172a',
            }} />}
          </div>
          <div onClick={() => setShowCreate(true)} style={{
            background: `${tripColor}`, color: '#000',
            borderRadius: 20, padding: '6px 14px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>+ ทริปใหม่</div>
          <img src={user.photoURL} alt="" onClick={logout}
            style={{ width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
      </div>

      {/* Notification setup banner */}
      {!myName && (
        <div onClick={() => setShowSettings(true)} style={{
          background: 'rgba(251,191,36,0.1)',
          borderBottom: '1px solid rgba(251,191,36,0.2)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>ตั้งค่าการแจ้งเตือน</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>กดเพื่อเลือกชื่อและเปิดรับการแจ้งเตือน</div>
          </div>
          <span style={{ color: '#fbbf24', fontSize: 16 }}>→</span>
        </div>
      )}

      {/* Trip selector */}
      <div style={{ padding: '12px 16px 8px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, width: 'max-content' }}>
          {trips.map(t => {
            const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG['วางแผน']
            const isSel = selectedId === t.id
            return (
              <div key={t.id} onClick={() => { setSelectedId(t.id); setTab('overview') }} style={{
                width: 145, flexShrink: 0,
                background: isSel ? `linear-gradient(135deg,${t.color}22,${t.color}44)` : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSel ? t.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16, padding: 13, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{t.img}</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: C.muted2, marginTop: 2 }}>
                  {formatDate(t.dates?.start)} – {formatDate(t.dates?.end)}
                </div>
                <div style={{ marginTop: 7 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                  }}>{t.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: '#475569' }}>👥 {(t.members || []).length} คน</span>
                  {isSel && (
                    <span onClick={e => { e.stopPropagation(); setShowEdit(true) }} style={{
                      fontSize: 11, color: t.color, cursor: 'pointer', padding: '2px 6px',
                      background: `${t.color}22`, borderRadius: 6,
                    }}>✏️ แก้ไข</span>
                  )}
                </div>
              </div>
            )
          })}

          {trips.length === 0 && (
            <div style={{
              width: 200, padding: 20, textAlign: 'center',
              color: C.muted, fontSize: 14,
            }}>
              ยังไม่มีทริป<br />กด "+ ทริปใหม่" เลยครับ
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {trip && (
        <>
          <div style={{
            display: 'flex', padding: '0 16px', gap: 2,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            overflowX: 'auto',
          }}>
            {TABS.map(t => (
              <div key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '9px 13px', fontSize: 13, whiteSpace: 'nowrap',
                fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? tripColor : C.muted,
                borderBottom: tab === t.id ? `2px solid ${tripColor}` : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{t.label}</div>
            ))}
          </div>

          <div style={{ padding: '14px 16px 40px' }}>
            {tab === 'overview'  && <OverviewTab  trip={{ ...trip, places, expenses }} uid={user.uid} onEdit={() => setShowEdit(true)} />}
            {tab === 'hotels'    && <HotelsTab    trip={trip} hotels={hotels} uid={user.uid} userName={userName} />}
            {tab === 'places'    && <PlacesTab    trip={trip} places={places} uid={user.uid} userName={userName} />}
            {tab === 'expenses'  && <ExpensesTab  trip={trip} expenses={expenses} uid={user.uid} userName={userName} />}
            {tab === 'checklist' && <ChecklistTab trip={trip} checklist={checklist} uid={user.uid} userName={userName} />}
            {tab === 'timeline'  && <TimelineTab  timeline={timeline} />}
          </div>

          <FAB trip={trip} places={places} uid={user.uid} userName={userName} color={tripColor} />
        </>
      )}

      {showMemories && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 300,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={e => e.target === e.currentTarget && setShowMemories(false)}>
          <div style={{
            background: '#1e293b', borderRadius: '24px 24px 0 0',
            padding: '24px 20px 40px', width: '100%', maxWidth: 480,
            maxHeight: '85vh', overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
          }}>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>🎞️ ความทรงจำ</div>
            {memories.map(m => (
              <div key={m.id} style={{
                background: `linear-gradient(135deg,${m.color}15,${m.color}25)`,
                border: `1.5px solid ${m.color}44`,
                borderRadius: 16, padding: 16, marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{m.img}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {formatDate(m.dates?.start)} – {formatDate(m.dates?.end)} · {m.days} วัน
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { icon: '💰', label: 'ค่าใช้จ่าย', value: `฿${(m.totalExpense||0).toLocaleString()}` },
                    { icon: '📍', label: 'สถานที่', value: `${(m.placesVisited||[]).length}/${m.placesTotal||0}` },
                    { icon: '👥', label: 'สมาชิก', value: `${(m.members||[]).length} คน` },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 10px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 16 }}>{item.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: m.color, marginTop: 2 }}>{item.value}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                {(m.placesVisited || []).length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: C.muted2 }}>
                    📍 {m.placesVisited.map(p => p.name).join(' · ')}
                  </div>
                )}
                {m.location && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>🌍 {m.location}</div>
                )}
              </div>
            ))}
            <button onClick={() => setShowMemories(false)} style={{
              width: '100%', padding: 12, background: 'rgba(255,255,255,0.05)',
              color: C.muted2, border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
            }}>ปิด</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 300,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={e => e.target === e.currentTarget && setShowSettings(false)}>
          <div style={{
            background: '#1e293b', borderRadius: '24px 24px 0 0',
            padding: '24px 20px 40px', width: '100%', maxWidth: 480,
            maxHeight: '85vh', overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
          }}>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>🔔 ตั้งค่าการแจ้งเตือน</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              เลือกชื่อของคุณ แล้วกดเปิดการแจ้งเตือนบนเครื่องนี้
            </div>

            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>ฉันคือ</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {MEMBER_OPTIONS.map(m => (
                <button key={m} onClick={() => { setMyName(m); localStorage.setItem('myName', m); setPushEnabled(false) }} style={{
                  padding: '8px 18px', borderRadius: 20, fontSize: 14, fontWeight: 700,
                  background: myName === m ? tripColor : 'rgba(255,255,255,0.06)',
                  color: myName === m ? '#000' : C.muted2,
                  border: 'none', cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
                }}>{m}</button>
              ))}
            </div>

            {pushEnabled ? (
              <div style={{
                background: '#10b98120', border: '1px solid #10b98140',
                borderRadius: 12, padding: '14px', textAlign: 'center',
                fontSize: 14, color: '#10b981', fontWeight: 700,
              }}>✅ เปิดการแจ้งเตือนสำหรับ {myName} แล้ว!</div>
            ) : (
              <button
                disabled={!myName || pushLoading}
                onClick={async () => {
                  if (!myName) return
                  setPushLoading(true)
                  const result = await subscribePush(myName)
                  setPushLoading(false)
                  if (result === 'ok') setPushEnabled(true)
                  else alert('ไม่สามารถเปิดการแจ้งเตือนได้ ลองอนุญาต notification ในการตั้งค่าเบราว์เซอร์')
                }}
                style={{
                  width: '100%', padding: 14, borderRadius: 12, border: 'none',
                  background: myName ? tripColor : 'rgba(255,255,255,0.08)',
                  color: myName ? '#000' : C.muted,
                  fontWeight: 800, fontSize: 15, cursor: myName ? 'pointer' : 'default',
                  fontFamily: 'Sarabun, sans-serif',
                }}
              >{pushLoading ? '⏳ กำลังเปิด...' : '🔔 เปิดการแจ้งเตือนบนเครื่องนี้'}</button>
            )}

            <div style={{
              background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)',
              borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#93c5fd', marginTop: 16,
            }}>
              💡 แต่ละเครื่องต้องทำแค่ครั้งเดียว — เมื่อมีคนเพิ่มที่พัก สถานที่ หรือค่าใช้จ่าย จะแจ้งเตือนทุกเครื่องที่เปิดไว้อัตโนมัติ
            </div>

            <button onClick={() => setShowSettings(false)} style={{
              width: '100%', marginTop: 16, padding: 12,
              background: 'rgba(255,255,255,0.05)', color: C.muted2,
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
            }}>ปิด</button>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSave={handleCreateTrip}
          color={tripColor}
          uid={user.uid}
        />
      )}

      {showEdit && trip && (
        <CreateModal
          onClose={() => setShowEdit(false)}
          onSave={handleEditTrip}
          color={tripColor}
          uid={user.uid}
          editData={trip}
        />
      )}
    </div>
  )
}
