// ============================================================
// estoque/page.tsx — Página de Estoque (Servidor)
// (pagina-de-estoque.tsx)
//
// O QUE ESTE ARQUIVO FAZ:
// Camada do servidor da página /admin/estoque.
// Busca QUATRO conjuntos de dados em paralelo para o painel:
//   1. lowStockProducts  → Produtos com estoque abaixo do mínimo
//   2. summary           → Resumo geral (total de produtos, valor total)
//   3. recentMovements   → Histórico das últimas 100 movimentações
//   4. allProducts       → Todos os produtos (para o formulário de entrada)
//
// ONDE FICA: src/app/admin/estoque/page.tsx
// ============================================================

import {
  getLowStockProducts,
  getStockSummary,
  getInventoryMovements
} from "@/actions/inventory";
// Importa as funções de consulta do módulo de estoque

import { getProducts } from "@/actions/product";
// Importa a lista de produtos (para o formulário de movimentação)

import { EstoqueClient } from "./client";
// Importa o componente de interface (mesmo diretório)

// Sempre busca dados frescos — essencial para gestão de estoque!
export const dynamic = "force-dynamic";

// ── Página de Estoque ─────────────────────────────────────────
export default async function EstoquePage() {
  // Executa as 4 consultas SIMULTANEAMENTE com Promise.all
  // Economia de tempo: em vez de ~400ms (4 × 100ms em série),
  // leva apenas ~100ms (todas ao mesmo tempo em paralelo)
  const [lowStockProducts, summary, recentMovements, allProducts] =
    await Promise.all([
      getLowStockProducts(),   // Produtos críticos (estoque abaixo do mínimo)
      getStockSummary(),       // KPIs: total de produtos, qtd críticos, valor total
      getInventoryMovements(), // Últimas 100 movimentações de estoque
      getProducts(),           // Todos os produtos (para o dropdown do formulário)
    ]);

  // Passa todos os dados para o Client Component
  // O EstoqueClient usa cada um para renderizar:
  //   lowStockProducts → cards de alerta (vermelho)
  //   summary          → cards de KPI no topo
  //   recentMovements  → tabela de histórico
  //   allProducts      → dropdown "Selecionar produto" no formulário
  return (
    <EstoqueClient
      lowStockProducts={lowStockProducts}
      summary={summary}
      recentMovements={recentMovements}
      allProducts={allProducts}
    />
  );
}
