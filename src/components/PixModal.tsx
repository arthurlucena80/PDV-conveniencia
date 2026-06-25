"use client";

import React, { useEffect, useState } from "react";
import { generatePixAction } from "@/actions/pix";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
import { getOrder } from "@/actions/order";

export function PixModal({
  isOpen,
  onOpenChange,
  orderId,
  amount,
  gateway,
  onSuccess
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  amount: number;
  gateway?: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pixData, setPixData] = useState<{ qr_code_base64: string; copia_e_cola: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      setError("");
      setPixData(null);
      setPaid(false);

      generatePixAction(orderId, amount, gateway || "mercado_pago").then((res) => {
        if (res.success && res.data) {
          setPixData(res.data);
        } else {
          setError(res.error || "Falha ao gerar Pix");
        }
        setLoading(false);
      });
    }
  }, [isOpen, orderId, amount, gateway]);

  useEffect(() => {
    if (!isOpen || !pixData || paid) return;
    
    const interval = setInterval(async () => {
      try {
        const order = await getOrder(orderId);
        if (order && order.status === "PAID") {
          setPaid(true);
          clearInterval(interval);
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } catch (e) {
        // ignore
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, pixData, paid, orderId, onSuccess]);

  const copyToClipboard = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.copia_e_cola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-6 flex flex-col items-center text-center bg-white border-0 shadow-xl rounded-3xl">
        <DialogTitle className="sr-only">Pagamento PIX</DialogTitle>
        <DialogDescription className="sr-only">Escaneie o QR Code para pagar via PIX.</DialogDescription>

        {paid ? (
          <div className="flex flex-col items-center gap-4 py-8 animate-in zoom-in duration-300">
            <CheckCircle2 size={64} className="text-green-500" />
            <h3 className="text-xl font-black text-gray-900">Pagamento Confirmado!</h3>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={48} className="animate-spin text-orange-500" />
            <p className="text-gray-500 font-medium">Gerando PIX Dinâmico...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-red-500 font-bold">{error}</p>
          </div>
        ) : pixData ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <h3 className="text-lg font-black text-gray-900">Pague via PIX</h3>
            <p className="text-sm text-gray-500 mb-2">Aguardando confirmação do banco...</p>
            
            {pixData.qr_code_base64 && (
              <img
                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                alt="QR Code"
                className="w-48 h-48 border rounded-xl shadow-sm"
              />
            )}
            
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2 w-full mt-4 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-bold transition-colors border border-gray-200"
            >
              {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
              {copied ? "Copiado!" : "Copiar Pix Copia e Cola"}
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
