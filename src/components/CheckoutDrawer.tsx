"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
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
  { method: "PIX" as PaymentMethod, label: "PIX", icon: QrCode, color: "#00805A", glow: "#00805A30", isPix: true },
  { method: "CARD" as PaymentMethod, label: "Cartão", icon: CreditCard, color: "#2563EB", glow: "#2563EB30" },
  { method: "CASH" as PaymentMethod, label: "Dinheiro", icon: Banknote, color: "#F59E0B", glow: "#F59E0B30", isCash: true },
  { method: "TAB" as PaymentMethod, label: "Fiado", icon: BookOpen, color: "#E53935", glow: "#E5393530", isTab: true },
];

export function CheckoutDrawer({
  isOpen, onOpenChange, orderId, totalAmount, clients, onSuccessReset, order
}: CheckoutDrawerProps) {
  const router = useRouter();
  const [step, setStep] = useState<"METHOD" | "CASH_CHANGE" | "TAB_CLIENT" | "PIX_PAYMENT" | "SUCCESS">("METHOD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [cashReceived, setCashReceived] = useState("");
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null);

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

  const handlePayment = async (method: PaymentMethod, clientId?: string) => {
    try {
      setIsProcessing(true);
      await closeOrder(orderId, method, clientId, discountValue);
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

  const handleMethodClick = (method: PaymentMethod, isCash?: boolean, isTab?: boolean, isPix?: boolean) => {
    if (isCash) {
      setPendingMethod(method);
      setStep("CASH_CHANGE");
    } else if (isTab) {
      setPendingMethod(method);
      setStep("TAB_CLIENT");
    } else if (isPix) {
      setPendingMethod(method);
      setStep("PIX_PAYMENT");
    } else {
      handlePayment(method);
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
        className="border-0 rounded-t-3xl overflow-hidden max-h-[90vh]"
        style={{ background: "#111A14", borderTop: "1px solid #1E2E21" }}
      >
        {/* ── SUCCESS ── */}
        {step === "SUCCESS" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full p-6" style={{ background: "#00805A20" }}>
              <CheckCircle2 className="size-16" style={{ color: "#22C55E" }} />
            </div>
            <h3 className="text-2xl font-black" style={{ color: "#F4F6F3" }}>
              Venda Finalizada!
            </h3>
            {discountValue > 0 && (
              <p className="text-sm font-medium" style={{ color: "#7A9B82" }}>
                Desconto aplicado: {BRL(discountValue)}
              </p>
            )}
            <p className="text-3xl font-black mb-4" style={{ color: "#00805A" }}>
              {BRL(finalTotal)}
            </p>
          </div>
        )}

        {/* ── METHOD SELECTION ── */}
        {step === "METHOD" && (
          <div className="px-6 py-6 space-y-5 overflow-y-auto">
            {/* Total & Discount */}
            <DrawerHeader className="p-0">
              <p className="text-xs font-black uppercase tracking-widest text-center" style={{ color: "#7A9B82" }}>
                Total da Venda
              </p>
              <DrawerTitle className="text-4xl font-black text-center" style={{ color: "#F4F6F3" }}>
                {BRL(finalTotal)}
              </DrawerTitle>
              {discountValue > 0 && (
                <p className="text-center text-sm" style={{ color: "#22C55E" }}>
                  Desconto: {BRL(discountValue)} aplicado
                </p>
              )}
            </DrawerHeader>

            {/* Discount Row */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "#0A0D0A", border: "1px solid #1A2B1D" }}
            >
              <div className="flex items-center gap-2">
                <Tag size={14} style={{ color: "#4A7A52" }} />
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                  Desconto (opcional)
                </p>
              </div>
              <div className="flex gap-2">
                {/* Type toggle */}
                <div
                  className="flex rounded-xl overflow-hidden flex-shrink-0"
                  style={{ border: "1px solid #1A2B1D" }}
                >
                  {(["fixed", "percent"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDiscountType(t)}
                      className="px-3 py-2.5 text-xs font-black transition-all"
                      style={{
                        background: discountType === t ? "#00805A" : "#111A14",
                        color: discountType === t ? "white" : "#4A7A52",
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
                  className="flex-1 h-10 rounded-xl font-mono text-sm"
                  style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#F4F6F3" }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => { setDiscountType("percent"); setDiscount(pct.toString()); }}
                    className="py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-125"
                    style={{
                      background: discountType === "percent" && discount === pct.toString() ? "#00805A20" : "#111A14",
                      border: `1px solid ${discountType === "percent" && discount === pct.toString() ? "#00805A" : "#1A2B1D"}`,
                      color: "#6B9B73",
                    }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* WhatsApp Pre-charge */}
            {order?.client?.phone && (
              <a
                href={`https://wa.me/${(() => {
                  let p = order.client.phone.replace(/\D/g, "");
                  if (!p.startsWith("55") && (p.length === 10 || p.length === 11)) p = `55${p}`;
                  return p;
                })()}?text=${encodeURIComponent(formatReceiptText({ ...order, discount: discountValue }))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm transition-all hover:brightness-110 active:scale-95"
                style={{ background: "#25D36615", color: "#25D366", border: "1px solid #25D36630", textDecoration: "none" }}
              >
                <MessageCircle className="size-5" />
                Enviar Comanda via WhatsApp
              </a>
            )}

            {/* Payment Methods */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#4A7A52" }}>
                Forma de Pagamento
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(({ method, label, icon: Icon, color, glow, isCash, isTab, isPix }) => (
                  <button
                    key={method}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleMethodClick(method, isCash, isTab, isPix)}
                    className="flex flex-col items-center justify-center gap-2.5 h-24 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}40`,
                      color,
                      boxShadow: `0 4px 20px ${glow}`,
                    }}
                  >
                    <Icon className="size-7" strokeWidth={1.5} />
                    {label}
                  </button>
                ))}
              </div>
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
                className="p-2.5 rounded-xl"
                style={{ background: "#162119", border: "1px solid #1E2E21", color: "#7A9B82" }}
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h3 className="text-lg font-black" style={{ color: "#F4F6F3" }}>Pagamento em Dinheiro</h3>
                <p className="text-sm font-black" style={{ color: "#F59E0B" }}>{BRL(finalTotal)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Valor Recebido
              </p>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black"
                  style={{ color: "#4A7A52" }}
                >
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
                  className="pl-10 h-16 text-3xl font-black rounded-2xl font-mono"
                  style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F4F6F3" }}
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
                      className="py-2.5 rounded-xl text-xs font-black transition-all hover:brightness-125"
                      style={{
                        background: cashReceived === v.toFixed(2) ? "#F59E0B20" : "#0A0D0A",
                        border: `1px solid ${cashReceived === v.toFixed(2) ? "#F59E0B" : "#1A2B1D"}`,
                        color: "#F59E0B",
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
                className="rounded-2xl p-5 flex items-center justify-between"
                style={{
                  background: change >= 0 ? "#0A1A0A" : "#1A0A0A",
                  border: `1px solid ${change >= 0 ? "#22C55E30" : "#E5393530"}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Calculator size={18} style={{ color: change >= 0 ? "#22C55E" : "#E53935" }} />
                  <span className="font-black text-sm" style={{ color: "#4A7A52" }}>Troco</span>
                </div>
                <span
                  className="text-3xl font-black"
                  style={{ color: change >= 0 ? "#22C55E" : "#E53935" }}
                >
                  {BRL(change)}
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing || !cashReceived || parseFloat(cashReceived.replace(",", ".")) < finalTotal}
              onClick={() => pendingMethod && handlePayment(pendingMethod)}
              className="w-full h-14 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#F59E0B", color: "#0A0D0A" }}
            >
              {isProcessing ? "Processando..." : "Confirmar Pagamento"}
            </button>
          </div>
        )}

        {/* ── TAB CLIENT SELECTION ── */}
        {step === "TAB_CLIENT" && (
          <div className="px-6 py-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("METHOD")}
                className="p-2.5 rounded-xl"
                style={{ background: "#162119", border: "1px solid #1E2E21", color: "#7A9B82" }}
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h3 className="text-lg font-black" style={{ color: "#F4F6F3" }}>Colocar no Fiado</h3>
                <p className="text-sm font-black" style={{ color: "#E53935" }}>{BRL(finalTotal)}</p>
              </div>
            </div>

            <p className="text-xs font-black uppercase tracking-wider" style={{ color: "#4A7A52" }}>
              Selecione o Cliente
            </p>
            <div className="space-y-2">
              {clients.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: "#2D4D33" }}>
                  Nenhum cliente cadastrado
                </p>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handlePayment("TAB", client.id)}
                    className="w-full flex justify-between items-center px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 hover:brightness-125"
                    style={{ background: "#162119", border: "1px solid #1E2E21", color: "#F4F6F3" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-9 rounded-lg flex items-center justify-center font-black text-sm"
                        style={{ background: "#1E2E21", color: "#00805A" }}
                      >
                        {client.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">{client.name}</p>
                        {client.phone && (
                          <p className="text-xs" style={{ color: "#4A7A52" }}>{client.phone}</p>
                        )}
                      </div>
                    </div>
                    {client.total_debt > 0 && (
                      <span className="text-xs font-black" style={{ color: "#E53935" }}>
                        {BRL(client.total_debt)}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        {/* ── PIX PAYMENT ── */}
        {step === "PIX_PAYMENT" && (
          <div className="px-6 py-6 space-y-6 flex flex-col items-center">
            <div className="flex w-full items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => setStep("METHOD")}
                className="p-2.5 rounded-xl"
                style={{ background: "#162119", border: "1px solid #1E2E21", color: "#7A9B82" }}
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h3 className="text-lg font-black" style={{ color: "#F4F6F3" }}>Pagamento via PIX</h3>
                <p className="text-sm font-black" style={{ color: "#00805A" }}>{BRL(finalTotal)}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl">
              <QrCode className="size-48" style={{ color: "#000" }} />
            </div>

            <div className="w-full space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-center" style={{ color: "#4A7A52" }}>
                Pix Copia e Cola
              </p>
              <div 
                className="p-3 rounded-xl flex items-center justify-between gap-3 font-mono text-xs break-all"
                style={{ background: "#0A0D0A", border: "1px solid #1E2E21", color: "#F4F6F3" }}
              >
                <span className="opacity-50 truncate">00020126580014br.gov.bcb.pix0136...</span>
                <button
                  type="button"
                  onClick={() => toast.success("Código PIX copiado!")}
                  className="px-3 py-1.5 rounded-lg font-bold transition-all hover:brightness-110 shrink-0"
                  style={{ background: "#00805A", color: "#FFF" }}
                >
                  Copiar
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePayment("PIX")}
              className="w-full h-14 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-40 mt-4"
              style={{ background: "#00805A", color: "#FFFFFF", boxShadow: "0 4px 14px #00805A40" }}
            >
              {isProcessing ? "Confirmando..." : "Confirmar Pagamento Realizado"}
            </button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
