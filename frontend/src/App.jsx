import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import api from "./api";
import "./App.css";

const captions = [
  "Your cravings called. We answered.",
  "What is your mood hungry for today?",
  "One mood. One meal. One perfect craving.",
  "Good food. Great mood.",
  "Follow the craving.",
  "Your next favourite meal is closer than you think.",
  "Some cravings simply cannot wait.",
  "Turn hunger into a moment worth remembering.",
  "Your taste knows what it wants.",
  "Find your kind of delicious.",
  "Crave it. Click it. Love it.",
  "Tonight deserves something delicious.",
  "A little craving can change the whole mood.",
  "Fresh picks. Big cravings.",
  "Made for your mood.",
  "Worth every bite.",
  "The good stuff starts here.",
  "Your hunger has good taste.",
  "Don't just scroll. Taste it.",
  "One click away from delicious.",
  "Your table. Your choice. Your craving.",
  "Popular for a reason.",
  "Currently causing cravings.",
  "Something delicious is waiting.",
  "Your next bite could be your favourite.",
  "Because ordinary meals are boring.",
  "Make room for something amazing.",
  "Eat happy.",
  "Cravings worth chasing.",
  "Good choices can be delicious.",
  "Your food story starts here.",
  "Hungry? Let's fix that.",
  "The best moments often start with food.",
  "Discover something worth craving.",
  "Ready when your appetite is."
];

function notify(message, type = "success") {
  window.dispatchEvent(new CustomEvent("cravehub:popup", { detail: { message, type } }));
}

function PopupHost() {
  const [popup, setPopup] = useState(null);
  useEffect(() => {
    const handler = (e) => {
      setPopup(e.detail);
      window.clearTimeout(window.__cravehubPopupTimer);
      window.__cravehubPopupTimer = window.setTimeout(() => setPopup(null), 3200);
    };
    window.addEventListener("cravehub:popup", handler);
    return () => window.removeEventListener("cravehub:popup", handler);
  }, []);
  if (!popup) return null;
  return <div className={`ch-popup ${popup.type}`} role="status">
    <div className="popup-mark">{popup.type === "error" ? "!" : popup.type === "info" ? "i" : "✓"}</div>
    <div><strong>{popup.type === "error" ? "Something needs attention" : popup.type === "info" ? "CraveHub" : "Craving confirmed"}</strong><p>{popup.message}</p></div>
    <button onClick={() => setPopup(null)} aria-label="Close">×</button>
  </div>;
}


