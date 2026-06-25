"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState, useTransition } from "react";
import { getClientHistory, payDebt } from "@/actions/client";
import { Loader2, ArrowUpRight, ArrowDownLeft, BookOpen, MessageCircle, Banknote } from "lucide-react";
import { formatDebtText, openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";

interface DebtHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientPhone?: string;
}

export function DebtHistoryModal({ isOpen, onOpenChange, clientId, clientName, clientPhone }: DebtHistoryModalProps) {
  const [history, setHistory] = useState<{ orders: any[]; payments: any[] }>({ orders: [], payments: [] });
  const [isPending, startTransition] = useTransition();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const fetchHistory = () => {
    if (isOpen && clientId) {
      startTransition(async () => {
        const data = await getClientHistory(clientId);
        setHistory(data);
      });
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isOpen, clientId]);

  const handlePayDebt = async () => {
    const amount = parseFloat(paymentAmount.replace(",", "."));
    if (!amount || amount <= 0) return;
    
    setIsPaying(true);
    try {
      await payDebt(clientId, amount);
      toast.success("Pagamento registrado com sucesso!");
      setPaymentAmount("");
      fetchHistory(); // Atualiza a lista na hora
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar pagamento.");
    } finally {
      setIsPaying(false);
    }
  };

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
        className="p-0 overflow-hidden border-0 rounded-2xl max-w-md w-full flex flex-col bg-white shadow-xl"
        style={{ maxHeight: '82vh' }}
      >
        {/* Header — like a receipt top */}
        <div className="px-6 py-5 flex items-start justify-between border-b-2 border-dashed border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100 border border-orange-200">
              <BookOpen className="size-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-gray-900">Extrato do Caderno</DialogTitle>
              <p className="text-xs font-bold mt-0.5 text-gray-500">{clientName}</p>
            </div>
          </div>
          {totalDebt !== 0 && (
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-gray-500">Saldo</p>
              <p className={`text-lg font-black font-money ${totalDebt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isPending ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin size-8 text-orange-500" />
              <p className="text-sm font-medium text-gray-500">Carregando extrato...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3 opacity-50">
              <BookOpen className="size-12 text-gray-400" />
              <p className="text-sm font-bold text-gray-500">Nenhum registro ainda</p>
            </div>
          ) : (
            items.map(item => {
              const isPayment = item.type === "PAYMENT";
              return (
                <div 
                  key={item.id} 
                  className={`flex gap-3 p-3 rounded-xl items-center border ${isPayment ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isPayment ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {isPayment ? <ArrowDownLeft className="size-4" strokeWidth={2.5} /> : <ArrowUpRight className="size-4" strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="flex-1 min-w-0 text-sm font-bold truncate text-gray-900">
                        {isPayment ? 'Pagamento' : 'Compra Fiado'}
                      </span>
                      <span className={`text-sm font-black font-money shrink-0 ${isPayment ? 'text-green-600' : 'text-gray-900'}`}>
                        {isPayment ? '+' : '-'} {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5 gap-2">
                      <p className="flex-1 min-w-0 text-xs truncate text-gray-500">{item.details}</p>
                      <span className="shrink-0 text-xs font-mono text-gray-400">
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
        <div className="px-6 py-4 flex flex-col items-center gap-3 border-t-2 border-dashed border-gray-200">
          
          {/* Payment Section */}
          {totalDebt > 0 && (
            <div className="w-full flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  style={{ color: '#111827', backgroundColor: '#FFFFFF' }}
                  className="w-full h-10 pl-9 pr-3 rounded-lg text-sm font-black font-money border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <button
                onClick={handlePayDebt}
                disabled={isPaying || !paymentAmount}
                className="h-10 px-4 flex shrink-0 items-center gap-1.5 rounded-lg font-bold text-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {isPaying ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />}
                Pagar
              </button>
            </div>
          )}

          {clientPhone && totalDebt > 0 && (
            <button
              type="button"
              onClick={() => {
                const text = formatDebtText(clientName, totalDebt);
                openWhatsApp(clientPhone, text);
              }}
              className="flex items-center gap-2 px-6 py-2.5 w-full justify-center rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95 bg-orange-500 text-white shadow-sm"
            >
              <MessageCircle className="size-4" />
              Lembrar Dívida via WhatsApp
            </button>
          )}
          <p className="text-xs font-mono text-gray-400">ControleNaMão PDV • {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
