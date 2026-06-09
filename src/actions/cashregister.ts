"use server";
// ============================================================
// cashregister.ts (controle-de-caixa.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Gerencia a abertura e fechamento de caixa por funcionário.
// Cada turno de trabalho tem um caixa associado.
//
// OPERAÇÕES:
//   - openCash()         → Abre o caixa do dia para o operador logado
//   - closeCash()        → Fecha o caixa com valor informado
//   - getCurrentCash()   → Retorna o caixa aberto do operador (se existir)
//   - getCashHistory()   → Histórico de todos os caixas
//   - getCashSummary()   → KPIs para o dashboard de caixa
//
// ONDE FICA: src/actions/cashregister.ts
// ============================================================

import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/auth";
import { logEvent } from "@/actions/audit";
import { revalidatePath } from "next/cache";

// ── Abrir Caixa ───────────────────────────────────────────────
// Registra a abertura do caixa pelo operador logado
// openingAmount = valor em dinheiro no caixa antes de começar (fundo de troco)
export async function openCash(openingAmount: number, notes?: string) {
  const session = await getSession();
  if (!session) throw new Error("Você precisa estar logado para abrir o caixa.");

  // Verifica se já tem um caixa aberto para este usuário
  const existing = await prisma.cashRegister.findFirst({
    where: { user_id: session.userId, closed_at: null },
  });
  if (existing) throw new Error("Você já tem um caixa aberto. Feche-o antes de abrir um novo.");

  const cashRegister = await prisma.cashRegister.create({
    data: {
      user_id:        session.userId,
      opening_amount: openingAmount,
      notes:          notes || null,
    },
  });

  await logEvent({
    action:    "CASH_OPENED",
    module:    "CASH",
    entity:    "CashRegister",
    entity_id: cashRegister.id,
    new_data:  { opening_amount: openingAmount, operator: session.name },
  });

  revalidatePath("/admin/funcionarios/caixa");
  return cashRegister;
}

// ── Fechar Caixa ──────────────────────────────────────────────
// cashId = ID do registro de caixa a fechar
// closingAmount = valor físico contado pelo operador
export async function closeCash(cashId: string, closingAmount: number, notes?: string) {
  const session = await getSession();
  if (!session) throw new Error("Sessão inválida.");

  // Busca o caixa e verifica se pertence ao usuário logado (ou é admin)
  const cashRegister = await prisma.cashRegister.findUnique({
    where: { id: cashId },
    include: { user: { select: { name: true } } },
  });
  if (!cashRegister) throw new Error("Caixa não encontrado.");
  if (cashRegister.closed_at) throw new Error("Este caixa já foi fechado.");

  // Calcula o valor esperado: vendas em dinheiro desde a abertura
  const cashSales = await prisma.order.aggregate({
    where: {
      user_id:       cashRegister.user_id,
      status:        "PAID",
      payment_method: "CASH",
      closed_at:     { gte: cashRegister.opened_at },
    },
    _sum: { total_amount: true },
  });

  const expectedAmount = Number(cashRegister.opening_amount) + Number(cashSales._sum.total_amount || 0);
  const difference     = closingAmount - expectedAmount;

  const updated = await prisma.cashRegister.update({
    where: { id: cashId },
    data: {
      closed_at:      new Date(),
      closing_amount: closingAmount,
      expected_amount: expectedAmount,
      difference,
      notes: notes || cashRegister.notes,
    },
  });

  await logEvent({
    action:    "CASH_CLOSED",
    module:    "CASH",
    entity:    "CashRegister",
    entity_id: cashId,
    new_data:  {
      operator:        cashRegister.user.name,
      expected_amount: expectedAmount,
      closing_amount:  closingAmount,
      difference,
    },
  });

  revalidatePath("/admin/funcionarios/caixa");
  return { ...updated, expectedAmount, difference };
}

// ── Caixa Atual Aberto ────────────────────────────────────────
// Retorna o caixa aberto do usuário logado (null se não tiver)
export async function getCurrentCash() {
  const session = await getSession();
  if (!session) return null;

  const cash = await prisma.cashRegister.findFirst({
    where: { user_id: session.userId, closed_at: null },
    include: { user: { select: { name: true } } },
  });

  if (!cash) return null;

  return {
    ...cash,
    opening_amount: Number(cash.opening_amount),
  };
}

// ── Histórico de Caixas ───────────────────────────────────────
// Para a tabela de histórico na página de controle de caixa
export async function getCashHistory(filters?: {
  user_id?: string;
  from?: string;
  to?: string;
}) {
  const where: any = {};
  if (filters?.user_id) where.user_id = filters.user_id;
  if (filters?.from || filters?.to) {
    where.opened_at = {};
    if (filters.from) where.opened_at.gte = new Date(filters.from);
    if (filters.to)   where.opened_at.lte = new Date(filters.to + "T23:59:59");
  }

  const registers = await prisma.cashRegister.findMany({
    where,
    orderBy: { opened_at: "desc" },
    take: 100,
    include: { user: { select: { name: true, role: true } } },
  });

  return registers.map((r) => ({
    ...r,
    opening_amount:  Number(r.opening_amount),
    closing_amount:  r.closing_amount  ? Number(r.closing_amount)  : null,
    expected_amount: r.expected_amount ? Number(r.expected_amount) : null,
    difference:      r.difference      ? Number(r.difference)      : null,
  }));
}

// ── KPIs do Controle de Caixa ─────────────────────────────────
// Para os cards no topo da página de caixa
export async function getCashSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [openCount, closedToday, diffToday, allOpen] = await Promise.all([
    // Caixas abertos agora
    prisma.cashRegister.count({ where: { closed_at: null } }),

    // Caixas fechados hoje
    prisma.cashRegister.count({
      where: { closed_at: { gte: today } },
    }),

    // Soma das diferenças dos fechamentos de hoje (para ver discrepâncias)
    prisma.cashRegister.aggregate({
      where: { closed_at: { gte: today }, difference: { not: null } },
      _sum: { difference: true },
    }),

    // Lista de quem está com caixa aberto agora
    prisma.cashRegister.findMany({
      where: { closed_at: null },
      include: { user: { select: { name: true } } },
    }),
  ]);

  return {
    openCount,
    closedToday,
    totalDifference: Number(diffToday._sum.difference || 0),
    openCashiers: allOpen.map((c) => ({
      id:             c.id,
      userName:       c.user.name,
      opened_at:      c.opened_at,
      opening_amount: Number(c.opening_amount),
    })),
  };
}
