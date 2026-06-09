// ============================================================
// categorias/page.tsx — Página de Categorias (Servidor)
// (pagina-de-categorias.tsx)
//
// O QUE ESTE ARQUIVO FAZ:
// É a "camada do servidor" da página /admin/categorias.
// Sua única responsabilidade: BUSCAR os dados do banco e
// passá-los para o componente de interface (CategoriasClient).
//
// PADRÃO UTILIZADO: Server Component + Client Component
// ┌──────────────────────────────────────────────────────┐
// │ page.tsx (SERVIDOR)                                  │
// │   ↓ busca dados do banco (roda no servidor)          │
// │   ↓ passa dados como "props"                         │
// │ client.tsx (NAVEGADOR)                               │
// │   ↓ recebe os dados e monta a interface interativa  │
// │   ↓ gerencia estados (abrir modal, editar, deletar)  │
// └──────────────────────────────────────────────────────┘
//
// POR QUE SEPARAR?
// O servidor pode acessar o banco diretamente, mas não pode
// ter estados (useState) ou eventos (onClick).
// O navegador pode ter estados e eventos, mas não acessa
// o banco diretamente.
// Separando, temos o melhor dos dois mundos!
//
// ONDE FICA: src/app/admin/categorias/page.tsx
// ============================================================

import { getCategories } from "@/actions/category";
// Importa a função que busca as categorias do banco

import { CategoriasClient } from "./client";
// Importa o componente de interface (está no mesmo diretório)
// "./" = pasta atual (categorias/)

// Instrui o Next.js a SEMPRE buscar dados frescos do banco
// (desativa o cache estático desta página)
// Sem isso, o Next.js pode mostrar dados desatualizados
export const dynamic = "force-dynamic";

// ── Componente de Página (Server Component) ───────────────────
// "async" = pode esperar operações assíncronas (como buscar do banco)
export default async function CategoriasPage() {
  // Busca todas as categorias do banco (em ordem alfabética)
  const categories = await getCategories();

  // Passa os dados para o Client Component e renderiza
  // O CategoriasClient recebe "categories" como prop e monta a interface
  return <CategoriasClient categories={categories} />;
}
