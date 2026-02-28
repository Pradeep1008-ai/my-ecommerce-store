"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cartItems: any[]
  onRemoveItem: (index: number) => void
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function CheckoutModal({ isOpen, onClose, cartItems, onRemoveItem }: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gstNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: ""
  })
  
  const [paymentMethod, setPaymentMethod] = useState("online") 
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  // Fixed API URL logic for local dev safety
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0)
  const gstAmount = subtotal * 0.18
  const total = subtotal + gstAmount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const saveOrderToDatabase = async (method: string) => {
    const orderData = {
        customer: formData, 
        // Added quantity to ensure the PDF generator works perfectly
        items: cartItems.map(item => ({ 
            name: item.name, 
            price: item.price, 
            quantity: item.quantity || 1, 
            hsnCode: item.hsnCode || 'N/A' 
        })),
        subtotal: subtotal,
        gstAmount: gstAmount,
        totalAmount: total,
        status: 'Pending',
        paymentMethod: method 
    }

    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        })

        const data = await response.json()

        if (data.success) {
            alert(`Order Confirmed! Your Order ID is: ${data.order._id || data.orderId}`)
            onClose() 
            window.location.href = '/my-orders' 
        } else {
            alert("Failed to place order: " + data.message)
        }
    } catch (error) {
        console.error("DB Save Error:", error)
        alert("Action successful, but failed to save order details. Contact support.")
    } finally {
        setIsProcessing(false)
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    if (paymentMethod === "cod") {
      await saveOrderToDatabase("Cash on Delivery")
      return
    }

    try {
      const res = await loadRazorpayScript()
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?")
        setIsProcessing(false)
        return
      }

      const orderRes = await fetch(`${API_URL}/api/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total })
      })
      const orderData = await orderRes.json()

      if (!orderData.success) {
        alert("Server error. Please try again.")
        setIsProcessing(false)
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SKKti4Zl37tCPj", 
        amount: orderData.order.amount,
        currency: "INR",
        name: "Solux Solar",
        description: "Energy Solutions Payment",
        order_id: orderData.order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch(`${API_URL}/api/razorpay/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
          })
          const verifyData = await verifyRes.json()

          if (verifyData.success) {
            saveOrderToDatabase("Online (Razorpay)") 
          } else {
            alert("Payment verification failed. Please contact support.")
            setIsProcessing(false)
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#dc2626" },
        modal: {
          ondismiss: function() {
            setIsProcessing(false)
          }
        }
      }

      const paymentObject = new (window as any).Razorpay(options)
      paymentObject.open()

    } catch (error) {
      console.error("Checkout Error:", error)
      alert("System Offline. Please try again.")
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4">
      <div className="relative w-full max-w-2xl border border-red-900/50 bg-[#0a0a0a] p-6 shadow-[0_0_30px_rgba(255,0,0,0.15)] md:p-8 my-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-red-500 transition-colors">
          <X size={24} />
        </button>

        <h2 className="mb-6 font-sans text-2xl font-bold tracking-tight text-foreground uppercase border-b border-red-900/30 pb-4">
          Secure_Checkout
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Left Column: Cart Summary */}
          <div>
            <h3 className="mb-4 font-mono text-xs tracking-[0.2em] text-primary uppercase">{"// Order Summary"}</h3>
            <div className="max-h-48 overflow-y-auto space-y-3 mb-4 pr-2">
              {cartItems.length === 0 ? (
                <p className="text-sm text-muted-foreground font-mono">Cart is empty.</p>
              ) : (
                cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-start text-sm font-mono border-b border-gray-800 pb-2">
                    
                    <span className="truncate pr-2 text-gray-300">
                      {item.name}
                      <span className="block text-xs text-gray-500 mt-1">
                        HSN: {item.hsnCode || 'N/A'}
                      </span>
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-red-500">
                        <span className="text-[75%] mr-1">₹</span>
                        {item.price.toFixed(2)}
                      </span>

                      {/* ✅ Remove button */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="text-gray-500 hover:text-red-500"
                        title="Remove item"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="space-y-2 border-t border-gray-800 pt-4 font-mono text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal:</span><span><span className="text-[75%] align-center mr-0.5">₹</span>{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>GST (18%):</span><span><span className="text-[75%] align-center mr-0.5">₹</span>{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-white text-lg mt-2 pt-2 border-t border-red-900/30">
                <span>Total:</span><span className="text-red-500"><span className="text-[75%] align-center mr-0.5">₹</span>{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Form & Payment Selection */}
          <form onSubmit={handleCheckout} className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
            
            {/* Contact Details */}
            <h3 className="mb-1 font-mono text-xs tracking-[0.2em] text-primary uppercase">{"// Billing Details"}</h3>
            <input name="name" required placeholder="Full Name" onChange={handleInputChange} className="border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
            <input name="email" type="email" required placeholder="Email Address" onChange={handleInputChange} className="border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
            <input name="phone" type="tel" required placeholder="Phone Number" onChange={handleInputChange} className="border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
            <input name="gstNumber" placeholder="GST Number (Optional)" onChange={handleInputChange} className="border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none uppercase" />

            {/* Shipping Details */}
            <h3 className="mb-1 mt-4 font-mono text-xs tracking-[0.2em] text-primary uppercase">{"// Shipping Address"}</h3>
            <input name="addressLine1" required placeholder="House/Plot No, Street" onChange={handleInputChange} className="border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
            <input name="addressLine2" placeholder="Apartment, Landmark (Optional)" onChange={handleInputChange} className="border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
            
            <div className="flex gap-4">
              <input name="city" required placeholder="City" onChange={handleInputChange} className="w-full border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
              <input name="state" required placeholder="State" onChange={handleInputChange} className="w-full border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
            </div>
            <input name="pincode" required placeholder="Pincode" onChange={handleInputChange} className="border-b border-primary/40 bg-transparent px-0 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />

            {/* Payment Selection Radio Buttons */}
            <div className="mt-4 flex flex-col gap-3 border border-gray-800 p-3 bg-black/50">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="payment" 
                  value="online" 
                  checked={paymentMethod === "online"} 
                  onChange={() => setPaymentMethod("online")}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <span className={`text-sm font-mono uppercase tracking-wider ${paymentMethod === 'online' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                  Online Payment (Cards/UPI)
                </span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="payment" 
                  value="cod" 
                  checked={paymentMethod === "cod"} 
                  onChange={() => setPaymentMethod("cod")}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <span className={`text-sm font-mono uppercase tracking-wider ${paymentMethod === 'cod' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                  Cash on Delivery (COD)
                </span>
              </label>
            </div>

            <button type="submit" disabled={isProcessing || cartItems.length === 0} className="mt-4 w-full bg-primary px-4 py-3 font-mono text-sm font-bold tracking-widest text-primary-foreground uppercase transition-all hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] disabled:opacity-50">
              {isProcessing ? "PROCESSING..." : "CONFIRM_ORDER"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}