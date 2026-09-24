function Navbar({ user, setUser }) {
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function logout() {
    if (!window.confirm("Are you sure you want to logout?")) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setMobileOpen(false);
    nav("/login");
  }

  return (
    <nav className="navbar navbar-expand-lg ch-navbar sticky-top">
      <div className="container">

        <Link
          className="navbar-brand ch-brand"
          to="/"
          onClick={() => setMobileOpen(false)}
        >
          <span className="brand-dot" />
          CraveHub
        </Link>

        <button
          className="mobile-nav-toggle"
          type="button"
          onClick={() => setMobileOpen(v => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div
          className={`navbar-nav ms-auto align-items-center ${
            mobileOpen ? "mobile-open" : ""
          }`}
        >

          <Link
            className="nav-link"
            to="/"
            onClick={() => setMobileOpen(false)}
          >
            Home
          </Link>

          {user && (
            <>
              <Link
                className="nav-link"
                to="/cart"
                onClick={() => setMobileOpen(false)}
              >
                Cart
              </Link>

              <Link
                className="nav-link"
                to="/orders"
                onClick={() => setMobileOpen(false)}
              >
                Orders
              </Link>

              <Link
                className="nav-link"
                to="/profile"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>
            </>
          )}

          {/* ADMIN LINK - FIXED */}
          {user?.role === "admin" && (
            <Link
              className="nav-link admin-nav"
              to="/admin"
              onClick={() => setMobileOpen(false)}
            >
              Admin
            </Link>
          )}

          {!user ? (
            <>
              <Link
                className="nav-link"
                to="/login"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>

              <Link
                className="nav-link register-nav"
                to="/register"
                onClick={() => setMobileOpen(false)}
              >
                Register
              </Link>
            </>
          ) : (
            <button
              className="btn btn-sm logout-btn ms-2"
              onClick={logout}
            >
              Logout
            </button>
          )}

        </div>
      </div>
    </nav>
  );
}