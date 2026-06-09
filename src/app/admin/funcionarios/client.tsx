"use client";
// src/app/admin/funcionarios/client.tsx — Interface de Cadastro de Funcionários

import { useState } from "react";
import {
  createEmployee, updateEmployee, toggleEmployeeStatus, resetPassword, ROLE_LABELS
} from "@/actions/employee";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Plus, UserCheck, UserX, Edit3, Key, ShieldCheck,
  ShoppingCart, Users, Mail, Phone, Calendar, X
} from "lucide-react";

type Employee = {
  id: string; name: string; email: string;
  role: string; cpf?: string | null; phone?: string | null;
  avatar_url?: string | null; hired_at?: string | null;
  is_active: boolean; created_at: string;
  totalSales: number; totalRevenue: number; totalDiscounts: number;
  lastSession: { logged_in: string; ip?: string | null } | null;
};

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ROLE_COLORS: Record<string, string> = {
  ADMIN:    "#8B5CF6",
  MANAGER:  "#F59E0B",
  OPERATOR: "#00805A",
};

const ROLE_ICONS: Record<string, any> = {
  ADMIN:    ShieldCheck,
  MANAGER:  Users,
  OPERATOR: ShoppingCart,
};

export function FuncionariosClient({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen]       = useState(false);
  const [isResetOpen, setResetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [loading, setLoading]     = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Form state
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "OPERATOR" as "ADMIN"|"MANAGER"|"OPERATOR",
    cpf: "", phone: "", avatar_url: "", hired_at: "",
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name:"", email:"", password:"", role:"OPERATOR", cpf:"", phone:"", avatar_url:"", hired_at:"" });
    setIsOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditTarget(emp);
    setForm({
      name: emp.name, email: emp.email, password: "",
      role: emp.role as any,
      cpf: emp.cpf || "", phone: emp.phone || "",
      avatar_url: emp.avatar_url || "",
      hired_at: emp.hired_at ? emp.hired_at.split("T")[0] : "",
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error("Nome e e-mail são obrigatórios."); return; }
    if (!editTarget && !form.password) { toast.error("Senha é obrigatória para novos funcionários."); return; }
    try {
      setLoading(true);
      if (editTarget) {
        await updateEmployee(editTarget.id, {
          name: form.name, email: form.email, role: form.role,
          cpf: form.cpf, phone: form.phone, avatar_url: form.avatar_url,
          hired_at: form.hired_at || undefined,
        });
        toast.success("Funcionário atualizado!");
      } else {
        await createEmployee({
          name: form.name, email: form.email, password: form.password,
          role: form.role, cpf: form.cpf, phone: form.phone,
          avatar_url: form.avatar_url, hired_at: form.hired_at || undefined,
        });
        toast.success("Funcionário criado! Login: " + form.email);
      }
      setIsOpen(false);
      router.refresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleToggle = async (emp: Employee) => {
    if (!confirm(`${emp.is_active ? "Desativar" : "Ativar"} funcionário "${emp.name}"?`)) return;
    try {
      await toggleEmployeeStatus(emp.id);
      toast.success(emp.is_active ? "Funcionário desativado." : "Funcionário ativado!");
      router.refresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !newPassword) return;
    try {
      setLoading(true);
      await resetPassword(editTarget.id, newPassword);
      toast.success("Senha redefinida com sucesso!");
      setResetOpen(false);
      setNewPassword("");
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const active = filtered.filter(e => e.is_active);
  const inactive = filtered.filter(e => !e.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>Funcionários</h1>
          <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
            {employees.filter(e => e.is_active).length} ativos · {employees.filter(e => !e.is_active).length} inativos
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
          style={{ background: "#00805A", color: "#F0F4F0", boxShadow: "0 4px 20px #00805A30" }}
        >
          <Plus size={16} /> Novo Funcionário
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="h-11 rounded-xl pl-4"
          style={{ background: "#111A14", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
        />
      </div>

      {/* Active Employees */}
      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#2D4D33" }}>Ativos</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map(emp => {
              const RoleIcon = ROLE_ICONS[emp.role] || UserCheck;
              const roleColor = ROLE_COLORS[emp.role] || "#6B9B73";
              return (
                <div key={emp.id} className="rounded-2xl p-5 space-y-4"
                  style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
                  {/* Top */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
                      style={{ background: `${roleColor}20`, color: roleColor }}>
                      {emp.avatar_url
                        ? <img src={emp.avatar_url} alt={emp.name} className="w-full h-full rounded-xl object-cover" />
                        : emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "#F0F4F0" }}>{emp.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <RoleIcon size={11} style={{ color: roleColor }} />
                        <span className="text-xs font-semibold" style={{ color: roleColor }}>
                          {ROLE_LABELS[emp.role] || emp.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(emp)}
                        className="p-2 rounded-lg transition-all hover:brightness-125"
                        style={{ color: "#4A7A52", background: "#1A2B1D" }}
                        title="Editar">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => { setEditTarget(emp); setResetOpen(true); }}
                        className="p-2 rounded-lg transition-all hover:brightness-125"
                        style={{ color: "#F59E0B", background: "#F59E0B10" }}
                        title="Redefinir Senha">
                        <Key size={13} />
                      </button>
                      <button onClick={() => handleToggle(emp)}
                        className="p-2 rounded-lg transition-all hover:brightness-125"
                        style={{ color: "#E53935", background: "#E5393510" }}
                        title="Desativar">
                        <UserX size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-1" style={{ borderTop: "1px solid #1A2B1D" }}>
                    <div className="text-center">
                      <p className="text-xs font-black" style={{ color: "#F0F4F0" }}>{emp.totalSales}</p>
                      <p className="text-xs" style={{ color: "#4A7A52" }}>Vendas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black" style={{ color: "#00805A" }}>{BRL(emp.totalRevenue)}</p>
                      <p className="text-xs" style={{ color: "#4A7A52" }}>Receita</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black" style={{ color: "#E53935" }}>{BRL(emp.totalDiscounts)}</p>
                      <p className="text-xs" style={{ color: "#4A7A52" }}>Descontos</p>
                    </div>
                  </div>

                  {/* Last login */}
                  {emp.lastSession && (
                    <p className="text-xs" style={{ color: "#2D4D33" }}>
                      Último acesso: {new Date(emp.lastSession.logged_in).toLocaleString("pt-BR")}
                    </p>
                  )}
                  {!emp.lastSession && (
                    <p className="text-xs" style={{ color: "#2D4D33" }}>Nunca acessou o sistema</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive Employees */}
      {inactive.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#2D4D33" }}>Inativos</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {inactive.map(emp => (
              <div key={emp.id} className="rounded-2xl p-5 flex items-center justify-between opacity-50"
                style={{ background: "#0F1510", border: "1px dashed #1A2B1D" }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#F0F4F0" }}>{emp.name}</p>
                  <p className="text-xs" style={{ color: "#4A7A52" }}>{ROLE_LABELS[emp.role] || emp.role}</p>
                </div>
                <button onClick={() => handleToggle(emp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: "#00805A20", color: "#00805A", border: "1px solid #00805A30" }}>
                  <UserCheck size={12} /> Ativar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {employees.length === 0 && (
        <div className="rounded-2xl p-16 text-center" style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
          <UserCheck size={40} style={{ color: "#2D4D33", margin: "0 auto 16px" }} />
          <p style={{ color: "#4A7A52" }}>Nenhum funcionário cadastrado ainda.</p>
          <p className="text-xs mt-1" style={{ color: "#2D4D33" }}>Clique em "Novo Funcionário" para começar.</p>
        </div>
      )}

      {/* Modal: Criar / Editar */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-md rounded-2xl border-0" style={{ background: "#111A14" }}>
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #1A2B1D" }}>
            <DialogTitle className="text-xl font-black" style={{ color: "#F0F4F0" }}>
              {editTarget ? "Editar Funcionário" : "Novo Funcionário"}
            </DialogTitle>
            <button onClick={() => setIsOpen(false)} style={{ color: "#4A7A52" }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSave} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-4">
              {[
                { name: "name",  label: "Nome Completo *",   icon: UserCheck, type: "text" },
                { name: "email", label: "E-mail *",          icon: Mail,      type: "email" },
                { name: "cpf",   label: "CPF",               icon: UserCheck, type: "text" },
                { name: "phone", label: "Telefone/WhatsApp", icon: Phone,     type: "tel" },
                { name: "hired_at", label: "Data de Admissão", icon: Calendar, type: "date" },
                { name: "avatar_url", label: "URL da Foto (opcional)", icon: UserCheck, type: "url" },
              ].map(({ name, label, type }) => (
                <div key={name} className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>{label}</Label>
                  <Input
                    type={type}
                    value={(form as any)[name]}
                    onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
                    className="h-11 rounded-xl"
                    style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
                  />
                </div>
              ))}

              {/* Senha (obrigatória apenas ao criar) */}
              {!editTarget && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Senha *</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className="h-11 rounded-xl"
                    style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
                  />
                </div>
              )}

              {/* Perfil de Acesso */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Perfil de Acesso</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["ADMIN", "MANAGER", "OPERATOR"] as const).map(role => (
                    <button
                      key={role} type="button"
                      onClick={() => setForm(prev => ({ ...prev, role }))}
                      className="p-3 rounded-xl text-xs font-bold transition-all text-center"
                      style={{
                        background: form.role === role ? `${ROLE_COLORS[role]}20` : "#0A0D0A",
                        border: `1px solid ${form.role === role ? ROLE_COLORS[role] : "#1A2B1D"}`,
                        color: form.role === role ? ROLE_COLORS[role] : "#4A7A52",
                      }}>
                      <div className="text-lg mb-1">
                        {role === "ADMIN" ? "🛡️" : role === "MANAGER" ? "📊" : "🛒"}
                      </div>
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-1" style={{ color: "#2D4D33" }}>
                  {form.role === "OPERATOR" && "Somente PDV: vê apenas a tela de vendas após o login."}
                  {form.role === "MANAGER" && "Gerente: acessa produtos, clientes, estoque e relatórios."}
                  {form.role === "ADMIN" && "Administrador: acesso total ao sistema."}
                </p>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "#00805A", color: "#F0F4F0" }}>
              {loading ? "Salvando..." : (editTarget ? "Salvar Alterações" : "Criar Funcionário")}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Redefinir Senha */}
      <Dialog open={isResetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-sm rounded-2xl border-0" style={{ background: "#111A14" }}>
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #1A2B1D" }}>
            <DialogTitle className="text-xl font-black" style={{ color: "#F0F4F0" }}>
              Redefinir Senha
            </DialogTitle>
            <button onClick={() => setResetOpen(false)} style={{ color: "#4A7A52" }}><X size={18} /></button>
          </div>
          <form onSubmit={handleResetPassword} className="px-6 py-5 space-y-4">
            <p className="text-sm" style={{ color: "#6B9B73" }}>
              Definindo nova senha para: <strong style={{ color: "#F0F4F0" }}>{editTarget?.name}</strong>
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Nova Senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-11 rounded-xl"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
              />
            </div>
            <button
              type="submit" disabled={loading || newPassword.length < 6}
              className="w-full h-12 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "#F59E0B", color: "#0A0D0A" }}>
              {loading ? "Salvando..." : "Redefinir Senha"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
