import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { signOut, type User } from 'firebase/auth'
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { BarChart3, ClipboardList, Fuel, LayoutDashboard, LogOut, Truck, Users, Wrench } from 'lucide-react'
import Login from './pages/Login'
import Trucks from './pages/Trucks'
import Deliveries from './pages/Deliveries'
import Finance from './pages/Finance'
import Maintenance from './pages/Maintenance'
import Reports from './pages/Reports'
import ProtectedRoute from './components/ProtectedRoute'
import { auth, db } from './lib/firebase'

const navItems=[{to:'/',label:'Dashboard',icon:LayoutDashboard},{to:'/trucks',label:'Trucks',icon:Truck},{to:'/deliveries',label:'Deliveries',icon:ClipboardList},{to:'/customers',label:'Customers',icon:Users},{to:'/finance',label:'Finance',icon:BarChart3},{to:'/reports',label:'Reports',icon:BarChart3},{to:'/fuel',label:'Fuel',icon:Fuel},{to:'/maintenance',label:'Maintenance',icon:Wrench}]
function Placeholder({title,description}:{title:string;description:string}){return <section className="page-card"><p className="eyebrow">Next phase</p><h2>{title}</h2><p>{description}</p></section>}

type Delivery={id:string;price?:number;amountPaid?:number;orderDate?:string;deliveryStatus?:string}
type Expense={id:string;amount?:number;date?:string}
type TruckRecord={id:string;registrationNumber?:string;make?:string;model?:string;status?:string;currentOdometer?:number}
type MaintenanceRecord={id:string;truckId?:string;nextDueDate?:string;nextDueOdometer?:number}

function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
const money=(v:number)=>'R'+v.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})

function Dashboard({user}:{user:User}){
 const [deliveries,setDeliveries]=useState<Delivery[]>([]),[expenses,setExpenses]=useState<Expense[]>([]),[trucks,setTrucks]=useState<TruckRecord[]>([]),[maintenance,setMaintenance]=useState<MaintenanceRecord[]>([])
 const [isOwner,setIsOwner]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState('')
 useEffect(()=>{let alive=true;async function loadRole(){if(!db||!auth?.currentUser){if(alive)setReady(true);return}try{const snap=await getDoc(doc(db,'users',auth.currentUser.uid));if(alive)setIsOwner(snap.exists()&&snap.data().role==='owner'&&snap.data().active===true)}catch{if(alive)setError('Some dashboard data could not be checked.')}finally{if(alive)setReady(true)}}loadRole();return()=>{alive=false}},[])
 useEffect(()=>{if(!db||!ready)return;const unsubs=[
  onSnapshot(collection(db,'deliveries'),s=>setDeliveries(s.docs.map(d=>({id:d.id,...d.data()} as Delivery))),()=>setError('Unable to load deliveries.')),
  onSnapshot(collection(db,'trucks'),s=>setTrucks(s.docs.map(d=>({id:d.id,...d.data()} as TruckRecord))),()=>setError('Unable to load trucks.')),
  onSnapshot(collection(db,'maintenanceRecords'),s=>setMaintenance(s.docs.map(d=>({id:d.id,...d.data()} as MaintenanceRecord))),()=>setError('Unable to load maintenance warnings.'))
 ]
 if(isOwner)unsubs.push(onSnapshot(collection(db,'expenses'),s=>setExpenses(s.docs.map(d=>({id:d.id,...d.data()} as Expense))),()=>setError('Unable to load expenses.')))
 return()=>unsubs.forEach(u=>u())},[ready,isOwner])
 const today=localDate()
 const todayDeliveries=deliveries.filter(d=>d.orderDate===today)
 const revenue=todayDeliveries.reduce((s,d)=>s+Math.max(0,Number(d.price)||0),0)
 const expensesToday=expenses.filter(e=>e.date===today).reduce((s,e)=>s+Math.max(0,Number(e.amount)||0),0)
 const due=maintenance.filter(m=>{const truck=trucks.find(t=>t.id===m.truckId);return !!((m.nextDueDate&&m.nextDueDate<=today)||(m.nextDueOdometer!==undefined&&truck&&Number(truck.currentOdometer||0)>=Number(m.nextDueOdometer)))})
 const outstanding=deliveries.reduce((s,d)=>s+Math.max(0,(Number(d.price)||0)-(Number(d.amountPaid)||0)),0)
 const active=trucks.filter(t=>t.status==='active').length
 return <div className="dashboard">
  <div className="hero"><div><p className="eyebrow">Tshinanne Transport</p><h2>Welcome back 👋</h2><p className="muted">{user.email??'Signed-in user'} — your transport business in one place.</p></div><div className="truck-badge"><Truck size={28}/><span>{trucks.length} truck{trucks.length===1?'':'s'} · {active} active</span></div></div>
  {error&&<div className="notice">{error}</div>}
  <div className="stats"><div className="stat"><span>Today’s revenue</span><strong>{isOwner?money(revenue):'Owner only'}</strong></div><div className="stat"><span>Today’s expenses</span><strong>{isOwner?money(expensesToday):'Owner only'}</strong></div><div className="stat"><span>Deliveries today</span><strong>{todayDeliveries.length}</strong></div><div className="stat"><span>Estimated profit</span><strong>{isOwner?money(revenue-expensesToday):'Owner only'}</strong></div></div>
  {isOwner&&<div className="dashboard-grid"><div className="page-card"><p className="eyebrow">Customer payments</p><h3>{money(outstanding)}</h3><p className="muted">Outstanding across recorded deliveries.</p></div><div className="page-card"><p className="eyebrow">Maintenance</p><h3>{due.length} due</h3><p className="muted">{due.length?'Review fleet care items before the next trip.':'No maintenance warnings right now.'}</p></div></div>}
  <div className="page-card"><p className="eyebrow">Fleet status</p><h3>Your trucks</h3>{trucks.length===0?<p className="muted">No trucks have been added yet.</p>:<div className="dashboard-trucks">{trucks.map(t=><div className="dashboard-truck" key={t.id}><div><strong>{t.registrationNumber||'Unregistered'}</strong><span>{t.make||'TATA'} {t.model||'1518'} · {Number(t.currentOdometer||0).toLocaleString('en-ZA')} km</span></div><span className="status">{t.status||'inactive'}</span></div>)}</div>}</div>
 </div>
}

