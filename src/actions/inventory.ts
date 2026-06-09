"use server";
// ============================================================
// inventory.ts (estoque.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Gerencia o ESTOQUE de produtos: registra entradas, saídas,
// ajustes e perdas. Mantém o campo "stock_current" de cada
// produto sempre atualizado.
//
// OPERAÇÕES DISPONÍVEIS:
//   - getInventoryMovements()     → Histórico de movimentações
//   - createInventoryMovement()   → Registra nova movimentação
//   - getLowStockProducts()       → Produtos abaixo do mínimo
//   - getStockSummary()           → Resumo geral do estoque (KPIs)
//
// TIPOS DE MOVIMENTAÇÃO (MovementType):
//   ENTRY       = Entrada (compra de mercadoria do fornecedor)
//   EXIT        = Saída manual (além das vendas normais)
//   ADJUSTMENT  = Ajuste por contagem física
//   LOSS        = Perda (produto estragado, quebra, etc.)
//   EXPIRATION  = Produto vencido
//
// ONDE FICA: src/actions/inventory.ts
// ============================================================

import { prisma } from "@/lib/prisma";
// prisma = cliente do banco de dados

import { revalidatePath } from "next/cache";
// revalidatePath = limpa cache de páginas após mudanças

import { MovementType } from "@prisma/client";
// MovementType = enum importado do Prisma com os tipos possíveis de movimentação
// (ENTRY, EXIT, ADJUSTMENT, LOSS, EXPIRATION)

// ── Função Auxiliar ───────────────────────────────────────────
// Serialização básica de movimentação (sem campos Decimal complexos)
function serializeMovement(m: any) {
  return { ...m }; // Por enquanto, só copia o objeto sem transformações
}

// ── Listar Histórico de Movimentações ─────────────────────────
// Retorna as últimas 100 movimentações de estoque
// productId = se informado, filtra apenas para esse produto
export async function getInventoryMovements(productId?: string) {
  const movements = await prisma.inventoryMovement.findMany({
    // Se productId for passado, filtra por produto; senão, busca todos
    // "productId ?" = "productId existe?" — se sim, aplica o filtro
    where: productId ? { product_id: productId } : undefined,

    include: { product: true }, // Inclui os dados do produto em cada movimentação

    orderBy: { created_at: "desc" }, // Mais recentes primeiro

    take: 100, // Limita a 100 registros (evita carregar o banco todo)
  });
  return movements;
}

// ── Registrar Nova Movimentação de Estoque ────────────────────
// Cria um registro no histórico E atualiza o estoque do produto
// Esta é a função mais importante do estoque!
export async function createInventoryMovement(data: {
  product_id: string;  // Qual produto será movimentado
  type: MovementType;  // Tipo: ENTRY, EXIT, ADJUSTMENT, LOSS ou EXPIRATION
  quantity: number;    // Quantidade (sempre positiva — o tipo define o sinal)
  notes?: string;      // Observação (ex: "Compra do fornecedor X") — opcional
}) {
  // Valida: quantidade deve ser positiva
  // (o "tipo" define se vai entrar ou sair do estoque)
  if (data.quantity <= 0) throw new Error("Quantidade deve ser maior que zero.");

  // Busca o produto para verificar se existe e saber o estoque atual
  const product = await prisma.product.findUnique({
    where: { id: data.product_id }
  });
  if (!product) throw new Error("Produto não encontrado.");

  // ── Calcula o delta (variação) do estoque ──
  // "delta" = quanto vai mudar no estoque (positivo = entra, negativo = sai)
  let stockDelta = 0;

  if (data.type === "ENTRY") {
    // Entrada de mercadoria: SOMA a quantidade
    stockDelta = data.quantity;

  } else if (
    data.type === "EXIT" ||
    data.type === "LOSS" ||
    data.type === "EXPIRATION"
  ) {
    // Saída, perda ou vencimento: SUBTRAI a quantidade
    stockDelta = -data.quantity; // O "-" torna negativo (diminui o estoque)

  } else if (data.type === "ADJUSTMENT") {
    // Ajuste manual: pode ser positivo (adiciona) ou negativo (remove)
    // Neste caso, passamos a quantidade positiva e ela é somada diretamente
    stockDelta = data.quantity;
  }

  // Calcula o novo estoque após a movimentação
  const newStock = product.stock_current + stockDelta;

  // Valida: estoque não pode ficar negativo
  // (não dá para ter -5 unidades de um produto)
  if (newStock < 0) {
    throw new Error("Estoque insuficiente para esta operação.");
  }

  // ── Executa as duas operações juntas (transação) ──
  // $transaction = se uma falhar, a outra é desfeita automaticamente
  // Evita situações como: "registrou a saída mas não atualizou o estoque"
  await prisma.$transaction([
    // 1. Registra a movimentação no histórico
    prisma.inventoryMovement.create({ data }),

    // 2. Atualiza o estoque atual do produto
    prisma.product.update({
      where: { id: data.product_id },
      data: { stock_current: newStock }, // Define o novo valor de estoque
    }),
  ]);

  // Atualiza caches das páginas afetadas
  revalidatePath("/admin/estoque");   // Tela de controle de estoque
  revalidatePath("/admin/produtos");  // Lista de produtos (mostra stock_current)
  revalidatePath("/");               // PDV (pode ocultar produto sem estoque)
}

