import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, query, where, writeBatch } from 'firebase/firestore'
import { Plus, Truck as TruckIcon, X, Pencil, Trash2 } from 'lucide-react'
import { db } from '../lib/firebase'

type DriverRecord = { id: string; displayName?: string; phone?: string; role?: string; active?: boolean }\n\ntype TruckRecord = {
  id: string
  registrationNumber: string
  make: string
  model: string
  driverId?: string
  status: 'active' | 'maintenance' | 'inactive'
  currentOdometer: number
  notes?: string
}

const emptyTruck = { registrationNumber: '', make: 'TATA', model: '1518', driverId: '', status: 'active' as const, currentOdometer: 0, notes: '' }

export default function Trucks() {
  const [trucks, setTrucks] = useState<TruckRecord[]>([])\n  const [drivers, setDrivers] = useState<DriverRecord[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyTruck)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!db) return
    const unsubscribe = onSnapshot(collection(db, 'trucks'), snapshot => {
      setTrucks(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<TruckRecord, 'id'>) })))
    }, () => setError('Unable to load truck records. Check your Firebase configuration and rules.'))
  }, [])

  function startAdd() { setEditing(null); setForm(emptyTruck); setError(''); setOpen(true) }
  function startEdit(truck: TruckRecord) { setEditing(truck.id); setForm({ registrationNumber: truck.registrationNumber, make: truck.make, model: truck.model, driverId: truck.driverId ?? '', status: truck.status, currentOdometer: truck.currentOdometer, notes: truck.notes ?? '' }); setError(''); setOpen(true) }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!db) { setError('Firebase is not configured.'); return }
    if (!form.registrationNumber.trim()) { setError('Registration number is required.'); return }
    try {
      const payload = { ...form, registrationNumber: form.registrationNumber.trim().toUpperCase(), currentOdometer: Number(form.currentOdometer) || 0, updatedAt: new Date().toISOString() }
      if (editing) await updateDoc(doc(db, 'trucks', editing), payload)
      else await addDoc(collection(db, 'trucks'), { ...payload, createdAt: new Date().toISOString() })
      setOpen(false)
    } catch { setError('Could not save the truck. Check your permissions.') }
  }

  async function remove(id: string) {
    if (!db || !confirm('Delete this truck record?')) return
    try { await deleteDoc(doc(db, 'trucks', id)) } catch { setError('Only an owner can delete a truck.') }
  }

  return (
    <section className="page-section">
      <div className="section-heading"><div><p className="eyebrow">Fleet</p><h2>Truck Management</h2><p className="muted">Keep the two TATA 1518 trucks and their operating details up to date.</p></div><button className="primary-button compact" onClick={startAdd}><Plus size={17}/> Add truck</button></div>
      {error && <div className="notice">{error}</div>}
      <div className="truck-grid">
        {trucks.length === 0 && <div className="page-card empty-state"><TruckIcon size={30}/><h3>No trucks recorded yet</h3><p className="muted">Add the first TATA 1518 truck to start building the fleet record.</p></div>}
        {trucks.map(truck => <article className="truck-card" key={truck.id}>
          <div className="truck-card-top"><div className="truck-symbol"><TruckIcon size={26}/></div><span className={`status status-${truck.status}`}>{truck.status}</span></div>
          <p className="eyebrow">{truck.make} {truck.model}</p><h3>{truck.registrationNumber}</h3>
          <div className="truck-detail"><span>Odometer</span><strong>{truck.currentOdometer.toLocaleString()} km</strong></div>
          <div className="truck-detail"><span>Driver</span><strong>{truck.driverId || 'Not assigned'}</strong></div>
          <div className="card-actions"><button onClick={() => startEdit(truck)}><Pencil size={15}/> Edit</button><button onClick={() => remove(truck.id)}><Trash2 size={15}/> Delete</button></div>
        </article>)}
      </div>
      {open && <div className="modal-backdrop"><form className="modal" onSubmit={save}>
        <div className="modal-heading"><div><p className="eyebrow">{editing ? 'Update fleet record' : 'New fleet record'}</p><h3>{editing ? 'Edit truck' : 'Add truck'}</h3></div><button type="button" className="close-button" onClick={() => setOpen(false)}><X/></button></div>
        <label>Registration number<input value={form.registrationNumber} onChange={e => setForm({...form, registrationNumber:e.target.value})} placeholder="e.g. ABC 123 GP" required /></label>
        <div className="form-row"><label>Make<input value={form.make} onChange={e => setForm({...form, make:e.target.value})} required /></label><label>Model<input value={form.model} onChange={e => setForm({...form, model:e.target.value})} required /></label></div>
        <label>Current odometer (km)<input type="number" min="0" value={form.currentOdometer} onChange={e => setForm({...form, currentOdometer:Number(e.target.value)})} /></label>
        <label>Status<select value={form.status} onChange={e => setForm({...form, status:e.target.value as TruckRecord['status']})}><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></label>
        <label>Assigned driver<select value={form.driverId} onChange={e => setForm({...form, driverId:e.target.value})}><option value="">Unassigned</option>{drivers.filter(d => !trucks.some(t => t.id !== editing && t.driverId === d.id)).map(d => <option key={d.id} value={d.id}>{d.displayName || d.phone || d.id}</option>)}</select></label>
        <label>Notes<textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} rows={3}/></label>
        <button className="primary-button" type="submit">{editing ? 'Save changes' : 'Add truck'}</button>
      </form></div>}
    </section>
  )
}