import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { AlertTriangle, CheckCircle2, Plus, Trash2, Wrench, X } from 'lucide-react'
import { auth, db } from '../lib/firebase'

type Truck={id:string;registrationNumber:string;make:string;model:string;currentOdometer:number;status:string}
type MaintenanceRecord={id:string;truckId:string;category:string;description:string;amount:number;odometer:number;date:string;nextDueOdometer?:number;nextDueDate?:string;createdAt?:string}
const categories=['Service','Oil change','Tyres','Brakes','Repairs','Parts','Other']
const empty={truckId:'',category:'Service',description:'',amount:0,odometer:0,date:new Date().toISOString().slice(0,10),nextDueOdometer:0,nextDueDate:''}

export default function Maintenance(){
 const[trucks,setTrucks]=useState<Truck[]>([]),[records,setRecords]=useState<MaintenanceRecord[]>([]),[role,setRole]=useState(''),[assigned,setAssigned]=useState('')
 const[open,setOpen]=useState(false),[editing,setEditing]=useState<string|null>(null),[form,setForm]=useState(empty),[error,setError]=useState('')
 useEffect(()=>{if(!db||!auth.currentUser)return;getDoc(doc(db,'users',auth.currentUser.uid)).then(s=>{setRole(s.data()?.role??'');setAssigned(s.data()?.assignedTruckId??'')}).catch(()=>setError('Unable to load your profile.'))},[])
 useEffect(()=>{if(!db)return;const unsubs=[
  onSnapshot(collection(db,'trucks'),s=>setTrucks(s.docs.map(d=>({id:d.id,...d.data()} as Truck))),()=>setError('Unable to load trucks.')),
  onSnapshot(
    role==='driver' && assigned
      ? query(collection(db,'maintenanceRecords'),where('truckId','==',assigned))
      : collection(db,'maintenanceRecords'),
    s=>setRecords(s.docs.map(d=>({id:d.id,...d.data()} as MaintenanceRecord)).sort((a,b)=>b.date.localeCompare(a.date))),
    ()=>setError('Unable to load maintenance records.')
  )
 ];return()=>unsubs.forEach(u=>u())},[role,assigned])
 const usableTrucks=role==='driver'?trucks.filter(t=>t.id===assigned):trucks
 const money=(v:number)=>'R'+v.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})
 const today=new Date().toISOString().slice(0,10)
 const due=useMemo(()=>records.filter(r=>(r.nextDueDate&&r.nextDueDate<=today)||(r.nextDueOdometer&&trucks.find(t=>t.id===r.truckId)?.currentOdometer>=r.nextDueOdometer)),[records,trucks,today])
 function startNew(){setEditing(null);const first=usableTrucks[0];setForm({...empty,truckId:first?.id??'',odometer:first?.currentOdometer??0});setError('');setOpen(true)}
 function startEdit(r:MaintenanceRecord){setEditing(r.id);setForm({truckId:r.truckId,category:r.category,description:r.description,amount:r.amount,odometer:r.odometer,date:r.date,nextDueOdometer:r.nextDueOdometer??0,nextDueDate:r.nextDueDate??''});setError('');setOpen(true)}
 async function save(e:React.FormEvent){e.preventDefault();if(!db||!form.truckId){setError('Select a truck.');return}if(!form.description.trim()||Number(form.amount)<0||Number(form.odometer)<0){setError('Description, amount and odometer are required.');return}try{const data={...form,amount:Number(form.amount)||0,odometer:Number(form.odometer)||0,nextDueOdometer:Number(form.nextDueOdometer)||null,nextDueDate:form.nextDueDate||null,updatedAt:new Date().toISOString()};if(editing)await updateDoc(doc(db,'maintenanceRecords',editing),data);else await addDoc(collection(db,'maintenanceRecords'),{...data,createdAt:new Date().toISOString()});setOpen(false);setEditing(null)}catch{setError('Could not save maintenance record. Check your permissions.')}}
 async function remove(id:string){if(!db||!confirm('Delete this maintenance record?'))return;try{await deleteDoc(doc(db,'maintenanceRecords',id))}catch{setError('Could not delete the record. Only the owner can delete maintenance records.')}}
 return <section className="page-section">
  <div className="section-heading"><div><p className="eyebrow">Fleet care</p><h2>Maintenance</h2><p className="muted">Track services, repairs, tyres and the next time each truck needs attention.</p></div><button className="primary-button compact" onClick={startNew} disabled={role==='driver'&&!assigned}><Plus size={17}/> Add record</button></div>
  {error&&<div className="notice">{error}</div>}
  {due.length>0&&<div className="maintenance-alert"><AlertTriangle size={20}/><div><strong>{due.length} maintenance item{due.length===1?'':'s'} due</strong><p>Check the affected truck and schedule the work.</p></div></div>}
  <div className="maintenance-grid">{trucks.map(t=><article className="maintenance-truck" key={t.id}><div><p className="eyebrow">{t.registrationNumber}</p><h3>{t.make} {t.model}</h3><p className="muted">Odometer: {Number(t.currentOdometer||0).toLocaleString('en-ZA')} km</p></div><Wrench size={25}/></article>)}</div>
  <div className="page-card"><p className="eyebrow">History</p><h3>Maintenance records</h3>{records.length===0?<p className="muted">No maintenance records yet.</p>:<div className="maintenance-list">{records.map(r=>{const t=trucks.find(x=>x.id===r.truckId);const isDue=(r.nextDueDate&&r.nextDueDate<=today)||(r.nextDueOdometer&&t&&t.currentOdometer>=r.nextDueOdometer);return <article className="maintenance-row" key={r.id}><div><strong>{r.category} — {t?.registrationNumber??r.truckId}</strong><span>{r.description} · {r.date} · {Number(r.odometer||0).toLocaleString('en-ZA')} km</span>{(r.nextDueDate||r.nextDueOdometer)&&<small>Next: {r.nextDueDate||''}{r.nextDueDate&&r.nextDueOdometer?' · ':''}{r.nextDueOdometer?Number(r.nextDueOdometer).toLocaleString('en-ZA')+' km':''}{isDue?' · Due':''}</small>}</div><div className="maintenance-actions"><strong>{money(Number(r.amount)||0)}</strong>{role==='owner'&&<><button className="icon-button small" onClick={()=>startEdit(r)} aria-label="Edit"><Wrench size={16}/></button><button className="icon-button small danger" onClick={()=>remove(r.id)} aria-label="Delete"><Trash2 size={16}/></button></>}</div></article>})}</div>}</div>
  {open&&<div className="modal-backdrop"><form className="modal" onSubmit={save}><div className="modal-heading"><div><p className="eyebrow">Fleet record</p><h3>{editing?'Edit maintenance':'Add maintenance'}</h3></div><button type="button" className="close-button" onClick={()=>setOpen(false)}><X/></button></div>
   <label>Truck<select value={form.truckId} onChange={e=>setForm({...form,truckId:e.target.value})}>{usableTrucks.map(t=><option key={t.id} value={t.id}>{t.registrationNumber} — {t.make} {t.model}</option>)}</select></label>
   <div className="form-row"><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label></div>
   <label>Description<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="e.g. Full service and filters" required/></label>
   <div className="form-row"><label>Cost (R)<input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:Number(e.target.value)})} required/></label><label>Odometer (km)<input type="number" min="0" step="1" value={form.odometer} onChange={e=>setForm({...form,odometer:Number(e.target.value)})} required/></label></div>
   <div className="form-row"><label>Next due odometer<input type="number" min="0" step="1" value={form.nextDueOdometer} onChange={e=>setForm({...form,nextDueOdometer:Number(e.target.value)})}/></label><label>Next due date<input type="date" value={form.nextDueDate} onChange={e=>setForm({...form,nextDueDate:e.target.value})}/></label></div>
   <button className="primary-button" type="submit"><CheckCircle2 size={16}/> {editing?'Update record':'Save record'}</button>
  </form></div>}
 </section>
}