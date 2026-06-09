"use client";
// src/app/admin/funcionarios/caixa/client.tsx — Controle de Caixa

import { useState } from "react";
import { openCash, closeCash } from "@/actions/cashregister";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DollarSign, Lock, Unlock, AlertTriangle, CheckCircle2, X } from "lucide-react";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type CashRegister = {
  id: string; user_id: string;
  opened_at: Date; closed_at: Date | null;
  opening_amount: number; closing_amount: number | null;
  expected_amount: number | null; difference: number | null;
  notes: string | null;
  user: { name: string; role: string };
};

type Summary = {
  openCount: number; closedToday: number; totalDifference: number;
  openCashiers: { id: string; userName: string; opened_at: Date; opening_amount: number }[];
};

export function CaixaClient({
  summary, history, employees, filters,
}: {
  summary: Summary;
  history: CashRegister[];
  employees: any[];
  filters: any;
}) {
  const router = useRouter();
  const [isOpenModal, setIsOpenModal]   = useState(false);
  const [isCloseModal, setIsCloseModal] = useState(false);
  const [selectedCash, setSelectedCash]  = useState<CashRegister | null>(null);
  const [loading, setLoading]           = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [notes, setNotes]               = useState("");

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(openingAmount.replace(",", "."));
    if (isNaN(amount) || amount < 0) { toast.error("Valor inicial inválido."); return; }
    try {
      setLoading(true);
      await openCash(amount, notes || undefined);
      toast.success("Caixa aberto com sucesso!");
      setIsOpenModal(false);
      setOpeningAmount(""); setNotes("");
      router.refresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCash) return;
    const amount = parseFloat(closingAmount.replace(",", "."));
    if (isNaN(amount) || amount < 0) { toast.error("Valor informado inválido."); return; }
    try {
      setLoading(true);
      await closeCash(selectedCash.id, amount, notes || undefined);
      toast.success("Caixa fechado!");
      setIsCloseModal(false);
      setClosingAmount(""); setNotes(""); setSelectedCash(null);
      router.refresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(filters);
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/admin/funcionarios/caixa?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>Controle de Caixa</h1>
          <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>Abertura e fechamento de caixas por operador</p>
        </div>
        <button
          onClick={() => setIsOpenModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
          style={{ background: "#00805A", color: "#F0F4F0" }}>
          <Unlock size={16} /> Abrir Meu Caixa
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Caixas Abertos Agora", value: summary.openCount, color: "#00805A", icon: Unlock },
          { label: "Fechamentos Hoje",     value: summary.closedToday, color: "#3B82F6", icon: Lock },
          {
            label: "Diferença Total Hoje",
            value: BRL(summary.totalDifference),
            color: summary.totalDifference === 0 ? "#00805A" : summary.totalDifference < 0 ? "#EF4444" : "#F59E0B",
            icon: DollarSign,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-6 flex items-center gap-4"
            style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
            <div className="p-3 rounded-xl" style={{ background: `${color}20`, color }}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-black" style={{ color: "#F0F4F0" }}>{value}</p>
              <p className="text-xs" style={{ color: "#4A7A52" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Caixas Abertos Atualmente */}
      {summary.openCashiers.length > 0 && (
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: "#111A14", border: "1px solid #00805A30" }}>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#00805A" }}>
            🟢 Caixas Abertos Agora
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.openCashiers.map(c => (
              <div key={c.id} className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D" }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#F0F4F0" }}>{c.userName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#4A7A52" }}>
                    Aberto às {new Date(c.opened_at).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}
                    {" · "}Fundo: {BRL(c.opening_amount)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const found = history.find(h => h.id === c.id) ||
                      { id: c.id, user_id: "", opened_at: c.opened_at, closed_at: null,
                        opening_amount: c.opening_amount, closing_amount: null,
                        expected_amount: null, difference: null, notes: null,
                        user: { name: c.userName, role: "" } };
                    setSelectedCash(found as any);
                    setIsCloseModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: "#E5393515", color: "#E53935", border: "1px solid #E5393930" }}>
                  <Lock size={12} /> Fechar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl p-4 grid grid-cols-3 gap-3"
        style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#4A7A52" }}>Operador</p>
          <select
            value={filters.user_id || ""}
            onChange={e => applyFilter("user_id", e.target.value)}
            className="w-full h-9 rounded-xl px-3 text-sm"
            style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}>
            <option value="">Todos</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        {[{ key: "from", label: "De" }, { key: "to", label: "Até" }].map(({ key, label }) => (
          <div key={key}>
            <p className="text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#4A7A52" }}>{label}</p>
            <input type="date" value={(filters as any)[key] || ""}
              onChange={e => applyFilter(key, e.target.value)}
              className="w-full h-9 rounded-xl px-3 text-sm"
              style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
            />
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
        <div className="px-5 py-3 text-xs font-black uppercase tracking-widest grid grid-cols-12"
          style={{ color: "#2D4D33", borderBottom: "1px solid #1A2B1D", background: "#0A0D0A" }}>
          <div className="col-span-2">Operador</div>
          <div className="col-span-2">Abertura</div>
          <div className="col-span-2">Fechamento</div>
          <div className="col-span-2">Fundo Inicial</div>
          <div className="col-span-2">Valor Esperado</div>
          <div className="col-span-2">Diferença</div>
        </div>
        {history.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: "#2D4D33" }}>Nenhum registro encontrado.</p>
        )}
        {history.map((r, i) => {
          const diff = r.difference;
          const diffColor = diff === null ? "#4A7A52" : diff === 0 ? "#00805A" : diff > 0 ? "#F59E0B" : "#EF4444";
          return (
            <div key={r.id} className="grid grid-cols-12 px-5 py-3 items-center text-xs"
              style={{ borderBottom: i < history.length-1 ? "1px solid #0F1510" : "none" }}>
              <div className="col-span-2 font-semibold" style={{ color: "#F0F4F0" }}>{r.user.name}</div>
              <div className="col-span-2" style={{ color: "#4A7A52" }}>
                {new Date(r.opened_at).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
              </div>
              <div className="col-span-2" style={{ color: "#4A7A52" }}>
                {r.closed_at
                  ? new Date(r.closed_at).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })
                  : <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#00805A20", color: "#00805A" }}>Aberto</span>}
              </div>
              <div className="col-span-2 font-bold" style={{ color: "#F0F4F0" }}>{BRL(r.opening_amount)}</div>
              <div className="col-span-2" style={{ color: "#4A7A52" }}>
                {r.expected_amount !== null ? BRL(r.expected_amount) : "—"}
              </div>
              <div className="col-span-2 font-black flex items-center gap-1.5" style={{ color: diffColor }}>
                {diff !== null ? (
                  <>
                    {diff === 0 ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {BRL(diff)}
                  </>
                ) : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Abrir Caixa */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="p-0 max-w-sm rounded-2xl border-0" style={{ background: "#111A14" }}>
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #1A2B1D" }}>
            <DialogTitle className="text-xl font-black" style={{ color: "#F0F4F0" }}>Abrir Caixa</DialogTitle>
            <button onClick={() => setIsOpenModal(false)} style={{ color: "#4A7A52" }}><X size={18} /></button>
          </div>
          <form onSubmit={handleOpen} className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Fundo de Troco (R$)
              </Label>
              <Input
                type="number" step="0.01" min="0"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                placeholder="0,00"
                className="h-11 rounded-xl text-xl font-black"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
              <p className="text-xs" style={{ color: "#2D4D33" }}>Valor em dinheiro no caixa antes de começar o turno</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Observações (opcional)
              </Label>
              <Input
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Turno da manhã"
                className="h-11 rounded-xl"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "#00805A", color: "#F0F4F0" }}>
              {loading ? "Abrindo..." : "Confirmar Abertura"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Fechar Caixa */}
      <Dialog open={isCloseModal} onOpenChange={setIsCloseModal}>
        <DialogContent className="p-0 max-w-sm rounded-2xl border-0" style={{ background: "#111A14" }}>
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #1A2B1D" }}>
            <DialogTitle className="text-xl font-black" style={{ color: "#F0F4F0" }}>Fechar Caixa</DialogTitle>
            <button onClick={() => setIsCloseModal(false)} style={{ color: "#4A7A52" }}><X size={18} /></button>
          </div>
          <form onSubmit={handleClose} className="px-6 py-5 space-y-4">
            <p className="text-sm" style={{ color: "#6B9B73" }}>
              Operador: <strong style={{ color: "#F0F4F0" }}>{selectedCash?.user.name}</strong>
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Valor Físico no Caixa (R$)
              </Label>
              <Input
                type="number" step="0.01" min="0"
                value={closingAmount}
                onChange={e => setClosingAmount(e.target.value)}
                placeholder="0,00"
                className="h-11 rounded-xl text-xl font-black"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
              <p className="text-xs" style={{ color: "#2D4D33" }}>
                Conte o dinheiro fisicamente e informe o total encontrado
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Observações (opcional)
              </Label>
              <Input
                value={notes} onChange={e => setNotes(e.target.value)}
                className="h-11 rounded-xl"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
            </div>
            <button type="submit" disabled={loading || !closingAmount}
              className="w-full h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "#EF4444", color: "#F0F4F0" }}>
              {loading ? "Fechando..." : "Confirmar Fechamento"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
