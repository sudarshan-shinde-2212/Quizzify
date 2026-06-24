"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./auth-context";
import {
  BookOpen, LayoutDashboard, FileQuestion, Users,
  LogOut, Trophy, Menu, X, ChevronDown
} from 'lucide-react';
import { QuizzifyLogo } from "./QuizzifyLogo";
import { LogoutConfirmationModal } from "./logout-confirmation-modal";

const sidebarLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Quizzes", href: "/admin/quizzes", icon: BookOpen },
  { label: "Questions", href: "/admin/questions", icon: FileQuestion },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Leaderboard", href: "/admin/leaderboard", icon: Trophy },
];

export function AdminSidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 400));
    logout();
    router.push("/");
    setLoggingOut(false);
    setShowLogoutModal(false);
    setShowProfileDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <QuizzifyLogo size={22} color="black" />
            <span className="font-semibold text-base tracking-tight">Quizzify</span>
            <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded-full ml-1">Admin</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-1 text-gray-500 hover:text-black">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {sidebarLinks.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <button
                key={href}
                onClick={() => {
                  router.push(href);
                  if (onClose) onClose();
                }}
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

        {/* User + Logout */}
        <div className="border-t border-gray-100 p-3" ref={dropdownRef}>
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1 relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.fullName || user?.name || "User"} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                  {(user?.fullName || user?.name || "A")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.fullName || user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showProfileDropdown ? "rotate-180" : ""}`} />
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10">
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={loggingOut}
      />
    </>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40 md:hidden">
        <div className="flex items-center gap-2">
          <QuizzifyLogo size={22} color="black" />
          <span className="font-semibold text-base tracking-tight">Quizzify</span>
          <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded-full ml-1">Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1 text-gray-500 hover:text-black"
        >
          <Menu size={20} />
        </button>
      </header>

      <AdminSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="md:ml-56 min-h-screen pt-14 md:pt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">{children}</div>
      </main>
    </div>
  );
}
