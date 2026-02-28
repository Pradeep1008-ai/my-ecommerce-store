"use client"

import { useState } from "react"

export function ConsultationForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "", // Changed from message to address
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

    try {
      const response = await fetch(`${API_URL}/api/consult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true)
        // Resetting address instead of message
        setForm({ name: "", email: "", phone: "", address: "" }) 
        setTimeout(() => setSubmitted(false), 3000)
      } else {
        alert("Transmission Failed: " + data.message)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("System Offline. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="consultation" className="bg-background py-20">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-12">
          <p className="mb-2 font-mono text-xs tracking-[0.3em] text-primary uppercase">
            {"// CONNECT"}
          </p>
          <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            REQUEST A SITE VISIT
          </h2>
          <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground">
            Provide your site address and our solar engineers will analyze your location.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Name
            </label>
            <input
              id="name" name="name" type="text" required
              value={form.name} onChange={handleChange}
              placeholder="Enter your full name"
              className="border-b border-primary/40 bg-transparent px-0 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Email
            </label>
            <input
              id="email" name="email" type="email" required
              value={form.email} onChange={handleChange}
              placeholder="your@email.com"
              className="border-b border-primary/40 bg-transparent px-0 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Phone Number
            </label>
            <input
              id="phone" name="phone" type="tel" required
              value={form.phone} onChange={handleChange}
              placeholder="+91 (123) 456-7890"
              className="border-b border-primary/40 bg-transparent px-0 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:outline-none"
            />
          </div>

          {/* Changed Message to Address */}
          <div className="flex flex-col gap-1">
            <label htmlFor="address" className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Site Address
            </label>
            <textarea
              id="address" name="address" required rows={4}
              value={form.address} onChange={handleChange}
              placeholder="Enter the complete physical address for the solar installation..."
              className="resize-none border-b border-primary/40 bg-transparent px-0 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit" disabled={loading || submitted}
            className="mt-4 w-full bg-primary px-8 py-4 font-mono text-sm font-bold tracking-widest text-primary-foreground uppercase transition-all hover:shadow-[0_0_30px_rgba(255,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "TRANSMITTING..." : submitted ? "REQUEST SENT" : "Submit Request"}
          </button>
        </form>
      </div>
    </section>
  )
}