function Navbar({ user, setUser }) {
  const nav = useNavigate();
  function logout() {
    if (!window.confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    nav("/login");
  }
  return (
    <nav className="navbar navbar-expand-lg ch-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand ch-brand" to="/">
          <span className="brand-dot" />CraveHub
        </Link>
        <div className="navbar-nav ms-auto align-items-center">
          <Link className="nav-link" to="/">Home</Link>
          {user && <>
            <Link className="nav-link" to="/cart">Cart</Link>
            <Link className="nav-link" to="/orders">Orders</Link>
            <Link className="nav-link" to="/profile">Profile</Link>
          </>}
          {user?.email === "admin@foodie.com" && <Link className="nav-link" to="/admin">Admin</Link>}
          {!user ? <>
            <Link className="nav-link" to="/login">Login</Link>
            <Link className="nav-link register-nav" to="/register">Register</Link>
          </> : <button className="btn btn-sm logout-btn ms-2" onClick={logout}>Logout</button>}
        </div>
      </div>
    </nav>
  );
}

function Home({ user }) {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [captionIndex, setCaptionIndex] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    loadFoods();
    const timer = setInterval(() => setCaptionIndex(i => (i + 1) % captions.length), 2800);
    return () => clearInterval(timer);
  }, []);

  async function loadFoods() {
    try { setFoods((await api.get("/foods")).data); }
    catch (err) { console.log(err); }
  }

  function addToCart(food) {
    if (!user) { notify("Please login first"); nav("/login"); return; }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(item => item._id === food._id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...food, quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    notify(`${food.name} joined your cravings.`);
  }

  const categories = ["All", ...new Set(foods.map(f => f.category).filter(Boolean))];
  const filteredFoods = foods.filter(food =>
    food.name?.toLowerCase().includes(search.toLowerCase()) &&
    (category === "All" || food.category === category)
  );

  return (
    <div className="page-bg">
      <section className="hero-section">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" /><div className="hero-orb orb-three" />
        <div className="container hero-content">
          <div className="hero-copy">
            <div className="eyebrow">WELCOME TO CRAVEHUB</div>
            <h1>Food that makes<span> your mood.</span></h1>
            <p className="hero-caption" key={captionIndex}>{captions[captionIndex]}</p>
            <div className="hero-actions">
              <a href="#menu" className="btn hero-btn">Explore Menu</a>
              {!user && <Link to="/register" className="btn hero-outline-btn">Join CraveHub</Link>}
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-food food-a">🍕</div>
            <div className="floating-food food-b">🍔</div>
            <div className="floating-food food-c">🍟</div>
            <div className="hero-food-card">
              <div className="hero-food-emoji">🍜</div>
              <h4>Something delicious</h4><p>is waiting for you.</p>
              <div className="mini-stars">✦ ✦ ✦</div>
            </div>
          </div>
        </div>
      </section>

      <main className="container py-5" id="menu">
        <div className="section-heading text-center">
          <span>EXPLORE</span><h2>Discover Your Cravings</h2>
          <p>Pick your favourite and let the good food begin.</p>
        </div>
        <div className="search-panel">
          <div className="search-wrap"><span>⌕</span>
            <input placeholder="Search pizza, burger, biryani..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="category-row">
            {categories.map(cat => <button key={cat} className={`category-pill ${category === cat ? "active" : ""}`} onClick={() => setCategory(cat)}>{cat}</button>)}
          </div>
        </div>

        <div className="row g-4 mt-2">
          {filteredFoods.length === 0 ? (
            <div className="empty-box"><div className="empty-emoji">🍽️</div><h4>No food items found</h4><p>Try another search or ask the admin to add food.</p></div>
          ) : filteredFoods.map((food, index) => (
            <div className="col-sm-6 col-lg-4 col-xl-3" key={food._id}>
              <div className={`food-card delay-${index % 4}`}>
                <div className="food-image-wrap">
                  {food.image ? <img src={food.image} alt={food.name} /> : <div className="food-placeholder">🍔</div>}
                  <span className="food-category">{food.category || "Food"}</span>
                </div>
                <div className="food-card-body">
                  <h5>{food.name}</h5>
                  <p>{food.description || "Delicious food made for your cravings."}</p>
                  <div className="food-bottom"><strong>₹{food.price}</strong><button onClick={() => addToCart(food)}>+ Add</button></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Auth({ type, setUser }) {
  const nav = useNavigate();
  const isRegister = type === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function submit(e) {
    e.preventDefault();
    try {
      if (isRegister) {
        await api.post("/auth/register", form);
        notify("Your CraveHub account is ready. Welcome to the table.");
        nav("/login");
        return;
      }
      const res = await api.post("/auth/login", { email: form.email, password: form.password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      notify("Welcome back. Your cravings are ready.");
      nav("/");
    } catch (err) {
      notify(err.response?.data?.message || "Something went wrong");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-blob blob-a" /><div className="auth-blob blob-b" />
      <div className="auth-card">
        <div className="auth-brand">CraveHub</div>
        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p>{isRegister ? "Your delicious journey begins here." : "Your next delicious meal is waiting."}</p>
        <form onSubmit={submit}>
          {isRegister && <div className="input-group-modern"><label>Name</label><input name="name" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Enter your name" required /></div>}
          <div className="input-group-modern"><label>Email</label><input type="email" name="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="Enter your email" required /></div>
          <div className="input-group-modern"><label>Password</label><input type="password" name="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="Enter your password" required /></div>
          <button className="auth-btn">{isRegister ? "Create Account" : "Login"}</button>
        </form>
        <div className="auth-switch">{isRegister ? <>Already have an account? <Link to="/login">Login</Link></> : <>Don't have an account? <Link to="/register">Register</Link></>}</div>
      </div>
    </div>
  );
}

function Cart() {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem("cart") || "[]"));
  const [address, setAddress] = useState("");
  const nav = useNavigate();

  function saveCart(c) { setCart(c); localStorage.setItem("cart", JSON.stringify(c)); }
  function increase(id) { saveCart(cart.map(i => i._id === id ? {...i,quantity:i.quantity+1} : i)); }
  function decrease(id) { saveCart(cart.map(i => i._id === id ? {...i,quantity:i.quantity-1} : i).filter(i => i.quantity > 0)); }
  function remove(id) { saveCart(cart.filter(i => i._id !== id)); }
  const total = cart.reduce((s,i) => s + Number(i.price)*i.quantity, 0);

  async function placeOrder() {
    if (!cart.length) return notify("Your cart is empty");
    if (!address.trim()) return notify("Please enter delivery address");
    try {
      await api.post("/orders", { items: cart.map(i => ({food:i._id,name:i.name,price:i.price,quantity:i.quantity})), totalAmount:total, address });
      localStorage.removeItem("cart"); setCart([]); notify("Order placed successfully!"); nav("/orders");
    } catch (err) { notify(err.response?.data?.message || "Failed to place order"); }
  }

  return <div className="page-bg"><div className="container py-5">
    <div className="section-heading"><span>YOUR ORDER</span><h2>🛒 Your Cart</h2></div>
    {!cart.length ? <div className="empty-box"><div className="empty-emoji">🛒</div><h4>Your cart is empty</h4><Link to="/" className="btn hero-btn mt-2">Browse Food</Link></div> :
      <>
        {cart.map(item => <div className="cart-card" key={item._id}>
          <div><h5>{item.name}</h5><p>₹{item.price} each</p></div>
          <div className="qty-controls"><button onClick={() => decrease(item._id)}>−</button><strong>{item.quantity}</strong><button onClick={() => increase(item._id)}>+</button></div>
          <strong className="cart-price">₹{Number(item.price)*item.quantity}</strong>
          <button className="remove-btn" onClick={() => remove(item._id)}>Remove</button>
        </div>)}
        <div className="checkout-card"><div className="total-row"><span>Total</span><strong>₹{total}</strong></div>
          <label>Delivery Address</label><textarea rows="3" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Enter your delivery address" />
          <button className="checkout-btn" onClick={placeOrder}>Place Order 🎉</button>
        </div>
      </>
    }
  </div></div>;
}

function Orders() {
  const [orders,setOrders]=useState([]), [loading,setLoading]=useState(true);
  useEffect(()=>{loadOrders()},[]);
  async function loadOrders(){try{setLoading(true);setOrders((await api.get("/orders/my")).data)}catch(err){notify(err.response?.data?.message||"Failed to load order history")}finally{setLoading(false)}}
  function statusClass(s){return s==="Delivered"?"status delivered":s==="Cancelled"?"status cancelled":s==="Preparing"?"status preparing":s==="Out for Delivery"?"status delivery":"status pending"}
  return <div className="page-bg"><div className="container py-5">
    <div className="section-heading d-flex justify-content-between align-items-end flex-wrap gap-3"><div><span>YOUR JOURNEY</span><h2>📦 Order History</h2><p>Every delicious order in one place.</p></div><button className="refresh-btn" onClick={loadOrders}>↻ Refresh</button></div>
    {loading&&<div className="empty-box"><div className="spinner-border text-warning"/><p className="mt-3">Loading your cravings...</p></div>}
    {!loading&&!orders.length&&<div className="empty-box"><div className="empty-emoji">🍽️</div><h4>No orders yet</h4><p>Your next delicious meal is waiting.</p><Link to="/" className="btn hero-btn">Browse Food</Link></div>}
    {!loading&&orders.map((o,i)=><div className="order-card" key={o._id}><div className="order-top"><div><small>ORDER {i+1}</small><h5>#{o._id.slice(-6)}</h5></div><span className={statusClass(o.status)}>{o.status||"Pending"}</span><strong>₹{o.totalAmount}</strong></div>
      <div className="order-items">{o.items?.map((item,j)=><div className="order-item" key={j}><span>{item.name} × {item.quantity}</span><strong>₹{Number(item.price)*Number(item.quantity)}</strong></div>)}</div>
      <div className="order-address"><small>DELIVERY ADDRESS</small><p>{o.address||"Address not available"}</p></div>
    </div>)}
  </div></div>
}

function Profile() {
  const [form,setForm]=useState({name:"",email:""});
  useEffect(()=>{(async()=>{try{const r=await api.get("/users/profile");setForm({name:r.data.name||"",email:r.data.email||""})}catch(e){console.log(e)}})()},[]);
  async function update(e){e.preventDefault();try{await api.put("/users/profile",{name:form.name});notify("Profile updated. Your CraveHub space is fresh.")}catch(err){notify(err.response?.data?.message||"Failed to update profile")}}
  return <div className="auth-page"><div className="auth-card profile-card"><div className="auth-brand">CraveHub</div><h1>My Profile</h1><p>Keep your account details fresh.</p><form onSubmit={update}>
    <div className="input-group-modern"><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
    <div className="input-group-modern"><label>Email</label><input value={form.email} disabled/></div>
    <button className="auth-btn">Update Profile</button>
  </form></div></div>
}

function Admin() {
  const [foods,setFoods]=useState([]),[orders,setOrders]=useState([]),[users,setUsers]=useState([]);
  const [form,setForm]=useState({name:"",description:"",price:"",category:"",image:""});
  useEffect(()=>{loadData()},[]);
  async function loadData(){try{const [f,o,u]=await Promise.all([api.get("/foods"),api.get("/orders"),api.get("/users")]);setFoods(f.data);setOrders(o.data);setUsers(u.data)}catch(err){notify(err.response?.data?.message||"Failed to load admin data")}}
  async function addFood(e){e.preventDefault();try{await api.post("/foods",{...form,price:Number(form.price)});setForm({name:"",description:"",price:"",category:"",image:""});await loadData();notify("New food added to the CraveHub menu.")}catch(err){notify(err.response?.data?.message||"Failed to add food")}}
  async function editFood(food){const name=prompt("Food name:",food.name);if(name===null)return;const category=prompt("Category:",food.category||"");if(category===null)return;const price=prompt("Price:",food.price);if(price===null)return;const description=prompt("Description:",food.description||"");if(description===null)return;const image=prompt("Image URL:",food.image||"");if(image===null)return;try{await api.put(`/foods/${food._id}`,{name,category,price:Number(price),description,image});await loadData();notify("Food details updated successfully.")}catch(err){notify(err.response?.data?.message||"Failed to update food")}}
  async function deleteFood(id){if(!confirm("Delete this food?"))return;try{await api.delete(`/foods/${id}`);await loadData()}catch(err){notify(err.response?.data?.message||"Failed to delete food")}}
  async function updateOrder(id,status){try{await api.put(`/orders/${id}/status`,{status});await loadData()}catch(err){notify(err.response?.data?.message||"Failed to update order")}}
  return <div className="page-bg"><div className="container py-5">
    <div className="section-heading"><span>CRAVEHUB CONTROL CENTER</span><h2>⚙️ Admin Dashboard</h2><p>Manage your menu, orders and users.</p></div>
    <div className="stats-grid"><div className="stat-card orange"><span>🍔</span><small>FOODS</small><strong>{foods.length}</strong></div><div className="stat-card purple"><span>📦</span><small>ORDERS</small><strong>{orders.length}</strong></div><div className="stat-card pink"><span>👥</span><small>USERS</small><strong>{users.length}</strong></div></div>
    <div className="admin-card"><h4>Add New Food</h4><form onSubmit={addFood} className="row g-3 mt-1">
      <div className="col-md-6"><input className="form-control modern-control" placeholder="Food name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
      <div className="col-md-6"><input className="form-control modern-control" placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} required/></div>
      <div className="col-md-6"><input className="form-control modern-control" type="number" placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></div>
      <div className="col-md-6"><input className="form-control modern-control" placeholder="Image URL" value={form.image} onChange={e=>setForm({...form,image:e.target.value})}/></div>
      <div className="col-12"><textarea className="form-control modern-control" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
      <div className="col-12"><button className="auth-btn admin-add-btn">+ Add Food</button></div>
    </form></div>
    <div className="admin-card"><h4>🍔 Food Menu</h4><div className="table-responsive"><table className="table admin-table mt-3"><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Action</th></tr></thead><tbody>{foods.map(f=><tr key={f._id}><td>{f.name}</td><td>{f.category}</td><td>₹{f.price}</td><td><button className="btn btn-sm btn-primary me-2" onClick={()=>editFood(f)}>Edit</button><button className="btn btn-sm btn-danger" onClick={()=>deleteFood(f._id)}>Delete</button></td></tr>)}{!foods.length&&<tr><td colSpan="4" className="text-center">No food items</td></tr>}</tbody></table></div></div>
    <div className="admin-card"><h4>📦 Manage Orders</h4><div className="table-responsive"><table className="table admin-table mt-3"><thead><tr><th>Order</th><th>Total</th><th>Address</th><th>Status</th></tr></thead><tbody>{orders.map(o=><tr key={o._id}><td>#{o._id.slice(-6)}</td><td>₹{o.totalAmount}</td><td>{o.address}</td><td><select className="form-select" value={o.status||"Pending"} onChange={e=>updateOrder(o._id,e.target.value)}><option>Pending</option><option>Preparing</option><option>Out for Delivery</option><option>Delivered</option><option>Cancelled</option></select></td></tr>)}{!orders.length&&<tr><td colSpan="4" className="text-center">No orders</td></tr>}</tbody></table></div></div>
    <div className="admin-card"><h4>👥 Registered Users</h4><div className="table-responsive"><table className="table admin-table mt-3"><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Role</th></tr></thead><tbody>{users.map((u,i)=><tr key={u._id}><td>{i+1}</td><td>{u.name||"-"}</td><td>{u.email||"-"}</td><td>{u.phone||"-"}</td><td>{u.address||"-"}</td><td><span className={`role-badge ${u.role==="admin"?"admin":""}`}>{u.role||"user"}</span></td></tr>)}{!users.length&&<tr><td colSpan="6" className="text-center">No users</td></tr>}</tbody></table></div></div>
  </div></div>
}

function App() {
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("user"))}catch{return null}});
  return <><Navbar user={user} setUser={setUser}/><PopupHost/><Routes>
    <Route path="/" element={<Home user={user}/>}/>
    <Route path="/login" element={<Auth type="login" setUser={setUser}/>}/>
    <Route path="/register" element={<Auth type="register" setUser={setUser}/>}/>
    <Route path="/cart" element={<Cart/>}/>
    <Route path="/orders" element={<Orders/>}/>
    <Route path="/profile" element={<Profile/>}/>
    <Route path="/admin" element={<Admin/>}/>
  </Routes></>;
}
export default App;
