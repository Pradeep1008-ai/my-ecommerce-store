"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchMyOrders = async () => {
      const storedUser = localStorage.getItem("user")
      if (!storedUser) {
        setIsLoading(false)
        return
      }

      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/my-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parsedUser.id }),
        })

        const data = await res.json()
        if (data.success) {
          setOrders(data.orders)
        }
      } catch (error) {
        console.error("Error fetching my orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyOrders()
  }, [])

  // Not logged in
  if (!isLoading && !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-mono text-gray-300">
        <h1 className="text-3xl text-red-500 mb-4 tracking-widest uppercase animate-pulse">
          ACCESS_DENIED
        </h1>
        <p className="mb-6">// PLEASE LOGIN TO VIEW YOUR ORDERS</p>
        <Link
          href="/"
          className="border border-gray-700 px-6 py-3 hover:border-red-500 hover:text-white transition-colors uppercase tracking-widest text-sm"
        >
          RETURN_TO_STORE
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8 font-mono text-gray-300">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
              My_Orders
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              // WELCOME BACK, {user?.name?.toUpperCase()}
            </p>
          </div>

          <Link
            href="/"
            className="border border-gray-700 px-4 py-2 text-sm hover:border-white transition-colors uppercase tracking-widest"
          >
            Back to Store
          </Link>
        </div>

        {/* LOADING */}
        {isLoading ? (
          <div className="py-20 text-center animate-pulse text-gray-500">
            LOADING_ORDER_HISTORY...
          </div>
        ) : orders.length === 0 ? (
          /* EMPTY */
          <div className="border border-gray-800 bg-[#0a0a0a] p-12 text-center shadow-[0_0_30px_rgba(255,255,255,0.02)]">
            <p className="text-gray-500 mb-4">
              You have not placed any orders yet.
            </p>
            <Link
              href="/"
              className="text-red-500 hover:text-red-400 underline underline-offset-4"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* ORDERS LIST */
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border border-gray-800 bg-[#0a0a0a] p-6 shadow-sm hover:border-gray-700 transition-colors"
              >
                {/* ORDER HEADER */}
                <div className="flex flex-col md:flex-row justify-between mb-4 border-b border-gray-800 pb-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">
                      Order_ID
                    </span>
                    <span className="font-bold text-white">
                      {order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 md:mt-0">
                    <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">
                      Date
                    </span>
                    <span>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-4 md:mt-0">
                    <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">
                      Status
                    </span>
                    <span className="bg-green-900/30 text-green-500 border border-green-900 px-2 py-1 text-xs uppercase">
                      {order.status}
                    </span>
                  </div>

                  {/* DOWNLOAD INVOICE BUTTON */}
                  <div className="mt-4 md:mt-0 flex items-center">
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order._id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-900/50 px-4 py-2 text-xs font-bold tracking-widest uppercase transition-colors"
                    >
                      Download_Invoice
                    </a>
                  </div>
                </div>

                {/* ITEMS */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        • {item.name}
                      </span>
                      <span>₹{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* TOTAL */}
                <div className="flex justify-between items-center border-t border-gray-800 pt-4 mt-4">
                  <span className="text-sm text-gray-500">
                    Includes GST: ₹{order.gstAmount.toFixed(2)}
                  </span>
                  <div className="text-lg font-bold text-white">
                    Total:{" "}
                    <span className="text-red-500">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}