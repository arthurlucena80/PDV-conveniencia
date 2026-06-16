"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getOrCreateOrder, addOrderItems, removeOrderItem, getOrder } from "@/actions/order";
import { createClient, updateClient, deleteClient, payDebt } from "@/actions/client";
import {
  Search, ChevronLeft, Plus, User, FileText, BadgeDollarSign,
  Wallet, Edit3, BookOpen, BarChart3, Tag, X, Minus,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { CheckoutBar } from "@/components/checkout-bar";
import { CheckoutDrawer } from "@/components/CheckoutDrawer";
import { DebtHistoryModal } from "@/components/DebtHistoryModal";
import { ProductFormModal } from "@/components/ProductFormModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type ScreenState = "CLIENT_SELECTION" | "ORDER_VIEW";

type Category = { id: string; name: string; icon?: string; color?: string };

function CadernoLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#00805A" />
      <text x="16" y="23" textAnchor="middle" fontFamily="serif" fontSize="20" fontWeight="bold" fill="white">C</text>
      <path d="M19 10 L21 10" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19 13 L21 13" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function POSClient({
  initialProducts,
  openOrders,
  clients,
  categories,
}: {
  initialProducts: any[];
  openOrders: any[];
  clients: any[];
  categories: Category[];
}) {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>("CLIENT_SELECTION");

  // Loading
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadingPayDebt, setLoadingPayDebt] = useState(false);
  const [loadingSaveClient, setLoadingSaveClient] = useState(false);

  // Client selection
  const [clientSearch, setClientSearch] = useState("");
  const [selectedDashboardClient, setSelectedDashboardClient] = useState<any>(null);

  // Client modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientFormId, setClientFormId] = useState("");
  const [clientFormName, setClientFormName] = useState("");
  const [clientFormPhone, setClientFormPhone] = useState("");
  const [clientFormCpf, setClientFormCpf] = useState("");

  // Debt
  const [debtPaymentAmount, setDebtPaymentAmount] = useState("");
  const [isDebtHistoryOpen, setIsDebtHistoryOpen] = useState(false);

  // Product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Order / PDV
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState("all");
  const [productSearch, setProductSearch] = useState("");

  // Derived
  const currentClient = selectedDashboardClient 
    ? clients.find(c => c.id === selectedDashboardClient.id) || selectedDashboardClient
    : null;

  const activeOrderForSelected = currentClient
    ? openOrders.find((o) => o.client_id === currentClient.id)
    : null;
  const debtForSelected = currentClient ? Number(currentClient.total_debt) : 0;

  useEffect(() => {
    if (activeOrder?.items) {
      const q: Record<string, number> = {};
      for (const item of activeOrder.items) {
        q[item.product_id] = (q[item.product_id] || 0) + item.quantity;
      }
      setCartQuantities(q);
    }
  }, [activeOrder]);

  const filteredClients = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase())),
    [clients, clientSearch]
  );

  // All categories including "Todos"
  const allCategories = useMemo(
    () => [{ id: "all", name: "Todos", icon: "🏪" }, ...categories],
    [categories]
  );

  // Products filtered by category + search
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchCat = activeCategory === "all" || p.category_id === activeCategory;
      const q = productSearch.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode || "").includes(q) ||
        (p.brand || "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [initialProducts, activeCategory, productSearch]);

  const { total, itemCount } = useMemo(() => {
    let t = 0;
    let count = 0;
    for (const p of initialProducts) {
      const qty = cartQuantities[p.id] || 0;
      t += qty * Number(p.price);
      count += qty;
    }
    return { total: t, itemCount: count };
  }, [cartQuantities, initialProducts]);

  // ── HANDLERS ──────────────────────────────────────────────────────────────

  const handleStartOrder = async (clientId: string | undefined) => {
    if (loadingOrder) return;
    try {
      setLoadingOrder(true);
      const order = await getOrCreateOrder(clientId);
      const fullOrder = await getOrder(order.id);
      setActiveOrder(fullOrder);
      setScreen("ORDER_VIEW");
    } catch (e: any) {
      toast.error("Erro ao abrir comanda: " + e.message);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleAddProduct = async (productId: string) => {
    setCartQuantities((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    try {
      await addOrderItems(activeOrder.id, [{ productId, quantity: 1 }]);
      const updated = await getOrder(activeOrder.id);
      setActiveOrder(updated);
    } catch (e: any) {
      toast.error("Erro ao adicionar: " + e.message);
      const updated = await getOrder(activeOrder.id);
      setActiveOrder(updated);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    const currentQ = cartQuantities[productId] || 0;
    if (currentQ <= 0) return;
    setCartQuantities((prev) => ({ ...prev, [productId]: Math.max(0, currentQ - 1) }));
    try {
      const orderItem = activeOrder.items.find((i: any) => i.product_id === productId);
      if (orderItem) {
        await removeOrderItem(activeOrder.id, orderItem.id);
        const updated = await getOrder(activeOrder.id);
        setActiveOrder(updated);
      }
    } catch (e: any) {
      toast.error("Erro ao remover: " + e.message);
      const updated = await getOrder(activeOrder.id);
      setActiveOrder(updated);
    }
  };

  const handleCharge = () => {
    if (itemCount === 0) { toast.error("Adicione itens antes de cobrar."); return; }
    setIsCheckoutOpen(true);
  };

  const openNewClientModal = () => {
    setClientFormId(""); setClientFormName(""); setClientFormPhone(""); setClientFormCpf("");
    setIsClientModalOpen(true);
  };

  const openEditClientModal = () => {
    if (!currentClient) return;
    setClientFormId(currentClient.id);
    setClientFormName(currentClient.name);
    setClientFormPhone(currentClient.phone || "");
    setClientFormCpf(currentClient.cpf || "");
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFormName.trim()) { toast.error("Digite o nome do cliente."); return; }
    try {
      setLoadingSaveClient(true);
      if (clientFormId) {
        await updateClient(clientFormId, { name: clientFormName, phone: clientFormPhone, cpf: clientFormCpf });
      } else {
        await createClient({ name: clientFormName, phone: clientFormPhone, cpf: clientFormCpf });
      }
      setIsClientModalOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoadingSaveClient(false);
    }
  };

  const handlePayDebtClick = async () => {
    if (!currentClient) { toast.error("Selecione um cliente."); return; }
    const parsedValue = debtPaymentAmount.replace(",", ".");
    const amount = parseFloat(parsedValue);
    if (!debtPaymentAmount || isNaN(amount) || amount <= 0) {
      toast.error("Digite um valor válido para pagamento."); return;
    }
    if (amount > debtForSelected) {
      toast.error(`Valor (${BRL(amount)}) maior que a dívida (${BRL(debtForSelected)}).`); return;
    }
    try {
      setLoadingPayDebt(true);
      await payDebt(currentClient.id, amount);
      toast.success("Pagamento registrado com sucesso!");
      setDebtPaymentAmount("");
      router.refresh();
    } catch (e: any) {
      toast.error("Erro ao registrar pagamento: " + e.message);
    } finally {
      setLoadingPayDebt(false);
    }
  };

  // ── CLIENT SELECTION SCREEN ───────────────────────────────────────────────
  if (screen === "CLIENT_SELECTION") {
    return (
      <main
        className="min-h-screen md:h-screen flex flex-col md:flex-row text-[#F4F6F3] md:overflow-hidden"
        style={{ backgroundColor: "#0C0F0A" }}
      >
        {/* ── Sidebar ── */}
        <aside
          className="w-full md:w-[320px] md:flex-shrink-0 flex flex-col z-10"
          style={{ backgroundColor: "#111A14CC", backdropFilter: "blur(24px)", borderRight: "1px solid #1E2E21" }}
        >
          {/* Brand Header — Cabeçalho com logo e botão de voltar */}
          <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #1E2E21" }}>
            {/* Linha superior: logo + botão de voltar ao admin */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <CadernoLogo size={36} />
                <div>
                  <h1 className="text-lg font-black tracking-tight" style={{ color: "#F4F6F3" }}>
                    Caderno PDV
                  </h1>
                  <p className="text-xs font-medium" style={{ color: "#7A9B82" }}>
                    Sistema de Comandas
                  </p>
                </div>
              </div>
              {/* Botão "Voltar ao Painel Admin" */}
              <a
                href="/admin"
                title="Voltar ao Painel Admin"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:brightness-125 flex-shrink-0"
                style={{
                  background: "#162119",
                  border: "1px solid #1E2E21",
                  color: "#7A9B82",
                }}
              >
                <ChevronLeft size={14} />
                Admin
              </a>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                style={{ color: "#7A9B82" }}
              />
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9 h-11 text-sm rounded-xl focus-visible:ring-[#00805A]"
                style={{ background: "#162119", border: "1px solid #1E2E21", color: "#F4F6F3" }}
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStartOrder(undefined)}
                disabled={loadingOrder}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "#F59E0B", color: "#0C0F0A" }}
              >
                <Plus className="size-5" />
                {loadingOrder ? "..." : "Avulsa"}
              </button>
              <button
                type="button"
                onClick={openNewClientModal}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 hover:brightness-110"
                style={{ background: "#162119", border: "1px solid #1E2E21", color: "#F4F6F3" }}
              >
                <User className="size-5" />
                Cliente
              </button>
              <button
                type="button"
                onClick={() => { setSelectedProduct(null); setIsProductModalOpen(true); }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 hover:brightness-110"
                style={{ background: "#162119", border: "1px solid #1E2E21", color: "#F4F6F3" }}
              >
                <Plus className="size-5" />
                Produto
              </button>
            </div>
          </div>

          {/* Client List */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#7A9B82" }}>
              Clientes ({filteredClients.length})
            </p>
            <a
              href="/admin"
              className="flex items-center gap-1 text-xs font-bold transition-all hover:brightness-125"
              style={{ color: "#4A7A52" }}
            >
              <BarChart3 size={12} /> Admin
            </a>
          </div>
          <div className="flex-1 md:overflow-y-auto px-4 pb-4 space-y-1.5">
            {filteredClients.map((client) => {
              const orderAmount =
                openOrders.find((o) => o.client_id === client.id)?.total_amount || 0;
              const debt = Number(client.total_debt);
              const isSelected = currentClient?.id === client.id;

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedDashboardClient(client)}
                  className="flex justify-between items-center px-3.5 py-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: isSelected ? "#162119" : "#0C0F0A",
                    borderTop: isSelected ? "1px solid #00805A80" : "1px solid #1E2E21",
                    borderRight: isSelected ? "1px solid #00805A80" : "1px solid #1E2E21",
                    borderBottom: isSelected ? "1px solid #00805A80" : "1px solid #1E2E21",
                    borderLeft: debt > 0
                      ? "3px solid #E53935"
                      : isSelected
                      ? "3px solid #00805A"
                      : "3px solid #1E2E21",
                  }}
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate" style={{ color: "#F4F6F3" }}>
                      {client.name}
                    </h3>
                    {debt > 0 ? (
                      <p className="text-xs font-semibold mt-0.5" style={{ color: "#E53935" }}>
                        Fiado: {BRL(debt)}
                      </p>
                    ) : (
                      <p className="text-xs mt-0.5" style={{ color: "#7A9B82" }}>
                        ✓ Conta limpa
                      </p>
                    )}
                  </div>
                  {Number(orderAmount) > 0 && (
                    <span
                      className="text-xs font-bold ml-2 shrink-0 px-2 py-1 rounded-lg"
                      style={{
                        color: "#F59E0B",
                        background: "#F59E0B18",
                        border: "1px solid #F59E0B30",
                      }}
                    >
                      {BRL(Number(orderAmount))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Main Dashboard ── */}
        <section className="flex-1 overflow-y-auto" style={{ backgroundColor: "#0C0F0A" }}>
          {currentClient ? (
            <div className="flex flex-col">
              {/* Client Header */}
              <div
                className="px-6 md:px-10 pt-7 pb-5 flex items-center justify-between gap-4"
                style={{
                  borderBottom: "1px solid #1E2E21",
                  background: "linear-gradient(135deg, #111A14 0%, #0C0F0A 100%)",
                }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="size-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0"
                    style={{ background: "#00805A20", border: "1px solid #00805A40", color: "#00805A" }}
                  >
                    {currentClient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-black tracking-tight truncate" style={{ color: "#F4F6F3" }}>
                      {currentClient.name}
                    </h2>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                      {currentClient.phone && (
                        <span className="text-xs" style={{ color: "#7A9B82" }}>
                          📞 {currentClient.phone}
                        </span>
                      )}
                      {currentClient.cpf && (
                        <span className="text-xs" style={{ color: "#7A9B82" }}>
                          📄 {currentClient.cpf}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openEditClientModal}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110"
                  style={{ background: "#162119", border: "1px solid #1E2E21", color: "#7A9B82" }}
                >
                  <Edit3 className="size-3.5" /> Editar
                </button>
              </div>

              {/* Cards */}
              <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Fiado Card */}
                <div
                  className="rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden"
                  style={{
                    background: debtForSelected > 0 ? "#1A0F0F" : "#111A14",
                    border: debtForSelected > 0 ? "1px solid #E5393520" : "1px solid #1E2E21",
                  }}
                >
                  {debtForSelected > 0 && (
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ background: "radial-gradient(ellipse at top right, #E5393510 0%, transparent 60%)" }}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl" style={{ background: "#E5393520", color: "#E53935" }}>
                        <Wallet className="size-5" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: "#7A9B82" }}>
                        Fiado em Aberto
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDebtHistoryOpen(true)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all hover:brightness-110"
                      style={{ color: "#7A9B82", background: "#162119", border: "1px solid #1E2E21" }}
                    >
                      <FileText className="size-3.5" /> Extrato
                    </button>
                  </div>

                  <div>
                    <div
                      className="text-5xl font-black tracking-tight"
                      style={{ color: debtForSelected > 0 ? "#E53935" : "#3d5e42" }}
                    >
                      {BRL(debtForSelected)}
                    </div>
                    {debtForSelected === 0 && (
                      <p className="text-sm mt-1.5 font-medium" style={{ color: "#00805A" }}>
                        ✓ Tudo em dia — sem dívidas!
                      </p>
                    )}
                  </div>

                  {debtForSelected > 0 ? (
                    <div
                      className="rounded-xl p-4 space-y-3"
                      style={{ background: "#0C0F0A", border: "1px solid #1E2E21" }}
                    >
                      <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#7A9B82" }}>
                        Receber Pagamento
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                            style={{ color: "#7A9B82" }}
                          >
                            R$
                          </span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={debtPaymentAmount}
                            onChange={(e) => setDebtPaymentAmount(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handlePayDebtClick(); }}
                            className="h-12 text-xl font-black pl-10 rounded-xl"
                            style={{ background: "#111A14", border: "1px solid #1E2E21", color: "#F4F6F3" }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handlePayDebtClick}
                          disabled={loadingPayDebt}
                          className="h-12 px-6 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                          style={{ background: "#22C55E", color: "#0C0F0A" }}
                        >
                          {loadingPayDebt ? "..." : "Pagar"}
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[25, 50, 100].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setDebtPaymentAmount(Math.min(v, debtForSelected).toFixed(2))}
                            className="py-2 text-xs font-bold rounded-lg transition-all hover:brightness-110"
                            style={{ border: "1px solid #1E2E21", background: "#111A14", color: "#7A9B82" }}
                          >
                            R${v}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setDebtPaymentAmount(debtForSelected.toFixed(2))}
                          className="py-2 text-xs font-bold rounded-lg"
                          style={{ border: "1px solid #22C55E40", background: "#22C55E15", color: "#22C55E" }}
                        >
                          Tudo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-xl p-4 text-center"
                      style={{ background: "#0C0F0A", border: "1px solid #1E2E21" }}
                    >
                      <p className="text-sm font-medium" style={{ color: "#3d5e42" }}>
                        Nenhum débito pendente
                      </p>
                    </div>
                  )}
                </div>

                {/* Comanda Card */}
                <div
                  className="rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden"
                  style={{ background: "#111A14", border: "1px solid #1E2E21" }}
                >
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ background: "radial-gradient(ellipse at top right, #00805A0A 0%, transparent 60%)" }}
                  />

                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl" style={{ background: "#F59E0B20", color: "#F59E0B" }}>
                      <BadgeDollarSign className="size-5" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: "#7A9B82" }}>
                      Comanda Atual
                    </h3>
                  </div>

                  {activeOrderForSelected ? (
                    <>
                      <div>
                        <div className="text-5xl font-black tracking-tight" style={{ color: "#F59E0B" }}>
                          {BRL(Number(activeOrderForSelected.total_amount))}
                        </div>
                        <p className="text-sm mt-1.5 font-medium" style={{ color: "#7A9B82" }}>
                          {activeOrderForSelected.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0} itens
                          na comanda
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartOrder(currentClient.id)}
                        disabled={loadingOrder}
                        className="w-full h-14 mt-auto rounded-xl font-black text-base transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: "#00805A", color: "#F4F6F3", boxShadow: "0 4px 24px #00805A30" }}
                      >
                        {loadingOrder ? "Abrindo..." : "→ Continuar Comanda"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="text-5xl font-black tracking-tight" style={{ color: "#2d4a32" }}>
                          R$ 0,00
                        </div>
                        <p className="text-sm mt-1.5 font-medium" style={{ color: "#3d5e42" }}>
                          Sem comanda aberta
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartOrder(currentClient.id)}
                        disabled={loadingOrder}
                        className="w-full h-14 mt-auto rounded-xl font-black text-base transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: "#00805A", color: "#F4F6F3", boxShadow: "0 4px 24px #00805A30" }}
                      >
                        {loadingOrder ? "Abrindo..." : "+ Abrir Nova Comanda"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="hidden md:flex h-full flex-col items-center justify-center text-center p-8"
              style={{ opacity: 0.4 }}
            >
              <BookOpen className="size-16 mb-4" style={{ color: "#1E2E21" }} />
              <h2 className="text-xl font-bold" style={{ color: "#7A9B82" }}>
                Selecione um cliente
              </h2>
              <p className="max-w-xs mt-1.5 text-sm" style={{ color: "#3d5e42" }}>
                Clique em um cliente para ver o fiado, extrato e abrir comanda.
              </p>
            </div>
          )}
        </section>

        {/* ── Modals ── */}
        <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
          <DialogContent
            className="p-0 overflow-hidden rounded-2xl max-w-sm border-0"
            style={{ background: "#111A14" }}
          >
            <div className="px-6 py-6" style={{ borderBottom: "1px solid #1E2E21" }}>
              <DialogTitle className="text-xl font-black" style={{ color: "#F4F6F3" }}>
                {clientFormId ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </div>
            <div className="px-6 py-5">
              <form onSubmit={handleSaveClient} className="space-y-4">
                {[
                  { label: "Nome do Cliente", value: clientFormName, set: setClientFormName, required: true, placeholder: "Ex: João Silva" },
                  { label: "Telefone (Opcional)", value: clientFormPhone, set: setClientFormPhone, required: false, placeholder: "(11) 99999-9999" },
                  { label: "CPF (Opcional)", value: clientFormCpf, set: setClientFormCpf, required: false, placeholder: "000.000.000-00" },
                ].map(({ label, value, set, required, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#7A9B82" }}>
                      {label}
                    </Label>
                    <Input
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      required={required}
                      placeholder={placeholder}
                      className="h-12 rounded-xl text-sm focus-visible:ring-[#00805A]"
                      style={{ background: "#0C0F0A", border: "1px solid #1E2E21", color: "#F4F6F3" }}
                    />
                  </div>
                ))}
                <div className="flex gap-2.5 pt-2">
                  {clientFormId && (
                    <button
                      type="button"
                      className="h-12 px-4 rounded-xl text-xs font-bold"
                      style={{ background: "#E5393510", border: "1px solid #E5393930", color: "#E53935" }}
                      onClick={async () => {
                        if (!confirm("Excluir cliente?")) return;
                        try { await deleteClient(clientFormId); setIsClientModalOpen(false); router.refresh(); }
                        catch (e: any) { toast.error(e.message); }
                      }}
                    >
                      Excluir
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loadingSaveClient}
                    className="flex-1 h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: "#00805A", color: "#F4F6F3" }}
                  >
                    {loadingSaveClient ? "Salvando..." : "Salvar Cliente"}
                  </button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {currentClient && (
          <DebtHistoryModal
            isOpen={isDebtHistoryOpen}
            onOpenChange={setIsDebtHistoryOpen}
            clientId={currentClient.id}
            clientName={currentClient.name}
            clientPhone={currentClient.phone}
          />
        )}

        <ProductFormModal
          isOpen={isProductModalOpen}
          onOpenChange={(open) => { setIsProductModalOpen(open); if (!open) { setSelectedProduct(null); router.refresh(); } }}
          product={selectedProduct}
        />
      </main>
    );
  }

  // ── ORDER VIEW ─────────────────────────────────────────────────────────────
  if (screen === "ORDER_VIEW") {
    const clientName = activeOrder?.client ? activeOrder.client.name : "Venda Avulsa";
    return (
      <main className="h-screen flex flex-col text-[#F4F6F3]" style={{ backgroundColor: "#0C0F0A" }}>
        <header
          className="flex-shrink-0 px-4 md:px-6 py-4 space-y-3 sticky top-0 z-20"
          style={{ borderBottom: "1px solid #1E2E21", background: "#111A14CC", backdropFilter: "blur(24px)" }}
        >
          {/* Top row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScreen("CLIENT_SELECTION")}
                className="flex size-10 items-center justify-center rounded-xl transition-all active:scale-95"
                style={{ background: "#162119", border: "1px solid #1E2E21", color: "#7A9B82" }}
              >
                <ChevronLeft className="size-5" />
              </button>
              <div>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#7A9B82" }}>
                  Comanda
                </p>
                <h1 className="text-xl font-black tracking-tight" style={{ color: "#F4F6F3" }}>
                  {clientName}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Cart badge */}
              {itemCount > 0 && (
                <div
                  className="px-3 py-1.5 rounded-xl text-sm font-black"
                  style={{ background: "#F59E0B20", color: "#F59E0B", border: "1px solid #F59E0B30" }}
                >
                  {itemCount} iten{itemCount !== 1 ? "s" : ""}
                </div>
              )}
              <button
                type="button"
                onClick={() => { setSelectedProduct(null); setIsProductModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                style={{ background: "#162119", border: "1px solid #1E2E21", color: "#7A9B82" }}
              >
                <Plus className="size-4" /> Produto
              </button>
            </div>
          </div>

          {/* Search + Category filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                style={{ color: "#7A9B82" }}
              />
              <Input
                placeholder="Buscar produto, código ou marca..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 h-10 text-sm rounded-xl"
                style={{ background: "#162119", border: "1px solid #1E2E21", color: "#F4F6F3" }}
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#7A9B82" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all"
                style={
                  activeCategory === cat.id
                    ? { background: "#00805A", color: "#F4F6F3", boxShadow: "0 0 16px #00805A40" }
                    : { background: "#162119", border: "1px solid #1E2E21", color: "#7A9B82" }
                }
              >
                {cat.icon && <span className="text-sm">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        </header>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-40">
              <Tag size={48} style={{ color: "#1E2E21", marginBottom: "12px" }} />
              <p className="text-lg font-bold" style={{ color: "#7A9B82" }}>Nenhum produto encontrado</p>
              <p className="text-sm mt-1" style={{ color: "#3d5e42" }}>Tente outra categoria ou busca.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={cartQuantities[product.id] ?? 0}
                  onAdd={() => handleAddProduct(product.id)}
                  onRemove={() => handleRemoveProduct(product.id)}
                  onEdit={() => { setSelectedProduct(product); setIsProductModalOpen(true); }}
                />
              ))}
            </div>
          )}
        </div>

        <CheckoutBar total={total} itemCount={itemCount} onCharge={handleCharge} />

        {activeOrder && (
          <CheckoutDrawer
            isOpen={isCheckoutOpen}
            onOpenChange={setIsCheckoutOpen}
            orderId={activeOrder.id}
            totalAmount={total}
            clients={clients}
            onSuccessReset={() => {
              setScreen("CLIENT_SELECTION");
              setActiveOrder(null);
              setCartQuantities({});
              setClientSearch("");
              setProductSearch("");
              setActiveCategory("all");
            }}
            order={activeOrder}
          />
        )}
        <ProductFormModal
          isOpen={isProductModalOpen}
          onOpenChange={(open) => { setIsProductModalOpen(open); if (!open) { setSelectedProduct(null); router.refresh(); } }}
          product={selectedProduct}
        />
      </main>
    );
  }

  return null;
}
