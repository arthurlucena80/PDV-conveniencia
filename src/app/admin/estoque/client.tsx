"use client";

import { useState } from "react";
import { createInventoryMovement } from "@/actions/inventory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Trash2,
  X,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MOVEMENT_TYPES = [
  { value: "ENTRY", label: "Entrada", icon: ArrowDown, color: "#22C55E", bg: "#22C55E15" },
  { value: "EXIT", label: "Saída", icon: ArrowUp, color: "#EF4444", bg: "#EF444415" },
  { value: "ADJUSTMENT", label: "Ajuste", icon: RefreshCw, color: "#F59E0B", bg: "#F59E0B15" },
  { value: "LOSS", label: "Perda", icon: Trash2, color: "#8B5CF6", bg: "#8B5CF615" },
];

type Product = { id: string; name: string; stock_current: number; stock_min: number; price: number };
type Movement = {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  notes?: string;
  created_at: string;
  product?: { name: string };
};

export function EstoqueClient({
  lowStockProducts,
  summary,
  recentMovements,
  allProducts,
}: {
  lowStockProducts: any[];
  summary: { totalProducts: number; lowStockCount: number; totalStockValue: number };
  recentMovements: Movement[];
  allProducts: Product[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [movType, setMovType] = useState("ENTRY");
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) { toast.error("Selecione um produto"); return; }
    const quantity = parseInt(qty);
    if (!quantity || quantity <= 0) { toast.error("Quantidade inválida"); return; }
    try {
      setLoading(true);
      await createInventoryMovement({
        product_id: selectedProduct,
        type: movType as any,
        quantity,
        notes: notes.trim() || undefined,
      });
      toast.success("Movimentação registrada!");
      setIsOpen(false);
      setSelectedProduct("");
      setQty("1");
      setNotes("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMovIcon = (type: string) => {
    const t = MOVEMENT_TYPES.find((m) => m.value === type);
    if (!t) return null;
    const Icon = t.icon;
    return <Icon size={14} style={{ color: t.color }} />;
  };

  const getMovLabel = (type: string) => MOVEMENT_TYPES.find((m) => m.value === type)?.label || type;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>
            Estoque
          </h1>
          <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
            Controle de entrada, saída e ajustes
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
          style={{ background: "#00805A", color: "#F0F4F0", boxShadow: "0 4px 20px #00805A30" }}
        >
          <RefreshCw size={16} /> Registrar Movimentação
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total de Produtos", value: summary.totalProducts.toString(), icon: Package, accent: "#00805A" },
          {
            label: "Estoque Baixo",
            value: summary.lowStockCount.toString(),
            icon: AlertTriangle,
            accent: summary.lowStockCount > 0 ? "#EF4444" : "#22C55E",
          },
          { label: "Valor em Estoque", value: BRL(summary.totalStockValue), icon: DollarSign, accent: "#F59E0B" },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
          >
            <div className="p-3 rounded-xl" style={{ background: `${accent}20`, color: accent }}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>{label}</p>
              <p className="text-2xl font-black mt-0.5" style={{ color: "#F0F4F0" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2B1D" }}>
          <div
            className="px-5 py-4 flex items-center gap-2.5"
            style={{ background: "#111A14", borderBottom: "1px solid #1A2B1D" }}
          >
            <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
            <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
              Estoque Baixo / Zerado
            </h2>
          </div>
          <div className="divide-y" style={{ divideColor: "#1A2B1D" }}>
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center">
                <TrendingUp size={24} style={{ color: "#22C55E", margin: "0 auto 8px" }} />
                <p className="text-sm font-semibold" style={{ color: "#22C55E" }}>
                  Todos os produtos com estoque OK!
                </p>
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3"
                  style={{ background: "#0A0D0A" }}
                >
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#F0F4F0" }}>{p.name}</p>
                    {p.brand && <p className="text-xs" style={{ color: "#4A7A52" }}>{p.brand}</p>}
                  </div>
                  <div className="text-right">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-black"
                      style={{
                        background: p.stock_current === 0 ? "#EF444415" : "#F59E0B15",
                        color: p.stock_current === 0 ? "#EF4444" : "#F59E0B",
                      }}
                    >
                      {p.stock_current === 0 ? "ESGOTADO" : `${p.stock_current} restantes`}
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: "#2D4D33" }}>
                      Mín: {p.stock_min}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Movements */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2B1D" }}>
          <div
            className="px-5 py-4"
            style={{ background: "#111A14", borderBottom: "1px solid #1A2B1D" }}
          >
            <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
              Movimentações Recentes
            </h2>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto" style={{ divideColor: "#1A2B1D" }}>
            {recentMovements.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm" style={{ color: "#2D4D33" }}>Nenhuma movimentação registrada.</p>
              </div>
            ) : (
              recentMovements.slice(0, 20).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-5 py-3"
                  style={{ background: "#0A0D0A" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">{getMovIcon(m.type)}</div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "#F0F4F0" }}>
                        {m.product?.name || "—"}
                      </p>
                      <p className="text-xs" style={{ color: "#4A7A52" }}>
                        {getMovLabel(m.type)} • {m.notes || "Sem observação"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-black text-sm"
                      style={{
                        color:
                          m.type === "ENTRY"
                            ? "#22C55E"
                            : m.type === "ADJUSTMENT"
                            ? "#F59E0B"
                            : "#EF4444",
                      }}
                    >
                      {m.type === "ENTRY" ? "+" : "-"}{m.quantity}
                    </p>
                    <p className="text-xs" style={{ color: "#2D4D33" }}>
                      {new Date(m.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Movement Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="p-0 overflow-hidden max-w-md rounded-2xl border-0"
          style={{ background: "#111A14" }}
        >
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #1A2B1D" }}>
            <DialogTitle className="text-xl font-black" style={{ color: "#F0F4F0" }}>
              Registrar Movimentação
            </DialogTitle>
            <button onClick={() => setIsOpen(false)} style={{ color: "#4A7A52" }}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave} className="px-6 py-5 space-y-5">
            {/* Type */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Tipo de Movimentação
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {MOVEMENT_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setMovType(t.value)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: movType === t.value ? `${t.color}20` : "#0A0D0A",
                        border: `1px solid ${movType === t.value ? t.color : "#1A2B1D"}`,
                        color: movType === t.value ? t.color : "#4A7A52",
                      }}
                    >
                      <Icon size={16} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product search */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Produto
              </Label>
              <Input
                placeholder="Buscar produto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="h-11 rounded-xl"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
              {productSearch && (
                <div
                  className="rounded-xl overflow-hidden max-h-40 overflow-y-auto"
                  style={{ border: "1px solid #1A2B1D" }}
                >
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedProduct(p.id); setProductSearch(p.name); }}
                      className="w-full flex justify-between items-center px-4 py-2.5 text-sm hover:brightness-125 transition-all"
                      style={{
                        background: selectedProduct === p.id ? "#00805A20" : "#0A0D0A",
                        color: "#F0F4F0",
                        borderBottom: "1px solid #1A2B1D",
                      }}
                    >
                      <span>{p.name}</span>
                      <span style={{ color: "#4A7A52" }}>Estoque: {p.stock_current}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Quantidade
              </Label>
              <Input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                min={1}
                className="h-11 rounded-xl"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Observação (opcional)
              </Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Reposição de fornecedor..."
                className="h-11 rounded-xl"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "#00805A", color: "#F0F4F0" }}
            >
              {loading ? "Registrando..." : "Registrar Movimentação"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
