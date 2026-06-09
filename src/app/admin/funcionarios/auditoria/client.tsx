"use client";
// src/app/admin/funcionarios/auditoria/client.tsx — Interface de Auditoria

import { useRouter } from "next/navigation";
import { Shield, LogIn, LogOut, ShoppingCart, Package, Users, Settings, DollarSign, AlertCircle } from "lucide-react";

type AuditLog = {
  id: string; action: string; module: string | null; entity: string;
  entity_id: string | null; old_data: any; new_data: any;
  ip: string | null; created_at: Date;
  user: { id: string; name: string; role: string } | null;
};

const MODULE_ICONS: Record<string, any> = {
  AUTH:      LogIn,
  SALES:     ShoppingCart,
  PRODUCTS:  Package,
  STOCK:     Package,
  CLIENTS:   Users,
  USERS:     Users,
  CASH:      DollarSign,
  SETTINGS:  Settings,
  DISCOUNTS: DollarSign,
};

const MODULE_COLORS: Record<string, string> = {
  AUTH:      "#3B82F6",
  SALES:     "#00805A",
  PRODUCTS:  "#F59E0B",
  STOCK:     "#8B5CF6",
  CLIENTS:   "#06B6D4",
  USERS:     "#EC4899",
  CASH:      "#22C55E",
  SETTINGS:  "#6B7280",
  DISCOUNTS: "#EF4444",
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN:               "Login",
  LOGOUT:              "Logout",
  SALE_CLOSED:         "Venda Fechada",
  EMPLOYEE_CREATED:    "Func. Criado",
  EMPLOYEE_UPDATED:    "Func. Editado",
  EMPLOYEE_ACTIVATED:  "Func. Ativado",
  EMPLOYEE_DEACTIVATED:"Func. Desativado",
  CASH_OPENED:         "Caixa Aberto",
  CASH_CLOSED:         "Caixa Fechado",
  PASSWORD_RESET:      "Senha Redefinida",
};

const MODULES = [
  { value: "", label: "Todos os módulos" },
  { value: "AUTH",      label: "Autenticação" },
  { value: "SALES",     label: "Vendas" },
  { value: "PRODUCTS",  label: "Produtos" },
  { value: "STOCK",     label: "Estoque" },
  { value: "CLIENTS",   label: "Clientes" },
  { value: "USERS",     label: "Funcionários" },
  { value: "CASH",      label: "Caixa" },
  { value: "DISCOUNTS", label: "Descontos" },
  { value: "SETTINGS",  label: "Configurações" },
];

export function AuditoriaClient({
  audits,
  employees,
  filters,
}: {
  audits: { logs: AuditLog[]; total: number; page: number; pages: number };
  employees: any[];
  filters: any;
}) {
  const router = useRouter();

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(filters);
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`/admin/funcionarios/auditoria?${params.toString()}`);
  };

  const goPage = (p: number) => {
    const params = new URLSearchParams(filters);
    params.set("page", String(p));
    router.push(`/admin/funcionarios/auditoria?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl" style={{ background: "#8B5CF620" }}>
          <Shield size={22} style={{ color: "#8B5CF6" }} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>Auditoria</h1>
          <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
            {audits.total.toLocaleString("pt-BR")} eventos registrados
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-3"
        style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
        {/* Funcionário */}
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Funcionário</p>
          <select
            value={filters.user_id || ""}
            onChange={e => applyFilter("user_id", e.target.value)}
            className="w-full h-9 rounded-xl px-3 text-sm"
            style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}>
            <option value="">Todos</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        {/* Módulo */}
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Módulo</p>
          <select
            value={filters.module || ""}
            onChange={e => applyFilter("module", e.target.value)}
            className="w-full h-9 rounded-xl px-3 text-sm"
            style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}>
            {MODULES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {/* Data Início */}
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>De</p>
          <input
            type="date"
            value={filters.from || ""}
            onChange={e => applyFilter("from", e.target.value)}
            className="w-full h-9 rounded-xl px-3 text-sm"
            style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
          />
        </div>
        {/* Data Fim */}
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>Até</p>
          <input
            type="date"
            value={filters.to || ""}
            onChange={e => applyFilter("to", e.target.value)}
            className="w-full h-9 rounded-xl px-3 text-sm"
            style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
          />
        </div>
      </div>

      {/* Log Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
        {/* Table Header */}
        <div className="grid grid-cols-12 px-5 py-3 text-xs font-black uppercase tracking-widest"
          style={{ color: "#2D4D33", borderBottom: "1px solid #1A2B1D", background: "#0A0D0A" }}>
          <div className="col-span-2">Data/Hora</div>
          <div className="col-span-2">Funcionário</div>
          <div className="col-span-2">Módulo</div>
          <div className="col-span-2">Ação</div>
          <div className="col-span-3">Detalhes</div>
          <div className="col-span-1">IP</div>
        </div>

        {/* Rows */}
        {audits.logs.length === 0 && (
          <div className="py-16 text-center">
            <AlertCircle size={32} style={{ color: "#2D4D33", margin: "0 auto 12px" }} />
            <p style={{ color: "#2D4D33" }}>Nenhum evento encontrado com os filtros selecionados.</p>
          </div>
        )}
        {audits.logs.map((log, i) => {
          const ModIcon = MODULE_ICONS[log.module || "SALES"] || Shield;
          const color   = MODULE_COLORS[log.module || "SALES"] || "#6B9B73";
          return (
            <div key={log.id}
              className="grid grid-cols-12 px-5 py-3 items-center text-xs gap-1"
              style={{
                borderBottom: i < audits.logs.length - 1 ? "1px solid #0F1510" : "none",
                background: i % 2 === 0 ? "transparent" : "#0A0D0A10",
              }}>
              {/* Data/hora */}
              <div className="col-span-2" style={{ color: "#4A7A52" }}>
                {new Date(log.created_at).toLocaleString("pt-BR", {
                  day: "2-digit", month: "2-digit",
                  hour: "2-digit", minute: "2-digit"
                })}
              </div>
              {/* Funcionário */}
              <div className="col-span-2 font-semibold truncate" style={{ color: "#F0F4F0" }}>
                {log.user?.name || "Sistema"}
              </div>
              {/* Módulo */}
              <div className="col-span-2">
                <span className="flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg text-xs font-bold"
                  style={{ background: `${color}15`, color }}>
                  <ModIcon size={11} />
                  {log.module || "—"}
                </span>
              </div>
              {/* Ação */}
              <div className="col-span-2 font-bold" style={{ color: "#F0F4F0" }}>
                {ACTION_LABELS[log.action] || log.action}
              </div>
              {/* Detalhes (new_data resumido) */}
              <div className="col-span-3 truncate" style={{ color: "#4A7A52" }}>
                {log.new_data
                  ? Object.entries(log.new_data as Record<string,any>)
                      .slice(0, 2)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(" · ")
                  : log.entity_id
                    ? `ID: ${log.entity_id.substring(0, 8)}...`
                    : "—"}
              </div>
              {/* IP */}
              <div className="col-span-1 font-mono text-xs" style={{ color: "#2D4D33" }}>
                {log.ip || "—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {audits.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "#4A7A52" }}>
            Página {audits.page} de {audits.pages} · {audits.total} eventos
          </p>
          <div className="flex gap-2">
            {Array.from({ length: Math.min(audits.pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => goPage(p)}
                className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: p === audits.page ? "#00805A" : "#111A14",
                  color: p === audits.page ? "#F0F4F0" : "#4A7A52",
                  border: "1px solid #1A2B1D",
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
