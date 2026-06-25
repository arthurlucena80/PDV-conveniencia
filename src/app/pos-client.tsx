"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getOrCreateOrder, addOrderItems, removeOrderItem, getOrder, deleteOrder, updateOrderNotes } from "@/actions/order";
import { createClient, updateClient, deleteClient, payDebt } from "@/actions/client";
import {
  Search, ChevronLeft, Plus, User, FileText, BadgeDollarSign,
  Wallet, Edit3, BookOpen, BarChart3, Tag, X, Minus, Menu,
  ShoppingCart, ClipboardList, LayoutDashboard, HelpCircle
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { CheckoutBar } from "@/components/checkout-bar";
import { CheckoutDrawer } from "@/components/CheckoutDrawer";
import { DebtHistoryModal } from "@/components/DebtHistoryModal";
import { ProductFormModal } from "@/components/ProductFormModal";
import { UserManual } from "@/components/UserManual";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type ScreenState = "VENDA" | "CLIENTES" | "PRODUTOS" | "COMANDAS" | "HISTORICO" | "AJUDA";

type Category = { id: string; name: string; icon?: string; color?: string };

function BrandLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#F97316" />
      <text x="16" y="22" textAnchor="middle" fontFamily="sans-serif" fontSize="18" fontWeight="900" fill="white">CNM</text>
    </svg>
  );
}

