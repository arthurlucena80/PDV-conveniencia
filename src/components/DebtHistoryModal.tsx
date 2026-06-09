"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState, useTransition } from "react";
import { getClientHistory } from "@/actions/client";
import { Loader2, ArrowUpRight, ArrowDownLeft, BookOpen } from "lucide-react";

interface DebtHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function DebtHistoryModal({ isOpen, onOpenChange, clientId, clientName }: DebtHistoryModalProps) {
  const [history, setHistory] = useState<{ orders: any[]; payments: any[] }>({ orders: [], payments: [] });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && clientId) {
      startTransition(async () => {
        const data = await getClientHistory(clientId);
        setHistory(data);
      });
    }
  }, [isOpen, clientId]);

  const items = [
    ...history.orders.map(o => ({
      id: o.id,
      date: new Date(o.created_at),
      type: "ORDER" as const,
      amount: o.total_amount,
      details: o.items.map((i: any) => `${i.quantity}x ${i.product?.name || 'Item'}`).join(", "),
    })),
    ...history.payments.map(p => ({
      id: p.id,
      date: new Date(p.created_at),
      type: "PAYMENT" as const,
      amount: p.amount,
      details: "Pagamento recebido",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalDebt = history.orders.reduce((s, o) => s + Number(o.total_amount), 0)
    - history.payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 overflow-hidden border-0 rounded-2xl max-w-md w-full flex flex-col"
        style={{ background: '#111A14', maxHeight: '82vh' }}
      >
        {/* Header — like a receipt top */}
        <div className="px-6 py-5 flex items-start justify-between" style={{ borderBottom: '2px dashed #1E2E21' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: '#162119', border: '1px solid #1E2E21' }}>
              <BookOpen className="size-5" style={{ color: '#00805A' }} />
            </div>
            <div>
              <DialogTitle className="text-base font-black" style={{ color: '#F4F6F3' }}>Extrato do Caderno</DialogTitle>
              <p className="text-xs font-bold mt-0.5" style={{ color: '#7A9B82' }}>{clientName}</p>
            </div>
          </div>
          {totalDebt !== 0 && (
            <div className="text-right">
              <p className="text-xs font-bold uppercase" style={{ color: '#7A9B82' }}>Saldo</p>
              <p className="text-lg font-black font-money" style={{ color: totalDebt > 0 ? '#E53935' : '#22C55E' }}>
                {totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isPending ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin size-8" style={{ color: '#00805A' }} />
              <p className="text-sm font-medium" style={{ color: '#7A9B82' }}>Carregando extrato...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3 opacity-40">
              <BookOpen className="size-12" style={{ color: '#1E2E21' }} />
              <p className="text-sm font-bold" style={{ color: '#7A9B82' }}>Nenhum registro ainda</p>
            </div>
          ) : (
            items.map(item => {
              const isPayment = item.type === "PAYMENT";
              return (
                <div 
                  key={item.id} 
                  className="flex gap-3 p-3 rounded-xl items-center"
                  style={{ background: '#0C0F0A', border: `1px solid ${isPayment ? '#22C55E15' : '#E5393915'}` }}
                >
                  <div className="p-2 rounded-lg shrink-0" style={{ background: isPayment ? '#22C55E18' : '#E5393918', color: isPayment ? '#22C55E' : '#E53935' }}>
                    {isPayment ? <ArrowDownLeft className="size-4" strokeWidth={2.5} /> : <ArrowUpRight className="size-4" strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-bold truncate" style={{ color: '#F4F6F3' }}>
                        {isPayment ? 'Pagamento' : 'Compra Fiado'}
                      </span>
                      <span className="text-sm font-black font-money shrink-0" style={{ color: isPayment ? '#22C55E' : '#F4F6F3' }}>
                        {isPayment ? '+' : '-'} {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5 gap-2">
                      <p className="text-xs truncate" style={{ color: '#7A9B82' }}>{item.details}</p>
                      <span className="text-xs font-mono shrink-0" style={{ color: '#3d5e42' }}>
                        {item.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} {item.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer — receipt bottom */}
        <div className="px-6 py-4 text-center" style={{ borderTop: '2px dashed #1E2E21' }}>
          <p className="text-xs font-mono" style={{ color: '#3d5e42' }}>Caderno PDV • {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
