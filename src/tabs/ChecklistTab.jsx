import { useState } from 'react'
import { CHECKLIST_CATEGORY, cardStyle, inputStyle, btnPrimary, btnSecondary, C } from '../constants.js'
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem, saveTemplate, getTemplates, logAction } from '../firebase.js'

export default function ChecklistTab({ trip, checklist, uid, userName }) {
  const [showAdd, setShowAdd] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState({ name: '', category: 'เสื้อผ้า' })
  const [tplName, setTplName] = useState('')
  const [filter, setFilter] = useState('ทั้งหมด')

  const handleAdd = async () => {
    if (!form.name) return
    await addChecklistItem(trip.id, { name: form.name, category: form.category })
    setForm({ name: '', category: 'เสื้อผ้า' })
    setShowAdd(false)
  }

  const handleToggle = async (item) => {
    const newDone = !item.done
    await toggleChecklistItem(trip.id, item.id, newDone)
    if (newDone) {
      await logAction(trip.id, {
        type: 'checklist_done', actor: userName,
        summary: `${userName} จัดของ "${item.name}" เสร็จแล้ว ✅`,
        refId: item.id,
      })
    }
  }

  const handleDelete = async (itemId) => {
    await deleteChecklistItem(trip.id, itemId)
  }

  const handleSaveTemplate = async () => {
    if (!tplName) return
    const items = checklist.map(({ name, category }) => ({ name, category }))
    await saveTemplate(tplName, items)
    setTplName('')
    alert('บันทึก template เรียบร้อยแล้ว')
  }

  const handleLoadTemplates = async () => {
    const tpls = await getTemplates()
    setTemplates(tpls)
    setShowTemplate(true)
  }

  const handleLoadTemplate = async (tpl) => {
    if (!tpl.items?.length) { setShowTemplate(false); return }
    for (const item of tpl.items) {
      await addChecklistItem(trip.id, item)
    }
    setShowTemplate(false)
  }

  const cats = ['ทั้งหมด', ...Object.keys(CHECKLIST_CATEGORY)]
  const filtered = checklist.filter(i => filter === 'ทั้งหมด' || i.category === filter)
  const doneCount = checklist.filter(i => i.done).length
  const pct = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Progress */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: C.muted }}>จัดของแล้ว</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: trip.color }}>{doneCount}/{checklist.length} ({pct}%)</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 8 }}>
          <div style={{
            width: `${pct}%`, height: 8, borderRadius: 6,
            background: pct === 100 ? '#10b981' : trip.color, transition: 'width 0.5s',
          }} />
        </div>
        {pct === 100 && (
          <div style={{ fontSize: 13, color: '#10b981', marginTop: 6, textAlign: 'center' }}>
            🎉 จัดของครบแล้ว พร้อมออกเดินทาง!
          </div>
        )}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            border: '1px solid', whiteSpace: 'nowrap', cursor: 'pointer',
            fontFamily: 'Sarabun, sans-serif',
            background: filter === c ? trip.color : 'rgba(255,255,255,0.04)',
            color: filter === c ? '#000' : C.muted,
            borderColor: filter === c ? trip.color : 'rgba(255,255,255,0.1)',
          }}>{c}</button>
        ))}
      </div>

      {/* รายการ */}
      {filtered.map(item => (
        <div key={item.id} style={{
          ...cardStyle,
          display: 'flex', alignItems: 'center', gap: 10,
          opacity: item.done ? 0.55 : 1,
        }}>
          <button onClick={() => handleToggle(item)} style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: item.done ? trip.color : 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${item.done ? trip.color : 'rgba(255,255,255,0.15)'}`,
            cursor: 'pointer', color: '#000', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{item.done ? '✓' : ''}</button>

          <span style={{ fontSize: 18 }}>{CHECKLIST_CATEGORY[item.category] || '📦'}</span>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 15, fontWeight: 600,
              textDecoration: item.done ? 'line-through' : 'none',
              color: item.done ? C.muted : '#f1f5f9',
            }}>{item.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{item.category}</div>
          </div>

          <button onClick={() => handleDelete(item.id)} style={{
            background: 'none', border: 'none', color: C.muted,
            cursor: 'pointer', fontSize: 16, padding: 4,
          }}>✕</button>
        </div>
      ))}

      {/* ปุ่มล่าง */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => setShowAdd(!showAdd)} style={{
          flex: 1, padding: 11, background: trip.color, color: '#000',
          border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'Sarabun, sans-serif',
        }}>+ เพิ่มรายการ</button>
        <button onClick={handleLoadTemplates} style={{
          flex: 1, padding: 11, background: 'rgba(255,255,255,0.06)', color: C.muted2,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'Sarabun, sans-serif',
        }}>📋 Template</button>
      </div>

      {showAdd && (
        <div style={cardStyle}>
          <input placeholder="ชื่อรายการ เช่น เสื้อผ้า 3 ชุด, ยาแก้ปวด" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {Object.keys(CHECKLIST_CATEGORY).map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: form.category === c ? trip.color : 'rgba(255,255,255,0.06)',
                color: form.category === c ? '#000' : C.muted2,
                border: 'none', cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
              }}>{CHECKLIST_CATEGORY[c]} {c}</button>
            ))}
          </div>
          <button onClick={handleAdd} style={btnPrimary(trip.color)}>บันทึก</button>
          <button onClick={() => setShowAdd(false)} style={btnSecondary}>ยกเลิก</button>
        </div>
      )}

      {/* บันทึกเป็น Template */}
      {checklist.length > 0 && (
        <div style={{ ...cardStyle, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="ชื่อ template เช่น จัดของครอบครัว 4 คน" value={tplName}
            onChange={e => setTplName(e.target.value)}
            style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
          <button onClick={handleSaveTemplate} style={{
            padding: '10px 16px', background: '#475569', color: '#f1f5f9',
            border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Sarabun, sans-serif', whiteSpace: 'nowrap',
          }}>💾 บันทึก</button>
        </div>
      )}

      {/* Template list */}
      {showTemplate && templates.length === 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, color: C.muted2, marginBottom: 4 }}>ยังไม่มี Template</div>
          <div style={{ fontSize: 12, color: C.muted }}>
            ใส่รายการจัดของที่ชอบ → กรอกชื่อ → กด 💾 บันทึก<br/>ครั้งหน้าโหลดมาใช้ได้เลย
          </div>
          <button onClick={() => setShowTemplate(false)} style={{
            marginTop: 12, padding: '8px 20px', background: 'rgba(255,255,255,0.06)',
            color: C.muted2, border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
          }}>ปิด</button>
        </div>
      )}

      {showTemplate && templates.length > 0 && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📋 เลือก Template</div>
          {templates.map(tpl => (
            <div key={tpl.id} onClick={() => handleLoadTemplate(tpl)} style={{
              padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, marginBottom: 6, cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600 }}>{tpl.name}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{tpl.items?.length} รายการ</span>
            </div>
          ))}
          <button onClick={() => setShowTemplate(false)} style={btnSecondary}>ปิด</button>
        </div>
      )}
    </div>
  )
}
