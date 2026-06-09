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
      className="relative flex flex-col overflow-hidden rounded-2xl"
      style={{ border: '1px solid #1E2E21', background: '#111A14' }}
    >
      <div className="relative aspect-square w-full overflow-hidden" style={{ background: '#162119' }}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
        )}
        
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="absolute left-2 top-2 z-10 flex size-8 items-center justify-center rounded-full backdrop-blur-md transition-colors"
            style={{ background: '#0C0F0AB0', color: '#7A9B82', border: '1px solid #1E2E21' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
        )}

        {quantity > 0 && (
          <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-black shadow-lg" style={{ background: '#00805A', color: '#F4F6F3' }}>
            {quantity}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-pretty text-sm font-bold leading-tight" style={{ color: '#F4F6F3' }}>{product.name}</h3>
        <p className="mt-1 text-base font-black font-money" style={{ color: '#F59E0B' }}>{formatted}</p>
      </div>

      <div className="p-3 pt-0">
        {quantity === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-black transition-all active:scale-95"
            style={{ background: '#00805A', color: '#F4F6F3', boxShadow: '0 2px 12px #00805A25' }}
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Adicionar
          </button>
        ) : (
          <div className="flex h-11 w-full items-center justify-between rounded-xl" style={{ background: '#162119', border: '1px solid #1E2E21' }}>
            <button
              type="button"
              onClick={onRemove}
              className="flex h-full w-11 items-center justify-center rounded-l-xl transition-colors active:bg-zinc-900"
              style={{ color: '#00805A' }}
            >
              <Minus className="size-4" strokeWidth={2.5} />
            </button>
            <span className="text-base font-black" style={{ color: '#F4F6F3' }}>{quantity}</span>
            <button
              type="button"
              onClick={onAdd}
              className="flex h-full w-11 items-center justify-center rounded-r-xl transition-colors active:bg-zinc-900"
              style={{ color: '#00805A' }}
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
