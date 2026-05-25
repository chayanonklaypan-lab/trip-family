import { useState } from 'react'
import { EXPENSE_CATEGORY, totalAmt, fuelCost, cardStyle, inputStyle, btnPrimary, btnSecondary, C } from '../constants.js'
import { addExpense, logAction, notifyTripMembers } from '../firebase.js'

export default function ExpensesTab({ trip, expenses, uid, userName }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', amount: '', category: 'อาหาร',
    paidBy: trip.members?.[0] || 'คุณ',
    splitWith: [...(trip.members || [])],
  })

  const toggleSplit = (m) => {
    setForm(f => ({
      ...f,
      splitWith: f.splitWith.includes(m)
        ? f.splitWith.filter(x => x !== m)
        : [...f.splitWith, m],
    }))
  }

  const handleAdd = async () => {
    if (!form.name || !form.amount) return
    const id = await addExpense(trip.id, {
      name: form.name, amount: Number(form.amount),
      category: form.category, paidBy: form.paidBy, splitWith: form.splitWith,
    })
    const summary = `${userName} บันทึก "${form.name}" ฿${Number(form.amount).toLocaleString()} (${form.category})`
    await logAction(trip.id, {
      type: 'expense_added', actor: userName,
      summary, refId: id,
    })
    notifyTripMembers(trip, userName, `[${trip.name}]\n${summary}`)
    setForm({
      name: '', amount: '', category: 'อาหาร',
      paidBy: trip.members?.[0] || 'คุณ',
      splitWith: [...(trip.members || [])],
    })
    setShowAdd(false)
  }

  // คำนวณยอดรวม
  const total = totalAmt(expenses)
  const fuel  = fuelCost(trip.distance, trip.car?.efficiency, trip.fuelPrice)
  const budget = trip.budgetTotal || 0
  const spent  = total + fuel
  const pct    = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const over   = budget > 0 && spent > budget

  // คำนวณยอดต่อคน
  const balances = {}
  ;(trip.members || []).forEach(m => (balances[m] = 0))
  expenses.forEach(exp => {
    const share = exp.amount / (exp.splitWith?.length || 1)
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount
    ;(exp.splitWith || []).forEach(m => {
      balances[m] = (balances[m] || 0) - share
    })
  })

  // แยกหมวด
  const byCategory = {}
  Object.keys(EXPENSE_CATEGORY).forEach(k => (byCategory[k] = 0))
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* แถบงบประมาณ */}
      {budget > 0 && (
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>💰 งบประมาณ</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>ตั้งงบ ฿{budget.toLocaleString()}</span>
            <span style={{ fontSize: 13, color: over ? '#ef4444' : trip.color, fontWeight: 700 }}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%', borderRadius: 6,
              background: over ? '#ef4444' : trip.color,
              transition: 'width 0.5s',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: C.muted }}>
              ใช้แล้ว ฿{spent.toLocaleString()} (รวมน้ำมันประมาณ)
            </span>
            <span style={{ fontSize: 12, color: over ? '#ef4444' : '#10b981', fontWeight: 700 }}>
              {over ? `เกิน ฿${(spent - budget).toLocaleString()}` : `เหลือ ฿${(budget - spent).toLocaleString()}`}
            </span>
          </div>
          {over && (
            <div style={{
              marginTop: 8, background: '#ef444420', border: '1px solid #ef444444',
              borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#ef4444',
            }}>⚠️ เกินงบแล้วครับ กรุณาตรวจสอบ</div>
          )}
        </div>
      )}

      {/* สรุปตัวเลข */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ ...cardStyle, textAlign: 'center', marginBottom: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: trip.color }}>฿{total.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: C.muted }}>รายจ่ายที่บันทึก</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center', marginBottom: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>฿{fuel.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: C.muted }}>⛽ ค่าน้ำมัน</div>
        </div>
      </div>

      {/* ยอดต่อคน */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>💳 สรุปยอดแต่ละคน</div>
        {(trip.members || []).map(m => {
          const bal = balances[m] || 0
          return (
            <div key={m} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: 14 }}>{m}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: bal >= 0 ? '#10b981' : '#ef4444' }}>
                {bal >= 0 ? '+' : ''}฿{Math.round(bal).toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>

      {/* แยกหมวด */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>📊 แยกหมวดหมู่</div>
        {Object.entries(byCategory).filter(([, amt]) => amt > 0).map(([cat, amt]) => (
          <div key={cat} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>{EXPENSE_CATEGORY[cat]} {cat}</span>
              <span style={{ fontWeight: 700 }}>฿{amt.toLocaleString()}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 5 }}>
              <div style={{
                width: `${total > 0 ? (amt / total) * 100 : 0}%`,
                height: 5, borderRadius: 4, background: trip.color, transition: 'width 0.5s',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* รายการ */}
      {expenses.map(exp => (
        <div key={exp.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {EXPENSE_CATEGORY[exp.category]} {exp.name}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                💳 {exp.paidBy} จ่าย · หารกับ {exp.splitWith?.join(', ')}
              </div>
              <div style={{ fontSize: 12, color: C.muted2, marginTop: 2 }}>
                คนละ ฿{Math.round(exp.amount / (exp.splitWith?.length || 1)).toLocaleString()}
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, color: trip.color }}>
              ฿{exp.amount.toLocaleString()}
            </div>
          </div>
        </div>
      ))}

      {/* ฟอร์มเพิ่ม */}
      {showAdd ? (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>💰 เพิ่มรายจ่าย</div>
          <input placeholder="รายการ เช่น ข้าวเที่ยง, ค่าทางด่วน" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
          <input type="number" placeholder="จำนวนเงิน (บาท)" value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} />

          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>หมวดหมู่</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {Object.keys(EXPENSE_CATEGORY).map(cat => (
              <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))} style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: form.category === cat ? trip.color : 'rgba(255,255,255,0.06)',
                color: form.category === cat ? '#000' : C.muted2,
                border: 'none', cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
              }}>{EXPENSE_CATEGORY[cat]} {cat}</button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>ใครจ่าย?</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {(trip.members || []).map(m => (
              <button key={m} onClick={() => setForm(f => ({ ...f, paidBy: m }))} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: form.paidBy === m ? trip.color : 'rgba(255,255,255,0.06)',
                color: form.paidBy === m ? '#000' : C.muted2,
                border: 'none', cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
              }}>{m}</button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>หารกับ?</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {(trip.members || []).map(m => (
              <button key={m} onClick={() => toggleSplit(m)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: form.splitWith.includes(m) ? `${trip.color}44` : 'rgba(255,255,255,0.06)',
                color: form.splitWith.includes(m) ? trip.color : C.muted,
                border: `1px solid ${form.splitWith.includes(m) ? trip.color : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
              }}>{m}</button>
            ))}
          </div>

          <button onClick={handleAdd} style={btnPrimary(trip.color)}>บันทึก</button>
          <button onClick={() => setShowAdd(false)} style={btnSecondary}>ยกเลิก</button>
        </div>
      ) : (
        <div onClick={() => setShowAdd(true)} style={{
          ...cardStyle,
          border: '1px dashed rgba(255,255,255,0.12)',
          textAlign: 'center', color: C.muted, cursor: 'pointer',
        }}>+ เพิ่มรายจ่าย</div>
      )}
    </div>
  )
}
