"use server";
// ============================================================
// product.ts (produtos.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Gerencia os PRODUTOS do sistema: cadastro, edição, listagem,
// busca, exclusão e ativação/desativação.
//
// OPERAÇÕES DISPONÍVEIS:
//   - getProducts()         → Lista TODOS os produtos (admin)
//   - getActiveProducts()   → Lista só produtos ativos (PDV)
//   - getProductById()      → Busca um produto pelo ID
//   - createProduct()       → Cadastra novo produto
//   - updateProduct()       → Atualiza dados do produto
//   - toggleProductActive() → Ativa ou desativa produto
//   - deleteProduct()       → Remove produto (com proteção)
//   - searchProducts()      → Busca por nome, barcode ou marca
//
// ONDE FICA: src/actions/product.ts
// ============================================================

import { prisma } from "@/lib/prisma";
// prisma = cliente do banco de dados (ver src/lib/prisma.ts)

import { revalidatePath } from "next/cache";
// revalidatePath = limpa o cache de uma página para ela recarregar dados frescos

// ── Função Auxiliar: serializeProduct ────────────────────────
// O Prisma retorna preços como "Decimal" (tipo especial).
// O Next.js exige que passemos apenas números simples (Number)
// para os componentes React (Client Components).
// Esta função faz essa conversão.
function serializeProduct(product: any) {
  if (!product) return null;  // Se não tiver produto, retorna vazio
  return {
    ...product,  // Copia todos os campos do produto
    price: Number(product.price),  // Converte preço de venda: Decimal → Number
    // Preço de custo pode ser nulo (não obrigatório no cadastro)
    cost_price: product.cost_price ? Number(product.cost_price) : null,
  };
}

// ── Listar Todos os Produtos ──────────────────────────────────
// Usado na tela de administração de produtos (inclui inativos)
// Retorna também os dados da categoria de cada produto (join automático)
export async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },    // Ordena de A a Z pelo nome
    include: { category: true }, // Inclui os dados da categoria junto
  });
  // Aplica serialização em todos os produtos
  return products.map(serializeProduct);
}

// ── Listar Produtos Ativos ────────────────────────────────────
// Usado NO PDV (tela de vendas) — só mostra produtos disponíveis
export async function getActiveProducts() {
  const products = await prisma.product.findMany({
    where: { is_active: true },   // Filtra só os ativos
    orderBy: { name: "asc" },
    include: { category: true },
  });
  return products.map(serializeProduct);
}

// ── Buscar Produto Por ID ─────────────────────────────────────
// Retorna os dados completos de um produto específico
// id = o UUID do produto no banco
export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },           // Busca pelo ID exato
    include: { category: true },
  });
  return serializeProduct(product);
}

// ── Criar Novo Produto ────────────────────────────────────────
// Recebe os dados do formulário e salva no banco
// Campos com "?" são opcionais no cadastro
export async function createProduct(data: {
  name: string;          // Nome do produto — obrigatório
  price: number;         // Preço de venda em R$ — obrigatório
  cost_price?: number;   // Preço de custo — opcional (para calcular margem)
  barcode?: string;      // Código de barras — opcional
  brand?: string;        // Marca — opcional
  category_id?: string;  // ID da categoria — opcional
  stock_current?: number;  // Quantidade atual em estoque
  stock_min?: number;      // Quantidade mínima (para alertas)
  image_url?: string;    // URL da foto — opcional
  description?: string;  // Descrição — opcional
}) {
  // Cria o produto e já retorna os dados salvos
  const product = await prisma.product.create({ data });

  // Atualiza o cache das páginas que mostram produtos
  revalidatePath("/admin/produtos"); // Lista de produtos no admin
  revalidatePath("/");              // PDV principal

  // Retorna o produto criado (com dados serializados)
  return serializeProduct(product);
}

// ── Atualizar Produto Existente ───────────────────────────────
// Atualiza apenas os campos passados (todos opcionais)
// id = ID do produto a alterar
export async function updateProduct(
  id: string,
  data: {
    name?: string;
    price?: number;
    cost_price?: number;
    barcode?: string;
    brand?: string;
    category_id?: string | null;  // null = remove a categoria
    stock_current?: number;
    stock_min?: number;
    image_url?: string;
    description?: string;
    is_active?: boolean;  // Pode ativar/desativar aqui também
  }
) {
  // Atualiza apenas os campos recebidos
  await prisma.product.update({ where: { id }, data });

  // Atualiza caches das páginas afetadas
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque"); // Estoque também exibe produtos
  revalidatePath("/");
}

// ── Ativar / Desativar Produto ────────────────────────────────
// Alterna entre ativo e inativo sem excluir o produto
// is_active = true (ativo) ou false (inativo)
export async function toggleProductActive(id: string, is_active: boolean) {
  await prisma.product.update({
    where: { id },
    data: { is_active },  // Só altera o campo is_active
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

// ── Excluir Produto ───────────────────────────────────────────
// REGRA DE NEGÓCIO: Não pode excluir produto que já foi vendido!
// Se tentarmos excluir, o banco de dados rejeitaria (onDelete: Restrict)
// Mas verificamos antes para dar uma mensagem amigável ao usuário.
export async function deleteProduct(id: string) {
  // Conta quantos itens de pedido usam este produto
  // count() = conta o número de registros
  const count = await prisma.orderItem.count({
    where: { product_id: id }
  });

  // Se já foi vendido ao menos uma vez, não permite excluir
  if (count > 0) {
    throw new Error(
      "Não é possível excluir um produto que já está em uma comanda. Tente inativá-lo."
    );
  }

  // Se nunca foi vendido, pode excluir
  await prisma.product.delete({ where: { id } });

  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

// ── Buscar Produtos por Texto ─────────────────────────────────
// Busca em nome, código de barras E marca ao mesmo tempo
// query = o texto digitado na barra de busca
export async function searchProducts(query: string) {
  const products = await prisma.product.findMany({
    where: {
      is_active: true,  // Apenas ativos
      OR: [
        // "OR" = pelo menos UMA das condições abaixo precisa ser verdadeira:
        { name: { contains: query, mode: "insensitive" } },
        // contains = "contém o texto"
        // mode: "insensitive" = não diferencia maiúsculas de minúsculas
        { barcode: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { category: true },
    take: 20,  // Limita o resultado a 20 produtos (performance)
  });
  return products.map(serializeProduct);
}
