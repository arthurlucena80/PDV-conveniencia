"use server";
// ============================================================
// audit.ts (auditoria.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Registra e consulta todos os eventos de auditoria do sistema.
// Toda ação importante (login, venda, desconto, etc.) é gravada
// aqui para rastrear quem fez o quê e quando.
//
// OPERAÇÕES:
//   - logEvent()     → Grava um evento no AuditLog
//   - getAuditLogs() → Consulta eventos com filtros
//
// ONDE FICA: src/actions/audit.ts
// ============================================================

import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/auth";

// Tipo que descreve os dados para registrar um evento
export type AuditEventData = {
  action: string;       // Ex: "LOGIN", "SALE", "PRICE_CHANGE"
  module?: string;      // Ex: "AUTH", "SALES", "PRODUCTS"
  entity: string;       // Ex: "Order", "Product", "User"
  entity_id?: string;   // ID do registro afetado
  old_data?: any;       // Dados anteriores (antes da mudança)
  new_data?: any;       // Dados novos (após a mudança)
  ip?: string;          // IP do usuário
  user_id?: string;     // Forçar user_id (para login, que não tem sessão ainda)
};

// ── Registrar Evento de Auditoria ────────────────────────────
// Função utilitária chamada por outros actions para gravar eventos
// Não é necessário chamar manualmente — cada action chama quando precisa
export async function logEvent(data: AuditEventData) {
  try {
    // Tenta pegar o usuário da sessão atual
    const session = await getSession();
    const userId = data.user_id || session?.userId || null;

    await prisma.auditLog.create({
      data: {
        user_id:   userId,
        action:    data.action,
        module:    (data.module as any) || "SALES",
        entity:    data.entity,
        entity_id: data.entity_id || null,
        old_data:  data.old_data   ? JSON.parse(JSON.stringify(data.old_data)) : undefined,
        new_data:  data.new_data   ? JSON.parse(JSON.stringify(data.new_data)) : undefined,
        ip:        data.ip || null,
      },
    });
  } catch (err) {
    // Nunca deixa o erro de auditoria derrubar a operação principal
    console.error("[AUDIT] Falha ao registrar evento:", err);
  }
}

// ── Consultar Logs de Auditoria ──────────────────────────────
// Retorna logs filtrados para a tela de auditoria do admin
export async function getAuditLogs(filters?: {
  user_id?: string;
  module?: string;
  action?: string;
  from?: string;  // Data início (ISO string)
  to?: string;    // Data fim (ISO string)
  page?: number;
}) {
  const page = filters?.page || 1;
  const take = 50; // Registros por página
  const skip = (page - 1) * take;

  const where: any = {};

  if (filters?.user_id)  where.user_id = filters.user_id;
  if (filters?.module)   where.module = filters.module;
  if (filters?.action)   where.action = { contains: filters.action, mode: "insensitive" };

  // Filtro de data
  if (filters?.from || filters?.to) {
    where.created_at = {};
    if (filters.from) where.created_at.gte = new Date(filters.from);
    if (filters.to)   where.created_at.lte = new Date(filters.to + "T23:59:59");
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      take,
      skip,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    pages: Math.ceil(total / take),
  };
}

// ── Resumo de Atividade de Hoje ──────────────────────────────
// Para o widget no dashboard de funcionários
export async function getTodayActivity() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [logins, sales, discounts, stockChanges] = await Promise.all([
    prisma.auditLog.count({
      where: { action: "LOGIN", created_at: { gte: startOfDay } },
    }),
    prisma.auditLog.count({
      where: { module: "SALES", action: "SALE_CLOSED", created_at: { gte: startOfDay } },
    }),
    prisma.auditLog.count({
      where: { module: "DISCOUNTS", created_at: { gte: startOfDay } },
    }),
    prisma.auditLog.count({
      where: { module: "STOCK", created_at: { gte: startOfDay } },
    }),
  ]);

  return { logins, sales, discounts, stockChanges };
}
