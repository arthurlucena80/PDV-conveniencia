"use server";
// ============================================================
// order.ts (pedidos.ts / vendas.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Controla tudo relacionado a VENDAS/COMANDAS do PDV.
// Uma "Order" (Pedido) é uma comanda aberta ou fechada.
//
// FLUXO DE UMA VENDA:
//   1. getOrCreateOrder()  → Abre uma comanda (status: OPEN)
//   2. addOrderItems()     → Adiciona produtos na comanda
//   3. removeOrderItem()   → Remove um produto se necessário
//   4. closeOrder()        → Fecha a comanda com forma de pagamento
//
// ONDE FICA: src/actions/order.ts
// ============================================================

import { prisma } from "@/lib/prisma";
// prisma = nosso cliente do banco de dados

import { OrderStatus, PaymentMethod } from "@prisma/client";
// OrderStatus = status possíveis: OPEN (aberto), PAID (pago), UNPAID (fiado)
// PaymentMethod = formas de pagamento: PIX, CARD, CASH, TAB (fiado)

import { revalidatePath } from "next/cache";
// revalidatePath = função do Next.js que limpa o cache de uma página
// Necessária para que a tela atualize após uma mudança no banco

import { sendReceiptViaEvolution } from "@/lib/evolution";
// Integração com WhatsApp para envio automático do recibo

// ── Função Auxiliar: serializeOrder ──────────────────────────
// PROBLEMA: O Prisma retorna valores monetários como "Decimal"
// (um tipo especial de número). O Next.js não consegue passar
// objetos Decimal do servidor para o cliente (componentes React).
//
// SOLUÇÃO: Esta função converte todos os Decimal para Number simples
// antes de enviar para o navegador.
//
// "order: any" = aceita qualquer formato de pedido
function serializeOrder(order: any) {
  // Se o pedido não existir, retorna null (vazio)
  if (!order) return null;

  return {
    ...order,  // Copia todos os campos do pedido original

    // Converte o total de Decimal para número normal
    // Ex: Decimal("25.90") → 25.90
    total_amount: Number(order.total_amount),

    // Converte o desconto (usa 0 se não tiver desconto)
    // "??" = operador "nullish coalescing": usa o valor da direita se o da esquerda for null/undefined
    discount: Number(order.discount ?? 0),

    // Converte os itens do pedido (é uma lista, então usamos .map())
    // .map() = aplica uma função em cada item da lista
    items: order.items?.map((i: any) => ({
      ...i,  // Copia todos os campos do item
      historical_price: Number(i.historical_price),  // Preço histórico (no momento da venda)
      product: i.product ? {
        ...i.product,   // Copia todos os campos do produto
        price: Number(i.product.price),  // Preço atual do produto
        // Preço de custo pode ser nulo (alguns produtos não têm custo cadastrado)
        cost_price: i.product.cost_price != null ? Number(i.product.cost_price) : null,
      } : undefined,
    })),

    // Converte os dados do cliente associado ao pedido
    client: order.client ? {
      ...order.client,   // Copia todos os campos do cliente
      total_debt: Number(order.client.total_debt),           // Dívida total do cliente
      credit_limit: Number(order.client.credit_limit ?? 0),  // Limite de crédito
    } : null,  // Se não tem cliente (venda avulsa), retorna null
  };
}

// ── Buscar Pedidos em Aberto ──────────────────────────────────
// Retorna todas as comandas que ainda estão abertas (status OPEN)
// Usado na tela principal do PDV para mostrar as comandas ativas
export async function getOpenOrders() {
  const orders = await prisma.order.findMany({
    where: { status: "OPEN" },  // Apenas pedidos abertos
    include: {
      client: true,  // Inclui os dados do cliente junto
      items: {
        include: { product: true }  // Inclui os dados do produto em cada item
      }
    },
    orderBy: { created_at: "desc" }  // Mais recentes primeiro
  });

  // Converte todos os pedidos para formato seguro (sem Decimal)
  return orders.map(serializeOrder);
}

