import { useNavigate, useLocation } from "react-router";
import { useAuth } from "./auth-context";
import {
  BookOpen, LayoutDashboard, FileQuestion, Users, BarChart3,
  Settings, LogOut, ListChecks, Trophy
} from "lucide-react";

const sidebarLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Quizzes", href: "/admin/quizzes", icon: BookOpen },
  { label: "Questions", href: "/admin/questions", icon: FileQuestion },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Results", href: "/admin/results", icon: Trophy },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-100 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-14 border-b border-gray-100">
        <BookOpen size={18} className="text-black" />
        <span className="font-semibold text-base tracking-tight">Quizzify</span>
        <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded-full ml-1">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {sidebarLinks.map(({ label, href, icon: Icon }) => {
          const active = location.pathname === href;
          return (
            <button
              key={href}
              onClick={() => navigate(href)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50 hover:text-black"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
          {user?.avatar ? (
            <img src={user.avatar} alt={user?.fullName || user?.name || "User"} className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
              {(user?.fullName || user?.name || "A")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{user?.fullName || user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-56 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
