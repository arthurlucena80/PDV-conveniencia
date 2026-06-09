"use client"

import { ArrowRight } from "lucide-react"

type CheckoutBarProps = {
  total: number
  itemCount: number
  onCharge: () => void
}

export function CheckoutBar({ total, itemCount, onCharge }: CheckoutBarProps) {
  const formatted = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  return (
    <div 
      className="fixed inset-x-0 bottom-0 z-20 backdrop-blur-md"
      style={{ borderTop: '1px solid #1E2E21', background: '#111A14F5' }}
    >
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex flex-col">
          <span className="text-xs font-medium" style={{ color: '#7A9B82' }}>
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </span>
          <span className="text-2xl font-black tracking-tight font-money" style={{ color: '#F4F6F3' }}>{formatted}</span>
        </div>

        <button
          type="button"
          onClick={onCharge}
          disabled={itemCount === 0}
          className="ml-auto flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-base font-black transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          style={{ 
            background: itemCount > 0 ? '#00805A' : '#1E2E21', 
            color: itemCount > 0 ? '#F4F6F3' : '#3d5e42',
            boxShadow: itemCount > 0 ? '0 4px 20px #00805A35' : 'none'
          }}
        >
          Cobrar
          <ArrowRight className="size-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
