"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Trash2, Plus, Image as ImageIcon } from "lucide-react"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("orders")
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const [isAuthorized, setIsAuthorized] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    hsnCode: "",
    imageUrl: "",
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      window.location.href = "/"
      return
    }

    const parsedUser = JSON.parse(storedUser)

    if (parsedUser.role !== "admin") {
      window.location.href = "/"
      return
    }

    setIsAuthorized(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch("http://localhost:5000/api/orders"),
        fetch("http://localhost:5000/api/products"),
      ])
      const ordersData = await ordersRes.json()
      const productsData = await productsRes.json()

      if (ordersData.success) setOrders(ordersData.orders)
      if (productsData) setProducts(productsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value })
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) {
      alert("Please select an image file first!")
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("image", imageFile)

      const uploadRes = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      })
      const uploadData = await uploadRes.json()

      if (!uploadData.success) throw new Error("Failed to upload image")

      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          imageUrl: uploadData.imageUrl,
        }),
      })
      const data = await res.json()

      if (data.success) {
        alert("Product added successfully!")
        setNewProduct({
          name: "",
          price: "",
          description: "",
          hsnCode: "",
          imageUrl: "",
        })
        setImageFile(null)
        fetchData()
      } else {
        alert("Error saving product.")
      }
    } catch (error) {
      console.error("Add error:", error)
      alert("Upload failed. Please check your backend connection.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return
    try {
      const res = await fetch(
        `http://localhost:5000/api/products/${id}`,
        { method: "DELETE" }
      )
      const data = await res.json()
      if (data.success) fetchData()
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      )
      const data = await res.json()
      if (data.success) fetchData()
    } catch (error) {
      console.error("Status update error:", error)
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-red-500 uppercase tracking-widest animate-pulse">
        VERIFYING_ADMIN_CREDENTIALS...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8 font-mono text-gray-300">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-red-900/30 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
              Admin_Dashboard
            </h1>
            <p className="mt-2 text-sm text-red-500">
              // SOLUX SOLAR COMMAND CENTER
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 text-sm tracking-widest uppercase transition-colors ${
                activeTab === "orders"
                  ? "bg-red-600 text-white"
                  : "border border-gray-700 hover:border-red-500"
              }`}
            >
              Order_History
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 text-sm tracking-widest uppercase transition-colors ${
                activeTab === "products"
                  ? "bg-red-600 text-white"
                  : "border border-gray-700 hover:border-red-500"
              }`}
            >
              Manage_Products
            </button>

            <Link
              href="/"
              className="ml-4 border-l border-gray-700 pl-4 text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              Exit
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center animate-pulse text-red-500">
            LOADING_SECURE_DATA...
          </div>
        ) : (
          <>
            {/* ================= ORDERS TAB ================= */}
            {activeTab === "orders" && (
              <div className="overflow-x-auto border border-gray-800 bg-[#0a0a0a] shadow-[0_0_30px_rgba(255,0,0,0.05)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-900 text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer Details</th>
                      <th className="px-6 py-4">GST Number</th>
                      <th className="px-6 py-4 text-right">Total Amount</th>
                      <th className="px-6 py-4 text-center">Order Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-white">
                          {order._id.slice(-6).toUpperCase()}
                        </td>

                        <td className="px-6 py-4 text-gray-300">
                          {order.customer.name}
                          <br />
                          <span className="text-xs text-gray-500">
                            {order.customer.phone}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-bold text-gray-400 uppercase">
                          {order.customer.gstNumber || "N/A"}
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-red-400">
                          ₹{order.totalAmount.toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <select
                            value={order.status || "Pending"}
                            onChange={(e) =>
                              updateOrderStatus(
                                order._id,
                                e.target.value
                              )
                            }
                            className={`bg-transparent border border-gray-700 text-xs font-bold tracking-widest uppercase py-1 px-2 outline-none transition-colors cursor-pointer ${
                              order.status === "Delivered"
                                ? "text-green-500"
                                : order.status === "Shipped"
                                ? "text-blue-500"
                                : "text-yellow-500"
                            }`}
                          >
                            <option
                              value="Pending"
                              className="bg-black text-yellow-500"
                            >
                              Pending
                            </option>
                            <option
                              value="Shipped"
                              className="bg-black text-blue-500"
                            >
                              Shipped
                            </option>
                            <option
                              value="Delivered"
                              className="bg-black text-green-500"
                            >
                              Delivered
                            </option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ================= PRODUCTS TAB ================= */}
            {activeTab === "products" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FORM */}
                <div className="lg:col-span-1 border border-red-900/30 bg-[#0a0a0a] p-6">
                  <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 border-b border-gray-800 pb-2 flex items-center gap-2">
                    <Plus size={18} className="text-red-500" /> Add_New_Product
                  </h2>

                  <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                    <input
                      name="name"
                      required
                      placeholder="Product Name"
                      value={newProduct.name}
                      onChange={handleInputChange}
                      className="border-b border-gray-700 bg-transparent px-0 py-2 text-sm text-white focus:border-red-500 outline-none"
                    />

                    <input
                      name="price"
                      type="number"
                      required
                      placeholder="Price (₹)"
                      value={newProduct.price}
                      onChange={handleInputChange}
                      className="border-b border-gray-700 bg-transparent px-0 py-2 text-sm text-white focus:border-red-500 outline-none"
                    />

                    <input
                      name="hsnCode"
                      required
                      placeholder="HSN/SAC Code"
                      value={newProduct.hsnCode}
                      onChange={handleInputChange}
                      className="border-b border-gray-700 bg-transparent px-0 py-2 text-sm text-white focus:border-red-500 outline-none"
                    />

                    <div className="border-b border-gray-700 py-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">
                        <ImageIcon size={16} className="text-red-500" />
                        {imageFile ? (
                          <span className="text-green-500 font-bold">
                            {imageFile.name}
                          </span>
                        ) : (
                          "Select Product Image (.jpg, .png)"
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setImageFile(e.target.files?.[0] || null)
                          }
                          className="hidden"
                        />
                      </label>
                    </div>

                    <textarea
                      name="description"
                      placeholder="Description..."
                      value={newProduct.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="border-b border-gray-700 bg-transparent px-0 py-2 text-sm text-white focus:border-red-500 outline-none resize-none"
                    />

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="mt-4 bg-red-600 px-4 py-3 text-sm font-bold tracking-widest text-white uppercase transition-all hover:bg-red-700 disabled:opacity-50"
                    >
                      {isProcessing ? "UPLOADING..." : "PUBLISH_PRODUCT"}
                    </button>
                  </form>
                </div>

                {/* LIST */}
                <div className="lg:col-span-2 border border-gray-800 bg-[#0a0a0a] p-6">
                  <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 border-b border-gray-800 pb-2">
                    Current_Catalog ({products.length})
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-600px overflow-y-auto pr-2">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center justify-between border border-gray-800 p-4 hover:border-gray-600 transition-colors bg-black"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover border border-gray-800"
                          />
                          <div>
                            <p className="font-bold text-white text-sm truncate w-32">
                              {product.name}
                            </p>
                            <p className="text-red-400 text-xs font-bold">
                              <span className="text-[9.5px]">₹</span>
                              {product.price}
                            </p>
                            <p className="text-gray-600 text-[10px]">
                              HSN: {product.hsnCode}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-gray-500 hover:text-red-500 transition-colors p-2"
                          title="Delete Product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}