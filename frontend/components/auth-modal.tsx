"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })

  if (!isOpen) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true) 

    const endpoint = isLogin ? '/api/login' : '/api/register'
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      // THE FIX: Check res.ok (HTTP 200) instead of data.success
      if (res.ok || data.success) {
        if (isLogin) {
          // Securely store the token and user data
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          
          onClose() // Close the modal
          window.location.reload() // Refresh to update navbar
        } else {
          alert("Account created successfully! Please log in.")
          setIsLogin(true) 
        }
      } else {
        // Provide a fallback error message if data.message is undefined
        alert("Error: " + (data.message || "Invalid credentials. Please try again."))
      }
    } catch (error) {
      console.error("Auth Error:", error)
      alert("Server Offline. Please try again later.")
    } finally {
      setIsLoading(false) 
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md border border-red-900/50 bg-[#0a0a0a] p-6 shadow-[0_0_30px_rgba(255,0,0,0.15)] md:p-8">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-red-500 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="mb-6 font-sans text-2xl font-bold tracking-tight text-foreground uppercase border-b border-red-900/30 pb-4">
          {isLogin ? "SYSTEM_LOGIN" : "REGISTER_USER"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input
              name="name"
              required
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              className="border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:outline-none"
            />
          )}
          
          <input
            name="email"
            type="email"
            required
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            className="border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:outline-none"
          />
          
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            className="border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:outline-none"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full bg-primary px-4 py-3 font-mono text-sm font-bold tracking-widest text-primary-foreground uppercase transition-all hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "AUTHENTICATING..." : (isLogin ? "ACCESS_ACCOUNT" : "CREATE_ACCOUNT")}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-800 pt-4 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
          >
            {isLogin ? "// Need an account? Register" : "// Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  )
}