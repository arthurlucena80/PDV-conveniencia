"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Users, BarChart3, Layers, Wallet, ShoppingCart, Settings, TrendingUp, Bell, LogOut, UserCheck, ChevronRight, Menu, X
} from "lucide-react";
import { logout } from "@/actions/auth";

const navItems = [
  { href: "/",                    label: "PDV",           icon: ShoppingCart },
  { href: "/admin",               label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos",      label: "Produtos",      icon: Package },
  { href: "/admin/categorias",    label: "Categorias",    icon: Layers },
  { href: "/admin/clientes",      label: "Clientes",      icon: Users },
  { href: "/admin/estoque",       label: "Estoque",       icon: TrendingUp },
  { href: "/admin/fiado",         label: "Fiado",         icon: Wallet },
  { href: "/admin/relatorios",    label: "Relatórios",    icon: BarChart3 },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

const funcionariosSubItems = [
  { href: "/admin/funcionarios",           label: "Cadastro" },
  { href: "/admin/funcionarios/auditoria", label: "Auditoria" },
  { href: "/admin/funcionarios/caixa",     label: "Controle de Caixa" },
  { href: "/admin/funcionarios/ranking",   label: "Ranking" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN:    "Administrador",
  MANAGER:  "Gerente",
  OPERATOR: "Somente PDV",
};

interface AdminLayoutClientProps {
  session: any;
  unreadCount: number;
  children: React.ReactNode;
}

export function AdminLayoutClient({ session, unreadCount, children }: AdminLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const initials = session?.name
    ? session.name
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div
      className="flex min-h-screen relative"
      style={{ backgroundColor: "#0A0D0A", color: "#F0F4F0" }}
    >
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR — Menu Lateral Esquerdo */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 flex-shrink-0 flex flex-col transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 h-full`}
        style={{ backgroundColor: "#0F1510", borderRight: "1px solid #1A2B1D" }}
      >
        {/* Logo / Marca */}
        <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #1A2B1D" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #00805A, #006045)",
                color: "white"
              }}
            >
              C
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: "#F0F4F0" }}>
                Caderno PDV
              </p>
              <p className="text-xs" style={{ color: "#4A7A52" }}>
                Painel Admin
              </p>
            </div>
          </div>
          <button
            className="lg:hidden text-[#6B9B73] hover:text-white transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href) && href !== "/";
            const activeStyle = isActive 
              ? { backgroundColor: "#142518", color: "#00FF9D" } 
              : { color: "#6B9B73" };
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-125 group"
                style={activeStyle}
              >
                <Icon size={17} className="transition-all group-hover:scale-110" style={{ flexShrink: 0 }} />
                {label}
              </Link>
            );
          })}

          {/* Seção: Funcionários */}
          {(session?.role === "ADMIN" || session?.role === "MANAGER") && (
            <div className="pt-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 mb-1"
                style={{ color: "#2D4D33", fontSize: "10px", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                <UserCheck size={12} />
                Funcionários
              </div>
              {funcionariosSubItems.map(({ href, label }) => {
                const isActive = pathname.startsWith(href);
                const activeStyle = isActive 
                  ? { backgroundColor: "#142518", color: "#00FF9D", paddingLeft: "24px" } 
                  : { color: "#4A7A52", paddingLeft: "24px" };
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-125"
                    style={activeStyle}
                  >
                    <ChevronRight size={13} style={{ flexShrink: 0 }} />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Rodapé da Sidebar: Info do Usuário */}
        <div className="p-4 space-y-3" style={{ borderTop: "1px solid #1A2B1D" }}>
          {session ? (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "#0A0D0A", border: "1px solid #1A2B1D" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: "#00805A20", color: "#00805A" }}
              >
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate" style={{ color: "#F0F4F0" }}>
                  {session.name}
                </p>
                <p className="text-xs" style={{ color: "#4A7A52" }}>
                  {ROLE_LABELS[session.role] || session.role}
                </p>
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  title="Sair"
                  className="p-1.5 rounded-lg transition-all hover:brightness-125"
                  style={{ color: "#4A7A52" }}
                >
                  <LogOut size={14} />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:brightness-125"
              style={{
                background: "#00805A20",
                color: "#00805A",
                border: "1px solid #00805A30"
              }}
            >
              Fazer Login
            </Link>
          )}

          <p className="text-xs text-center" style={{ color: "#2D4D33" }}>
            PDV v2.0
          </p>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL — Header + Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Superior */}
        <header
          className="flex items-center justify-between px-4 lg:px-8 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #1A2B1D", backgroundColor: "#0F1510" }}
        >
          {/* Menu Hamburger no Mobile */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:brightness-125 text-[#6B9B73]"
              onClick={() => setIsSidebarOpen(true)}
              style={{
                background: "#162119",
                border: "1px solid #1A2B1D",
              }}
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Direita: Sino de notificações + Avatar */}
          <div className="flex items-center gap-4">
            {/* Sino de Notificações */}
            <div className="relative">
              <button
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:brightness-125"
                style={{
                  background: "#162119",
                  border: "1px solid #1A2B1D",
                  color: "#6B9B73"
                }}
              >
                <Bell size={17} />
              </button>

              {unreadCount > 0 && (
                <span
                  className="badge-pulse absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-black"
                  style={{ background: "#E53935", color: "white" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>

            {/* Avatar do Usuário */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
              style={{
                background: "#00805A20",
                border: "1px solid #00805A40",
                color: "#00805A"
              }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