// ── Abrir ou Buscar Comanda ───────────────────────────────────
// Se o cliente já tem uma comanda aberta, retorna ela.
// Se não tem, cria uma nova.
// clientId = ID do cliente (opcional — vendas avulsas não têm cliente)
export async function getOrCreateOrder(clientId?: string) {
  if (clientId) {
    // ── Com cliente identificado ──
    // Procura se já existe uma comanda aberta para este cliente
    let order = await prisma.order.findFirst({
      where: { client_id: clientId, status: "OPEN" },
      include: { items: { include: { product: true } }, client: true }
    });

    // Se não encontrou, cria uma nova comanda zerada para o cliente
    if (!order) {
      order = await prisma.order.create({
        data: {
          client_id: clientId,  // Vincula ao cliente
          status: "OPEN",       // Abre a comanda
          total_amount: 0,      // Começa com total zero
        },
        include: { items: { include: { product: true } }, client: true }
      });
    }
    return serializeOrder(order);

  } else {
    // ── Venda avulsa (sem cliente) ──
    // Procura uma comanda anônima vazia existente para reaproveitar
    let order = await prisma.order.findFirst({
      where: {
        client_id: null,    // Sem cliente
        status: "OPEN",     // Aberta
        total_amount: 0,    // Vazia (total zero)
      },
      include: { items: { include: { product: true } }, client: true },
      orderBy: { created_at: 'desc' }  // A mais recente primeiro
    });

    // Se não existe comanda vazia, cria uma nova
    if (!order) {
      order = await prisma.order.create({
        data: { status: "OPEN", total_amount: 0 },
        include: { items: { include: { product: true } }, client: true }
      });
    }
    return serializeOrder(order);
  }
}

// ── Buscar Uma Comanda Específica ─────────────────────────────
// Retorna os dados de uma comanda pelo seu ID
// orderId = o ID único da comanda (UUID gerado automaticamente)
export async function getOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },  // Inclui itens e produtos
      client: true  // Inclui dados do cliente
    }
  });
  return serializeOrder(order);
}

// ── Adicionar Produtos na Comanda ─────────────────────────────
// Adiciona um ou mais produtos em uma comanda existente
// orderId = ID da comanda
// items = lista de { productId: ID do produto, quantity: quantidade }
export async function addOrderItems(
  orderId: string,
  items: { productId: string; quantity: number }[]
) {
  // Processa cada produto da lista
  for (const item of items) {
    // Ignora se a quantidade for zero ou negativa
    if (item.quantity <= 0) continue;

    // Busca os dados do produto no banco (para saber o preço atual)
    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    });

    // Se o produto não existir mais no banco, pula
    if (!product) continue;

    // Verifica se este produto já está na comanda
    const existingItem = await prisma.orderItem.findFirst({
      where: { order_id: orderId, product_id: item.productId },
    });

    if (existingItem) {
      // ── Produto já na comanda → incrementa a quantidade ──
      await prisma.orderItem.update({
        where: { id: existingItem.id },
        data: {
          // Soma a quantidade atual com a nova quantidade
          quantity: existingItem.quantity + item.quantity,
        },
      });
    } else {
      // ── Produto novo na comanda → cria um novo item ──
      await prisma.orderItem.create({
        data: {
          order_id: orderId,         // Qual comanda
          product_id: item.productId, // Qual produto
          quantity: item.quantity,    // Quantidade
          // Salva o preço ATUAL do produto como "preço histórico"
          // Assim, se o preço mudar depois, a comanda mantém o preço original
          historical_price: product.price,
        },
      });
    }
  }

  // Recalcula o total da comanda com os novos itens
  await recalculateOrderTotal(orderId);

  // Atualiza o cache da página principal do PDV
  revalidatePath("/");
}

