import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, onSnapshot, orderBy, query, getDocs } from 'firebase/firestore'
import { BarChart3, Plus, X, Wallet, TrendingDown, TrendingUp, Clock } from 'lucide-react'
import { db, auth } from '../lib/firebase'

type Expense = { id:string; truckId?:string; category:string; amount:number; description?:string; date:string; createdBy?:string }
type Delivery = { id:string; price:number; amountPaid:number; paymentStatus:'unpaid'|'partial'|'paid'; orderDate:string; customerName?:string }
type Truck = { id:string; registrationNumber:string }
const categories=['Fuel','Maintenance','Tyres','Repairs','Driver costs','Other']

export default function Finance(){
 const [expenses,setExpenses]=useState<Expense[]>([]),[deliveries,setDeliveries]=useState<Delivery[]>([]),[trucks,setTrucks]=useState<Truck[]>([])
 const [isOwner,setIsOwner]=useState<boolean|null>(null),[open,setOpen]=useState(false),[error,setError]=useState('')
 const [form,setForm]=useState({category:'Fuel',amount:0,description:'',date:new Date().toISOString().slice(0,10),truckId:''})
 useEffect(()=>{async function loadRole(){if(!db||!auth?.currentUser){setIsOwner(false);return}try{const s=await getDocs(query(collection(db,'users')));const me=s.docs.find(d=>d.id===auth.currentUser?.uid);setIsOwner(me?.data().role==='owner'&&me?.data().active===true)}catch{setIsOwner(false)}}loadRole()},[])
 useEffect(()=>{if(!db||!isOwner)return;const u=[
  onSnapshot(query(collection(db,'expenses'),orderBy('date','desc')),s=>setExpenses(s.docs.map(d=>({id:d.id,...d.data()} as Expense))),()=>setError('Unable to load expenses.')),
  onSnapshot(query(collection(db,'deliveries'),orderBy('orderDate','desc')),s=>setDeliveries(s.docs.map(d=>({id:d.id,...d.data()} as Delivery))),()=>setError('Unable to load delivery income.')),
  onSnapshot(collection(db,'trucks'),s=>setTrucks(s.docs.map(d=>({id:d.id,...d.data()} as Truck))),()=>setError('Unable to load trucks.'))]
 return()=>u.forEach(x=>x())},[isOwner])
 const totals=useMemo(()=>{const revenue=deliveries.reduce((s,d)=>s+Math.max(0,Number(d.price)||0),0);const received=deliveries.reduce((s,d)=>s+Math.max(0,Number(d.amountPaid)||0),0);const expensesTotal=expenses.reduce((s,e)=>s+Math.max(0,Number(e.amount)||0),0);return{revenue,received,outstanding:Math.max(0,revenue-received),expensesTotal,profit:revenue-expensesTotal}},[deliveries,expenses])
 const money=(v:number)=>'R'+v.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})
 async function saveExpense(e:React.FormEvent){e.preventDefault();if(!db||!auth?.currentUser){setError('Firebase is not configured.');return}const amount=Math.max(0,Number(form.amount)||0);if(amount<=0||!form.description.trim()||!form.date){setError('Amount, description and date are required.');return}try{await addDoc(collection(db,'expenses'),{category:form.category,amount,description:form.description.trim(),date:form.date,truckId:form.truckId||null,createdBy:auth.currentUser.uid,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});setForm({category:'Fuel',amount:0,description:'',date:new Date().toISOString().slice(0,10),truckId:''});setOpen(false);setError('')}catch{setError('Could not save the expense. Check your permissions.')}}
 if(isOwner===null)return <section className="page-section"><div className="page-card"><p className="muted">Checking finance access…</p></div></section>
 if(!isOwner)return <section className="page-section"><div className="page-card access-card"><BarChart3 size={30}/><p className="eyebrow">Owner only</p><h2>Finance is private</h2><p className="muted">Only the business owner can view income, expenses, outstanding payments and profit.</p></div></section>
 return <section className="page-section">
  <div className="section-heading"><div><p className="eyebrow">Money & reporting</p><h2>Finance</h2><p className="muted">Track business revenue, cash received, expenses and estimated profit.</p></div><button className="primary-button compact" onClick={()=>{setError('');setOpen(true)}}><Plus size={17}/> Add expense</button></div>
  {error&&<div className="notice">{error}</div>}
  <div className="finance-stats">
   <div className="finance-stat"><div><span>Delivery revenue</span><strong>{money(totals.revenue)}</strong></div><TrendingUp size={22}/></div>
   <div className="finance-stat"><div><span>Payments received</span><strong>{money(totals.received)}</strong></div><Wallet size={22}/></div>
   <div className="finance-stat"><div><span>Outstanding</span><strong>{money(totals.outstanding)}</strong></div><Clock size={22}/></div>
   <div className="finance-stat"><div><span>Expenses</span><strong>{money(totals.expensesTotal)}</strong></div><TrendingDown size={22}/></div>
   <div className="finance-stat highlight"><div><span>Estimated profit</span><strong>{money(totals.profit)}</strong><small>Revenue minus recorded expenses</small></div><BarChart3 size={22}/></div>
  </div>
  <div className="page-card"><p className="eyebrow">Expense history</p><h3>Recorded expenses</h3>{expenses.length===0?<p className="muted">No expenses recorded yet.</p>:<div className="expense-list">{expenses.map(exp=><article className="expense-row" key={exp.id}><div><strong>{exp.description}</strong><span>{exp.category} · {exp.date}{exp.truckId?' · '+(trucks.find(t=>t.id===exp.truckId)?.registrationNumber??exp.truckId):''}</span></div><strong>{money(Number(exp.amount)||0)}</strong></article>)}</div>}</div>
  <div className="page-card"><p className="eyebrow">Income history</p><h3>Recent deliveries</h3>{deliveries.length===0?<p className="muted">No delivery income recorded yet.</p>:<div className="expense-list">{deliveries.slice(0,10).map(d=><article className="expense-row" key={d.id}><div><strong>{d.customerName||'Customer'}</strong><span>{d.orderDate} · {d.paymentStatus}</span></div><strong>{money(Number(d.price)||0)}</strong></article>)}</div>}</div>
  {open&&<div className="modal-backdrop"><form className="modal" onSubmit={saveExpense}><div className="modal-heading"><div><p className="eyebrow">Business cost</p><h3>Add expense</h3></div><button type="button" className="close-button" onClick={()=>setOpen(false)}><X/></button></div>
   <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
   <div className="form-row"><label>Amount (R)<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:Number(e.target.value)})} required/></label><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label></div>
   <label>Truck (optional)<select value={form.truckId} onChange={e=>setForm({...form,truckId:e.target.value})}><option value="">Business-wide</option>{trucks.map(t=><option key={t.id} value={t.id}>{t.registrationNumber}</option>)}</select></label>
   <label>Description<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="e.g. Diesel refill" required/></label>
   <button className="primary-button" type="submit">Save expense</button>
  </form></div>}
 </section>
}