function AppShell({user}:{user:User}){async function handleLogout(){if(auth)await signOut(auth)}return <div className="app-shell"><header className="topbar"><div className="brand"><div className="brand-mark"><Truck size={21}/></div><div><strong>Tshinanne Transport</strong><span>Fleet Manager</span></div></div><button className="icon-button" onClick={handleLogout} aria-label="Sign out" title="Sign out"><LogOut size={20}/></button></header><main className="content"><Routes><Route path="/" element={<Dashboard user={user}/>}/><Route path="/trucks" element={<Trucks/>}/><Route path="/deliveries" element={<Deliveries/>}/><Route path="/customers" element={<Placeholder title="Customers" description="Keep customer contact details and delivery history in one place."/>}/><Route path="/finance" element={<Finance/>}/><Route path="/reports" element={<Reports/>}/><Route path="/fuel" element={<Placeholder title="Fuel" description="Record litres, fuel costs, stations and odometer readings."/>}/><Route path="/maintenance" element={<Maintenance/>}/></Routes></main><nav className="bottom-nav" aria-label="Main navigation">{navItems.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==='/' }><Icon size={19}/><span>{label}</span></NavLink>)}</nav></div>}
export default function App(){const[user,setUser]=useState<User|null|undefined>(undefined);useEffect(()=>{if(!auth){setUser(null);return}return auth.onAuthStateChanged(setUser)},[]);if(user===undefined)return <main className="auth-page"><p className="muted">Loading secure session…</p></main>;return <Routes><Route path="/login" element={user?<Navigate to="/" replace/>:<Login/>}/><Route element={<ProtectedRoute user={user}/>}><Route path="/*" element={<AppShell user={user}/>} /></Route></Routes>}
