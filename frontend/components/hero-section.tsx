"use client"

export function HeroSection() {
  const scrollToConsult = () => {
    const el = document.getElementById("consultation")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden border-b border-border bg-background">
      {/* Grid pattern background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FF0000" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Scan line effect */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,0,0,0.01)_2px,rgba(255,0,0,0.01)_4px)]" />

      {/* Diagonal red accent line */}
      <div className="absolute -right-20 top-1/4 h-1px w-80 rotate-45 bg-primary/20" />
      <div className="absolute -left-20 bottom-1/3 h-1px w-80 -rotate-45 bg-primary/20" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p className="mb-4 font-mono text-xs tracking-[0.3em] text-primary uppercase">
          {"// CLEAN ENERGY EVOLUTION"}
        </p>
        <h1 className="mb-6 font-sans text-5xl font-bold leading-tight tracking-tight text-foreground md:text-7xl">
          <span className="text-balance">POWERING</span>
          <br />
          <span className="text-primary">YOUR</span>{" "}
          <span className="text-balance">FUTURE</span>
        </h1>
        <p className="mx-auto mb-10 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground">
          High-efficiency solar modules and smart energy systems engineered for
sustainable performance. Industrial-grade reliability meets next-gen
renewable innovation.
        </p>
        <button
          onClick={scrollToConsult}
          className="group relative inline-flex items-center gap-2 border-0 bg-primary px-8 py-4 font-mono text-sm font-bold tracking-widest text-primary-foreground uppercase transition-all hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]"
        >
          Consult
          <span className="inline-block transition-transform group-hover:translate-x-1">
            {"->"}
          </span>
        </button>
      </div>
    </section>
  )
}
