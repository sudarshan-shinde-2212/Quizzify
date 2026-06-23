"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./auth-context";
import { apiGetSettings } from "./api";
import { BookOpen, Menu, X, LogOut, ChevronDown, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LogoutConfirmationModal } from "./logout-confirmation-modal";

const navLinks = [
  { label: "Quiz", href: "/dashboard" },
  { label: "History", href: "/history" },
  { label: "Leaderboard", href: "/leaderboard" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [platformName, setPlatformName] = useState("Quizzify");

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    apiGetSettings()
      .then((s) => { if (s?.platformName) setPlatformName(s.platformName); })
      .catch(() => {});
  }, []);

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 400));
    logout();
    router.push("/");
    setLoggingOut(false);
    setShowLogoutModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
              <BookOpen size={18} className="text-black" />
              <span className="font-semibold text-base tracking-tight">{platformName}</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      active ? "bg-black text-white" : "text-gray-600 hover:text-black hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user?.fullName || user?.name || "User"}
                      className="w-7 h-7 rounded-full bg-gray-100 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                      {(user?.fullName || user?.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-800">{user?.fullName || user?.name}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50"
                    >
                      <div className="px-3 py-2 border-b border-gray-50">
                        <p className="text-xs font-medium text-black">{user?.fullName || user?.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          router.push("/profile");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <User size={13} />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={13} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-1.5" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => { router.push(link.href); setMobileOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      pathname === link.href ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                  <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 px-3 py-2">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user?.fullName || user?.name || "User"} className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {(user?.fullName || user?.name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{user?.fullName || user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-800 flex items-center gap-2"
                  >
                    <User size={13} />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 flex items-center gap-2"
                  >
                    <LogOut size={13} />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

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
