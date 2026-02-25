"use client"

import Image from "next/image"

interface ProductCardProps {
  title: string
  price: string
  image: string
  sku: string
  onOrder: () => void
}

export function ProductCard({ title, price, image, sku, onOrder }: ProductCardProps) {
  return (
    <div className="group flex flex-col border border-border bg-card transition-colors hover:border-primary/50">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 bg-background/80 px-2 py-1 font-mono text-[10px] tracking-wider text-muted-foreground backdrop-blur-sm">
          {sku}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="mb-1 font-sans text-base font-semibold tracking-tight text-card-foreground">
            {title}
          </h3>
          <p className="font-mono text-lg font-bold text-primary">{price}</p>
        </div>
        <button
          onClick={onOrder}
          className="mt-auto w-full border border-primary bg-transparent px-4 py-3 font-mono text-xs font-bold tracking-widest text-primary uppercase transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_rgba(255,0,0,0.3)]"
        >
          Order Now
        </button>
      </div>
    </div>
  )
}
