"use client";

import { useState, useMemo } from "react";
import { createClient, updateClient, deleteClient } from "@/actions/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Plus, Edit3, Users, AlertTriangle, CheckCircle2,
  Phone, Mail, CreditCard, MapPin, X, User, History
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getClientLogs } from "@/actions/client-log";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Client = {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  birth_date?: string;
  credit_limit: number;
  total_debt: number;
  notes?: string;
  created_at: string;
};

const emptyForm = {
  name: "", cpf: "", phone: "", email: "", address: "", birth_date: "", credit_limit: "0", notes: "",
};

export function ClientesAdminClient({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openLog = async (c: Client) => {
    setSelected(c);
    setIsOpen(false);
    setLogs([]);
    setIsLogOpen(true);
    setLogLoading(true);
    try {
      const data = await getClientLogs(c.id);
      setLogs(data);
    } catch (err) {
      toast.error("Erro ao carregar histórico");
    } finally {
      setLogLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase();
      const matchQ = !q || c.name.toLowerCase().includes(q) || (c.phone || "").includes(q) || (c.cpf || "").includes(q);
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "debtors" && c.total_debt > 0) ||
        (filterStatus === "clean" && c.total_debt === 0);
      return matchQ && matchStatus;
    });
  }, [clients, search, filterStatus]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditId(c.id);
    setForm({
      name: c.name, cpf: c.cpf || "", phone: c.phone || "",
      email: c.email || "", address: c.address || "",
      birth_date: c.birth_date ? c.birth_date.slice(0, 10) : "",
      credit_limit: c.credit_limit.toString(),
      notes: c.notes || "",
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    try {
      setLoading(true);
      const data = {
        name: form.name.trim(),
        cpf: form.cpf.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        birth_date: form.birth_date ? new Date(form.birth_date) : undefined,
        credit_limit: parseFloat(form.credit_limit) || 0,
        notes: form.notes.trim() || undefined,
      };
      if (editId) {
        await updateClient(editId, data as any);
        toast.success("Cliente atualizado!");
      } else {
        await createClient(data as any);
        toast.success("Cliente criado!");
      }
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir cliente?")) return;
    try {
      await deleteClient(id);
      toast.success("Cliente excluído.");
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalDebt = clients.reduce((acc, c) => acc + c.total_debt, 0);
  const debtorCount = clients.filter((c) => c.total_debt > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>Clientes</h1>
          <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
            {clients.length} clientes • {debtorCount} com fiado
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95" style={{ background: "#00805A", color: "#F0F4F0", boxShadow: "0 4px 20px #00805A30" }}>
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total de Clientes", value: clients.length.toString(), color: "#00805A" },
          { label: "Com Fiado", value: debtorCount.toString(), color: "#EF4444" },
          { label: "Total a Receber", value: BRL(totalDebt), color: "#F59E0B" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>{label}</p>
            <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "#4A7A52" }} />
          <Input
            placeholder="Buscar por nome, telefone ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl"
            style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-11 px-3 rounded-xl text-sm font-semibold outline-none" style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#6B9B73" }}>
          <option value="all">Todos</option>
          <option value="debtors">Com fiado</option>
          <option value="clean">Sem dívida</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2B1D" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#111A14", borderBottom: "1px solid #1A2B1D" }}>
              {["Cliente", "Contato", "CPF", "Limite", "Fiado em Aberto", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-black text-xs uppercase tracking-widest" style={{ color: "#4A7A52" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: "#2D4D33" }}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="transition-all hover:brightness-125" style={{ background: "#0A0D0A", borderBottom: "1px solid #1A2B1D" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0" style={{ background: c.total_debt > 0 ? "#E5393515" : "#00805A15", color: c.total_debt > 0 ? "#E53935" : "#00805A", border: `1px solid ${c.total_debt > 0 ? "#E5393930" : "#00805A30"}` }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: "#F0F4F0" }}>{c.name}</p>
                      <p className="text-xs" style={{ color: "#2D4D33" }}>
                        desde {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    {c.phone && <p className="text-xs flex items-center gap-1" style={{ color: "#6B9B73" }}><Phone size={10} /> {c.phone}</p>}
                    {c.email && <p className="text-xs flex items-center gap-1" style={{ color: "#6B9B73" }}><Mail size={10} /> {c.email}</p>}
                    {!c.phone && !c.email && <span style={{ color: "#2D4D33" }}>—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "#4A7A52" }}>{c.cpf || "—"}</td>
                <td className="px-4 py-3 text-xs font-bold" style={{ color: "#4A7A52" }}>{BRL(c.credit_limit)}</td>
                <td className="px-4 py-3">
                  {c.total_debt > 0 ? (
                    <span className="font-black" style={{ color: "#E53935" }}>{BRL(c.total_debt)}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#22C55E" }}>
                      <CheckCircle2 size={12} /> Em dia
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openLog(c)} className="p-2 rounded-lg transition-all hover:brightness-125" style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#F59E0B" }} title="Ver Histórico/Log">
                    <History size={14} />
                  </button>
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg transition-all hover:brightness-125" style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#6B9B73" }} title="Editar Cliente">
                    <Edit3 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-lg rounded-2xl border-0" style={{ background: "#111A14" }}>
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #1A2B1D" }}>
            <DialogTitle className="text-xl font-black" style={{ color: "#F0F4F0" }}>
              {editId ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <button onClick={() => setIsOpen(false)} style={{ color: "#4A7A52" }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSave} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Nome *</Label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Nome completo" required className="h-11 rounded-xl" style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>CPF</Label>
                <Input value={form.cpf} onChange={(e) => setField("cpf", e.target.value)} placeholder="000.000.000-00" className="h-11 rounded-xl font-mono" style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="(11) 99999-9999" className="h-11 rounded-xl" style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="email@exemplo.com" className="h-11 rounded-xl" style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Nascimento</Label>
                <Input type="date" value={form.birth_date} onChange={(e) => setField("birth_date", e.target.value)} className="h-11 rounded-xl" style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Endereço</Label>
              <Input value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="Rua, número, bairro..." className="h-11 rounded-xl" style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Limite de Crédito (Fiado)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: "#4A7A52" }}>R$</span>
                <Input type="number" value={form.credit_limit} onChange={(e) => setField("credit_limit", e.target.value)} min={0} step={10} className="pl-9 h-11 rounded-xl" style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Observações</Label>
              <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Observações sobre o cliente..." rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none" style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }} />
            </div>
            <div className="flex gap-3 pt-2">
              {editId && (
                <button type="button" onClick={() => handleDelete(editId)} className="px-4 h-12 rounded-xl text-xs font-bold" style={{ background: "#E5393510", border: "1px solid #E5393930", color: "#E53935" }}>
                  Excluir
                </button>
              )}
              <button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50" style={{ background: "#00805A", color: "#F0F4F0" }}>
                {loading ? "Salvando..." : "Salvar Cliente"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Modal */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-2xl rounded-2xl border-0" style={{ background: "#111A14" }}>
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #1A2B1D" }}>
            <DialogTitle className="text-xl font-black" style={{ color: "#F0F4F0" }}>
              Histórico de Atividades - {selected?.name}
            </DialogTitle>
            <button onClick={() => setIsLogOpen(false)} style={{ color: "#4A7A52" }}><X size={18} /></button>
          </div>
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            {logLoading ? (
               <p className="text-center text-sm" style={{ color: "#4A7A52" }}>Carregando log...</p>
            ) : logs.length === 0 ? (
               <p className="text-center text-sm" style={{ color: "#4A7A52" }}>Nenhum registro encontrado para este cliente.</p>
            ) : (
               <div className="space-y-3">
                 {logs.map((log) => (
                   <div key={log.id} className="p-4 rounded-xl flex items-center justify-between" style={{ background: "#0A0D0A", border: "1px solid #1A2B1D" }}>
                     <div>
                       <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ 
                          background: log.type === 'CONSUMPTION' ? '#E5393520' : log.type === 'PAYMENT' ? '#00805A20' : '#F59E0B20',
                          color: log.type === 'CONSUMPTION' ? '#E53935' : log.type === 'PAYMENT' ? '#00805A' : '#F59E0B'
                       }}>
                         {log.type === 'CONSUMPTION' ? 'Consumo' : log.type === 'PAYMENT' ? 'Pagamento' : 'Atualização'}
                       </span>
                       <p className="mt-2 text-sm font-semibold" style={{ color: "#F0F4F0" }}>{log.description}</p>
                       <p className="text-xs mt-1" style={{ color: "#4A7A52" }}>{new Date(log.created_at).toLocaleString("pt-BR")}</p>
                     </div>
                     {log.amount && (
                        <div className="font-black text-lg" style={{ color: log.type === 'CONSUMPTION' ? '#E53935' : log.type === 'PAYMENT' ? '#00805A' : '#F59E0B' }}>
                           {BRL(log.amount)}
                        </div>
                     )}
                   </div>
                 ))}
               </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
