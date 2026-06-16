"use client"

import { ArrowRight, MessageCircle } from "lucide-react"
import { formatReceiptText } from "@/lib/whatsapp"

type CheckoutBarProps = {
  total: number
  itemCount: number
  onCharge: () => void
  order?: any
}

export function CheckoutBar({ total, itemCount, onCharge, order }: CheckoutBarProps) {
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

        <div className="ml-auto flex flex-1 items-center gap-2">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95 hover:brightness-110"
              style={{ background: "#25D366", color: "#FFF", boxShadow: "0 4px 14px #25D36640" }}
              title="Enviar Comanda via WhatsApp"
            >
              <MessageCircle className="size-6" />
            </a>
          )}
          <button
            type="button"
            onClick={onCharge}
            disabled={itemCount === 0}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-base font-black transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
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
    </div>
  )
}