export function POSClient({
  initialProducts,
  openOrders,
  closedOrders,
  clients,
  categories,
}: {
  initialProducts: any[];
  openOrders: any[];
  closedOrders: any[];
  clients: any[];
  categories: Category[];
}) {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>("VENDA");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Loading
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadingPayDebt, setLoadingPayDebt] = useState(false);
  const [loadingSaveClient, setLoadingSaveClient] = useState(false);

  // Client Selection & Debt
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null); // For Comandas/Debt
  const [debtPaymentAmount, setDebtPaymentAmount] = useState("");
  const [isDebtHistoryOpen, setIsDebtHistoryOpen] = useState(false);

  // Client modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientFormId, setClientFormId] = useState("");
  const [clientFormName, setClientFormName] = useState("");
  const [clientFormPhone, setClientFormPhone] = useState("");
  const [clientFormCpf, setClientFormCpf] = useState("");

  // Product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Order modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderFormId, setOrderFormId] = useState("");
  const [orderFormNotes, setOrderFormNotes] = useState("");

  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  
  // Historico
  const [historySearch, setHistorySearch] = useState("");

  // Ensure an active order for Venda
  useEffect(() => {
    if (screen === "VENDA" && !activeOrder) {
      // Create or get anonymous order
      handleStartOrder(undefined, false, true);
    }
  }, [screen]);

  useEffect(() => {
    if (activeOrder?.items) {
      const q: Record<string, number> = {};
      for (const item of activeOrder.items) {
        q[item.product_id] = (q[item.product_id] || 0) + item.quantity;
      }
      setCartQuantities(q);
    } else {
      setCartQuantities({});
    }
  }, [activeOrder]);

  const filteredClients = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase())),
    [clients, clientSearch]
  );

  const filteredHistory = useMemo(() => {
    return closedOrders.filter(order => {
      const q = historySearch.toLowerCase();
      const clientName = order.client?.name?.toLowerCase() || "";
      const notes = order.notes?.toLowerCase() || "";
      return clientName.includes(q) || notes.includes(q) || order.id.includes(q);
    });
  }, [closedOrders, historySearch]);

  const allCategories = useMemo(
    () => [{ id: "all", name: "Todos" }, ...categories],
    [categories]
  );

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

  const handleStartOrder = async (clientId?: string, forceNew: boolean = false, silent: boolean = false) => {
    try {
      if(!silent) setLoadingOrder(true);
      const newOrder = await getOrCreateOrder(clientId, forceNew);
      setActiveOrder(newOrder);
      if(!silent) setScreen("VENDA");
      setIsSidebarOpen(false);
    } catch (e: any) {
      if(!silent) toast.error("Erro ao iniciar comanda: " + e.message);
    } finally {
      if(!silent) setLoadingOrder(false);
    }
  };

  const handleAddProduct = async (productId: string) => {
    if (!activeOrder) {
      toast.error("Aguarde a inicialização da comanda...");
      return;
    }
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
    if (!activeOrder) return;
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

  const openEditClientModal = (c: any) => {
    setClientFormId(c.id);
    setClientFormName(c.name);
    setClientFormPhone(c.phone || "");
    setClientFormCpf(c.cpf || "");
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFormName.trim()) { toast.error("Digite o nome do cliente."); return; }
    try {
      setLoadingSaveClient(true);
      if (clientFormId) {
        await updateClient(clientFormId, { name: clientFormName, phone: clientFormPhone, cpf: clientFormCpf });
        toast.success("Cliente atualizado.");
      } else {
        await createClient({ name: clientFormName, phone: clientFormPhone, cpf: clientFormCpf });
        toast.success("Cliente criado.");
      }
      setIsClientModalOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoadingSaveClient(false);
    }
  };

  const handlePayDebtClick = async (c: any, amountStr: string) => {
    const amount = parseFloat(amountStr.replace(",", "."));
    const debt = Number(c.total_debt);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Digite um valor válido."); return;
    }
    if (amount > debt) {
      toast.error(`Valor maior que a dívida (${BRL(debt)}).`); return;
    }
    try {
      setLoadingPayDebt(true);
      await payDebt(c.id, amount);
      toast.success("Pagamento registrado!");
      setDebtPaymentAmount("");
      router.refresh();
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setLoadingPayDebt(false);
    }
  };

  const openNewOrderModal = () => {
    setOrderFormId("");
    setOrderFormNotes("");
    setIsOrderModalOpen(true);
  };

  const openEditOrderModal = (order: any) => {
    setOrderFormId(order.id);
    setOrderFormNotes(order.notes || "");
    setIsOrderModalOpen(true);
  };

  const handleSaveOrderNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (orderFormId) {
        await updateOrderNotes(orderFormId, orderFormNotes);
        toast.success("Comanda atualizada.");
      } else {
        const newOrder = await getOrCreateOrder(undefined, true);
        if (orderFormNotes) {
          await updateOrderNotes(newOrder.id, orderFormNotes);
        }
        toast.success("Comanda criada.");
      }
      setIsOrderModalOpen(false);
      router.refresh();
    } catch(e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Excluir esta comanda permanentemente?")) return;
    try {
      await deleteOrder(orderId);
      toast.success("Comanda excluída.");
      router.refresh();
    } catch(e: any) {
      toast.error(e.message);
    }
  };

  // ── RENDER SIDEBAR ────────────────────────────────────────────────────────
  const renderSidebar = () => (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar Content */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-orange-500">
          <div className="flex items-center gap-3">
            <BrandLogo size={32} />
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">
                ControleNaMão
              </h1>
            </div>
          </div>
          <button className="md:hidden text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <button
            onClick={() => { setScreen("VENDA"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${screen === "VENDA" ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <ShoppingCart size={20} />
            Vender
          </button>
          
          <button
            onClick={() => { setScreen("COMANDAS"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${screen === "COMANDAS" ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <ClipboardList size={20} />
            Comanda / Mesas
          </button>

          <button
            onClick={() => { setScreen("HISTORICO"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${screen === "HISTORICO" ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <FileText size={20} />
            Histórico de Vendas
          </button>

          <button
            onClick={() => { setScreen("PRODUTOS"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${screen === "PRODUTOS" ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <Tag size={20} />
            Cadastro de Produtos
          </button>

          <button
            onClick={() => { setScreen("CLIENTES"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${screen === "CLIENTES" ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <User size={20} />
            Cliente
          </button>

          <button
            onClick={() => { setScreen("AJUDA"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${screen === "AJUDA" ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            <HelpCircle size={20} />
            Ajuda / Manual
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <a
            href="/admin"
            className="flex items-center gap-3 px-3 py-3 w-full rounded-xl font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <LayoutDashboard size={20} />
            Painel Admin
          </a>
        </div>
      </aside>
    </>
  );

  // ── RENDER MAIN CONTENT ───────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900 font-sans">
      {renderSidebar()}

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* HEADER */}
        <header className="flex-shrink-0 bg-orange-500 text-white shadow-md z-10">
          <div className="flex items-center h-16 px-4 gap-3">
            <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-black tracking-wide flex-1">
              {screen === "VENDA" && "Venda"}
              {screen === "CLIENTES" && "Clientes"}
              {screen === "PRODUTOS" && "Produtos"}
              {screen === "COMANDAS" && "Comandas / Mesas"}
              {screen === "HISTORICO" && "Histórico de Vendas"}
              {screen === "AJUDA" && "Ajuda / Manual"}
            </h2>
            {screen === "VENDA" && (
              <div className="flex items-center gap-3">
                <button onClick={() => setProductSearch(productSearch === "" ? " " : "")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Search size={20} />
                </button>
              </div>
            )}
            {(screen === "PRODUTOS" || screen === "CLIENTES" || screen === "COMANDAS") && (
              <button 
                onClick={() => {
                  if (screen === "PRODUTOS") setIsProductModalOpen(true);
                  else if (screen === "CLIENTES") openNewClientModal();
                  else openNewOrderModal();
                }} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1 text-sm font-bold"
              >
                <Plus size={20} />
              </button>
            )}
          </div>

          {/* SEARCH & FILTERS FOR VENDA */}
          {screen === "VENDA" && (
            <div className="bg-white px-4 py-2 border-b border-gray-200">
              {/* Optional Search Bar inline */}
              {productSearch !== "" && (
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    placeholder="Buscar produto..."
                    value={productSearch === " " ? "" : productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 h-10 bg-gray-100 border-transparent rounded-xl focus-visible:ring-orange-500"
                  />
                </div>
              )}
              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {allCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === cat.id ? "bg-orange-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
          
          {/* VENDA SCREEN */}
          {screen === "VENDA" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={cartQuantities[product.id] ?? 0}
                  onAdd={() => handleAddProduct(product.id)}
                  onRemove={() => handleRemoveProduct(product.id)}
                />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <Tag size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-bold text-lg">Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          )}

          {/* PRODUTOS SCREEN */}
          {screen === "PRODUTOS" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {initialProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={0}
                  onAdd={() => { setSelectedProduct(product); setIsProductModalOpen(true); }}
                  onRemove={() => {}}
                  onEdit={() => { setSelectedProduct(product); setIsProductModalOpen(true); }}
                />
              ))}
            </div>
          )}

          {/* CLIENTES SCREEN */}
          {screen === "CLIENTES" && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-10 h-12 text-base rounded-xl bg-white border-gray-200 shadow-sm focus-visible:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClients.map((client) => {
                  const debt = Number(client.total_debt);
                  return (
                    <div key={client.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="size-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xl">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{client.name}</h3>
                            <p className="text-sm text-gray-500">{client.phone || client.cpf || "Sem contato"}</p>
                          </div>
                        </div>
                        {debt > 0 && (
                          <span className="px-3 py-1 bg-red-50 text-red-600 font-bold text-xs rounded-full border border-red-100">
                            Fiado: {BRL(debt)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-auto">
                        <button 
                          onClick={() => { handleStartOrder(client.id, true); }}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Plus size={16} /> Comanda
                        </button>
                        {debt > 0 && (
                          <button 
                            onClick={() => { setSelectedClient(client); setIsDebtHistoryOpen(true); }}
                            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                            <Wallet size={16} /> Fiado
                          </button>
                        )}
                        <button 
                          onClick={() => openEditClientModal(client)}
                          className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMANDAS SCREEN */}
          {screen === "COMANDAS" && (
            <div className="max-w-4xl mx-auto space-y-4">
               {openOrders.length === 0 ? (
                 <div className="text-center py-12 text-gray-400">
                    <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-lg">Nenhuma comanda aberta</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {openOrders.map(order => (
                     <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start mb-3">
                         <div>
                           <h3 className="font-black text-gray-900 text-lg">
                             {order.notes || order.client?.name || "Venda Avulsa"}
                           </h3>
                           <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                           <div className="bg-orange-100 text-orange-700 font-black px-3 py-1 rounded-lg">
                             {BRL(Number(order.total_amount))}
                           </div>
                           <div className="flex gap-2">
                             <button onClick={() => openEditOrderModal(order)} className="p-1.5 text-gray-400 hover:text-orange-500 bg-gray-50 rounded-md transition-colors">
                               <Edit3 size={16} />
                             </button>
                             <button onClick={() => handleDeleteOrder(order.id)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 rounded-md transition-colors">
                               <X size={16} />
                             </button>
                           </div>
                         </div>
                       </div>
                       <div className="flex justify-between items-center mt-4">
                         <span className="text-sm font-bold text-gray-500">{order.items?.reduce((a:any,b:any)=>a+b.quantity,0) || 0} itens</span>
                         <button 
                           onClick={() => { setActiveOrder(order); setScreen("VENDA"); }}
                           className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                         >
                           Continuar
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* HISTORICO SCREEN */}
          {screen === "HISTORICO" && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <Input
                  placeholder="Buscar no histórico (nome, mesa, ID)..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-10 h-12 text-base rounded-xl bg-white border-gray-200 shadow-sm focus-visible:ring-orange-500"
                />
              </div>

              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-bold text-lg">Nenhum pedido encontrado</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredHistory.map((order) => (
                    <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-gray-900 text-base truncate">
                            {order.notes || order.client?.name || "Venda Avulsa"}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(order.closed_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="font-black text-gray-900 text-lg block">
                            {BRL(Number(order.total_amount) - Number(order.discount || 0))}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Status
                        </span>
                        {order.status === "PAID" ? (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                            ✅ PAGO
                          </span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                            ⏳ FIADO / A PAGAR
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AJUDA SCREEN */}
          {screen === "AJUDA" && (
            <div className="max-w-4xl mx-auto">
              <UserManual />
            </div>
          )}

        </div>

        {screen === "VENDA" && (
          <CheckoutBar 
            total={total} 
            itemCount={itemCount} 
            onCharge={handleCharge} 
            onLeaveOpen={() => {
              setActiveOrder(null);
              setCartQuantities({});
              setProductSearch("");
              setActiveCategory("all");
              handleStartOrder(undefined, false, true);
              setScreen("VENDA");
            }}
            order={activeOrder} 
          />
        )}
      </main>

      {/* MODALS & DRAWERS */}
      {activeOrder && (
        <CheckoutDrawer
          isOpen={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          orderId={activeOrder.id}
          totalAmount={total}
          clients={clients}
          onSuccessReset={() => {
            setActiveOrder(null);
            setCartQuantities({});
            setProductSearch("");
            setActiveCategory("all");
            // Re-create a new anonymous order instantly for next sale
            handleStartOrder(undefined, false, true);
          }}
          order={activeOrder}
        />
      )}

      {/* Client Edit/Create Modal */}
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-sm border-0 bg-white shadow-xl">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <DialogTitle className="text-xl font-black text-gray-900">
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
                  <Label className="text-xs font-bold uppercase text-gray-500">{label}</Label>
                  <Input
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    required={required}
                    placeholder={placeholder}
                    className="h-12 rounded-xl bg-white border-gray-200 focus-visible:ring-orange-500"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                {clientFormId && (
                  <button
                    type="button"
                    className="h-12 px-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100"
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
                  className="flex-1 h-12 rounded-xl font-black text-sm bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {loadingSaveClient ? "Salvando..." : "Salvar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debt History Modal */}
      {selectedClient && (
        <DebtHistoryModal
          isOpen={isDebtHistoryOpen}
          onOpenChange={setIsDebtHistoryOpen}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          clientPhone={selectedClient.phone}
        />
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onOpenChange={(open) => { setIsProductModalOpen(open); if (!open) { setSelectedProduct(null); router.refresh(); } }}
        product={selectedProduct}
        categories={categories}
      />

      {/* Order Form Modal (Mesas) */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-sm border-0 bg-white shadow-xl">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <DialogTitle className="text-xl font-black text-gray-900">
              {orderFormId ? "Editar Comanda" : "Nova Comanda/Mesa"}
            </DialogTitle>
          </div>
          <div className="px-6 py-5">
            <form onSubmit={handleSaveOrderNotes} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-gray-500">Nome / Número da Mesa</Label>
                <Input
                  value={orderFormNotes}
                  onChange={(e) => setOrderFormNotes(e.target.value)}
                  placeholder="Ex: Mesa 05"
                  className="h-12 rounded-xl bg-white border-gray-200 focus-visible:ring-orange-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl font-black text-sm bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
