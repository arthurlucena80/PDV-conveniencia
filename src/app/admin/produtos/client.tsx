"use client";

import { useState, useMemo } from "react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
} from "@/actions/product";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Edit3,
  Package,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Tag,
  Barcode,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STOCK_STATUS = (cur: number, min: number) => {
  if (cur === 0) return { label: "Esgotado", color: "#E53935", bg: "#E5393515" };
  if (cur <= min) return { label: "Baixo", color: "#F59E0B", bg: "#F59E0B15" };
  return { label: "OK", color: "#22C55E", bg: "#22C55E15" };
};

type Product = {
  id: string;
  name: string;
  barcode?: string;
  brand?: string;
  category_id?: string;
  category?: { id: string; name: string };
  price: number;
  cost_price?: number;
  stock_current: number;
  stock_min: number;
  image_url?: string;
  description?: string;
  is_active: boolean;
};

type Category = { id: string; name: string };

const emptyForm = {
  name: "",
  barcode: "",
  brand: "",
  category_id: "",
  price: "",
  cost_price: "",
  stock_current: "0",
  stock_min: "0",
  image_url: "",
  description: "",
};

export function ProdutosClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode || "").includes(q) ||
        (p.brand || "").toLowerCase().includes(q);
      const matchCat = filterCategory === "all" || p.category_id === filterCategory;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && p.is_active) ||
        (filterStatus === "inactive" && !p.is_active) ||
        (filterStatus === "low" && p.stock_current <= p.stock_min);
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, filterCategory, filterStatus]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      barcode: p.barcode || "",
      brand: p.brand || "",
      category_id: p.category_id || "",
      price: p.price.toString(),
      cost_price: p.cost_price?.toString() || "",
      stock_current: p.stock_current.toString(),
      stock_min: p.stock_min.toString(),
      image_url: p.image_url || "",
      description: p.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    const price = parseFloat(form.price.replace(",", "."));
    if (!price || isNaN(price) || price <= 0) { toast.error("Preço inválido"); return; }

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        barcode: form.barcode.trim() || undefined,
        brand: form.brand.trim() || undefined,
        category_id: form.category_id || undefined,
        price,
        cost_price: form.cost_price ? parseFloat(form.cost_price.replace(",", ".")) : undefined,
        stock_current: parseInt(form.stock_current) || 0,
        stock_min: parseInt(form.stock_min) || 0,
        image_url: form.image_url.trim() || undefined,
        description: form.description.trim() || undefined,
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success("Produto atualizado!");
      } else {
        await createProduct(payload);
        toast.success("Produto criado!");
      }
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir produto?")) return;
    try {
      await deleteProduct(id);
      toast.success("Produto excluído.");
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleProductActive(id, !current);
      toast.success(!current ? "Produto ativado." : "Produto desativado.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const lowStockCount = products.filter((p) => p.is_active && p.stock_current <= p.stock_min).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>
            Produtos
          </h1>
          <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
            {products.length} produtos cadastrados
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
          style={{ background: "#00805A", color: "#F0F4F0", boxShadow: "0 4px 20px #00805A30" }}
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: "#1A1000", border: "1px solid #F59E0B30" }}
        >
          <AlertTriangle size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
          <p className="text-sm font-semibold" style={{ color: "#F59E0B" }}>
            {lowStockCount} produto{lowStockCount > 1 ? "s" : ""} com estoque baixo ou zerado.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "#4A7A52" }} />
          <Input
            placeholder="Buscar por nome, código, marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl text-sm"
            style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-11 px-3 rounded-xl text-sm font-semibold outline-none"
          style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#6B9B73" }}
        >
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 px-3 rounded-xl text-sm font-semibold outline-none"
          style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#6B9B73" }}
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="low">Estoque baixo</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2B1D" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#111A14", borderBottom: "1px solid #1A2B1D" }}>
              {["Produto", "Categoria", "Preço Venda", "Custo", "Estoque", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-black text-xs uppercase tracking-widest"
                  style={{ color: "#4A7A52" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "#2D4D33" }}>
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const stock = STOCK_STATUS(p.stock_current, p.stock_min);
              const margin =
                p.cost_price && p.cost_price > 0
                  ? ((p.price - p.cost_price) / p.price) * 100
                  : null;
              return (
                <tr
                  key={p.id}
                  className="transition-all hover:brightness-125"
                  style={{
                    background: "#0A0D0A",
                    borderBottom: "1px solid #1A2B1D",
                    opacity: p.is_active ? 1 : 0.5,
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          style={{ border: "1px solid #1A2B1D" }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
                        >
                          <Package size={16} style={{ color: "#4A7A52" }} />
                        </div>
                      )}
                      <div>
                        <p className="font-bold" style={{ color: "#F0F4F0" }}>
                          {p.name}
                        </p>
                        {p.brand && (
                          <p className="text-xs" style={{ color: "#4A7A52" }}>
                            {p.brand}
                          </p>
                        )}
                        {p.barcode && (
                          <p className="text-xs font-mono" style={{ color: "#2D4D33" }}>
                            {p.barcode}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.category ? (
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "#00805A20", color: "#00805A" }}
                      >
                        {p.category.name}
                      </span>
                    ) : (
                      <span style={{ color: "#2D4D33" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-black" style={{ color: "#F0F4F0" }}>
                        {BRL(p.price)}
                      </span>
                      {margin !== null && (
                        <p className="text-xs" style={{ color: "#22C55E" }}>
                          {margin.toFixed(0)}% margem
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "#4A7A52" }}>
                    {p.cost_price ? BRL(p.cost_price) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: stock.bg, color: stock.color }}
                    >
                      <span>{p.stock_current}</span>
                      <span style={{ opacity: 0.6 }}>/ {p.stock_min} mín</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(p.id, p.is_active)}
                      className="flex items-center gap-1.5 text-xs font-bold transition-all"
                      style={{ color: p.is_active ? "#22C55E" : "#4A7A52" }}
                    >
                      {p.is_active ? (
                        <ToggleRight size={20} />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                      {p.is_active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 rounded-lg transition-all hover:brightness-125"
                      style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#6B9B73" }}
                    >
                      <Edit3 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="p-0 overflow-hidden max-w-lg rounded-2xl border-0"
          style={{ background: "#111A14" }}
        >
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #1A2B1D" }}>
            <DialogTitle className="text-xl font-black" style={{ color: "#F0F4F0" }}>
              {editingId ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <button onClick={() => setIsModalOpen(false)} style={{ color: "#4A7A52" }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Nome *
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ex: Cerveja Skol 350ml"
                required
                className="h-11 rounded-xl"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
            </div>

            {/* Barcode + Brand */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                  Código de Barras
                </Label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "#4A7A52" }} />
                  <Input
                    value={form.barcode}
                    onChange={(e) => setField("barcode", e.target.value)}
                    placeholder="7891234567890"
                    className="pl-9 h-11 rounded-xl font-mono text-sm"
                    style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                  Marca
                </Label>
                <Input
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                  placeholder="Ex: Ambev"
                  className="h-11 rounded-xl"
                  style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Categoria
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 z-10" style={{ color: "#4A7A52" }} />
                <select
                  value={form.category_id}
                  onChange={(e) => setField("category_id", e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-xl text-sm outline-none"
                  style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: form.category_id ? "#F0F4F0" : "#4A7A52" }}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                  Preço de Venda *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: "#4A7A52" }}>R$</span>
                  <Input
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                    required
                    className="pl-9 h-11 rounded-xl font-mono"
                    style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                  Preço de Custo
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: "#4A7A52" }}>R$</span>
                  <Input
                    value={form.cost_price}
                    onChange={(e) => setField("cost_price", e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                    className="pl-9 h-11 rounded-xl font-mono"
                    style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
                  />
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                  Estoque Atual
                </Label>
                <Input
                  type="number"
                  value={form.stock_current}
                  onChange={(e) => setField("stock_current", e.target.value)}
                  min={0}
                  className="h-11 rounded-xl"
                  style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                  Estoque Mínimo
                </Label>
                <Input
                  type="number"
                  value={form.stock_min}
                  onChange={(e) => setField("stock_min", e.target.value)}
                  min={0}
                  className="h-11 rounded-xl"
                  style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
                />
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                URL da Imagem
              </Label>
              <Input
                value={form.image_url}
                onChange={(e) => setField("image_url", e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="h-11 rounded-xl text-sm"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="preview"
                  className="w-20 h-20 rounded-xl object-cover mt-2"
                  style={{ border: "1px solid #1A2B1D" }}
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingId)}
                  className="px-4 h-12 rounded-xl text-xs font-bold transition-all"
                  style={{ background: "#E5393510", border: "1px solid #E5393930", color: "#E53935" }}
                >
                  Excluir
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "#00805A", color: "#F0F4F0" }}
              >
                {loading ? "Salvando..." : "Salvar Produto"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
