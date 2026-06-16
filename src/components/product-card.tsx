"use client"

import Image from "next/image"
import { Plus, Minus } from "lucide-react"

type ProductCardProps = {
  product: any
  quantity: number
  onAdd: () => void
  onRemove: () => void
  onEdit?: () => void
}

export function ProductCard({ product, quantity, onAdd, onRemove, onEdit }: ProductCardProps) {
  const formatted = Number(product.price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  return (
    <div 
      className="relative flex flex-col overflow-hidden rounded-2xl glass-panel card-hover transition-all duration-300 group"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/40">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-20 bg-gradient-to-br from-white/5 to-transparent">🛍️</div>
        )}
        
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="absolute left-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
        )}

        {quantity > 0 && (
          <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-black shadow-[0_0_15px_rgba(0,128,90,0.5)] bg-emerald-600 text-white border border-emerald-400/30">
            {quantity}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="text-pretty text-sm font-bold leading-tight text-zinc-100 group-hover:text-emerald-400 transition-colors">{product.name}</h3>
        <p className="mt-1 text-base font-black font-money text-amber-400">{formatted}</p>
      </div>

      <div className="p-3 pt-0 bg-black/80">
        {quantity === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-black transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_2px_15px_rgba(0,128,90,0.3)] hover:shadow-[0_4px_20px_rgba(0,128,90,0.5)] border border-emerald-400/20"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Adicionar
          </button>
        ) : (
          <div className="flex h-11 w-full items-center justify-between rounded-xl bg-zinc-900/80 border border-emerald-500/30 backdrop-blur-sm">
            <button
              type="button"
              onClick={onRemove}
              className="flex h-full w-11 items-center justify-center rounded-l-xl transition-colors hover:bg-white/5 active:bg-white/10 text-emerald-400"
            >
              <Minus className="size-4" strokeWidth={2.5} />
            </button>
            <span className="text-base font-black text-white">{quantity}</span>
            <button
              type="button"
              onClick={onAdd}
              className="flex h-full w-11 items-center justify-center rounded-r-xl transition-colors hover:bg-white/5 active:bg-white/10 text-emerald-400"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
