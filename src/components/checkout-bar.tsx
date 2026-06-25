"use client"

import { ArrowRight, MessageCircle, ArrowLeft } from "lucide-react"
import { formatReceiptText } from "@/lib/whatsapp"

type CheckoutBarProps = {
  total: number
  itemCount: number
  onCharge: () => void
  onLeaveOpen?: () => void
  order?: any
}

export function CheckoutBar({ total, itemCount, onCharge, onLeaveOpen, order }: CheckoutBarProps) {
  const formatted = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  // Format link
  let waLink = ""
  if (order && itemCount > 0) {
    const text = encodeURIComponent(formatReceiptText(order))
    if (order.client?.phone) {
      let p = order.client.phone.replace(/\D/g, "")
      if (!p.startsWith("55") && (p.length === 10 || p.length === 11)) p = `55${p}`
      waLink = `https://wa.me/${p}?text=${text}`
    } else {
      waLink = `https://wa.me/?text=${text}`
    }
  }

  return (
    <div 
      className="fixed inset-x-0 bottom-0 z-20 bg-white/90 backdrop-blur-md border-t border-gray-200"
    >
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-500">
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </span>
          <span className="text-2xl font-black tracking-tight font-money text-gray-900">{formatted}</span>
        </div>

        <div className="ml-auto flex flex-1 items-center gap-2">
          {waLink && (
            <a
               href={waLink}
               target="_blank"
               rel="noopener noreferrer"
               className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95 hover:brightness-110 shadow-sm"
               style={{ background: "#25D366", color: "#FFF" }}
               title="Enviar Comanda via WhatsApp"
            >
               <MessageCircle className="size-6" />
            </a>
          )}
          {onLeaveOpen && (
            <button
              type="button"
              onClick={onLeaveOpen}
              className="flex h-14 px-4 shrink-0 items-center justify-center gap-2 rounded-2xl transition-all active:scale-95 hover:bg-gray-200 bg-gray-100 text-gray-700 border border-gray-200 shadow-sm font-bold text-sm"
              title="Voltar"
            >
              <ArrowLeft className="size-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCharge}
            disabled={itemCount === 0}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-base font-black transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 text-white"
            style={{ 
              background: itemCount > 0 ? '#F97316' : '#D1D5DB', 
              boxShadow: itemCount > 0 ? '0 4px 14px rgba(249, 115, 22, 0.4)' : 'none'
            }}
          >
            Cobrar
            <ArrowRight className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
