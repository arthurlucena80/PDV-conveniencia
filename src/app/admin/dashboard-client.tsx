"use client";
// ============================================================
// dashboard-client.tsx — Painel de KPIs e Gráficos (Navegador)
// (painel-de-indicadores.tsx)
//
// O QUE ESTE ARQUIVO FAZ:
// Renderiza o painel administrativo com métricas e gráficos.
// Recebe todos os dados já calculados do servidor (page.tsx)
// e os transforma em cards visuais e gráficos interativos.
//
// "use client" = roda no NAVEGADOR pois usa a biblioteca Recharts,
// que precisa acessar o DOM (estrutura da página) para desenhar gráficos.
//
// COMPONENTES DESTE ARQUIVO:
//   - StatCard      → Card de métrica individual (faturamento, vendas, etc.)
//   - CustomTooltip → Dica personalizada ao passar o mouse nos gráficos
//   - DashboardClient → Componente principal que monta todo o painel
//
// BIBLIOTECAS USADAS:
//   - recharts → Gráficos (barras, pizza, linha)
//   - lucide-react → Ícones
//
// ONDE FICA: src/app/admin/dashboard-client.tsx
// ============================================================

import {
  BarChart,          // Container do gráfico de barras
  Bar,               // Cada barra do gráfico
  XAxis,             // Eixo horizontal (datas, categorias)
  YAxis,             // Eixo vertical (valores em R$)
  CartesianGrid,     // Grade de fundo do gráfico
  Tooltip,           // Dica ao passar o mouse em uma barra
  ResponsiveContainer, // Wrapper que adapta o gráfico ao tamanho da tela
  LineChart,         // Container do gráfico de linha (não usado aqui, mas importado)
  Line,              // Linha do gráfico de linha
  PieChart,          // Container do gráfico de pizza
  Pie,               // A pizza em si
  Cell,              // Cada fatia da pizza (com cor individual)
} from "recharts";
// recharts = biblioteca de gráficos para React

import {
  TrendingUp,     // Seta subindo (crescimento positivo)
  TrendingDown,   // Seta descendo (crescimento negativo)
  DollarSign,     // Cifrão $ (faturamento)
  ShoppingCart,   // Carrinho (ticket médio)
  Users,          // Pessoas (devedores)
  AlertTriangle,  // Triângulo de alerta
  Package,        // Caixa (produtos)
  CreditCard,     // Cartão de crédito (fiado)
} from "lucide-react";
// lucide-react = biblioteca de ícones SVG

// ── Funções Utilitárias ───────────────────────────────────────

// Formata número para moeda Real Brasileiro
// Ex: 1234.5 → "R$ 1.234,50"
// toLocaleString = método nativo do JavaScript para formatação regional
const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Paleta de cores para o gráfico de pizza e outros elementos
// Cada fatia recebe uma cor desta lista (em ordem)
const COLORS = [
  "#00805A", // Verde (PIX)
  "#F59E0B", // Âmbar (Cartão)
  "#3B82F6", // Azul (Crédito)
  "#EF4444", // Vermelho (Débito)
  "#8B5CF6", // Roxo (Dinheiro)
  "#EC4899", // Rosa (Fiado)
];

// Tradução dos métodos de pagamento (enum inglês → português)
// Record<string, string> = tipo TypeScript para objeto com chave e valor strings
const PAYMENT_LABELS: Record<string, string> = {
  PIX:         "PIX",
  CARD:        "Cartão",
  CARD_CREDIT: "Crédito",
  CARD_DEBIT:  "Débito",
  CASH:        "Dinheiro",
  TAB:         "Fiado",
  MIXED:       "Misto",
};

// Dias da semana em português (índice 0 = domingo)
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Converte string de data "2024-06-09" para o dia da semana abreviado
// Ex: "2024-06-09" (domingo) → "Dom"
function formatDate(dateStr: string) {
  // Adiciona "T12:00:00" para evitar problemas de fuso horário
  // (sem isso, a data pode ser interpretada como dia anterior)
  const d = new Date(dateStr + "T12:00:00");
  return WEEK_DAYS[d.getDay()]; // getDay() retorna 0-6 (Dom-Sáb)
}

