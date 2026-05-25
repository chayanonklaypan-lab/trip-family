import { useState } from 'react'
import { EXPENSE_CATEGORY, inputStyle, C } from '../constants.js'
import { addExpense, checkInPlace, logAction } from '../firebase.js'

export default function FAB({ trip, places, uid, userName, color }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState(null) // 'expense' | 'fuel' | 'checkin'
  const [form, setForm] = useState({ name: '', amount: '', place: '' })

  const reset = () => { setOpen(false); setMode(null); setForm({ name: '', amount: '', place: '' }) }

  const handleExpense = async () => {
    if (!form.name || !form.amount) return
    const id = await addExpense(trip.id, {
      name: form.name, amount: Number(form.amount),
      category: 'อื่นๆ', paidBy: userName, splitWith: trip.members || [],
    })
    await logAction(trip.id, {
      type: 'expense_added', actor: userName,
      summary: `${userName} บันทึก "${form.name}" ฿${Number(form.amount).toLocaleString()}`,
      refId: id,
    })
    reset()
  }

  const handleFuel = async () => {
    if (!form.amount) return
    const id = await addExpense(trip.id, {
      name: form.name || 'เติมน้ำมัน', amount: Number(form.amount),
      category: 'น้ำมัน', paidBy: userName, splitWith: trip.members || [],
    })
    await logAction(trip.id, {
      type: 'fuel_added', actor: userName,
      summary: `${userName} เติมน้ำมัน ฿${Number(form.amount).toLocaleString()}`,
      refId: id,
    })
    reset()
  }

  const handleCheckin = async () => {
    if (!form.place) return
    const place = places.find(p => p.id === form.place)
    if (!place) return
    await checkInPlace(trip.id, place.id, true)
    await logAction(trip.id, {
      type: 'place_checkin', actor: userName,
      summary: `${userName} เช็คอินที่ "${place.name}" ✅`,
      refId: place.id,
    })
    reset()
  }

  const MODES = [
    { id: 'expense', label: 'ค่าใช้จ่าย', icon: '💰' },
    { id: 'fuel',    label: 'เติมน้ำมัน',  icon: '⛽' },
    { id: 'checkin', label: 'เช็คอิน',     icon: '📍' },
  ]

  return (
    <>
      {/* Overlay */}
      {open && (
        <div onClick={reset} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 200, backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* Bottom Sheet */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, zIndex: 201,
          padding: '0 16px',
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20, padding: 20,
            boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
          }}>
            {!mode ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
                  เพิ่มอะไร?
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {MODES.map(m => (
                    <button key={m.id} onClick={() => setMode(m.id)} style={{
                      flex: 1, padding: '14px 8px', borderRadius: 14,
                      background: `${color}22`, border: `1.5px solid ${color}44`,
                      color: '#f1f5f9', cursor: 'pointer',
                      fontFamily: 'Sarabun, sans-serif', fontWeight: 700,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 24 }}>{m.icon}</span>
                      <span style={{ fontSize: 13 }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : mode === 'expense' ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>💰 บันทึกค่าใช้จ่าย</div>
                <input placeholder="รายการ เช่น ข้าวกลางวัน" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
                <input type="number" placeholder="จำนวนเงิน (บาท)" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleExpense} style={{
                    flex: 1, padding: 11, background: color, color: '#000',
                    border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Sarabun, sans-serif',
                  }}>บันทึก</button>
                  <button onClick={() => setMode(null)} style={{
                    flex: 1, padding: 11, background: 'rgba(255,255,255,0.06)', color: C.muted2,
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
                  }}>← กลับ</button>
                </div>
              </>
            ) : mode === 'fuel' ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>⛽ บันทึกเติมน้ำมัน</div>
                <input placeholder="ชื่อสถานี (ถ้ามี) เช่น PTT" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
                <input type="number" placeholder="ยอดเงิน (บาท)" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleFuel} style={{
                    flex: 1, padding: 11, background: color, color: '#000',
                    border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Sarabun, sans-serif',
                  }}>บันทึก</button>
                  <button onClick={() => setMode(null)} style={{
                    flex: 1, padding: 11, background: 'rgba(255,255,255,0.06)', color: C.muted2,
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
                  }}>← กลับ</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>📍 เช็คอินสถานที่</div>
                <select value={form.place} onChange={e => setForm(f => ({ ...f, place: e.target.value }))}
                  style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">เลือกสถานที่...</option>
                  {places.filter(p => !p.done).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCheckin} style={{
                    flex: 1, padding: 11, background: color, color: '#000',
                    border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Sarabun, sans-serif',
                  }}>เช็คอิน ✓</button>
                  <button onClick={() => setMode(null)} style={{
                    flex: 1, padding: 11, background: 'rgba(255,255,255,0.06)', color: C.muted2,
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
                  }}>← กลับ</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button onClick={() => setOpen(!open)} style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        right: 20, zIndex: 202,
        width: 60, height: 60, borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}, ${color}bb)`,
        border: 'none', cursor: 'pointer',
        fontSize: 30, fontWeight: 700, color: '#000',
        boxShadow: `0 4px 24px ${color}77`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.2s',
        transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
      }}>+</button>
    </>
  )
}
