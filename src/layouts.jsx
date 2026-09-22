import {
  BarChart3,
  Building2,
  CalendarDays,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Settings2,
  Trophy,
  UsersRound,
} from "lucide-react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { Footer, Navbar, ThemeToggle, cx } from "./components/ui";
import { useApp } from "./contexts/AppContext";

export function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

const userLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard?section=scores", label: "My scores", icon: Trophy },
  { to: "/dashboard?section=impact", label: "My impact", icon: HeartHandshake },
  {
    to: "/dashboard?section=profile",
    label: "Profile & settings",
    icon: Settings2,
  },
];
const adminLinks = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin?section=users", label: "Members", icon: UsersRound },
  {
    to: "/admin?section=subscriptions",
    label: "Subscriptions",
    icon: Settings2,
  },
  { to: "/admin?section=charities", label: "Charities", icon: Building2 },
  { to: "/admin?section=draws", label: "Draw studio", icon: CalendarDays },
  { to: "/admin?section=winners", label: "Winners", icon: Trophy },
  { to: "/admin?section=reports", label: "Reports", icon: BarChart3 },
];

export function Protected({ admin = false }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin")
    return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function AppShell({ admin = false, children }) {
  const { user, logout } = useApp();
  const links = admin ? adminLinks : userLinks;
  return (
    <div className="app-shell">
      <aside className="dashboard-sidebar">
        <NavLink className="brand" to="/">
          <span className="brand-mark">DH</span>
          <span>digital heroes</span>
        </NavLink>
        <div className="workspace-label">
          {admin ? "Admin workspace" : "Member space"}
        </div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={label} to={to} end={end}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{user?.avatar}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>{admin ? "Administrator" : "Member"}</small>
          </div>
          <button className="plain-icon" onClick={logout} aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <header className="dashboard-top">
        <NavLink className="brand" to="/">
          <span className="brand-mark">DH</span>
          <span>digital heroes</span>
        </NavLink>
        <span className="workspace-label">
          {admin ? "Admin workspace" : "Member space"}
        </span>
        <ThemeToggle />
      </header>
      <main className={cx("dashboard-main", admin && "admin-main")}>
        {children}
      </main>
      <nav className="mobile-app-nav">
        {links.slice(0, 5).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={label} to={to} end={end}>
            <Icon size={18} />
            <span>{label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
