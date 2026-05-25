import { initializeApp } from 'firebase/app'
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signOut, onAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore, doc, collection,
  getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy, where,
} from 'firebase/firestore'

// ── Firebase config (จากแอปการเงิน) ──────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyD7g_7u7i2iF68DSy8EyH8fHlDDmFfI_KI",
  authDomain:        "my-finance-app-bc424.firebaseapp.com",
  projectId:         "my-finance-app-bc424",
  storageBucket:     "my-finance-app-bc424.firebasestorage.app",
  messagingSenderId: "59908518783",
  appId:             "1:59908518783:web:30a0e1118ea3ee766c604a",
}

const app            = initializeApp(firebaseConfig)
export const auth    = getAuth(app)
export const db      = getFirestore(app)

// ── Auth ──────────────────────────────────────────────────────
const provider = new GoogleAuthProvider()
export const loginWithGoogle = () => signInWithPopup(auth, provider)
export const logout          = () => signOut(auth)
export { onAuthStateChanged }

// ── OpenWeatherMap ────────────────────────────────────────────
// ขอ free API key ได้ที่ openweathermap.org
const OPENWEATHER_KEY = 'YOUR_OPENWEATHER_API_KEY'

const WX_ICONS = {
  '01': '☀️', '02': '🌤️', '03': '⛅', '04': '☁️',
  '09': '🌦️', '10': '🌧️', '11': '⛈️', '13': '❄️', '50': '🌫️',
}

export async function fetchWeather(city, startDate, days) {
  if (!city || !OPENWEATHER_KEY || OPENWEATHER_KEY === 'YOUR_OPENWEATHER_API_KEY') return null
  try {
    const geo = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_KEY}`
    ).then(r => r.json())
    if (!geo?.length) return null

    const { lat, lon } = geo[0]
    const cnt = Math.min((days || 3) * 8, 40)
    const data = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric&cnt=${cnt}`
    ).then(r => r.json())

    const byDate = {}
    data.list?.forEach(item => {
      const date = item.dt_txt.split(' ')[0]
      if (!byDate[date] || item.dt_txt.includes('12:00:00')) byDate[date] = item
    })

    const start = new Date(startDate)
    return Array.from({ length: Math.min(days || 3, 5) }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().split('T')[0]
      const item = byDate[key]
      const iconCode = item?.weather?.[0]?.icon?.slice(0, 2) || '01'
      return {
        date: i === 0 ? 'วันแรก' : i === (days || 3) - 1 && (days || 3) > 1 ? 'วันสุดท้าย' : `วันที่ ${i + 1}`,
        icon: WX_ICONS[iconCode] || '🌤️',
        min: Math.round(item?.main?.temp_min ?? 25),
        max: Math.round(item?.main?.temp_max ?? 32),
        rain: Math.round((item?.pop ?? 0.2) * 100),
      }
    })
  } catch (e) {
    console.error('Weather fetch error:', e)
    return null
  }
}

export async function saveLineToken(memberName, token) {
  await setDoc(doc(db, 'settings', 'lineTokens'), { [memberName]: token }, { merge: true })
}

export async function getLineTokens() {
  const snap = await getDoc(doc(db, 'settings', 'lineTokens'))
  return snap.exists() ? snap.data() : {}
}

export async function notifyTripMembers(trip, actorName, message) {
  try {
    const tokens = await getLineTokens()
    const recipients = (trip.members || []).filter(m => m !== actorName)
    await Promise.all(
      recipients
        .filter(m => tokens[m])
        .map(m =>
          fetch('/api/line-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokens[m], message }),
          })
        )
    )
  } catch (e) {
    console.error('LINE notify error:', e)
  }
}

// ── Helpers ───────────────────────────────────────────────────
export const ts = () => serverTimestamp()

