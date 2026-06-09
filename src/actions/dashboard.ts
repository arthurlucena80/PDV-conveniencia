"use server";
// ============================================================
// dashboard.ts (painel-de-controle.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Fornece todos os DADOS PARA O PAINEL ADMINISTRATIVO.
// São as "métricas de negócio" que aparecem no dashboard:
// faturamento, vendas, clientes devedores, produtos mais vendidos, etc.
//
// OPERAÇÕES DISPONÍVEIS:
//   - getDashboardStats()    → Todos os KPIs do painel principal
//   - getMonthlySales()      → Vendas mês a mês (gráfico de linha)
//   - getSalesByCategory()   → Vendas por categoria (gráfico de pizza)
//   - getClientRanking()     → Ranking de clientes que mais compram
//   - getProductsReport()    → Relatório de produtos com lucro
//   - getNotifications()     → Alertas não lidos do sistema
//   - markNotificationRead() → Marca uma notificação como lida
//   - markAllNotificationsRead() → Marca todas como lidas
//
// ONDE FICA: src/actions/dashboard.ts
// ============================================================

import { prisma } from "@/lib/prisma";
// prisma = cliente do banco de dados

import { revalidatePath } from "next/cache";
// revalidatePath = limpa cache de páginas

// ── KPIs do Dashboard ─────────────────────────────────────────
// KPI = Key Performance Indicator (Indicador Chave de Performance)
// São as métricas principais que o dono do negócio acompanha
export async function getDashboardStats() {

  // ── Datas de referência ──
  const now = new Date();  // Data e hora atual

  // Início do dia atual (ex: 2024-06-09 00:00:00)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Início do mês atual (ex: 2024-06-01 00:00:00)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Início do mês anterior (para calcular crescimento)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Último segundo do mês anterior (ex: 2024-05-31 23:59:59)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // ── Executa todas as consultas SIMULTANEAMENTE ──
  // Promise.all = não precisa esperar uma terminar para começar a próxima
  // É como abrir 11 abas ao mesmo tempo em vez de uma por vez
  const [
    revenueToday,      // Faturamento hoje
    revenueMonth,      // Faturamento do mês atual
    revenueLastMonth,  // Faturamento do mês anterior
    salesToday,        // Número de vendas hoje
    salesMonth,        // Número de vendas no mês
    totalTab,          // Total em fiado de todos os clientes
    debtClientsCount,  // Quantos clientes têm dívida
    topProducts,       // Top 5 produtos mais vendidos
    topClients,        // Top 5 maiores devedores
    salesByPayment,    // Vendas agrupadas por forma de pagamento
    dailySales,        // Vendas dos últimos 7 dias (para o gráfico)
  ] = await Promise.all([

    // 1. Faturamento de hoje
    // aggregate = faz cálculos em múltiplos registros
    // _sum = soma todos os valores de total_amount
    prisma.order.aggregate({
      where: { status: "PAID", closed_at: { gte: startOfDay } },
      // "gte" = "greater than or equal" (maior ou igual)
      _sum: { total_amount: true },
    }),

    // 2. Faturamento do mês atual
    prisma.order.aggregate({
      where: { status: "PAID", closed_at: { gte: startOfMonth } },
      _sum: { total_amount: true },
    }),

    // 3. Faturamento do mês anterior
    prisma.order.aggregate({
      where: {
        status: "PAID",
        closed_at: { gte: startOfLastMonth, lte: endOfLastMonth },
        // "lte" = "less than or equal" (menor ou igual)
      },
      _sum: { total_amount: true },
    }),

    // 4. Quantidade de vendas hoje
    prisma.order.count({ where: { status: "PAID", closed_at: { gte: startOfDay } } }),

    // 5. Quantidade de vendas no mês
    prisma.order.count({ where: { status: "PAID", closed_at: { gte: startOfMonth } } }),

    // 6. Total de fiado de todos os clientes somado
    prisma.client.aggregate({ _sum: { total_debt: true } }),

    // 7. Quantos clientes têm dívida maior que zero
    prisma.client.count({ where: { total_debt: { gt: 0 } } }),
    // "gt" = "greater than" (maior que)

    // 8. Top 5 produtos mais vendidos (agrupados por produto)
    prisma.orderItem.groupBy({
      by: ["product_id"],              // Agrupa por produto
      _sum: { quantity: true },        // Soma as quantidades vendidas
      orderBy: { _sum: { quantity: "desc" } }, // Ordena do mais vendido ao menos
      take: 5,                         // Pega apenas os 5 primeiros
    }),

    // 9. Top 5 maiores devedores (clientes com mais fiado)
    prisma.client.findMany({
      where: { total_debt: { gt: 0 } },  // Apenas quem tem dívida
      orderBy: { total_debt: "desc" },    // Quem deve mais primeiro
      take: 5,
    }),

    // 10. Vendas agrupadas por forma de pagamento no mês
    prisma.order.groupBy({
      by: ["payment_method"],            // Agrupa por forma de pagamento
      where: { status: "PAID", closed_at: { gte: startOfMonth } },
      _sum: { total_amount: true },      // Soma o valor de cada forma
      _count: true,                      // E conta o número de vendas
    }),

    // 11. Vendas dos últimos 7 dias (SQL puro para agrupar por data)
    // $queryRaw = SQL direto no banco (Prisma não tem esta função de forma simples)
    prisma.$queryRaw<{ date: string; total: any; count: bigint }[]>`
      SELECT
        DATE(closed_at) as date,          -- Apenas a data (sem hora)
        SUM(total_amount) as total,        -- Total faturado no dia
        COUNT(*) as count                  -- Número de vendas no dia
      FROM "Order"
      WHERE status = 'PAID'
        AND closed_at >= NOW() - INTERVAL '7 days'  -- Últimos 7 dias
      GROUP BY DATE(closed_at)             -- Um registro por dia
      ORDER BY date ASC                    -- Ordem cronológica
    `,
  ]);

  // ── Busca os detalhes dos top produtos (nome, categoria, preço) ──
  // Primeiro buscamos apenas os IDs (acima), agora buscamos os detalhes
  const topProductDetails = await Promise.all(
    topProducts.map(async (p) => {
      // Para cada produto do top 5, busca os dados completos
      const product = await prisma.product.findUnique({
        where: { id: p.product_id },
        include: { category: true },
      });
      return {
        ...product,
        totalSold: Number(p._sum.quantity || 0), // Total vendido (convertido para Number)
        price: Number(product?.price || 0),       // Preço (convertido para Number)
      };
    })
  );

  // ── Calcula métricas derivadas ──
  const revToday = Number(revenueToday._sum.total_amount || 0);       // R$ hoje
  const revMonth = Number(revenueMonth._sum.total_amount || 0);       // R$ no mês
  const revLastMonth = Number(revenueLastMonth._sum.total_amount || 0); // R$ mês anterior

  // Ticket médio = faturamento do mês ÷ número de vendas
  // (valor médio de cada venda)
  const ticketMedio = salesMonth > 0 ? revMonth / salesMonth : 0;
  // "salesMonth > 0 ?" = verifica antes de dividir para não dar erro de "divisão por zero"

  // ── Monta e retorna o objeto final ──
  return {
    revenueToday: revToday,         // Faturamento hoje em R$
    revenueMonth: revMonth,         // Faturamento do mês em R$
    revenueLastMonth: revLastMonth, // Faturamento do mês anterior em R$

    // Percentual de crescimento em relação ao mês anterior
    // revLastMonth > 0 = só calcula se tiver dados do mês anterior
    growthPercent: revLastMonth > 0
      ? ((revMonth - revLastMonth) / revLastMonth) * 100
      : 0,

    salesToday,   // Número de vendas hoje
    salesMonth,   // Número de vendas no mês
    ticketMedio,  // Valor médio por venda
    totalTab: Number(totalTab._sum.total_debt || 0), // Total em fiado
    debtClientsCount,  // Número de clientes com dívida

    topProducts: topProductDetails,  // Top 5 produtos mais vendidos

    // Serializa os clientes devedores (converte Decimal para Number)
    topClients: topClients.map((c) => ({
      ...c,
      total_debt: Number(c.total_debt),
      credit_limit: Number(c.credit_limit),
    })),

    // Serializa as vendas por forma de pagamento
    salesByPayment: salesByPayment.map((s) => ({
      method: s.payment_method,           // PIX, CARD, CASH, TAB...
      total: Number(s._sum.total_amount || 0), // Total em R$
      count: s._count,                    // Número de transações
    })),

    // Serializa as vendas diárias para o gráfico
    dailySales: dailySales.map((d) => ({
      date: String(d.date),    // Data em texto (ex: "2024-06-09")
      total: Number(d.total),  // Faturamento do dia
      count: Number(d.count),  // Número de vendas (bigint → Number)
    })),
  };
}

