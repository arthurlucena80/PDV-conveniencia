// ============================================================
// layout.tsx — Layout do Painel Administrativo (admin/layout.tsx)
// (layout-do-painel.tsx)
//
// O QUE ESTE ARQUIVO FAZ:
// Define o LAYOUT COMPARTILHADO de TODAS as páginas do admin.
// É como um "frame" que envolve todas as páginas:
//   - Sidebar esquerda (menu de navegação)
//   - Header superior (sino de notificações, avatar)
//   - Área de conteúdo principal (onde cada página é exibida)
//
// COMO FUNCIONA:
// O Next.js aplica este layout automaticamente a todas as rotas
// dentro da pasta /app/admin/:
//   /admin            → usa este layout + page.tsx do admin
//   /admin/produtos   → usa este layout + page.tsx de produtos
//   /admin/clientes   → usa este layout + page.tsx de clientes
//   etc.
//
// {children} = o conteúdo da página atual (substituído automaticamente)
//
// ONDE FICA: src/app/admin/layout.tsx
// ============================================================

import Link from "next/link";
// Link = componente de link do Next.js (mais eficiente que <a> normal)
// Faz navegação sem recarregar a página inteira (Single Page Application)

import {
  LayoutDashboard,  // Ícone: grade de quadrados (dashboard)
  Package,          // Ícone: caixa (produtos)
  Users,            // Ícone: pessoas (clientes)
  BarChart3,        // Ícone: gráfico de barras (relatórios)
  Layers,           // Ícone: camadas (categorias)
  Wallet,           // Ícone: carteira (fiado)
  ShoppingCart,     // Ícone: carrinho (PDV)
  Settings,         // Ícone: engrenagem (configurações)
  TrendingUp,       // Ícone: gráfico subindo (estoque)
  Bell,             // Ícone: sino (notificações)
  LogOut,           // Ícone: seta saindo (logout)
  UserCheck,        // Ícone: pessoa com check (funcionários)
  ChevronRight,     // Ícone: seta direita (subitem do menu)
} from "lucide-react";
// lucide-react = biblioteca de ícones SVG modernos

import { getNotifications } from "@/actions/dashboard";
// Busca as notificações não lidas (para o badge no sino)

import { getSession, logout } from "@/actions/auth";
// getSession = verifica quem está logado
// logout = função de sair do sistema

// ── Array de Itens do Menu Lateral ───────────────────────────
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

// ── Subitens do menu Funcionários ────────────────────────────
const funcionariosSubItems = [
  { href: "/admin/funcionarios",           label: "Cadastro" },
  { href: "/admin/funcionarios/auditoria", label: "Auditoria" },
  { href: "/admin/funcionarios/caixa",     label: "Controle de Caixa" },
  { href: "/admin/funcionarios/ranking",   label: "Ranking" },
];

// ── Mapa de nomes dos perfis de usuário ──────────────────────
const ROLE_LABELS: Record<string, string> = {
  ADMIN:    "Administrador",
  MANAGER:  "Gerente",
  OPERATOR: "Somente PDV",
};