// ── TRIPS ─────────────────────────────────────────────────────
export async function getTrips() {
  const snap = await getDocs(collection(db, 'trips'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createTrip(data, uid) {
  const ref = await addDoc(collection(db, 'trips'), {
    ...data, createdBy: uid, createdAt: ts(),
  })
  return ref.id
}

export async function updateTrip(tripId, data) {
  await updateDoc(doc(db, 'trips', tripId), data)
}

export async function deleteTrip(tripId) {
  await deleteDoc(doc(db, 'trips', tripId))
}

export function listenTrips(callback) {
  return onSnapshot(
    query(collection(db, 'trips'), orderBy('createdAt', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ── HOTELS ────────────────────────────────────────────────────
export async function addHotel(tripId, data) {
  const ref = await addDoc(collection(db, 'trips', tripId, 'hotels'), {
    ...data, votes: {}, createdAt: ts(),
  })
  return ref.id
}

export async function voteHotel(tripId, hotelId, uid, emoji) {
  await updateDoc(doc(db, 'trips', tripId, 'hotels', hotelId), {
    [`votes.${uid}`]: emoji,
  })
}

export function listenHotels(tripId, callback) {
  return onSnapshot(
    collection(db, 'trips', tripId, 'hotels'),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ── PLACES ────────────────────────────────────────────────────
export async function addPlace(tripId, data) {
  const ref = await addDoc(collection(db, 'trips', tripId, 'places'), {
    ...data, votes: {}, done: false, createdAt: ts(),
  })
  return ref.id
}

export async function votePlace(tripId, placeId, uid, emoji) {
  await updateDoc(doc(db, 'trips', tripId, 'places', placeId), {
    [`votes.${uid}`]: emoji,
  })
}

export async function checkInPlace(tripId, placeId, done) {
  await updateDoc(doc(db, 'trips', tripId, 'places', placeId), { done })
}

export function listenPlaces(tripId, callback) {
  return onSnapshot(
    collection(db, 'trips', tripId, 'places'),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ── EXPENSES ──────────────────────────────────────────────────
export async function addExpense(tripId, data) {
  const ref = await addDoc(collection(db, 'trips', tripId, 'expenses'), {
    ...data, createdAt: ts(),
  })
  return ref.id
}

export function listenExpenses(tripId, callback) {
  return onSnapshot(
    collection(db, 'trips', tripId, 'expenses'),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ── TIMELINE ──────────────────────────────────────────────────
export async function logAction(tripId, { type, actor, summary, refId = '' }) {
  await addDoc(collection(db, 'trips', tripId, 'timeline'), {
    type, actor, summary, refId, photoUrl, timestamp: ts(),
  })
}

export function listenTimeline(tripId, callback) {
  return onSnapshot(
    query(collection(db, 'trips', tripId, 'timeline'), orderBy('timestamp', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ── CHECKLIST ─────────────────────────────────────────────────
export async function addChecklistItem(tripId, data) {
  return addDoc(collection(db, 'trips', tripId, 'checklist'), {
    ...data, done: false, createdAt: ts(),
  })
}

export async function toggleChecklistItem(tripId, itemId, done) {
  await updateDoc(doc(db, 'trips', tripId, 'checklist', itemId), { done })
}

export async function deleteChecklistItem(tripId, itemId) {
  await deleteDoc(doc(db, 'trips', tripId, 'checklist', itemId))
}

export function listenChecklist(tripId, callback) {
  return onSnapshot(
    collection(db, 'trips', tripId, 'checklist'),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ── MEMORIES ──────────────────────────────────────────────────
export async function archiveTrip(tripId, { trip, expenses, places }) {
  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const placesVisited = places.filter(p => p.done).map(p => ({ name: p.name, category: p.category }))
  const start = trip.dates?.start ? new Date(trip.dates.start) : null
  const end   = trip.dates?.end   ? new Date(trip.dates.end)   : null
  const days  = start && end ? Math.round((end - start) / 86400000) + 1 : 0
  await setDoc(doc(db, 'memories', tripId), {
    tripId, name: trip.name, img: trip.img, color: trip.color,
    dates: trip.dates, members: trip.members || [],
    days, totalExpense, placesVisited,
    placesTotal: places.length,
    budgetTotal: trip.budgetTotal || 0,
    car: trip.car || null, location: trip.location || '',
    archivedAt: ts(),
  })
}

export function listenMemories(callback) {
  return onSnapshot(
    query(collection(db, 'memories'), orderBy('archivedAt', 'desc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )
}

// ── TEMPLATES ─────────────────────────────────────────────────
export async function saveTemplate(name, items) {
  return addDoc(collection(db, 'templates'), { name, items, createdAt: ts() })
}

export async function getTemplates() {
  const snap = await getDocs(collection(db, 'templates'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── CARS ──────────────────────────────────────────────────────
export async function getCars() {
  const snap = await getDocs(collection(db, 'cars'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getCarOdometer(uid) {
  try {
    const snap = await getDoc(doc(db, 'car_app', uid))
    if (!snap.exists()) return null
    const cars = snap.data()?.data?.cars || []
    return cars.map(c => ({ brand: c.brand, km: c.km }))
  } catch {
    return null
  }
}

export async function updateCarOdometer(uid, newKm) {
  try {
    const ref = doc(db, 'car_app', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return false
    const cars = [...(snap.data()?.data?.cars || [])]
    if (cars.length === 0) return false
    // อัปเดต km ของรถคันแรก (MG5)
    const idx = cars.findIndex(c => c.brand?.includes('MG') || c.isMG5)
    const i = idx >= 0 ? idx : 0
    cars[i] = { ...cars[i], km: Number(newKm) }
    await updateDoc(ref, { 'data.cars': cars })
    return true
  } catch (e) {
    console.error('updateCarOdometer error:', e)
    return false
  }
}

export async function getFuelEfficiency(carId) {
  const snap = await getDocs(collection(db, 'cars', carId, 'fuelLogs'))
  const logs = snap.docs.map(d => d.data())
  if (logs.length < 2) return null
  const totalKm     = logs.reduce((s, l) => s + (l.odometer || 0), 0)
  const totalLiters = logs.reduce((s, l) => s + (l.liters || 0), 0)
  return totalLiters > 0 ? totalKm / totalLiters : null
}

// ── USERS ─────────────────────────────────────────────────────
export async function saveUser(uid, data) {
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
