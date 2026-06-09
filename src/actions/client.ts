"use server";
// ============================================================
// client.ts (clientes.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Gerencia os CLIENTES do sistema (cadastro, atualização,
// histórico de compras, controle de fiado).
//
// OPERAÇÕES DISPONÍVEIS:
//   - getClients()        → Lista todos os clientes
//   - createClient()      → Cadastra novo cliente
//   - updateClient()      → Atualiza dados do cliente
//   - deleteClient()      → Remove cliente (só se sem dívida)
//   - getClientHistory()  → Histórico de compras e pagamentos
//   - payDebt()           → Registra pagamento de fiado
//
// ONDE FICA: src/actions/client.ts
// ============================================================

import { prisma } from "@/lib/prisma";
// prisma = nosso cliente do banco de dados

import { revalidatePath } from "next/cache";
// revalidatePath = limpa o cache de uma página para forçar atualização

// ── Função Auxiliar: serializeClient ─────────────────────────
// Converte os campos Decimal do Prisma para Number simples
// (mesmo motivo explicado em order.ts)
function serializeClient(client: any) {
  if (!client) return null;
  return {
    ...client,   // Copia todos os campos do cliente
    total_debt: Number(client.total_debt),     // Total em fiado
    credit_limit: Number(client.credit_limit), // Limite de crédito
  };
}

// ── Listar Todos os Clientes ──────────────────────────────────
// Retorna todos os clientes ordenados por nome (A-Z)
export async function getClients() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },  // "asc" = ascendente = A até Z
  });
  // Aplica a serialização em cada cliente da lista
  return clients.map(serializeClient);
}

// ── Criar Novo Cliente ────────────────────────────────────────
// "data" = objeto com os dados do formulário de cadastro
// "?" após o campo = campo opcional (não obrigatório)
export async function createClient(data: {
  name: string;         // Nome (obrigatório)
  cpf?: string;         // CPF (opcional)
  phone?: string;       // Telefone (opcional)
  email?: string;       // E-mail (opcional)
  address?: string;     // Endereço (opcional)
  birth_date?: Date;    // Data de nascimento (opcional)
  credit_limit?: number; // Limite de crédito em R$ (opcional)
  notes?: string;       // Observações (opcional)
}) {
  // Cria o cliente no banco com os dados recebidos
  await prisma.client.create({ data });

  // Atualiza o cache das páginas que mostram clientes
  revalidatePath("/admin/clientes");  // Página de listagem de clientes
  revalidatePath("/");               // PDV principal (lista lateral)
}

// ── Atualizar Cliente Existente ───────────────────────────────
// id = ID único do cliente no banco
// data = campos a atualizar (todos opcionais)
export async function updateClient(
  id: string,
  data: {
    name?: string;
    cpf?: string;
    phone?: string;
    email?: string;
    address?: string;
    birth_date?: Date;
    credit_limit?: number;
    notes?: string;
  }
) {
  // Atualiza apenas os campos passados em "data"
  // O Prisma só altera os campos que você enviar!
  await prisma.client.update({ where: { id }, data });

  // Atualiza caches
  revalidatePath("/admin/clientes");
  revalidatePath("/");
}

// ── Excluir Cliente ───────────────────────────────────────────
// Remove um cliente do sistema
// REGRA DE NEGÓCIO: Não é possível excluir clientes com dívida ativa!
export async function deleteClient(id: string) {
  // Primeiro, busca o cliente para verificar se tem dívida
  const client = await prisma.client.findUnique({ where: { id } });

  // Verifica se o cliente tem dívida pendente
  // Number() converte Decimal para número para comparar
  if (client && Number(client.total_debt) > 0) {
    // Lança um erro que aparecerá como toast de erro na tela
    throw new Error("Não é possível excluir um cliente com saldo devedor.");
  }

  // Se não tem dívida, pode deletar
  await prisma.client.delete({ where: { id } });

  // Atualiza caches
  revalidatePath("/admin/clientes");
  revalidatePath("/");
}

// ── Histórico do Cliente ──────────────────────────────────────
// Retorna todas as compras no fiado e todos os pagamentos
// de um cliente específico
// clientId = ID do cliente
export async function getClientHistory(clientId: string) {

  // Busca todas as compras no FIADO deste cliente
  // (apenas TAB = compras que foram para o fiado)
  const orders = await prisma.order.findMany({
    where: {
      client_id: clientId,
      payment_method: "TAB"  // Apenas pedidos no fiado
    },
    include: {
      items: {
        include: { product: true }  // Inclui os detalhes de cada produto
      }
    },
    orderBy: { created_at: "desc" },  // Mais recentes primeiro
  });

  // Busca todos os pagamentos feitos por este cliente
  const payments = await prisma.debtPayment.findMany({
    where: { client_id: clientId },
    orderBy: { created_at: "desc" },  // Mais recentes primeiro
  });

  // Retorna as duas listas, já serializadas (sem Decimal)
  return {
    // Serializa cada pedido e seus itens
    orders: orders.map((o: any) => ({
      ...o,
      total_amount: Number(o.total_amount),
      discount: Number(o.discount),
      items: o.items?.map((i: any) => ({
        ...i,
        historical_price: Number(i.historical_price),
        product: i.product
          ? {
              ...i.product,
              price: Number(i.product.price),
              // Custo pode ser nulo
              cost_price: i.product.cost_price ? Number(i.product.cost_price) : null
            }
          : undefined,
      })),
    })),
    // Serializa cada pagamento
    payments: payments.map((p: any) => ({
      ...p,
      amount: Number(p.amount)  // Valor pago
    })),
  };
}

// ── Registrar Pagamento de Fiado ──────────────────────────────
// Registra que o cliente pagou parte ou toda sua dívida
// clientId = ID do cliente
// amountToPay = valor que está sendo pago agora (em R$)
export async function payDebt(clientId: string, amountToPay: number) {

  // Busca o cliente para verificar a dívida atual
  const client = await prisma.client.findUnique({ where: { id: clientId } });

  // Se o cliente não existir mais no banco
  if (!client) throw new Error("Cliente não encontrado.");

  // Verifica se o valor a pagar não é maior que a dívida
  // (não faz sentido pagar mais do que deve)
  if (Number(client.total_debt) < amountToPay) {
    throw new Error("Valor de pagamento excede a dívida total.");
  }

  // $transaction = executa as duas operações juntas ou nenhuma
  // Se uma falhar, a outra é desfeita (atomicidade)
  await prisma.$transaction([

    // 1. Registra o pagamento no histórico
    prisma.debtPayment.create({
      data: {
        client_id: clientId,  // Quem pagou
        amount: amountToPay,  // Quanto pagou
        // user_id e notes podem ser adicionados futuramente
      }
    }),

    // 2. Subtrai o valor pago da dívida do cliente
    // decrement = subtrai o valor do campo atual no banco
    prisma.client.update({
      where: { id: clientId },
      data: { total_debt: { decrement: amountToPay } },
    }),
  ]);

  // Atualiza o cache de todas as páginas afetadas
  revalidatePath("/admin/clientes"); // Página de clientes
  revalidatePath("/admin/fiado");    // Página de fiado
  revalidatePath("/admin");          // Dashboard (mostra total de inadimplência)
  revalidatePath("/");              // PDV principal
}
