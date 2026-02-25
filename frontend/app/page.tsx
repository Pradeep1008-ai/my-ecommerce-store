"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProductsGrid } from "@/components/products-grid"
import { ConsultationForm } from "@/components/consultation-form"
import { Footer } from "@/components/footer"
import { CheckoutModal } from "@/components/checkout-modal" 
import { AuthModal } from "@/components/auth-modal" 

export default function Home() {
  const [cartItems, setCartItems] = useState<any[]>([]) 
  const [products, setProducts] = useState([]) 
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false) 

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Error fetching products:", err))
  }, [])

  const handleAddToCart = (product: any) => {
    setCartItems((prev) => [...prev, product])
  }

  return (
    <main className="min-h-screen bg-background relative">
      <Navbar cartCount={cartItems.length} />
      
      {/* LOGIN BUTTON - Navbar kinda clear ga kanipinchadaniki top-24 pettam */}
      <div className="fixed top-24 right-8 z-40">
        <button 
          onClick={() => setIsAuthOpen(true)}
          className="bg-black border border-gray-700 hover:border-red-500 text-white px-4 py-2 font-mono text-sm tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(255,0,0,0.2)]"
        >
          ACCOUNT_LOGIN
        </button>
      </div>

      {/* Floating Checkout Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-8 right-8 z-40">
          <button 
            onClick={() => setIsCheckoutOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 font-mono text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(255,0,0,0.5)] border border-red-400 transition-all flex items-center gap-2"
          >
            Checkout ({cartItems.length})
          </button>
        </div>
      )}

      <HeroSection />
      <ProductsGrid products={products} onAddToCart={handleAddToCart} />
      <ConsultationForm />
      <Footer />

      {/* Modals */}
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        cartItems={cartItems} 
      />
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </main>
  )
}