// ── Produtos com Estoque Baixo ────────────────────────────────
// Retorna produtos onde o estoque atual está abaixo ou igual ao mínimo
// O Prisma não suporta comparação entre colunas (stock_current <= stock_min),
// então usamos uma query SQL pura com $queryRaw
export async function getLowStockProducts() {
  // $queryRaw = executa SQL puro diretamente no banco
  // Quando o Prisma não suporta algo, usamos SQL diretamente
  const rawResult = await prisma.$queryRaw<any[]>`
    SELECT p.*, c.name as category_name
    FROM "Product" p
    LEFT JOIN "Category" c ON p.category_id = c.id
    WHERE p.is_active = true
      AND p.stock_current <= p.stock_min
    ORDER BY p.stock_current ASC
    LIMIT 50
  `;
  // Serializa os resultados (converte Decimal para Number)
  return rawResult.map((p: any) => ({
    ...p,
    price: Number(p.price),
    cost_price: p.cost_price ? Number(p.cost_price) : null,
  }));
}

// ── Resumo Geral do Estoque (KPIs) ───────────────────────────
// Retorna 3 métricas para o painel de estoque:
// - Total de produtos cadastrados e ativos
// - Quantidade de produtos com estoque baixo (alertas)
// - Valor total do estoque em R$ (estoque × preço de venda)
export async function getStockSummary() {
  // Promise.all = executa as 3 consultas ao banco SIMULTANEAMENTE
  // Mais rápido do que fazer uma por vez (seriam 3 idas ao banco em série)
  const [totalProducts, lowStock, totalValue] = await Promise.all([

    // 1. Conta todos os produtos ativos
    prisma.product.count({ where: { is_active: true } }),

    // 2. Conta produtos com estoque abaixo do mínimo (SQL puro)
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Product"
      WHERE is_active = true AND stock_current <= stock_min
    `,
    // bigint = número inteiro muito grande (o PostgreSQL retorna COUNT como bigint)

    // 3. Calcula o valor total do estoque (quantidade × preço)
    prisma.$queryRaw<[{ total: any }]>`
      SELECT COALESCE(SUM(stock_current * price), 0) as total FROM "Product"
      WHERE is_active = true
    `,
    // COALESCE = "se for nulo, use 0" — evita NULL quando não há produtos
    // SUM = soma todos os valores
  ]);

  // Monta e retorna o objeto de resumo
  return {
    totalProducts,                          // Número simples (do count())
    lowStockCount: Number(lowStock[0].count), // Converte bigint → Number
    totalStockValue: Number(totalValue[0].total), // Converte para Number
  };
}