// ── Componente Principal: AdminLayout ─────────────────────────
// "async" = este componente pode buscar dados no servidor antes de renderizar
// { children } = o conteúdo da página atual (ex: a página do Dashboard ou de Produtos)
export default async function AdminLayout({
  children
}: {
  children: React.ReactNode  // React.ReactNode = qualquer elemento React válido
}) {

  // ── Busca dados do servidor em paralelo ──
  // Promise.all = executa as duas buscas AO MESMO TEMPO (mais rápido)
  const [notifications, session] = await Promise.all([
    getNotifications(), // Notificações não lidas
    getSession(),       // Dados do usuário logado
  ]);

  // Conta notificações para o badge (bolinha vermelha no sino)
  const unreadCount = notifications.length;

  // ── Gera as iniciais do nome do usuário ──
  // Ex: "João Silva" → "JS"
  // Ex: "Maria" → "M"
  const initials = session?.name
    ? session.name
        .split(" ")         // Divide por espaço: ["João", "Silva"]
        .slice(0, 2)        // Pega no máximo 2 palavras: ["João", "Silva"]
        .map((w) => w[0])   // Pega a primeira letra de cada: ["J", "S"]
        .join("")           // Junta: "JS"
        .toUpperCase()      // Maiúsculo: "JS"
    : "?";  // Se não tiver nome, usa "?"

  // ── Renderiza o layout completo ──────────────────────────────
  return (
    // Container principal: ocupa a tela toda, linha horizontal (flex-row)
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "#0A0D0A", color: "#F0F4F0" }}
    >

      {/* ═══════════════════════════════════════════════ */}
      {/* SIDEBAR — Menu Lateral Esquerdo                 */}
      {/* ═══════════════════════════════════════════════ */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col"
        // w-60 = largura fixa de 240px
        // flex-shrink-0 = não encolhe quando a tela for pequena
        // flex flex-col = organiza os filhos em coluna (de cima para baixo)
        style={{ backgroundColor: "#0F1510", borderRight: "1px solid #1A2B1D" }}
      >

        {/* ── Logo / Marca ── */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid #1A2B1D" }}>
          <div className="flex items-center gap-3">
            {/* Quadrado verde com a letra "C" — logotipo */}
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
        </div>

        {/* ── Menu de Navegação ── */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-125 group"
              style={{ color: "#6B9B73" }}
            >
              <Icon size={17} className="transition-all group-hover:scale-110" style={{ flexShrink: 0 }} />
              {label}
            </Link>
          ))}

          {/* ── Seção: Funcionários ── */}
          {/* Só aparece se o usuário for ADMIN ou MANAGER */}
          {(session?.role === "ADMIN" || session?.role === "MANAGER") && (
            <div className="pt-2">
              {/* Rótulo da seção */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 mb-1"
                style={{ color: "#2D4D33", fontSize: "10px", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                <UserCheck size={12} />
                Funcionários
              </div>
              {/* Links do submenu */}
              {funcionariosSubItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-125"
                  style={{ color: "#4A7A52", paddingLeft: "24px" }}
                >
                  <ChevronRight size={13} style={{ flexShrink: 0 }} />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* ── Rodapé da Sidebar: Info do Usuário ── */}
        <div className="p-4 space-y-3" style={{ borderTop: "1px solid #1A2B1D" }}>
          {/* Se existe sessão (usuário logado), mostra o card do usuário */}
          {session ? (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "#0A0D0A", border: "1px solid #1A2B1D" }}
            >
              {/* Avatar circular com as iniciais do usuário */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: "#00805A20", color: "#00805A" }}
              >
                {initials}  {/* Ex: "JS" para João Silva */}
              </div>

              {/* Nome e perfil do usuário */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate" style={{ color: "#F0F4F0" }}>
                  {session.name}
                  {/* truncate = corta com "..." se o nome for muito longo */}
                </p>
                <p className="text-xs" style={{ color: "#4A7A52" }}>
                  {ROLE_LABELS[session.role] || session.role}
                  {/* Mostra "Administrador" em vez de "ADMIN" */}
                </p>
              </div>

              {/* Botão de Logout (Sair) */}
              {/* form + action = forma do Next.js de chamar Server Actions com formulário */}
              <form action={logout}>
                <button
                  type="submit"
                  title="Sair"  // Tooltip que aparece ao passar o mouse
                  className="p-1.5 rounded-lg transition-all hover:brightness-125"
                  style={{ color: "#4A7A52" }}
                >
                  <LogOut size={14} />
                </button>
              </form>
            </div>
          ) : (
            // Se não tem sessão (usuário não logado), mostra link de login
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

          {/* Versão do sistema */}
          <p className="text-xs text-center" style={{ color: "#2D4D33" }}>
            PDV v2.0
          </p>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════ */}
      {/* ÁREA PRINCIPAL — Header + Conteúdo              */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* flex-1 = ocupa todo o espaço restante (após a sidebar) */}
        {/* min-w-0 = evita overflow horizontal em telas pequenas */}

        {/* ── Header Superior ── */}
        <header
          className="flex items-center justify-between px-8 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #1A2B1D", backgroundColor: "#0F1510" }}
        >
          {/* Espaço vazio à esquerda (pode ser usado para breadcrumbs futuramente) */}
          <div />

          {/* Direita: Sino de notificações + Avatar */}
          <div className="flex items-center gap-4">

            {/* ── Sino de Notificações ── */}
            <div className="relative">  {/* relative = para posicionar o badge */}
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

              {/* Badge vermelho com contador (só aparece se tiver notificações) */}
              {unreadCount > 0 && (
                <span
                  className="badge-pulse absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-black"
                  // absolute = posiciona relativo ao div pai (relative acima)
                  // -top-1 -right-1 = posiciona no canto superior direito
                  // badge-pulse = animação pulsante definida no globals.css
                  style={{ background: "#E53935", color: "white" }}
                >
                  {/* Mostra o número ou "9+" se tiver mais de 9 */}
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>

            {/* ── Avatar do Usuário no Header ── */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
              style={{
                background: "#00805A20",
                border: "1px solid #00805A40",
                color: "#00805A"
              }}
            >
              {initials}  {/* Mesmas iniciais do card na sidebar */}
            </div>
          </div>
        </header>

        {/* ── Conteúdo da Página ── */}
        {/* {children} = aqui é renderizado o conteúdo da página atual */}
        {/* Ex: quando você acessa /admin/produtos, o page.tsx de produtos é colocado aqui */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
        {/* overflow-y-auto = adiciona scroll vertical quando o conteúdo for maior que a tela */}
        {/* p-8 = padding (espaçamento interno) de 32px em todos os lados */}
      </div>
    </div>
  );
}
