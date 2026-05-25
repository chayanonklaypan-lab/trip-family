import { useState, useEffect } from 'react'
import { countDays, formatDate, fuelCost, cardStyle, C } from '../constants.js'
import { fetchWeather } from '../firebase.js'

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

export default function OverviewTab({ trip }) {
  const [weather, setWeather]           = useState(null)
  const [weatherLoading, setLoading]    = useState(false)

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
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
          {trip.img} {trip.name}
        </div>
        {trip.location && (
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>📍 {trip.location}</div>
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
