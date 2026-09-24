import React, { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import api from "./api";

const captions = [
  "Your mood has a menu. Find it.",
  "A little hungry? Let CraveHub handle the rest.",
  "From first bite to your door — follow the crave.",
];

const MOODS = [
  { key: "Hungry", emoji: "🍽️", text: "Big hunger, big flavours" },
  { key: "Lazy", emoji: "🛋️", text: "Comfort without the effort" },
  { key: "Spicy", emoji: "🌶️", text: "Turn up the heat" },
  { key: "Comfort", emoji: "🥹", text: "Something warm & familiar" },
  { key: "Energetic", emoji: "⚡", text: "Fuel the good energy" },
];

const METER_LEVELS = [
  { key: "Mild", emoji: "🙂", text: "Just a little craving" },
  { key: "Medium", emoji: "😋", text: "Okay, now I need food" },
  { key: "Strong", emoji: "🤤", text: "Serious craving territory" },
  { key: "Extreme", emoji: "🔥", text: "DROP EVERYTHING. FEED ME." },
];

function notify(message, type = "success") {
  window.dispatchEvent(new CustomEvent("cravehub:notify", { detail: { message, type } }));
}

function PopupHost() {
  const [popup, setPopup] = useState(null);
  useEffect(() => {
    const handler = (e) => {
      setPopup(e.detail);
      window.clearTimeout(window.__cravePopupTimer);
      window.__cravePopupTimer = window.setTimeout(() => setPopup(null), 4200);
    };
    window.addEventListener("cravehub:notify", handler);
    return () => window.removeEventListener("cravehub:notify", handler);
  }, []);
  if (!popup) return null;
  return (
    <div className={`ch-popup ${popup.type || "success"}`}>
      <div className="popup-mark">{popup.type === "error" ? "!" : popup.type === "info" ? "i" : "✓"}</div>
      <div><strong>{popup.type === "error" ? "Something needs attention" : popup.type === "info" ? "CraveHub" : "Craving confirmed"}</strong><p>{popup.message}</p></div>
      <button onClick={() => setPopup(null)} aria-label="Close">×</button>
    </div>
  );
}

function CravePulse({ show, onDone }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 5200);
    return () => clearTimeout(t);
  }, [show, onDone]);
  if (!show) return null;
  return (
    <div className="crave-pulse">
      <div className="pulse-glow" />
      <span className="pulse-icon">✦</span>
      <div><small>CRAVE PULSE</small><strong>CRAVINGS IS ORDERED</strong><p>Your journey has officially begun.</p></div>
    </div>
  );
}

function Navbar({ user, setUser }) {
  const nav = useNavigate();
  function logout() {
    if (!window.confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("token"); localStorage.removeItem("user");
    setUser(null); nav("/login");
  }
  return (
    <nav className="navbar navbar-expand-lg ch-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand ch-brand" to="/"><span className="brand-dot" />CraveHub</Link>
        <div className="navbar-nav ms-auto align-items-center">
          <Link className="nav-link" to="/">Home</Link>
          {user && <><Link className="nav-link" to="/cart">Cart</Link><Link className="nav-link" to="/orders">Orders</Link><Link className="nav-link" to="/profile">Profile</Link></>}
          {user?.email === "admin@foodie.com" && <Link className="nav-link admin-nav" to="/admin">Admin</Link>}
          {!user ? <><Link className="nav-link" to="/login">Login</Link><Link className="nav-link register-nav" to="/register">Register</Link></> :
            <button className="btn btn-sm logout-btn ms-2" onClick={logout}>Logout</button>}
        </div>
      </div>
    </nav>
  );
}

function QuickPreview({ food, onClose, onAdd }) {
  if (!food) return null;
  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="food-preview-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="preview-image">{food.image ? <img src={food.image} alt={food.name}/> : <span>🍔</span>}</div>
        <div className="preview-copy">
          <span className="mini-tag">{food.category || "Food"}</span>
          <h2>{food.name}</h2>
          <p>{food.description || "Delicious food made for your cravings."}</p>
          <div className="preview-footer"><strong>₹{food.price}</strong><button className="crave-btn" onClick={() => onAdd(food)}>Add to Crave</button></div>
        </div>
      </div>
    </div>
  );
}

