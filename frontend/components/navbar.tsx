"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingCart, LogOut, User as UserIcon } from "lucide-react"
import Image from "next/image"

export function Navbar({ cartCount = 0 }: { cartCount?: number }) {
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/"
  }

  return (
    <>
      {/* TOP CONTACT BAR */}
      <div className="w-full bg-red-600 text-white text-xs font-semibold tracking-wide">
        <div className="mx-auto max-w-7xl px-6 py-1 flex flex-col md:flex-row justify-between items-center">
          <span>
            Address: Shop.UGF47, Central Mall, Opp: Central Bus Stand, MSK Mill
            Road, Kalaburagi
          </span>
          <span className="font-bold">Call Us: 8123378092</span>
        </div>
      </div>

      {/* MAIN NAVBAR */}
      <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 font-mono text-sm">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Solux Solar"
                width={140}
                height={40}
                priority
                className="h-8 w-auto object-contain"
              />
            </Link>

            <div className="hidden md:flex gap-6 text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">
                HOME
              </Link>
              <Link
                href="/#products"
                className="hover:text-white transition-colors"
              >
                PRODUCTS
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {mounted && user ? (
              <div className="flex items-center gap-4 border-r border-gray-800 pr-6">
                {/* --- NEW: USERNAME DISPLAY --- */}
                <span className="hidden md:inline text-red-500 text-xs font-bold tracking-widest uppercase mr-4">
                  // {user.name}
                </span>

                {user.role === "admin" ? (
                  <Link
                    href="/admin"
                    className="text-white hover:text-red-400 font-bold tracking-widest transition-colors"
                  >
                    ADMIN_PANEL
                  </Link>
                ) : (
                  <Link
                    href="/my-orders"
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest"
                  >
                    <UserIcon size={16} /> My_Orders
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-500 transition-colors ml-2"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <span className="hidden md:inline text-gray-600 text-xs tracking-widest border-r border-gray-800 pr-6">
                // GUEST_MODE
              </span>
            )}

            <div className="relative flex items-center text-white">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}