// ── Relatório Mensal de Vendas ────────────────────────────────
// Retorna o faturamento de cada mês de um determinado ano
// year = ano desejado (ex: 2024)
export async function getMonthlySales(year: number) {
  const result = await prisma.$queryRaw<{ month: string; total: any; count: bigint }[]>`
    SELECT
      TO_CHAR(closed_at, 'YYYY-MM') as month,  -- Ex: "2024-06"
      SUM(total_amount) as total,               -- Total do mês
      COUNT(*) as count                          -- Número de vendas
    FROM "Order"
    WHERE status = 'PAID'
      AND EXTRACT(YEAR FROM closed_at) = ${year}  -- Apenas o ano solicitado
    GROUP BY TO_CHAR(closed_at, 'YYYY-MM')
    ORDER BY month ASC  -- Janeiro primeiro
  `;
  return result.map((r) => ({
    month: r.month,
    total: Number(r.total),
    count: Number(r.count),
  }));
}

// ── Relatório de Vendas por Categoria ────────────────────────
// Para o gráfico de pizza: quanto cada categoria vendeu
export async function getSalesByCategory() {
  const result = await prisma.$queryRaw<{ category_name: string; total: any; count: bigint }[]>`
    SELECT
      COALESCE(c.name, 'Sem Categoria') as category_name,
      -- COALESCE = "se nulo, usa 'Sem Categoria'"
      SUM(oi.quantity * oi.historical_price) as total,
      -- Total = quantidade × preço histórico de cada item
      COUNT(DISTINCT o.id) as count  -- Número de pedidos únicos
    FROM "OrderItem" oi
    JOIN "Order" o ON oi.order_id = o.id
    JOIN "Product" p ON oi.product_id = p.id
    LEFT JOIN "Category" c ON p.category_id = c.id
    -- LEFT JOIN = inclui mesmo produtos sem categoria
    WHERE o.status = 'PAID'
    GROUP BY c.name
    ORDER BY total DESC  -- Categorias mais vendidas primeiro
  `;
  return result.map((r) => ({
    category: r.category_name,
    total: Number(r.total),
    count: Number(r.count),
  }));
}