// ── Tipo TypeScript: DashboardStats ──────────────────────────
// Define o formato esperado dos dados que vêm do servidor
// Garante que o TypeScript avise se um campo estiver faltando
type DashboardStats = {
  revenueToday: number;        // Faturamento de hoje em R$
  revenueMonth: number;        // Faturamento do mês em R$
  revenueLastMonth: number;    // Faturamento do mês anterior
  growthPercent: number;       // % de crescimento (pode ser negativo)
  salesToday: number;          // Número de vendas hoje
  salesMonth: number;          // Número de vendas no mês
  ticketMedio: number;         // Valor médio por venda
  totalTab: number;            // Total em fiado (R$)
  debtClientsCount: number;    // Quantidade de clientes com dívida
  topProducts: any[];          // Top 5 produtos mais vendidos
  topClients: any[];           // Top 5 maiores devedores
  salesByPayment: {            // Vendas agrupadas por forma de pagamento
    method: string | null;
    total: number;
    count: number;
  }[];
  dailySales: {                // Vendas dos últimos 7 dias
    date: string;
    total: number;
    count: number;
  }[];
};

// ── Componente: StatCard ──────────────────────────────────────
// Card individual de métrica — aparece na grade do topo do dashboard
// Props (propriedades que recebe):
//   label  = título do card (ex: "Faturamento Hoje")
//   value  = valor principal formatado (ex: "R$ 1.234,50")
//   sub    = texto pequeno abaixo (ex: "5 vendas hoje")
//   icon   = componente de ícone (ex: DollarSign)
//   accent = cor de destaque em hexadecimal
//   trend  = indicador de crescimento (seta verde ou vermelha)
function StatCard({
  label,
  value,
  sub,
  icon: Icon,    // "icon: Icon" = renomeia a prop para usar como componente (<Icon />)
  accent,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;              // "?" = opcional
  icon: any;
  accent: string;
  trend?: { value: number; positive: boolean }; // "?" = opcional
}) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
      // relative + overflow-hidden = permite o gradiente de fundo no canto
      style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
    >
      {/* Gradiente sutil no canto superior direito (decorativo) */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        // pointer-events-none = não interfere nos cliques do usuário
        // inset-0 = ocupa 100% do espaço do pai (absolute)
        style={{
          // radial-gradient = gradiente circular saindo do canto
          background: `radial-gradient(ellipse at top right, ${accent}10 0%, transparent 65%)`,
        }}
      />

      {/* Linha superior: título + ícone */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
          {label}
        </p>
        {/* Quadrado colorido com o ícone */}
        <div className="p-2.5 rounded-xl" style={{ background: `${accent}20`, color: accent }}>
          <Icon size={17} />  {/* O ícone renderizado como componente */}
        </div>
      </div>

      {/* Valor principal + subtítulo */}
      <div>
        <div className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>
          {value}  {/* Ex: "R$ 1.234,50" */}
        </div>
        {/* O && significa "só renderiza se 'sub' existir" */}
        {sub && (
          <p className="text-xs mt-1 font-medium" style={{ color: "#4A7A52" }}>
            {sub}  {/* Ex: "5 vendas hoje" */}
          </p>
        )}
      </div>

      {/* Indicador de tendência (crescimento vs mês anterior) */}
      {trend && (
        <div className="flex items-center gap-1.5">
          {/* Seta verde (subindo) ou vermelha (descendo) */}
          {trend.positive ? (
            <TrendingUp size={14} style={{ color: "#22C55E" }} />
          ) : (
            <TrendingDown size={14} style={{ color: "#EF4444" }} />
          )}
          {/* Percentual com cor correspondente */}
          <span
            className="text-xs font-bold"
            style={{ color: trend.positive ? "#22C55E" : "#EF4444" }}
          >
            {trend.value.toFixed(1)}% vs mês anterior
            {/* .toFixed(1) = arredonda para 1 casa decimal */}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Componente: CustomTooltip ─────────────────────────────────
// Tooltip personalizado que aparece ao passar o mouse nas barras do gráfico
// O Recharts passa automaticamente: active (está visível?), payload (dados), label (rótulo)
const CustomTooltip = ({ active, payload, label }: any) => {
  // Só renderiza se o tooltip estiver ativo e tiver dados
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl px-4 py-3 text-sm shadow-xl"
        style={{ background: "#0F1510", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
      >
        <p className="font-bold mb-1">{label}</p>  {/* Ex: "Seg" (dia da semana) */}
        {/* payload = array com os dados de cada série do gráfico */}
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {BRL(p.value)}  {/* Formata o valor como moeda */}
          </p>
        ))}
      </div>
    );
  }
  return null;  // Se não estiver ativo, não renderiza nada
};

// ── Componente Principal: DashboardClient ─────────────────────
// Monta todo o painel administrativo
// stats = todos os dados calculados que vieram do servidor
export function DashboardClient({ stats }: { stats: DashboardStats }) {
  // Pega o total vendido do produto mais vendido (para calcular a barra de progresso)
  // O produto com index [0] é o mais vendido (lista já ordenada pelo servidor)
  // "|| 1" evita divisão por zero se não houver produtos
  const maxProduct = stats.topProducts[0]?.totalSold || 1;

  return (
    <div className="space-y-8">
      {/* ── Título da Página ── */}
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
          Visão geral do negócio em tempo real
        </p>
      </div>

      {/* ── Grade de Cards KPI ── */}
      {/* grid-cols-4 em telas grandes, 2 em médias, 1 em pequenas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Faturamento Hoje */}
        <StatCard
          label="Faturamento Hoje"
          value={BRL(stats.revenueToday)}  // Formata o número como R$
          sub={`${stats.salesToday} venda${stats.salesToday !== 1 ? "s" : ""} hoje`}
          // Plural inteligente: "1 venda" ou "5 vendas"
          icon={DollarSign}
          accent="#00805A"  // Verde
        />
        {/* Card 2: Faturamento do Mês (com indicador de crescimento) */}
        <StatCard
          label="Faturamento do Mês"
          value={BRL(stats.revenueMonth)}
          sub={`${stats.salesMonth} vendas este mês`}
          icon={TrendingUp}
          accent="#F59E0B"  // Âmbar
          trend={{
            value: Math.abs(stats.growthPercent),  // Math.abs = valor absoluto (sem sinal)
            positive: stats.growthPercent >= 0,    // true = crescimento, false = queda
          }}
        />
        {/* Card 3: Ticket Médio */}
        <StatCard
          label="Ticket Médio"
          value={BRL(stats.ticketMedio)}
          sub="Por venda (mês atual)"
          icon={ShoppingCart}
          accent="#3B82F6"  // Azul
        />
        {/* Card 4: Fiado em Aberto */}
        <StatCard
          label="Fiado em Aberto"
          value={BRL(stats.totalTab)}
          sub={`${stats.debtClientsCount} clientes inadimplentes`}
          icon={CreditCard}
          accent="#EF4444"  // Vermelho
        />
      </div>

      {/* ── Linha de Gráficos Principal ── */}
      {/* 2/3 da largura para o gráfico de barras, 1/3 para o de pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Gráfico de Barras: Vendas dos Últimos 7 Dias */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
        >
          <h2 className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: "#4A7A52" }}>
            Vendas — Últimos 7 Dias
          </h2>
          {/* ResponsiveContainer adapta o gráfico ao tamanho do container */}
          <ResponsiveContainer width="100%" height={220}>
            {/* BarChart = gráfico de barras verticais */}
            <BarChart data={stats.dailySales} barSize={32}>
              {/* Grade de fundo com linhas pontilhadas */}
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2B1D" />

              {/* Eixo X: datas (convertidas para dia da semana) */}
              <XAxis
                dataKey="date"            // Campo dos dados que vai no eixo X
                tickFormatter={formatDate} // Converte "2024-06-09" → "Dom"
                tick={{ fill: "#4A7A52", fontSize: 12 }}
                axisLine={false}  // Remove a linha do eixo
                tickLine={false}  // Remove os tracinhos abaixo dos rótulos
              />

              {/* Eixo Y: valores em R$ (formato compacto: R$1k, R$5k) */}
              <YAxis
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                // v = valor bruto (ex: 1234), resultado: "R$1k"
                tick={{ fill: "#4A7A52", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}  // Largura reservada para os rótulos
              />

              {/* Tooltip personalizado ao passar o mouse */}
              <Tooltip content={<CustomTooltip />} />

              {/* As barras verdes com bordas arredondadas no topo */}
              {/* radius={[6,6,0,0]} = arredonda apenas o topo [topLeft, topRight, bottomRight, bottomLeft] */}
              <Bar dataKey="total" fill="#00805A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza: Formas de Pagamento */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
        >
          <h2 className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: "#4A7A52" }}>
            Formas de Pagamento
          </h2>

          {/* Condição: só mostra o gráfico se tiver dados */}
          {stats.salesByPayment.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={stats.salesByPayment}  // Dados
                    dataKey="total"              // Campo com o valor de cada fatia
                    nameKey="method"             // Campo com o nome de cada fatia
                    cx="50%"                     // Centro horizontal
                    cy="50%"                     // Centro vertical
                    innerRadius={45}             // Raio interno (cria o buraco = rosca)
                    outerRadius={70}             // Raio externo
                    paddingAngle={3}             // Espaço entre as fatias
                  >
                    {/* Uma Cell por fatia, cada uma com sua cor da paleta */}
                    {stats.salesByPayment.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                        // "% COLORS.length" faz voltar ao início se tiver mais fatias que cores
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => BRL(Number(v))}  // Formata o valor como R$
                    contentStyle={{
                      background: "#0F1510",
                      border: "1px solid #1A2B1D",
                      borderRadius: "12px",
                      color: "#F0F4F0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legenda manual abaixo do gráfico */}
              <div className="space-y-2 mt-2">
                {stats.salesByPayment.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    {/* Bolinha colorida + nome do método */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span style={{ color: "#6B9B73" }}>
                        {PAYMENT_LABELS[s.method || ""] || s.method}
                        {/* Usa a tradução se existir, senão usa o valor bruto */}
                      </span>
                    </div>
                    {/* Valor total nesta forma de pagamento */}
                    <span className="font-bold" style={{ color: "#F0F4F0" }}>
                      {BRL(s.total)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Estado vazio: sem vendas no mês */
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: "#2D4D33" }}>
                Sem vendas este mês
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Linha Inferior: Top Produtos + Maiores Devedores ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Card: Top 5 Produtos Mais Vendidos */}
        <div className="rounded-2xl p-6" style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
          {/* Cabeçalho */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-xl" style={{ background: "#00805A20", color: "#00805A" }}>
              <Package size={16} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
              Produtos Mais Vendidos
            </h2>
          </div>

          <div className="space-y-4">
            {/* Estado vazio */}
            {stats.topProducts.length === 0 && (
              <p className="text-sm" style={{ color: "#2D4D33" }}>
                Nenhum produto vendido ainda.
              </p>
            )}

            {/* Lista de produtos com barra de progresso */}
            {stats.topProducts.map((p, i) => (
              <div key={p.id} className="space-y-1.5">
                {/* Nome + quantidade */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold truncate max-w-[60%]" style={{ color: "#F0F4F0" }}>
                    {/* Número de ranking em verde */}
                    <span className="font-black mr-2" style={{ color: "#4A7A52" }}>
                      #{i + 1}  {/* i começa em 0, então +1 → 1, 2, 3... */}
                    </span>
                    {p.name}
                  </span>
                  <span className="font-black" style={{ color: "#F59E0B" }}>
                    {p.totalSold} un.
                  </span>
                </div>
                {/* Barra de progresso proporcional ao produto mais vendido */}
                <div className="h-1.5 rounded-full" style={{ background: "#1A2B1D" }}>
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      // Largura proporcional: se vendeu metade do mais vendido → 50%
                      width: `${Math.round((p.totalSold / maxProduct) * 100)}%`,
                      background: "linear-gradient(90deg, #00805A, #F59E0B)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card: Top 5 Maiores Devedores */}
        <div className="rounded-2xl p-6" style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
          {/* Cabeçalho */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-xl" style={{ background: "#E5393520", color: "#E53935" }}>
              <Users size={16} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
              Maiores Devedores
            </h2>
          </div>

          <div className="space-y-3">
            {/* Estado vazio — 🎉 quando não tem devedores */}
            {stats.topClients.length === 0 && (
              <p className="text-sm" style={{ color: "#2D4D33" }}>
                Nenhuma dívida em aberto. 🎉
              </p>
            )}

            {/* Lista de devedores */}
            {stats.topClients.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "#0A0D0A", border: "1px solid #1A2B1D" }}
              >
                {/* Avatar (inicial do nome) + nome */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                    style={{ background: "#E5393515", color: "#E53935", border: "1px solid #E5393930" }}
                  >
                    {/* .charAt(0) = primeiro caractere | .toUpperCase() = maiúsculo */}
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm" style={{ color: "#F0F4F0" }}>
                    {c.name}
                  </span>
                </div>
                {/* Valor da dívida em vermelho */}
                <span className="font-black text-sm" style={{ color: "#E53935" }}>
                  {BRL(c.total_debt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Banner de Alerta de Fiado ── */}
      {/* Sempre visível no rodapé do dashboard */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "#1A0F0F", border: "1px solid #E5393520" }}
      >
        {/* Ícone de alerta */}
        <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: "#E5393520", color: "#E53935" }}>
          <AlertTriangle size={18} />
        </div>
        {/* Mensagem com link para gerenciar */}
        <div>
          <p className="font-bold text-sm" style={{ color: "#F0F4F0" }}>
            {stats.debtClientsCount} clientes com fiado em aberto
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#7A3333" }}>
            Total de {BRL(stats.totalTab)} a receber.{" "}
            <a href="/admin/fiado" className="underline" style={{ color: "#E53935" }}>
              Gerenciar fiados →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