// ── Remover Item da Comanda ───────────────────────────────────
// Remove um produto específico da comanda (pelo ID do item)
// orderId = ID da comanda
// orderItemId = ID do item a remover
export async function removeOrderItem(orderId: string, orderItemId: string) {
  // Deleta o item do banco (usa deleteMany para não quebrar se o item já foi removido)
  await prisma.orderItem.deleteMany({
    where: { id: orderItemId },
  });

  // Recalcula o total sem o item removido
  await recalculateOrderTotal(orderId);

  // Atualiza o cache
  revalidatePath("/");
}

// ── Fechar (Finalizar) a Comanda ──────────────────────────────
// Registra o pagamento e fecha a comanda
// orderId = ID da comanda
// paymentMethod = forma de pagamento (PIX, CARD, CASH, TAB)
// clientId = ID do cliente (opcional, para registrar no fiado)
// discount = valor do desconto em reais (padrão: 0)
export async function closeOrder(
  orderId: string,
  paymentMethod: PaymentMethod,
  clientId?: string,
  discount = 0
) {
  // Busca a comanda atual no banco
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Comanda não encontrada.");

  // Determina o cliente: o passado como parâmetro ou o da própria comanda
  const finalClientId = clientId || order.client_id;

  // Calcula o valor final com desconto
  // Math.max(0, ...) garante que o valor nunca seja negativo
  const finalAmount = Math.max(0, Number(order.total_amount) - discount);

  // Data e hora do fechamento
  const now = new Date();

  if (paymentMethod === "TAB") {
    // ── Pagamento no Fiado ──
    // O cliente leva agora e paga depois

    // Fiado sem cliente é impossível — precisa saber quem deve
    if (!finalClientId) throw new Error("Selecione um cliente para registrar no Fiado.");

    // $transaction = executa as duas operações juntas ou nenhuma
    // (se uma falhar, a outra é desfeita automaticamente — ACID)
    await prisma.$transaction([
      // 1. Atualiza a comanda para status UNPAID (não pago)
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: "UNPAID",
          payment_method: "TAB",
          client_id: finalClientId,
          discount,    // Registra o desconto dado
          closed_at: now,  // Data/hora do fechamento
        },
      }),
      // 2. Soma o valor ao saldo devedor do cliente
      // increment = adiciona o valor ao campo atual
      prisma.client.update({
        where: { id: finalClientId },
        data: { total_debt: { increment: finalAmount } },
      }),
    ]);

  } else {
    // ── Outros pagamentos (PIX, Cartão, Dinheiro) ──
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",            // Pago!
        payment_method: paymentMethod,
        client_id: finalClientId,
        discount,
        closed_at: now,
      },
    });
  }

  // Atualiza os caches de todas as páginas afetadas
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/fiado");

  // ── Envio de Recibo via WhatsApp (Evolution API) ──
  // Busca o pedido completo para gerar o recibo
  try {
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        items: { include: { product: true } }
      }
    });

    if (fullOrder && fullOrder.client && fullOrder.client.phone) {
      // Dispara assincronamente (não usamos await para não travar o fechamento da tela)
      sendReceiptViaEvolution(serializeOrder(fullOrder)).catch((err) => {
        console.error("Erro no envio do whatsapp em background:", err);
      });
    }
  } catch (error) {
    console.error("Erro ao tentar disparar WhatsApp:", error);
  }
}

// ── Função Interna: Recalcular Total ─────────────────────────
// "async" = função assíncrona (pode esperar o banco responder)
// Não é exportada (só usada internamente por este arquivo)
async function recalculateOrderTotal(orderId: string) {
  // Busca todos os itens da comanda
  const items = await prisma.orderItem.findMany({
    where: { order_id: orderId },
  });

  // Soma os totais de cada item
  // reduce() = percorre a lista acumulando um resultado
  // acc = acumulador (começa em 0)
  // item = cada item da lista
  const total = items.reduce((acc, item) => {
    // Valor do item = preço × quantidade
    return acc + (Number(item.historical_price) * item.quantity);
  }, 0);  // 0 = valor inicial do acumulador

  // Atualiza o total da comanda no banco
  await prisma.order.update({
    where: { id: orderId },
    data: { total_amount: total },
  });
}
