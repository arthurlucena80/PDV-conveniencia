"use client"

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
      className="relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 flex-shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🛍️</div>
        )}
        
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="absolute left-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-gray-200 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
        )}

        {quantity > 0 && (
          <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-black shadow-md bg-orange-500 text-white border border-orange-400">
            {quantity}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 bg-white">
        <h3 className="text-sm font-bold leading-tight text-gray-800 line-clamp-2 min-h-[2.5rem] group-hover:text-orange-500 transition-colors">{product.name}</h3>
        <p className="mt-1 text-base font-black font-money text-orange-600">{formatted}</p>
      </div>

      <div className="p-3 pt-0 bg-white">
        {quantity === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-all active:scale-95 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Adicionar
          </button>
        ) : (
          <div className="flex h-10 w-full items-center justify-between rounded-xl bg-orange-50 border border-orange-200 overflow-hidden">
            <button
              type="button"
              onClick={onRemove}
              className="flex h-full w-10 items-center justify-center transition-colors hover:bg-orange-100 active:bg-orange-200 text-orange-600"
            >
              <Minus className="size-4" strokeWidth={2.5} />
            </button>
            <span className="text-base font-black text-orange-700">{quantity}</span>
            <button
              type="button"
              onClick={onAdd}
              className="flex h-full w-10 items-center justify-center transition-colors hover:bg-orange-100 active:bg-orange-200 text-orange-600"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
