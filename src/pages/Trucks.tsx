import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore'
import { Plus, Truck as TruckIcon, X, Pencil, Trash2 } from 'lucide-react'
import { auth, db } from '../lib/firebase'

type DriverRecord = {
  id: string
  displayName?: string
  phone?: string
  role?: string
  active?: boolean
}

type TruckRecord = {
  id: string
  registrationNumber: string
  make: string
  model: string
  driverId?: string | null
  status: 'active' | 'maintenance' | 'inactive'
  currentOdometer: number
  notes?: string
}

const emptyTruck = {
  registrationNumber: '',
  make: 'TATA',
  model: '1518',
  driverId: '',
  status: 'active' as const,
  currentOdometer: 0,
  notes: ''
}

export default function Trucks() {
  const [trucks, setTrucks] = useState<TruckRecord[]>([])
  const [drivers, setDrivers] = useState<DriverRecord[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyTruck)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!db || !auth?.currentUser) return
    getDoc(doc(db, 'users', auth.currentUser.uid)).then(snapshot => {
      setIsOwner(snapshot.exists() && snapshot.data().role === 'owner' && snapshot.data().active === true)
    }).catch(() => setError('Unable to load your profile.'))
  }, [])

  useEffect(() => {
    if (!db) return
    return onSnapshot(
      collection(db, 'trucks'),
      snapshot => setTrucks(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<TruckRecord, 'id'>) }))),
      () => setError('Unable to load truck records. Check your Firebase configuration and rules.')
    )
  }, [])

  useEffect(() => {
    if (!db) return
    return onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'driver'), where('active', '==', true)),
      snapshot => setDrivers(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<DriverRecord, 'id'>) }))),
      () => setError('Unable to load active drivers.')
    )
  }, [])

  function startAdd() {
    setEditing(null)
    setForm(emptyTruck)
    setError('')
    setOpen(true)
  }

  function startEdit(truck: TruckRecord) {
    setEditing(truck.id)
    setForm({
      registrationNumber: truck.registrationNumber,
      make: truck.make,
      model: truck.model,
      driverId: truck.driverId ?? '',
      status: truck.status,
      currentOdometer: truck.currentOdometer,
      notes: truck.notes ?? ''
    })
    setError('')
    setOpen(true)
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!db) {
      setError('Firebase is not configured.')
      return
    }

    const registrationNumber = form.registrationNumber.trim().toUpperCase()
    const odometer = Number(form.currentOdometer)
    const existing = editing ? trucks.find(t => t.id === editing) : undefined
    const selectedDriver = form.driverId ? drivers.find(d => d.id === form.driverId) : undefined

    if (!registrationNumber) {
      setError('Registration number is required.')
      return
    }
    if (!Number.isFinite(odometer) || odometer < 0) {
      setError('Odometer must be 0 or higher.')
      return
    }
    if (existing && odometer < Number(existing.currentOdometer || 0)) {
      setError('Odometer cannot be lower than the current recorded reading.')
      return
    }
    if (form.driverId && !selectedDriver) {
      setError('Select an active driver from the list.')
      return
    }
    if (form.driverId && trucks.some(t => t.id !== editing && t.driverId === form.driverId)) {
      setError('That driver is already assigned to another truck.')
      return
    }

    try {
      const now = new Date().toISOString()
      const payload = {
        registrationNumber,
        make: form.make.trim(),
        model: form.model.trim(),
        driverId: form.driverId || null,
        status: form.status,
        currentOdometer: odometer,
        notes: form.notes.trim(),
        updatedAt: now
      }

      const batch = writeBatch(db)

      if (editing) {
        batch.update(doc(db, 'trucks', editing), payload)

        const oldDriverId = existing?.driverId
        if (oldDriverId && oldDriverId !== form.driverId) {
          batch.update(doc(db, 'users', oldDriverId), { assignedTruckId: null, updatedAt: now })
        }
        if (form.driverId && form.driverId !== oldDriverId) {
          batch.update(doc(db, 'users', form.driverId), { assignedTruckId: editing, updatedAt: now })
        }
      } else {
        const truckRef = doc(collection(db, 'trucks'))
        batch.set(truckRef, { ...payload, createdAt: now })
        if (form.driverId) {
          batch.update(doc(db, 'users', form.driverId), { assignedTruckId: truckRef.id, updatedAt: now })
        }
      }

      await batch.commit()
      setOpen(false)
    } catch {
      setError('Could not save the truck. Check your permissions and driver assignment.')
    }
  }

  async function remove(id: string) {
    if (!db || !confirm('Delete this truck record?')) return
    try {
      await deleteDoc(doc(db, 'trucks', id))
    } catch {
      setError('Only an owner can delete a truck.')
    }
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Fleet</p>
          <h2>Truck Management</h2>
          <p className="muted">Keep the two TATA 1518 trucks and their operating details up to date.</p>
        </div>
        {isOwner && <button className="primary-button compact" onClick={startAdd}><Plus size={17}/> Add truck</button>}
      </div>

      {error && <div className="notice">{error}</div>}

      <div className="truck-grid">
        {trucks.length === 0 && (
          <div className="page-card empty-state">
            <TruckIcon size={30}/>
            <h3>No trucks recorded yet</h3>
            <p className="muted">Add the first TATA 1518 truck to start building the fleet record.</p>
          </div>
        )}

        {trucks.map(truck => {
          const driver = drivers.find(d => d.id === truck.driverId)
          return (
            <article className="truck-card" key={truck.id}>
              <div className="truck-card-top">
                <div className="truck-symbol"><TruckIcon size={26}/></div>
                <span className={`status status-${truck.status}`}>{truck.status}</span>
              </div>
              <p className="eyebrow">{truck.make} {truck.model}</p>
              <h3>{truck.registrationNumber}</h3>
              <div className="truck-detail"><span>Odometer</span><strong>{Number(truck.currentOdometer || 0).toLocaleString()} km</strong></div>
              <div className="truck-detail"><span>Driver</span><strong>{driver?.displayName || driver?.phone || 'Not assigned'}</strong></div>
              {isOwner && <div className="card-actions">
                <button onClick={() => startEdit(truck)}><Pencil size={15}/> Edit</button>
                <button onClick={() => remove(truck.id)}><Trash2 size={15}/> Delete</button>
              </div>}
            </article>
          )
        })}
      </div>

      {open && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={save}>
            <div className="modal-heading">
              <div><p className="eyebrow">{editing ? 'Update fleet record' : 'New fleet record'}</p><h3>{editing ? 'Edit truck' : 'Add truck'}</h3></div>
              <button type="button" className="close-button" onClick={() => setOpen(false)}><X/></button>
            </div>

            <label>Registration number<input value={form.registrationNumber} onChange={e => setForm({...form, registrationNumber: e.target.value})} placeholder="e.g. ABC 123 GP" required /></label>
            <div className="form-row">
              <label>Make<input value={form.make} onChange={e => setForm({...form, make: e.target.value})} required /></label>
              <label>Model<input value={form.model} onChange={e => setForm({...form, model: e.target.value})} required /></label>
            </div>
            <label>Current odometer (km)<input type="number" min="0" value={form.currentOdometer} onChange={e => setForm({...form, currentOdometer: Number(e.target.value)})} /></label>
            <label>Status<select value={form.status} onChange={e => setForm({...form, status: e.target.value as TruckRecord['status']})}><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></label>
            <label>Assigned driver<select value={form.driverId} onChange={e => setForm({...form, driverId: e.target.value})}><option value="">Unassigned</option>{drivers.filter(d => !trucks.some(t => t.id !== editing && t.driverId === d.id)).map(d => <option key={d.id} value={d.id}>{d.displayName || d.phone || d.id}</option>)}</select></label>
            <label>Notes<textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3}/></label>
            <button className="primary-button" type="submit">{editing ? 'Save changes' : 'Add truck'}</button>
          </form>
        </div>
      )}
    </section>
  )
}
