"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { PixModal } from "./PixModal";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { closeOrder } from "@/actions/order";
import { PaymentMethod } from "@prisma/client";
import {
  CheckCircle2, CreditCard, Banknote, QrCode,
  BookOpen, ChevronLeft, Tag, Calculator, MessageCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatReceiptText, openWhatsApp } from "@/lib/whatsapp";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface CheckoutDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  totalAmount: number;
  clients: any[];
  onSuccessReset: () => void;
  order?: any;
}

const PAYMENT_METHODS = [
  { method: "PIX" as PaymentMethod, label: "PIX", icon: QrCode, color: "#10B981", glow: "#10B98130", isPix: true },
  { method: "CARD" as PaymentMethod, label: "Cartão", icon: CreditCard, color: "#3B82F6", glow: "#3B82F630" },
  { method: "CASH" as PaymentMethod, label: "Dinheiro", icon: Banknote, color: "#F59E0B", glow: "#F59E0B30", isCash: true },
  { method: "TAB" as PaymentMethod, label: "Fiado", icon: BookOpen, color: "#EF4444", glow: "#EF444430", isTab: true },
];

export function CheckoutDrawer({
  isOpen, onOpenChange, orderId, totalAmount, clients, onSuccessReset, order
}: CheckoutDrawerProps) {
  const router = useRouter();
  const [step, setStep] = useState<"METHOD" | "CASH_CHANGE" | "TAB_CLIENT" | "PIX_PAYMENT" | "SUCCESS" | "CARD_MACHINE" | "PIX_BANK">("METHOD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [cashReceived, setCashReceived] = useState("");
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null);
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  
  // Pix Dinâmico
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixGateway, setPixGateway] = useState<string>("mercado_pago");

  const discountValue = (() => {
    const raw = parseFloat(discount.replace(",", ".")) || 0;
    if (discountType === "percent") return Math.min((totalAmount * raw) / 100, totalAmount);
    return Math.min(raw, totalAmount);
  })();

  const finalTotal = Math.max(0, totalAmount - discountValue);
  const change = Math.max(0, (parseFloat(cashReceived.replace(",", ".")) || 0) - finalTotal);

  const resetState = () => {
    setStep("METHOD");
    setDiscount("");
    setDiscountType("fixed");
    setCashReceived("");
    setPendingMethod(null);
  };

  const handlePayment = async (method: PaymentMethod, clientId?: string, paymentNotes?: string) => {
    try {
      setIsProcessing(true);
      await closeOrder(orderId, method, clientId, discountValue, sendWhatsapp, whatsappPhone, paymentNotes);
      
      if (sendWhatsapp) {
        const finalPhone = whatsappPhone || order?.client?.phone;
        if (finalPhone) {
          // Montar o pedido temp para formatar o texto
          const tempOrder = {
             ...order,
             discount: discountValue,
             total_amount: totalAmount,
             status: method === "TAB" ? "UNPAID" : "PAID"
          };
          const text = formatReceiptText(tempOrder, order?.client?.name);
          openWhatsApp(finalPhone, text);
        }
      }

      setStep("SUCCESS");
      setTimeout(() => {
        onOpenChange(false);
        resetState();
        onSuccessReset();
        router.refresh();
      }, 1800);
    } catch (e: any) {
      toast.error("Erro ao finalizar: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMethodClick = (method: string, isCash = false, isTab = false, isPix = false) => {
    if (isPix) {
      setStep("PIX_BANK");
      return;
    }
    
    if (isCash) {
      setPendingMethod(method as PaymentMethod);
      setStep("CASH_CHANGE");
    } else if (isTab) {
      setPendingMethod(method as PaymentMethod);
      setStep("TAB_CLIENT");
    } else if (method === "CARD") {
      setPendingMethod(method as PaymentMethod);
      setStep("CARD_MACHINE");
    } else {
      handlePayment(method as PaymentMethod);
    }
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (step === "SUCCESS") return;
        onOpenChange(open);
        if (!open) resetState();
      }}
    >
      <DrawerContent
        className="border-0 rounded-t-3xl overflow-hidden max-h-[90vh] bg-white shadow-2xl"
      >
        {/* ── SUCCESS ── */}
        {step === "SUCCESS" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full p-6 bg-green-50">
              <CheckCircle2 className="size-16 text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900">
              Venda Finalizada!
            </h3>
            {discountValue > 0 && (
              <p className="text-sm font-medium text-gray-500">
                Desconto aplicado: {BRL(discountValue)}
              </p>
            )}
            <p className="text-3xl font-black mb-4 text-orange-500">
              {BRL(finalTotal)}
            </p>
          </div>
        )}

        {/* ── METHOD SELECTION ── */}
        {step === "METHOD" && (
          <div className="px-6 py-6 space-y-5 overflow-y-auto">
            {/* Total & Discount */}
            <DrawerHeader className="p-0">
              <p className="text-xs font-black uppercase tracking-widest text-center text-gray-500">
                Total da Venda
              </p>
              <DrawerTitle className="text-4xl font-black text-center text-gray-900">
                {BRL(finalTotal)}
              </DrawerTitle>
              {discountValue > 0 && (
                <p className="text-center text-sm text-green-600">
                  Desconto: {BRL(discountValue)} aplicado
                </p>
              )}
            </DrawerHeader>

            {/* Discount Row */}
            <div
              className="rounded-2xl p-4 space-y-3 bg-gray-50 border border-gray-200"
            >
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-gray-500" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                  Desconto (opcional)
                </p>
              </div>
              <div className="flex gap-2">
                {/* Type toggle */}
                <div
                  className="flex rounded-xl overflow-hidden flex-shrink-0 border border-gray-200"
                >
                  {(["fixed", "percent"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDiscountType(t)}
                      className="px-3 py-2.5 text-xs font-black transition-all"
                      style={{
                        background: discountType === t ? "#F97316" : "#FFFFFF",
                        color: discountType === t ? "white" : "#6B7280",
                      }}
                    >
                      {t === "fixed" ? "R$" : "%"}
                    </button>
                  ))}
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={discountType === "fixed" ? "0,00" : "0%"}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="flex-1 h-10 rounded-xl font-mono text-sm bg-white border-gray-200 text-gray-900 focus-visible:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => { setDiscountType("percent"); setDiscount(pct.toString()); }}
                    className="py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-gray-100"
                    style={{
                      background: discountType === "percent" && discount === pct.toString() ? "#FFF7ED" : "#FFFFFF",
                      border: `1px solid ${discountType === "percent" && discount === pct.toString() ? "#F97316" : "#E5E7EB"}`,
                      color: discountType === "percent" && discount === pct.toString() ? "#F97316" : "#6B7280",
                    }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-500">
                Forma de Pagamento
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(({ method, label, icon: Icon, color, glow, isCash, isTab, isPix }) => (
                  <button
                    key={method}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleMethodClick(method, !!isCash, !!isTab, !!isPix)}
                    className="flex flex-col items-center justify-center gap-2.5 h-24 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-50 bg-white hover:bg-gray-50"
                    style={{
                      border: `1px solid ${color}40`,
                      color,
                      boxShadow: `0 4px 10px ${glow}`,
                    }}
                  >
                    <Icon className="size-7" strokeWidth={1.5} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Envio de WhatsApp (API Automática) */}
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-green-500" />
                  <Label htmlFor="send-whatsapp" className="font-bold text-sm text-gray-700 cursor-pointer">
                    Enviar recibo por WhatsApp
                  </Label>
                </div>
                <Switch 
                  id="send-whatsapp" 
                  checked={sendWhatsapp} 
                  onCheckedChange={setSendWhatsapp}
                />
              </div>
              {sendWhatsapp && (!order?.client?.phone) && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300 relative z-50 pointer-events-auto">
                  <Label className="text-xs text-gray-500">Número de Telefone (Balcão)</Label>
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="bg-white border-gray-300 focus-visible:ring-green-500 text-gray-900 pointer-events-auto"
                    disabled={false}
                    readOnly={false}
                  />
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── CASH CHANGE ── */}
        {step === "CASH_CHANGE" && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("METHOD")}
                className="p-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h3 className="text-lg font-black text-gray-900">Pagamento em Dinheiro</h3>
                <p className="text-sm font-black text-orange-500">{BRL(finalTotal)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Valor Recebido
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-500">
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  placeholder="0,00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && pendingMethod && handlePayment(pendingMethod)}
                  className="pl-10 h-16 text-3xl font-black rounded-2xl font-mono bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-orange-500"
                />
              </div>
              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[finalTotal, Math.ceil(finalTotal / 10) * 10, Math.ceil(finalTotal / 50) * 50, Math.ceil(finalTotal / 100) * 100]
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                  .slice(0, 4)
                  .map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCashReceived(v.toFixed(2))}
                      className="py-2.5 rounded-xl text-xs font-black transition-all hover:bg-orange-50"
                      style={{
                        background: cashReceived === v.toFixed(2) ? "#FFF7ED" : "#F9FAFB",
                        border: `1px solid ${cashReceived === v.toFixed(2) ? "#F97316" : "#E5E7EB"}`,
                        color: cashReceived === v.toFixed(2) ? "#F97316" : "#6B7280",
                      }}
                    >
                      {BRL(v)}
                    </button>
                  ))}
              </div>
            </div>

            {/* Change display */}
            {cashReceived && (
              <div
                className="rounded-2xl p-5 flex items-center justify-between border"
                style={{
                  background: change >= 0 ? "#F0FDF4" : "#FEF2F2",
                  borderColor: change >= 0 ? "#BBF7D0" : "#FECACA",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Calculator size={18} style={{ color: change >= 0 ? "#22C55E" : "#EF4444" }} />
                  <span className="font-black text-sm" style={{ color: change >= 0 ? "#166534" : "#991B1B" }}>Troco</span>
                </div>
                <span
                  className="text-3xl font-black"
                  style={{ color: change >= 0 ? "#22C55E" : "#EF4444" }}
                >
                  {BRL(change)}
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing || !cashReceived || parseFloat(cashReceived.replace(",", ".")) < finalTotal}
              onClick={() => pendingMethod && handlePayment(pendingMethod)}
              className="w-full h-14 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-40 bg-orange-500 text-white hover:bg-orange-600"
            >
              {isProcessing ? "Processando..." : "Confirmar Pagamento"}
            </button>
          </div>
        )}

        {/* ── CARD MACHINE SELECTION ── */}
        {step === "CARD_MACHINE" && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("METHOD")}
                className="p-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h3 className="text-lg font-black text-gray-900">Selecione o Banco / Máquina</h3>
                <p className="text-sm font-black text-blue-500">{BRL(finalTotal)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { id: "mercado_pago", label: "Mercado Pago", color: "#009EE3" },
                { id: "c6_bank", label: "C6 Bank", color: "#242424" },
                { id: "infinitepay", label: "InfinitePay", color: "#00C853" },
                { id: "outros", label: "Outros / Genérico", color: "#6B7280" }
              ].map((machine) => (
                <button
                  key={machine.id}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePayment("CARD", undefined, machine.label === "Outros / Genérico" ? "Cartão" : `Banco/Máquina: ${machine.label}`)}
                  className="w-full flex justify-between items-center px-4 py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 hover:bg-gray-50 bg-white border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-10 rounded-lg flex items-center justify-center font-black text-sm text-white"
                      style={{ backgroundColor: machine.color }}
                    >
                      <CreditCard size={18} />
                    </div>
                    <span className="font-bold text-base text-gray-900">{machine.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PIX BANK SELECTION ── */}
        {step === "PIX_BANK" && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("METHOD")}
                className="p-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h3 className="text-lg font-black text-gray-900">Selecione o Banco PIX</h3>
                <p className="text-sm font-black text-emerald-500">{BRL(finalTotal)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { id: "mercado_pago", label: "Mercado Pago", color: "#009EE3" },
                { id: "c6_bank", label: "C6 Bank", color: "#242424" },
                { id: "infinitepay", label: "InfinitePay", color: "#00C853" }
              ].map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => {
                    setPixGateway(bank.id);
                    setIsPixModalOpen(true);
                  }}
                  className="w-full flex justify-between items-center px-4 py-4 rounded-xl transition-all active:scale-[0.98] hover:bg-gray-50 bg-white border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-10 rounded-lg flex items-center justify-center font-black text-sm text-white"
                      style={{ backgroundColor: bank.color }}
                    >
                      <QrCode size={18} />
                    </div>
                    <span className="font-bold text-base text-gray-900">{bank.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB CLIENT SELECTION ── */}
        {step === "TAB_CLIENT" && (
          <div className="px-6 py-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("METHOD")}
                className="p-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h3 className="text-lg font-black text-gray-900">Colocar no Fiado</h3>
                <p className="text-sm font-black text-red-500">{BRL(finalTotal)}</p>
              </div>
            </div>

            <p className="text-xs font-black uppercase tracking-wider text-gray-500">
              Selecione o Cliente
            </p>
            <div className="space-y-2">
              {clients.length === 0 ? (
                <p className="text-center py-8 text-sm text-gray-400">
                  Nenhum cliente cadastrado
                </p>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handlePayment("TAB", client.id)}
                    className="w-full flex justify-between items-center px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 hover:bg-gray-50 bg-white border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-9 rounded-lg flex items-center justify-center font-black text-sm bg-gray-100 text-gray-600"
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-gray-900">{client.name}</p>
                        {client.phone && (
                          <p className="text-xs text-gray-500">{client.phone}</p>
                        )}
                      </div>
                    </div>
                    {client.total_debt > 0 && (
                      <span className="text-xs font-black text-red-500">
                        {BRL(client.total_debt)}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </DrawerContent>
      
      {order && (
        <PixModal
          isOpen={isPixModalOpen}
          onOpenChange={setIsPixModalOpen}
          orderId={order.id}
          amount={finalTotal}
          gateway={pixGateway}
          onSuccess={() => {
            setIsPixModalOpen(false);
            // Confirma na UI fechando o pedido
            const bankName = pixGateway === 'mercado_pago' ? 'Mercado Pago' : pixGateway === 'c6_bank' ? 'C6 Bank' : 'InfinitePay';
            handlePayment("PIX", undefined, `PIX: ${bankName}`);
          }}
        />
      )}
    </Drawer>
  );
}
