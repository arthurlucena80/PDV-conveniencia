// ============================================================
// produtos/page.tsx — Página de Produtos (Servidor)
// (pagina-de-produtos.tsx)
//
// O QUE ESTE ARQUIVO FAZ:
// Camada do servidor da página /admin/produtos.
// Busca dois conjuntos de dados em paralelo:
//   - Todos os produtos (para montar a tabela)
//   - Todas as categorias (para o filtro e o formulário)
// Depois passa ambos para o ProdutosClient renderizar.
//
// ONDE FICA: src/app/admin/produtos/page.tsx
// ============================================================

import { getProducts } from "@/actions/product";
// Importa a função que busca todos os produtos do banco

import { getCategories } from "@/actions/category";
// Importa a função que busca todas as categorias do banco

import { ProdutosClient } from "./client";
// Importa o componente de interface interativa (mesmo diretório)

// Sempre busca dados frescos — não usa cache do Next.js
export const dynamic = "force-dynamic";

// ── Página de Produtos ────────────────────────────────────────
export default async function ProdutosPage() {
  // Promise.all = executa as duas buscas AO MESMO TEMPO
  // Mais rápido que fazer uma por vez!
  // Sem Promise.all seria:
  //   const products = await getProducts();    (espera)
  //   const categories = await getCategories(); (espera de novo)
  // Com Promise.all:
  //   as duas buscas acontecem simultaneamente
  const [products, categories] = await Promise.all([
    getProducts(),    // Lista de todos os produtos
    getCategories(),  // Lista de todas as categorias
  ]);

  // Passa os dados para o Client Component
  // "products" = array de produtos
  // "categories" = array de categorias (para o dropdown no formulário)
  return <ProdutosClient products={products} categories={categories} />;
}
