"use client"

import { ProductCard } from "./product-card"

interface ProductsGridProps {
  products: any[] 
  onAddToCart: (product: any) => void // <-- UPDATED to receive the product
}

export function ProductsGrid({ products = [], onAddToCart }: ProductsGridProps) {
  return (
    <section id="products" className="border-b border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <p className="mb-2 font-mono text-xs tracking-[0.3em] text-primary uppercase">
            {"// CATALOG"}
          </p>
          <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            PRODUCTS
          </h2>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard
                key={product._id} 
                title={product.name} 
                 price={
                <span className="flex items-center gap-1">
                <span className="text-sm mt-[3px]">₹</span>
                <span className="text-lg font-bold">{product.price}</span>
                </span>
                }
                image={product.imageUrl} 
                sku={`HSN-${product.hsnCode}`} 
                onOrder={() => onAddToCart(product)} // <-- UPDATED to pass the product
              />
            ))
          ) : (
            <div className="col-span-full py-10 text-center border border-dashed border-red-900/50">
              <p className="font-mono text-red-500 animate-pulse">// SYSTEM_LOADING_DATA...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}