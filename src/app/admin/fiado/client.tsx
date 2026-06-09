"use client";

import { useState, useMemo } from "react";
import { payDebt } from "@/actions/client";
import { Input } from "@/components/ui/input";
import { Search, Wallet, Users, DollarSign, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Client = {
  id: string;
  name: string;
  phone?: string;
  cpf?: string;
  total_debt: number;
  credit_limit: number;
};

export function FiadoClient({
  debtors,
  summary,
}: {
  debtors: Client[];
  summary: { totalTab: number; overdueCount: number };
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () =>
      debtors.filter(
        (c) =>
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.phone || "").includes(search)
      ),
    [debtors, search]
  );

  const handlePay = async (client: Client) => {
    const raw = (payAmount[client.id] || "").replace(",", ".");
    const amount = parseFloat(raw);
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error("Digite um valor válido.");
      return;
    }
    if (amount > client.total_debt) {
      toast.error(`Valor maior que a dívida (${BRL(client.total_debt)}).`);
      return;
    }
    try {
      setLoading((l) => ({ ...l, [client.id]: true }));
      await payDebt(client.id, amount);
      toast.success(`Pagamento de ${BRL(amount)} registrado para ${client.name}!`);
      setPayAmount((p) => ({ ...p, [client.id]: "" }));
      setPayingId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading((l) => ({ ...l, [client.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>
          Fiado / Contas a Receber
        </h1>
        <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
          Gerencie os débitos em aberto dos clientes
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: "#1A0F0F", border: "1px solid #E5393520" }}
        >
          <div className="p-3 rounded-xl" style={{ background: "#E5393520", color: "#E53935" }}>
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#7A3333" }}>
              Total a Receber
            </p>
            <p className="text-3xl font-black" style={{ color: "#E53935" }}>
              {BRL(summary.totalTab)}
            </p>
          </div>
        </div>
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
        >
          <div className="p-3 rounded-xl" style={{ background: "#F59E0B20", color: "#F59E0B" }}>
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
              Clientes com Fiado
            </p>
            <p className="text-3xl font-black" style={{ color: "#F0F4F0" }}>
              {summary.overdueCount}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "#4A7A52" }} />
        <Input
          placeholder="Buscar cliente por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-xl"
          style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
        />
      </div>

      {/* Debtors List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div
            className="rounded-2xl p-16 text-center"
            style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
          >
            <CheckCircle2 size={40} style={{ color: "#22C55E", margin: "0 auto 12px" }} />
            <p className="font-bold" style={{ color: "#22C55E" }}>
              Nenhum devedor encontrado!
            </p>
            <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
              Todos os clientes estão em dia.
            </p>
          </div>
        )}
        {filtered.map((client) => {
          const isExpanded = payingId === client.id;
          return (
            <div
              key={client.id}
              className="rounded-2xl overflow-hidden transition-all"
              style={{ border: "1px solid #E5393520", background: "#100808" }}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                    style={{ background: "#E5393515", color: "#E53935", border: "1px solid #E5393930" }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: "#F0F4F0" }}>
                      {client.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {client.phone && (
                        <span className="text-xs flex items-center gap-1" style={{ color: "#4A7A52" }}>
                          <Phone size={11} /> {client.phone}
                        </span>
                      )}
                      {client.cpf && (
                        <span className="text-xs" style={{ color: "#2D4D33" }}>
                          CPF: {client.cpf}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: "#E53935" }}>
                      {BRL(client.total_debt)}
                    </p>
                    <p className="text-xs" style={{ color: "#7A3333" }}>
                      em aberto
                    </p>
                  </div>
                  <button
                    onClick={() => setPayingId(isExpanded ? null : client.id)}
                    className="px-4 py-2 rounded-xl font-black text-xs transition-all active:scale-95"
                    style={{ background: "#22C55E20", color: "#22C55E", border: "1px solid #22C55E30" }}
                  >
                    <Wallet size={14} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div
                  className="px-5 pb-5 pt-0 border-t"
                  style={{ borderColor: "#E5393520" }}
                >
                  <div className="pt-4 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                      Registrar Pagamento
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#4A7A52" }}>
                          R$
                        </span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={payAmount[client.id] || ""}
                          onChange={(e) =>
                            setPayAmount((p) => ({ ...p, [client.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === "Enter" && handlePay(client)}
                          className="h-12 pl-10 text-lg font-black rounded-xl font-mono"
                          style={{ background: "#0A0D0A", border: "1px solid #E5393530", color: "#F0F4F0" }}
                        />
                      </div>
                      <button
                        onClick={() => handlePay(client)}
                        disabled={loading[client.id]}
                        className="h-12 px-6 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: "#22C55E", color: "#0A0D0A" }}
                      >
                        {loading[client.id] ? "..." : "Pagar"}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {[25, 50, 100].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() =>
                            setPayAmount((p) => ({
                              ...p,
                              [client.id]: Math.min(v, client.total_debt).toFixed(2),
                            }))
                          }
                          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-125"
                          style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#4A7A52" }}
                        >
                          R${v}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setPayAmount((p) => ({ ...p, [client.id]: client.total_debt.toFixed(2) }))
                        }
                        className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: "#22C55E15",
                          border: "1px solid #22C55E30",
                          color: "#22C55E",
                        }}
                      >
                        Tudo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
