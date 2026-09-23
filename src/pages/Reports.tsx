import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { BarChart3, Fuel, Package, Wallet } from 'lucide-react'
import { auth, db } from '../lib/firebase'

type Delivery={id:string;truckId?:string;price?:number;amountPaid?:number;orderDate?:string;customerName?:string}
type Expense={id:string;truckId?:string;category?:string;amount?:number;date?:string}
type FuelRecord={id:string;truckId?:string;litres?:number;amount?:number;date?:string}
type Truck={id:string;registrationNumber?:string}

const money=(v:number)=>'R'+v.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})
function firstOfMonth(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}

export default function Reports(){
 const [from,setFrom]=useState(firstOfMonth()),[to,setTo]=useState(today()),[owner,setOwner]=useState<boolean|null>(null)
 const [deliveries,setDeliveries]=useState<Delivery[]>([]),[expenses,setExpenses]=useState<Expense[]>([]),[fuel,setFuel]=useState<FuelRecord[]>([]),[trucks,setTrucks]=useState<Truck[]>([]),[error,setError]=useState('')
 useEffect(()=>{async function role(){if(!db||!auth?.currentUser){setOwner(false);return}try{const s=await getDoc(doc(db,'users',auth.currentUser.uid));setOwner(s.exists()&&s.data().role==='owner'&&s.data().active===true)}catch{setOwner(false)}}role()},[])
 useEffect(()=>{if(!db||owner!==true)return;const u=[
  onSnapshot(collection(db,'deliveries'),s=>setDeliveries(s.docs.map(d=>({id:d.id,...d.data()} as Delivery))),()=>setError('Unable to load deliveries.')),
  onSnapshot(collection(db,'expenses'),s=>setExpenses(s.docs.map(d=>({id:d.id,...d.data()} as Expense))),()=>setError('Unable to load expenses.')),
  onSnapshot(collection(db,'fuelRecords'),s=>setFuel(s.docs.map(d=>({id:d.id,...d.data()} as FuelRecord))),()=>setError('Unable to load fuel records.')),
  onSnapshot(collection(db,'trucks'),s=>setTrucks(s.docs.map(d=>({id:d.id,...d.data()} as Truck))),()=>setError('Unable to load trucks.'))
 ];return()=>u.forEach(x=>x())},[owner])
 const inRange=(date?:string)=>!!date&&date>=from&&date<=to
 const filtered=useMemo(()=>({deliveries:deliveries.filter(d=>inRange(d.orderDate)),expenses:expenses.filter(e=>inRange(e.date)),fuel:fuel.filter(f=>inRange(f.date))}),[deliveries,expenses,fuel,from,to])
 const totals=useMemo(()=>{const revenue=filtered.deliveries.reduce((s,d)=>s+Math.max(0,Number(d.price)||0),0);const received=filtered.deliveries.reduce((s,d)=>s+Math.max(0,Number(d.amountPaid)||0),0);const expenseTotal=filtered.expenses.reduce((s,e)=>s+Math.max(0,Number(e.amount)||0),0);const fuelLitres=filtered.fuel.reduce((s,f)=>s+Math.max(0,Number(f.litres)||0),0);const fuelCost=filtered.fuel.reduce((s,f)=>s+Math.max(0,Number(f.amount)||0),0);return{revenue,received,outstanding:Math.max(0,revenue-received),expenseTotal,fuelLitres,fuelCost,profit:revenue-expenseTotal}},[filtered])
 const categoryTotals=useMemo(()=>Object.entries(filtered.expenses.reduce<Record<string,number>>((a,e)=>{const k=e.category||'Other';a[k]=(a[k]||0)+Math.max(0,Number(e.amount)||0);return a},{})).sort((a,b)=>b[1]-a[1]),[filtered.expenses])
 const truckTotals=useMemo(()=>trucks.map(t=>{const ds=filtered.deliveries.filter(d=>d.truckId===t.id);const es=filtered.expenses.filter(e=>e.truckId===t.id);const revenue=ds.reduce((s,d)=>s+Math.max(0,Number(d.price)||0),0);const expenseCosts=es.reduce((s,e)=>s+Math.max(0,Number(e.amount)||0),0);const fuelCosts=filtered.fuel.filter(x=>x.truckId===t.id).reduce((s,x)=>s+Math.max(0,Number(x.amount)||0),0);const costs=expenseCosts+fuelCosts;return{...t,deliveries:ds.length,revenue,costs,profit:revenue-costs}}).sort((a,b)=>b.revenue-a.revenue),[trucks,filtered])
 if(owner===null)return <section className="page-section"><div className="page-card"><p className="muted">Checking report access…</p></div></section>
 if(!owner)return <section className="page-section"><div className="page-card access-card"><BarChart3 size={30}/><p className="eyebrow">Owner only</p><h2>Reports are private</h2><p className="muted">Financial and truck profitability reports are available to the business owner.</p></div></section>
 const maxCategory=categoryTotals[0]?.[1]||1
 return <section className="page-section">
  <div className="section-heading"><div><p className="eyebrow">Business insights</p><h2>Reports</h2><p className="muted">Review performance for any date range.</p></div></div>
  {error&&<div className="notice">{error}</div>}
  <div className="report-filters"><label>From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div>
  <div className="finance-stats">
   <div className="finance-stat"><div><span>Revenue</span><strong>{money(totals.revenue)}</strong></div><BarChart3 size={22}/></div>
   <div className="finance-stat"><div><span>Payments received</span><strong>{money(totals.received)}</strong></div><Wallet size={22}/></div>
   <div className="finance-stat"><div><span>Outstanding</span><strong>{money(totals.outstanding)}</strong></div><Wallet size={22}/></div>
   <div className="finance-stat"><div><span>Expenses</span><strong>{money(totals.expenseTotal)}</strong></div><BarChart3 size={22}/></div>
   <div className="finance-stat highlight"><div><span>Estimated profit</span><strong>{money(totals.profit)}</strong><small>{filtered.deliveries.length} deliveries</small></div><Package size={22}/></div>
  </div>
  <div className="report-grid">
   <div className="page-card"><p className="eyebrow">Expenses</p><h3>By category</h3>{categoryTotals.length===0?<p className="muted">No expenses in this period.</p>:<div className="bar-list">{categoryTotals.map(([name,value])=><div className="bar-row" key={name}><div><strong>{name}</strong><span>{money(value)}</span></div><div className="bar-track"><i style={{width:`${Math.max(5,(value/maxCategory)*100)}%`}}/></div></div>)}</div>}</div>
   <div className="page-card"><p className="eyebrow">Fuel</p><h3>Fuel analytics</h3><div className="report-number"><Fuel size={22}/><strong>{totals.fuelLitres.toLocaleString('en-ZA',{maximumFractionDigits:1})} L</strong></div><p className="muted">{money(totals.fuelCost)} recorded fuel cost in this period.</p></div>
  </div>
  <div className="page-card"><p className="eyebrow">Fleet performance</p><h3>Truck comparison</h3>{truckTotals.length===0?<p className="muted">No trucks recorded.</p>:<div className="truck-report-list">{truckTotals.map(t=><div className="truck-report-row" key={t.id}><div><strong>{t.registrationNumber||'Unregistered'}</strong><span>{t.deliveries} deliveries · {money(t.revenue)} revenue · {money(t.costs)} truck costs</span></div><strong>{money(t.profit)}</strong></div>)}</div>}</div>
 </section>
}