function CraveLocked({ food, onClose, onLogin }) {
  if (!food) return null;
  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="locked-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="lock-icon">🔒</div>
        <span className="mini-tag">CRAVE LOCKED</span>
        <h2>That craving needs a login.</h2>
        <p>Sign in to save <strong>{food.name}</strong> to your cart and start your Crave Journey.</p>
        <div className="locked-actions"><button className="ghost-btn" onClick={onClose}>Maybe later</button><button className="crave-btn" onClick={onLogin}>Login & Crave</button></div>
      </div>
    </div>
  );
}

function Home({ user }) {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [captionIndex, setCaptionIndex] = useState(0);
  const [meter, setMeter] = useState("Medium");
  const [mood, setMood] = useState("");
  const [preview, setPreview] = useState(null);
  const [locked, setLocked] = useState(null);
  const [surprise, setSurprise] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    loadFoods();
    const timer = setInterval(() => setCaptionIndex(i => (i + 1) % captions.length), 2800);
    return () => clearInterval(timer);
  }, []);

  async function loadFoods() {
    try { setFoods((await api.get("/foods")).data || []); }
    catch (err) { console.log(err); notify("Could not load the menu. Check your backend connection.", "error"); }
  }

  function addToCart(food) {
    if (!user) { setPreview(null); setLocked(food); return; }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(item => item._id === food._id);
    if (existing) existing.quantity += 1; else cart.push({ ...food, quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    setPreview(null); notify(`${food.name} is locked into your cravings.`);
  }

  function surpriseMe() {
    if (!foods.length) return notify("No menu items are available yet.", "info");
    setSurprise("spinning");
    setTimeout(() => {
      const item = foods[Math.floor(Math.random() * foods.length)];
      setSurprise(item);
    }, 900);
  }

  const categories = ["All", ...new Set(foods.map(f => f.category).filter(Boolean))];
  const filteredFoods = foods.filter(food => {
    const hay = `${food.name || ""} ${food.description || ""} ${food.category || ""}`.toLowerCase();
    const searchMatch = hay.includes(search.toLowerCase());
    const moodMatch = !mood || hay.includes(mood.toLowerCase()) ||
      (mood === "Spicy" && /spicy|chilli|chili|pepper|masala|tandoori/i.test(hay)) ||
      (mood === "Comfort" && /biryani|rice|pizza|burger|noodle|pasta|soup/i.test(hay)) ||
      (mood === "Energetic" && /protein|salad|wrap|grill|chicken|egg/i.test(hay));
    const meterMatch = meter !== "Extreme" || Number(food.price || 0) >= 250;
    return searchMatch && moodMatch && (category === "All" || food.category === category) && meterMatch;
  });

  return (
    <div className="page-bg">
      <section className="hero-section">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" /><div className="hero-orb orb-three" />
        <div className="container hero-content">
          <div className="hero-copy">
            <div className="eyebrow">WELCOME TO CRAVEHUB</div>
            <h1>Food that makes<span> your mood.</span></h1>
            <p className="hero-caption" key={captionIndex}>{captions[captionIndex]}</p>
            <div className="hero-actions"><a href="#crave-menu" className="btn hero-btn">Explore Menu</a>{!user && <Link to="/register" className="btn hero-outline-btn">Join CraveHub</Link>}</div>
            <div className="hero-mini-stats"><span>✦ Mood-led</span><span>✦ Surprise-ready</span><span>✦ Door-bound</span></div>
          </div>
          <div className="hero-visual">
            <div className="floating-food food-a">🍕</div><div className="floating-food food-b">🍔</div><div className="floating-food food-c">🍟</div>
            <div className="hero-food-card"><div className="hero-food-emoji">🍜</div><span className="hero-card-label">TONIGHT'S CRAVE</span><h4>Something delicious</h4><p>is waiting for you.</p><div className="mini-stars">✦ ✦ ✦</div></div>
          </div>
        </div>
      </section>

      <main className="container py-5" id="crave-menu">
        <section className="crave-control-grid">
          <div className="crave-control-card meter-card">
            <div className="control-head"><div><span className="section-kicker">🧠 CRAVE METER</span><h3>How intense is it?</h3></div><strong>{meter}</strong></div>
            <div className="meter-track">{METER_LEVELS.map((m, i) => <button key={m.key} className={meter === m.key ? "active" : ""} onClick={() => setMeter(m.key)}><span>{m.emoji}</span><small>{m.key}</small></button>)}</div>
          </div>
          <div className="crave-control-card surprise-card">
            <div><span className="section-kicker">🎲 SURPRISE MY CRAVING</span><h3>Don't make me choose.</h3><p>Let CraveHub pick a random bite.</p></div>
            <button className="surprise-btn" onClick={surpriseMe}>Surprise me <span>↗</span></button>
          </div>
        </section>

        <section className="mood-section">
          <div className="section-heading"><span>😊 MOOD → FOOD</span><h2>What are you feeling?</h2><p>Tap a mood and let the menu move with you.</p></div>
          <div className="mood-row">{MOODS.map(m => <button key={m.key} className={`mood-pill ${mood === m.key ? "active" : ""}`} onClick={() => setMood(mood === m.key ? "" : m.key)}><span>{m.emoji}</span><div><strong>{m.key}</strong><small>{m.text}</small></div></button>)}</div>
        </section>

        <section className="dna-banner">
          <div><span className="section-kicker">💜 CRAVE DNA</span><h3>Your taste has a personality.</h3><p>Every choice helps turn CraveHub into your kind of menu.</p></div>
          <div className="dna-badges"><span>🍔 Comfort Chaser</span><span>🌶️ Heat Curious</span><span>✨ Explorer</span></div>
        </section>

        <div className="section-heading text-center"><span>EXPLORE</span><h2>Discover Your Cravings</h2><p>{mood || meter !== "Medium" ? `Showing ${mood || meter.toLowerCase()} cravings.` : "Pick your favourite and let the good food begin."}</p></div>
        <div className="search-panel">
          <div className="search-wrap"><span>⌕</span><input placeholder="Search pizza, burger, biryani..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="category-row">{categories.map(cat => <button key={cat} className={`category-pill ${category === cat ? "active" : ""}`} onClick={() => setCategory(cat)}>{cat}</button>)}</div>
        </div>

        <div className="row g-4 mt-2">
          {filteredFoods.length === 0 ? <div className="empty-box smart-empty"><div className="empty-orbit">🍽️</div><span className="section-kicker">SMART EMPTY STATE</span><h4>No match for this craving.</h4><p>Try another mood, lower the craving intensity, or clear your search.</p><button className="ghost-btn" onClick={() => {setMood("");setMeter("Medium");setSearch("");setCategory("All")}}>Reset my cravings</button></div> :
          filteredFoods.map((food, index) => <div className="col-sm-6 col-lg-4 col-xl-3" key={food._id}>
            <div className={`food-card delay-${index % 4}`} onClick={() => setPreview(food)}>
              <div className="food-image-wrap">{food.image ? <img src={food.image} alt={food.name}/> : <div className="food-placeholder">🍔</div>}<span className="food-category">{food.category || "Food"}</span><span className="quick-view">Quick preview</span></div>
              <div className="food-card-body"><div className="food-card-title"><h5>{food.name}</h5><span>↗</span></div><p>{food.description || "Delicious food made for your cravings."}</p><div className="food-bottom"><strong>₹{food.price}</strong><button onClick={e => {e.stopPropagation(); addToCart(food)}}>+ Add</button></div></div>
            </div>
          </div>)}
        </div>
      </main>

      {preview && <QuickPreview food={preview} onClose={() => setPreview(null)} onAdd={addToCart}/>}
      {locked && <CraveLocked food={locked} onClose={() => setLocked(null)} onLogin={() => {setLocked(null);nav("/login")}}/>}
      {surprise && <div className="modal-backdrop-custom" onClick={() => setSurprise(null)}><div className="surprise-modal" onClick={e=>e.stopPropagation()}>{surprise === "spinning" ? <><div className="dice-spin">🎲</div><h2>Reading your craving...</h2><p>Let the universe pick dinner.</p></> : <><span className="mini-tag">YOUR RANDOM CRAVE</span><div className="surprise-food-image">{surprise.image ? <img src={surprise.image} alt={surprise.name}/> : <span>🍔</span>}</div><h2>{surprise.name}</h2><p>{surprise.description || "A delicious surprise from the menu."}</p><div className="preview-footer"><strong>₹{surprise.price}</strong><button className="crave-btn" onClick={()=>{addToCart(surprise);setSurprise(null)}}>That's the one ✦</button></div></>}</div></div>}
    </div>
  );
}

function Auth({ type, setUser }) {
  const nav = useNavigate(), isRegister = type === "register";
  const [form, setForm] = useState({name:"",email:"",password:""}), [showPassword,setShowPassword] = useState(false);
  async function submit(e) {
    e.preventDefault();
    try {
      if (isRegister) { await api.post("/auth/register", form); notify("Your CraveHub account is ready. Welcome to the table."); nav("/login"); return; }
      const res = await api.post("/auth/login", {email:form.email,password:form.password});
      localStorage.setItem("token",res.data.token); localStorage.setItem("user",JSON.stringify(res.data.user)); setUser(res.data.user); notify("Welcome back. Your cravings are ready."); nav("/");
    } catch(err) { notify(err.response?.data?.message || "Something went wrong","error"); }
  }
  return <div className="auth-page"><div className="auth-blob blob-a"/><div className="auth-blob blob-b"/><div className="auth-card">
    <div className="auth-brand">CraveHub</div><span className="section-kicker centered">YOUR CRAVING SPACE</span><h1>{isRegister?"Create your account":"Welcome back"}</h1><p>{isRegister?"Your delicious journey begins here.":"Your next delicious meal is waiting."}</p>
    <form onSubmit={submit}>
      {isRegister&&<div className="input-group-modern"><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Enter your name" required/></div>}
      <div className="input-group-modern"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Enter your email" required/></div>
      <div className="input-group-modern"><label>Password</label><div className="password-wrap"><input type={showPassword?"text":"password"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Enter your password" required/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?"◉":"◌"}</button></div></div>
      <button className="auth-btn">{isRegister?"Create Account":"Login"} <span>→</span></button>
    </form>
    <div className="auth-switch">{isRegister?<>Already have an account? <Link to="/login">Login</Link></>:<>Don't have an account? <Link to="/register">Register</Link></>}</div>
  </div></div>;
}

function Cart() {
  const [cart,setCart]=useState(JSON.parse(localStorage.getItem("cart")||"[]")), [address,setAddress]=useState(""), [pulse,setPulse]=useState(false);
  const nav=useNavigate();
  function saveCart(c){setCart(c);localStorage.setItem("cart",JSON.stringify(c))}
  const increase=id=>saveCart(cart.map(i=>i._id===id?{...i,quantity:i.quantity+1}:i));
  const decrease=id=>saveCart(cart.map(i=>i._id===id?{...i,quantity:i.quantity-1}:i).filter(i=>i.quantity>0));
  const remove=id=>saveCart(cart.filter(i=>i._id!==id));
  const total=cart.reduce((s,i)=>s+Number(i.price)*i.quantity,0);
  async function placeOrder(){
    if(!cart.length)return notify("Your cart is empty","info");
    if(!address.trim())return notify("Please enter delivery address","error");
    try{
      await api.post("/orders",{items:cart.map(i=>({food:i._id,name:i.name,price:i.price,quantity:i.quantity})),totalAmount:total,address});
      localStorage.removeItem("cart");setCart([]);setPulse(true);window.setTimeout(()=>nav("/orders"),1400);
    }catch(err){notify(err.response?.data?.message||"Failed to place order","error")}
  }
  return <div className="page-bg"><div className="container py-5"><div className="section-heading"><span>CRAVE LOCKER</span><h2>🛒 Your Cart</h2><p>Everything you chose, ready for the journey.</p></div>
    {!cart.length?<div className="empty-box smart-empty"><div className="empty-orbit">🛒</div><span className="section-kicker">NOTHING LOCKED YET</span><h4>Your cart is waiting for a craving.</h4><p>Explore the menu and give it something to carry.</p><Link to="/" className="crave-btn">Browse Food ✦</Link></div>:<>
      {cart.map(item=><div className="cart-card" key={item._id}><div className="cart-food"><div className="cart-thumb">{item.image?<img src={item.image} alt=""/>:"🍔"}</div><div><h5>{item.name}</h5><p>₹{item.price} each</p></div></div><div className="qty-controls"><button onClick={()=>decrease(item._id)}>−</button><strong>{item.quantity}</strong><button onClick={()=>increase(item._id)}>+</button></div><strong className="cart-price">₹{Number(item.price)*item.quantity}</strong><button className="remove-btn" onClick={()=>remove(item._id)}>Remove</button></div>)}
      <div className="checkout-card"><div className="total-row"><span>Total Crave</span><strong>₹{total}</strong></div><label>Delivery Address</label><textarea rows="3" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Where should the craving land?"/><button className="checkout-btn" onClick={placeOrder}>Lock My Craving 🎉</button></div>
    </>}
  </div><CravePulse show={pulse} onDone={()=>setPulse(false)}/></div>
}

const JOURNEY = ["Craved","Crafting","On the Move","At Your Door"];
function Journey({status}) {
  const index = status === "Delivered" ? 3 : status === "Out for Delivery" ? 2 : status === "Preparing" ? 1 : 0;
  return <div className="journey"><div className="journey-line"><span style={{width:`${(index/3)*100}%`}}/></div>{JOURNEY.map((x,i)=><div className={`journey-step ${i<=index?"active":""}`} key={x}><div className="journey-dot">{i<=index?"✓":i+1}</div><span>{x.toUpperCase()}</span></div>)}</div>;
}
function Orders() {
  const [orders,setOrders]=useState([]),[loading,setLoading]=useState(true);
  useEffect(()=>{loadOrders()},[]);
  async function loadOrders(){try{setLoading(true);setOrders((await api.get("/orders/my")).data||[])}catch(err){notify(err.response?.data?.message||"Failed to load order history","error")}finally{setLoading(false)}}
  function statusClass(s){return s==="Delivered"?"status delivered":s==="Cancelled"?"status cancelled":s==="Preparing"?"status preparing":s==="Out for Delivery"?"status delivery":"status pending"}
  const latest=orders[0];
  return <div className="page-bg"><div className="container py-5"><div className="section-heading d-flex justify-content-between align-items-end flex-wrap gap-3"><div><span>🛵 CRAVE JOURNEY</span><h2>Order History</h2><p>Follow every craving from thought to doorstep.</p></div><button className="refresh-btn" onClick={loadOrders}>↻ Refresh</button></div>
    {latest&&<div className="journey-hero"><div><span className="section-kicker">LATEST CRAVE · #{latest._id.slice(-6)}</span><h3>{latest.status==="Delivered"?"That craving made it home.":"Your craving is moving."}</h3></div><span className={statusClass(latest.status)}>{latest.status||"Pending"}</span><Journey status={latest.status}/></div>}
    {loading&&<div className="empty-box"><div className="spinner-border"/><p className="mt-3">Loading your cravings...</p></div>}
    {!loading&&!orders.length&&<div className="empty-box smart-empty"><div className="empty-orbit">🛵</div><span className="section-kicker">CRAVE JOURNEY</span><h4>Your first journey starts here.</h4><p>Place an order and watch it move from Craved to At Your Door.</p><Link to="/" className="crave-btn">Find a Crave ✦</Link></div>}
    {!loading&&orders.map((o,i)=><div className="order-card" key={o._id}><div className="order-top"><div><small>ORDER {i+1}</small><h5>#{o._id.slice(-6)}</h5></div><span className={statusClass(o.status)}>{o.status||"Pending"}</span><strong>₹{o.totalAmount}</strong></div><Journey status={o.status}/><div className="order-items">{o.items?.map((item,j)=><div className="order-item" key={j}><span>{item.name} × {item.quantity}</span><strong>₹{Number(item.price)*Number(item.quantity)}</strong></div>)}</div><div className="order-address"><small>DELIVERY ADDRESS</small><p>{o.address||"Address not available"}</p></div></div>)}
  </div></div>;
}

function Profile() {
  const [form,setForm]=useState({name:"",email:""}),[orders,setOrders]=useState([]);
  useEffect(()=>{(async()=>{try{const [r,o]=await Promise.all([api.get("/users/profile"),api.get("/orders/my")]);setForm({name:r.data.name||"",email:r.data.email||""});setOrders(o.data||[])}catch(e){console.log(e)}})()},[]);
  async function update(e){e.preventDefault();try{await api.put("/users/profile",{name:form.name});notify("Profile updated. Your CraveHub space is fresh.")}catch(err){notify(err.response?.data?.message||"Failed to update profile","error")}}
  const count=orders.length, delivered=orders.filter(o=>o.status==="Delivered").length;
  return <div className="auth-page"><div className="profile-layout"><div className="auth-card profile-card"><div className="auth-brand">CraveHub</div><span className="section-kicker centered">💜 CRAVE DNA</span><h1>My Profile</h1><p>Keep your account details fresh.</p><form onSubmit={update}><div className="input-group-modern"><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="input-group-modern"><label>Email</label><input value={form.email} disabled/></div><button className="auth-btn">Update Profile <span>→</span></button></form></div>
    <div className="dna-profile-card"><span className="section-kicker">YOUR CRAVE DNA</span><h2>{form.name||"Crave Explorer"}</h2><p>Your taste, your journey, your badges.</p><div className="score-ring"><strong>{Math.min(99,count*12+delivered*8+20)}</strong><span>CRAVE<br/>SCORE</span></div><div className="profile-badges"><span>🏆 First Crave</span><span>🌶️ Spice Seeker</span><span>🗺️ Food Explorer</span>{count>=5&&<span>🔥 Crave Streak</span>}</div><div className="profile-stats"><div><strong>{count}</strong><small>ORDERS</small></div><div><strong>{delivered}</strong><small>DELIVERED</small></div><div><strong>{Math.max(1,Math.min(7,count))}</strong><small>STREAK</small></div></div></div>
  </div></div>;
}

function Admin() {
  const [foods,setFoods]=useState([]),[orders,setOrders]=useState([]),[users,setUsers]=useState([]),[form,setForm]=useState({name:"",description:"",price:"",category:"",image:""}),[preview,setPreview]=useState(null);
  useEffect(()=>{loadData()},[]);
  async function loadData(){try{const [f,o,u]=await Promise.all([api.get("/foods"),api.get("/orders"),api.get("/users")]);setFoods(f.data||[]);setOrders(o.data||[]);setUsers(u.data||[])}catch(err){notify(err.response?.data?.message||"Failed to load admin data","error")}}
  async function addFood(e){e.preventDefault();try{await api.post("/foods",{...form,price:Number(form.price)});setForm({name:"",description:"",price:"",category:"",image:""});await loadData();notify("New food added to the CraveHub menu.")}catch(err){notify(err.response?.data?.message||"Failed to add food","error")}}
  async function editFood(food){const name=prompt("Food name:",food.name);if(name===null)return;const category=prompt("Category:",food.category||"");if(category===null)return;const price=prompt("Price:",food.price);if(price===null)return;const description=prompt("Description:",food.description||"");if(description===null)return;const image=prompt("Image URL:",food.image||"");if(image===null)return;try{await api.put(`/foods/${food._id}`,{name,category,price:Number(price),description,image});await loadData();notify("Food details updated successfully.")}catch(err){notify(err.response?.data?.message||"Failed to update food","error")}}
  async function deleteFood(id){if(!confirm("Delete this food?"))return;try{await api.delete(`/foods/${id}`);await loadData();notify("Food removed from the menu.")}catch(err){notify(err.response?.data?.message||"Failed to delete food","error")}}
  async function updateOrder(id,status){try{await api.put(`/orders/${id}/status`,{status});await loadData();notify(`Order status changed to ${status}.`)}catch(err){notify(err.response?.data?.message||"Failed to update order","error")}}
  return <div className="page-bg"><div className="container py-5"><div className="section-heading"><span>👨‍🍳 CRAVEHUB CONTROL CENTER</span><h2>Admin Dashboard</h2><p>A cleaner command center for food, orders and people.</p></div>
    <div className="stats-grid"><div className="stat-card violet"><span>🍔</span><small>FOODS</small><strong>{foods.length}</strong><p>Menu ready to crave</p></div><div className="stat-card apricot"><span>📦</span><small>ORDERS</small><strong>{orders.length}</strong><p>Journeys in the system</p></div><div className="stat-card ink"><span>👥</span><small>USERS</small><strong>{users.length}</strong><p>Crave community</p></div></div>
    <div className="admin-card admin-form-card"><div className="admin-section-head"><div><span className="section-kicker">MENU BUILDER</span><h4>Add New Food</h4></div><span className="admin-chip">LIVE MENU</span></div><form onSubmit={addFood} className="row g-3 mt-1"><div className="col-md-6"><input className="form-control modern-control" placeholder="Food name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div><div className="col-md-6"><input className="form-control modern-control" placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} required/></div><div className="col-md-6"><input className="form-control modern-control" type="number" placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></div><div className="col-md-6"><input className="form-control modern-control" placeholder="Image URL" value={form.image} onChange={e=>setForm({...form,image:e.target.value})}/></div><div className="col-12"><textarea className="form-control modern-control" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div><div className="col-12"><button className="auth-btn admin-add-btn">+ Add Food to Menu</button></div></form></div>
    <div className="admin-card"><div className="admin-section-head"><div><span className="section-kicker">FOOD PREVIEW</span><h4>Menu Management</h4></div><span className="admin-chip">{foods.length} ITEMS</span></div><div className="admin-food-grid">{foods.map(f=><div className="admin-food-mini" key={f._id}><div className="admin-mini-image">{f.image?<img src={f.image} alt=""/>:<span>🍔</span>}</div><div><strong>{f.name}</strong><small>{f.category} · ₹{f.price}</small></div><div className="admin-mini-actions"><button onClick={()=>setPreview(f)}>Preview</button><button onClick={()=>editFood(f)}>Edit</button><button className="danger-mini" onClick={()=>deleteFood(f._id)}>Delete</button></div></div>)}{!foods.length&&<div className="empty-inline">No food items yet.</div>}</div></div>
    <div className="admin-card"><div className="admin-section-head"><div><span className="section-kicker">ORDER VISUALS</span><h4>Manage Orders</h4></div></div><div className="admin-order-list">{orders.map(o=><div className="admin-order-row" key={o._id}><div><strong>#{o._id.slice(-6)}</strong><small>{o.address}</small></div><span className={o.status==="Delivered"?"status delivered":o.status==="Preparing"?"status preparing":o.status==="Out for Delivery"?"status delivery":"status pending"}>{o.status||"Pending"}</span><strong>₹{o.totalAmount}</strong><select className="form-select" value={o.status||"Pending"} onChange={e=>updateOrder(o._id,e.target.value)}><option>Pending</option><option>Preparing</option><option>Out for Delivery</option><option>Delivered</option><option>Cancelled</option></select></div>)}{!orders.length&&<div className="empty-inline">No orders yet.</div>}</div></div>
    <div className="admin-card"><div className="admin-section-head"><div><span className="section-kicker">CRAVE COMMUNITY</span><h4>Registered Users</h4></div></div><div className="table-responsive"><table className="table admin-table"><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th></tr></thead><tbody>{users.map((u,i)=><tr key={u._id}><td>{i+1}</td><td>{u.name||"-"}</td><td>{u.email||"-"}</td><td>{u.phone||"-"}</td><td><span className={`role-badge ${u.role==="admin"?"admin":""}`}>{u.role||"user"}</span></td></tr>)}{!users.length&&<tr><td colSpan="5" className="text-center">No users</td></tr>}</tbody></table></div></div>
  </div>{preview&&<QuickPreview food={preview} onClose={()=>setPreview(null)} onAdd={()=>notify("Preview only — use the customer menu to add items.","info")}/>}</div>;
}

function App(){
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("user"))}catch{return null}});
  return <><Navbar user={user} setUser={setUser}/><PopupHost/><Routes><Route path="/" element={<Home user={user}/>}/><Route path="/login" element={<Auth type="login" setUser={setUser}/>}/><Route path="/register" element={<Auth type="register" setUser={setUser}/>}/><Route path="/cart" element={<Cart/>}/><Route path="/orders" element={<Orders/>}/><Route path="/profile" element={<Profile/>}/><Route path="/admin" element={<Admin/>}/></Routes></>;
}
export default App;
