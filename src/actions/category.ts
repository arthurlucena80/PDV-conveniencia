"use server";
// ============================================================
// category.ts (categorias.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Gerencia as CATEGORIAS de produtos: Bebidas, Snacks,
// Refrigerantes, etc. Cada produto pode ter uma categoria
// para facilitar a organização e os filtros no PDV.
//
// OPERAÇÕES DISPONÍVEIS:
//   - getCategories()    → Lista todas as categorias
//   - createCategory()   → Cria nova categoria com ícone e cor
//   - updateCategory()   → Atualiza uma categoria
//   - deleteCategory()   → Remove (só se não tiver produtos)
//
// ONDE FICA: src/actions/category.ts
// ============================================================

import { prisma } from "@/lib/prisma";
// prisma = cliente do banco de dados

import { revalidatePath } from "next/cache";
// revalidatePath = força a atualização do cache de uma página

// ── Listar Todas as Categorias ────────────────────────────────
// Retorna todas as categorias em ordem alfabética (A-Z)
// Usada em: filtros do PDV, formulário de produto, tela de categorias
export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" }, // "asc" = ascendente = A até Z
  });
  // Não precisa de serialização aqui pois Category não tem campos Decimal
}

// ── Criar Nova Categoria ──────────────────────────────────────
// data.name  = nome obrigatório (ex: "Bebidas")
// data.icon  = emoji opcional para o ícone visual (ex: "🍺")
// data.color = cor hexadecimal opcional (ex: "#3B82F6" = azul)
export async function createCategory(data: {
  name: string;   // Nome da categoria — obrigatório
  icon?: string;  // Emoji ícone — opcional (ex: "🍺", "🥤", "🍫")
  color?: string; // Cor em HEX — opcional (ex: "#FF5733", "#22C55E")
}) {
  // Cria e retorna a nova categoria
  const cat = await prisma.category.create({ data });

  // Atualiza o cache das páginas que listam categorias
  revalidatePath("/admin/categorias"); // Tela de gestão de categorias
  revalidatePath("/admin/produtos");   // Formulário de produto (dropdown de categorias)

  // Retorna os dados da categoria criada
  return cat;
}

// ── Atualizar Categoria ───────────────────────────────────────
// id   = ID único da categoria no banco
// data = novos valores para nome, ícone e/ou cor
export async function updateCategory(
  id: string,
  data: {
    name: string;   // Nome (obrigatório na atualização)
    icon?: string;  // Ícone — opcional
    color?: string; // Cor — opcional
  }
) {
  // Atualiza a categoria com os novos dados
  await prisma.category.update({ where: { id }, data });

  // Atualiza caches das páginas afetadas
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/produtos");
}

// ── Excluir Categoria ─────────────────────────────────────────
// REGRA DE NEGÓCIO: Não pode excluir uma categoria que tem produtos!
// Se excluíssemos, os produtos ficariam "órfãos" (sem categoria).
// O schema define onDelete: SetNull (os produtos ficam sem categoria),
// mas aqui verificamos para dar uma mensagem amigável.
export async function deleteCategory(id: string) {
  // Conta quantos produtos usam esta categoria
  const count = await prisma.product.count({
    where: { category_id: id }
  });

  // Se tem produtos, não permite excluir
  if (count > 0) {
    throw new Error(
      "Existem produtos nessa categoria. Remova-os ou mude a categoria primeiro."
    );
  }

  // Sem produtos, pode excluir
  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/categorias");
}