// ── Ranking de Clientes ───────────────────────────────────────
// Top 10 clientes que mais compraram no total (inclui fiado)
export async function getClientRanking() {
  const result = await prisma.$queryRaw<{
    id: string;
    name: string;
    total_purchases: any;
    order_count: bigint;
  }[]>`
    SELECT
      c.id,
      c.name,
      SUM(o.total_amount) as total_purchases,  -- Total gasto pelo cliente
      COUNT(o.id) as order_count               -- Número de pedidos
    FROM "Client" c
    JOIN "Order" o ON o.client_id = c.id
    WHERE o.status IN ('PAID', 'UNPAID')  -- Inclui fiado (UNPAID)
    GROUP BY c.id, c.name
    ORDER BY total_purchases DESC          -- Maiores compradores primeiro
    LIMIT 10
  `;
  return result.map((r) => ({
    ...r,
    total_purchases: Number(r.total_purchases),
    order_count: Number(r.order_count),
    // Ticket médio = total gasto ÷ número de compras
    ticket_medio: Number(r.total_purchases) / Number(r.order_count),
  }));
}

// ── Relatório de Produtos ─────────────────────────────────────
// Tabela completa: cada produto com quantidade vendida, receita e lucro
export async function getProductsReport() {
  const result = await prisma.$queryRaw<any[]>`
    SELECT
      p.id,
      p.name,
      p.price,
      p.cost_price,
      COALESCE(SUM(oi.quantity), 0) as total_sold,
      -- Total vendido em unidades (0 se nunca foi vendido)
      COALESCE(SUM(oi.quantity * oi.historical_price), 0) as total_revenue,
      -- Receita total = quantidade × preço de venda histórico
      COALESCE(SUM(oi.quantity * (oi.historical_price - COALESCE(p.cost_price, 0))), 0) as total_profit
      -- Lucro bruto = quantidade × (preço de venda - custo)
      -- COALESCE(p.cost_price, 0) = usa 0 se o custo não foi cadastrado
    FROM "Product" p
    LEFT JOIN "OrderItem" oi ON oi.product_id = p.id
    -- LEFT JOIN = inclui produtos que nunca foram vendidos (mostra 0)
    LEFT JOIN "Order" o ON oi.order_id = o.id AND o.status = 'PAID'
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.price, p.cost_price
    ORDER BY total_sold DESC  -- Mais vendidos primeiro
  `;
  return result.map((r) => ({
    ...r,
    price: Number(r.price),
    cost_price: r.cost_price ? Number(r.cost_price) : null,
    total_sold: Number(r.total_sold),
    total_revenue: Number(r.total_revenue),
    total_profit: Number(r.total_profit),
  }));
}

// ── Buscar Notificações Não Lidas ─────────────────────────────
// Retorna os 20 alertas mais recentes que ainda não foram lidos
export async function getNotifications() {
  return prisma.notification.findMany({
    where: { is_read: false },       // Apenas não lidas
    orderBy: { created_at: "desc" }, // Mais recentes primeiro
    take: 20,                        // Limite de 20
  });
}

// ── Marcar Notificação como Lida ──────────────────────────────
// id = ID da notificação
export async function markNotificationRead(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { is_read: true },  // Marca como lida
  });
  revalidatePath("/admin");   // Atualiza o badge de notificações
}

// ── Marcar Todas como Lidas ───────────────────────────────────
// Útil para limpar todas as notificações de uma vez
export async function markAllNotificationsRead() {
  await prisma.notification.updateMany({
    where: { is_read: false },   // Apenas as não lidas
    data: { is_read: true },     // Marca todas como lidas
  });
  revalidatePath("/admin");
}
