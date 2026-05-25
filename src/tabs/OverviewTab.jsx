import { useState, useEffect } from 'react'
import { countDays, formatDate, fuelCost, cardStyle, inputStyle, C, STATUS_OPTIONS, STATUS_CONFIG } from '../constants.js'
import { fetchWeather, getCarOdometer, updateCarOdometer, updateTrip, archiveTrip } from '../firebase.js'

const WEATHER_MOCK = [
  { date: 'วันแรก',      icon: '⛅', min: 26, max: 33, rain: 20 },
  { date: 'วันที่ 2',    icon: '🌦️', min: 25, max: 31, rain: 55 },
  { date: 'วันที่ 3',    icon: '☀️', min: 27, max: 35, rain: 10 },
  { date: 'วันสุดท้าย', icon: '⛅', min: 26, max: 32, rain: 30 },
]

const Pill = ({ children, color, bg }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    background: bg || 'rgba(255,255,255,0.08)',
    color: color || '#94a3b8',
    border: `1px solid ${color || '#94a3b8'}44`,
  }}>{children}</span>
)

export default function OverviewTab({ trip, uid, onEdit }) {
  const [weather, setWeather]           = useState(null)
  const [weatherLoading, setLoading]    = useState(false)
  const [odometer, setOdometer]         = useState(null)
  const [endKm, setEndKm]               = useState('')
  const [kmSaving, setKmSaving]         = useState(false)
  const [kmSaved, setKmSaved]           = useState(false)
  const [archiving, setArchiving]       = useState(false)
  const [archived, setArchived]         = useState(false)

  const fuel     = fuelCost(trip.distance, trip.car?.efficiency, trip.fuelPrice)
  const days     = countDays(trip.dates?.start, trip.dates?.end)
  const doneCount = (trip.places || []).filter(p => p.done).length

  useEffect(() => {
    if (!trip.location || !trip.dates?.start) return
    setLoading(true)
    fetchWeather(trip.location, trip.dates.start, days || 3)
      .then(data => { setWeather(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [trip.location, trip.dates?.start, days])

  useEffect(() => {
    if (uid) getCarOdometer(uid).then(setOdometer)
  }, [uid])

  const handleStatusChange = async (newStatus) => {
    await updateTrip(trip.id, { status: newStatus })
    if (newStatus === 'เสร็จแล้ว') {
      setArchiving(true)
      await archiveTrip(trip.id, {
        trip,
        expenses: trip.expenses || [],
        places: trip.places || [],
      })
      setArchiving(false)
      setArchived(true)
    }
  }

  const handleUpdateKm = async () => {
    if (!endKm || !uid || kmSaving) return
    setKmSaving(true)
    const ok = await updateCarOdometer(uid, Number(endKm))
    setKmSaving(false)
    if (ok) { setKmSaved(true); getCarOdometer(uid).then(setOdometer) }
  }

  const weatherData  = weather || WEATHER_MOCK.slice(0, Math.max(days, 1) || 3)
  const isRealWeather = !!weather

  const shareToLine = () => {
    const placesList = (trip.places || [])
      .map((p, i) => `  ${i + 1}. ${p.name}`)
      .join('\n') || '  -'
    const text = [
      `🗺️ ทริป: ${trip.name}`,
      `📅 ${formatDate(trip.dates?.start)} – ${formatDate(trip.dates?.end)} (${days} วัน)`,
      trip.location ? `📍 ปลายทาง: ${trip.location}` : '',
      `👥 ผู้ร่วมทาง: ${(trip.members || []).join(', ')}`,
      `🚗 ${trip.car?.name || ''} · ระยะ ${trip.distance || 0} km`,
      `⛽ ค่าน้ำมัน (ไปกลับ): ฿${fuel.toLocaleString()}`,
      `💰 งบประมาณ: ฿${(trip.budgetTotal || 0).toLocaleString()}`,
      `📍 สถานที่ที่วางแผน:\n${placesList}`,
      `\n✈️ ไปกันเลย!`,
    ].filter(Boolean).join('\n')
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank')
  }

  const openAllMaps = () => {
    const places = (trip.places || []).map(p => p.name).filter(Boolean)
    const query  = places.length > 0
      ? places.slice(0, 5).join(' ')  + (trip.location ? ` ${trip.location}` : '')
      : trip.location || trip.name
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      '_blank',
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* สรุปหลัก */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 24, fontWeight: 900 }}>
            {trip.img} {trip.name}
          </div>
          {onEdit && (
            <button onClick={onEdit} style={{
              padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Sarabun, sans-serif', flexShrink: 0, marginLeft: 8,
            }}>✏️ แก้ไข</button>
          )}
        </div>
        {(trip.origin || trip.location) && (
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
            {trip.origin && trip.location
              ? `📍 ${trip.origin} → ${trip.location}`
              : `📍 ${trip.origin || trip.location}`}
          </div>
        )}
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>
          📅 {formatDate(trip.dates?.start)} – {formatDate(trip.dates?.end)} · {days} วัน
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'ระยะทาง',            value: `${(trip.distance||0).toLocaleString()} km`, icon: '📍' },
            { label: 'ค่าน้ำมัน (ไปกลับ)', value: `฿${fuel.toLocaleString()}`,                 icon: '⛽' },
            { label: 'สถานที่',              value: `${doneCount}/${(trip.places||[]).length} แห่ง`, icon: '🗺️' },
            { label: 'สมาชิก',              value: `${(trip.members||[]).length} คน`,             icon: '👥' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12,
            }}>
              <div style={{ fontSize: 18 }}>{item.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: trip.color }}>
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* สมาชิก */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>👥 สมาชิกที่ไปด้วย</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(trip.members || []).map(m => (
            <Pill key={m} color="#e2e8f0" bg="rgba(255,255,255,0.08)">{m}</Pill>
          ))}
        </div>
      </div>

      {/* รถ */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 28 }}>🚗</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{trip.car?.name || 'ยังไม่เลือกรถ'}</div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {trip.car?.efficiency} km/L · ราคาน้ำมัน ฿{trip.fuelPrice}/L
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#ef4444' }}>
            ฿{fuel.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>ค่าน้ำมัน</div>
        </div>
      </div>

      {/* Google Maps — ดูสถานที่ทั้งหมด */}
      <div onClick={openAllMaps} style={{
        ...cardStyle,
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
        background: 'rgba(66,133,244,0.08)',
        border: '1px solid rgba(66,133,244,0.2)',
      }}>
        <div style={{ fontSize: 28 }}>🗺️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>ดูสถานที่ทั้งหมดบน Google Maps</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            {(trip.places || []).length > 0
              ? `${(trip.places || []).length} สถานที่${trip.location ? ` ใน ${trip.location}` : ''}`
              : trip.location || 'แตะเพื่อเปิด Maps'}
          </div>
        </div>
        <div style={{ color: '#4285f4', fontSize: 20 }}>→</div>
      </div>

      {/* สภาพอากาศ */}
      {trip.dates?.start && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: C.muted }}>🌤️ สภาพอากาศช่วงเดินทาง</div>
            {isRealWeather && (
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700,
                background: '#10b98120', color: '#10b981', border: '1px solid #10b98140',
              }}>Live ✓</span>
            )}
          </div>

          {weatherLoading ? (
            <div style={{ textAlign: 'center', color: C.muted, padding: '16px 0', fontSize: 13 }}>
              ⏳ กำลังโหลดสภาพอากาศ...
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {weatherData.map((w, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                  padding: '10px 14px', textAlign: 'center', flexShrink: 0, minWidth: 80,
                }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{w.date}</div>
                  <div style={{ fontSize: 24 }}>{w.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                    {w.min}–{w.max}°C
                  </div>
                  <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>
                    🌧️ {w.rain}%
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isRealWeather && !weatherLoading && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: 'right' }}>
              {trip.location
                ? '* ใส่ OpenWeatherMap API key ใน firebase.js เพื่อดูข้อมูลจริง'
                : '* ระบุเมืองปลายทางตอนสร้างทริปเพื่อดูสภาพอากาศ'}
            </div>
          )}
        </div>
      )}

      {/* เปลี่ยนสถานะทริป */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>สถานะทริป</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(s => {
            const sc = STATUS_CONFIG[s]
            const isActive = trip.status === s
            return (
              <button key={s} onClick={() => !isActive && handleStatusChange(s)} style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: isActive ? sc.bg : 'rgba(255,255,255,0.04)',
                color: isActive ? sc.text : C.muted,
                border: `1.5px solid ${isActive ? sc.border : 'rgba(255,255,255,0.08)'}`,
                cursor: isActive ? 'default' : 'pointer',
                fontFamily: 'Sarabun, sans-serif',
              }}>{s}</button>
            )
          })}
        </div>
        {archiving && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>⏳ กำลังบันทึกความทรงจำ...</div>
        )}
        {archived && (
          <div style={{
            marginTop: 10, background: '#6366f120', border: '1px solid #6366f140',
            borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#a5b4fc',
          }}>🎞️ บันทึกลงความทรงจำแล้ว ดูได้ที่หน้าหลัก</div>
        )}
      </div>

      {/* อัปเดต km กลับแอปดูแลรถ */}
      {odometer && odometer.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
            🚗 อัปเดต km กลับแอปดูแลรถ
          </div>
          <div style={{ fontSize: 12, color: C.muted2, marginBottom: 10 }}>
            {odometer.map((c, i) => (
              <span key={i}>ปัจจุบัน: <b style={{ color: '#f1f5f9' }}>{(c.km || 0).toLocaleString()} km</b> ({c.brand})</span>
            ))}
          </div>
          {kmSaved ? (
            <div style={{
              background: '#10b98120', border: '1px solid #10b98140',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#10b981', textAlign: 'center',
            }}>✅ อัปเดต km เรียบร้อยแล้ว</div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="km ปลายทาง เช่น 119800"
                value={endKm}
                onChange={e => setEndKm(e.target.value)}
                style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
              />
              <button onClick={handleUpdateKm} disabled={kmSaving || !endKm} style={{
                padding: '10px 16px', borderRadius: 10, border: 'none',
                background: endKm ? trip.color : 'rgba(255,255,255,0.1)',
                color: endKm ? '#000' : C.muted,
                fontWeight: 700, fontSize: 14, cursor: endKm ? 'pointer' : 'default',
                fontFamily: 'Sarabun, sans-serif', flexShrink: 0,
              }}>
                {kmSaving ? '...' : 'บันทึก'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Milestone */}
      {(trip.status === 'ยืนยัน' || trip.status === 'กำลังเดินทาง') && (
        <div style={{ display: 'flex', gap: 10 }}>
          {trip.status === 'ยืนยัน' && (
            <button onClick={() => handleStatusChange('กำลังเดินทาง')} style={{
              flex: 1, padding: 14, borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              fontFamily: 'Sarabun, sans-serif',
            }}>🚗 เริ่มเดินทาง!</button>
          )}
          {trip.status === 'กำลังเดินทาง' && (
            <button onClick={() => handleStatusChange('เสร็จแล้ว')} style={{
              flex: 1, padding: 14, borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              fontFamily: 'Sarabun, sans-serif',
            }}>🏠 กลับถึงบ้านแล้ว!</button>
          )}
        </div>
      )}

      {/* LINE Share */}
      <button onClick={shareToLine} style={{
        background: 'linear-gradient(135deg, #00b900, #00a000)',
        borderRadius: 14, padding: 14, width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15,
        border: 'none', color: '#fff', fontFamily: 'Sarabun, sans-serif',
      }}>
        💬 แชร์แผนให้ครอบครัวทาง LINE
      </button>
    </div>
  )
}
