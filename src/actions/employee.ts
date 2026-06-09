"use server";
// ============================================================
// employee.ts (funcionario.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Gerencia os funcionários do sistema (CRUD completo).
// Aqui ficam as funções para listar, criar, editar,
// ativar/desativar e ver estatísticas de cada funcionário.
//
// OPERAÇÕES:
//   - getEmployees()         → Lista todos os funcionários
//   - getEmployee()          → Busca um funcionário por ID
//   - createEmployee()       → Cria novo funcionário
//   - updateEmployee()       → Edita dados do funcionário
//   - toggleEmployeeStatus() → Ativa ou desativa o acesso
//   - resetPassword()        → Redefine a senha
//   - getEmployeeStats()     → Vendas, cancelamentos, descontos por funcionário
//
// ONDE FICA: src/actions/employee.ts
// ============================================================

import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logEvent } from "@/actions/audit";

// Nomes amigáveis dos perfis de acesso
export const ROLE_LABELS: Record<string, string> = {
  ADMIN:    "Administrador",
  MANAGER:  "Gerente",
  OPERATOR: "Somente PDV",
};

// ── Listar Todos os Funcionários ─────────────────────────────
// Retorna todos os usuários do sistema com contagem de sessões e vendas
export async function getEmployees() {
  const users = await prisma.user.findMany({
    orderBy: [{ is_active: "desc" }, { name: "asc" }],
    select: {
      id:         true,
      name:       true,
      email:      true,
      role:       true,
      cpf:        true,
      phone:      true,
      avatar_url: true,
      hired_at:   true,
      is_active:  true,
      created_at: true,
      // Última sessão de login
      sessions: {
        orderBy: { logged_in: "desc" },
        take: 1,
        select: { logged_in: true, logged_out: true, ip: true },
      },
      // Total de vendas (comandas fechadas)
      orders: {
        where: { status: "PAID" },
        select: { total_amount: true, discount: true },
      },
    },
  });

  return users.map((u) => ({
    ...u,
    hired_at:        u.hired_at?.toISOString() || null,
    created_at:      u.created_at.toISOString(),
    lastSession:     u.sessions[0] || null,
    totalSales:      u.orders.length,
    totalRevenue:    u.orders.reduce((s, o) => s + Number(o.total_amount), 0),
    totalDiscounts:  u.orders.reduce((s, o) => s + Number(o.discount), 0),
  }));
}

// ── Buscar Funcionário por ID ────────────────────────────────
export async function getEmployee(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      cpf: true, phone: true, avatar_url: true, hired_at: true,
      is_active: true, created_at: true,
    },
  });
}

// ── Criar Novo Funcionário ────────────────────────────────────
export async function createEmployee(data: {
  name:       string;
  email:      string;
  password:   string;
  role:       "ADMIN" | "MANAGER" | "OPERATOR";
  cpf?:       string;
  phone?:     string;
  avatar_url?: string;
  hired_at?:  string;
}) {
  // Verifica se o email já está em uso
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Este e-mail já está cadastrado no sistema.");

  // Gera o hash da senha
  const hashed = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name:       data.name.trim(),
      email:      data.email.trim().toLowerCase(),
      password:   hashed,
      role:       data.role,
      cpf:        data.cpf?.replace(/\D/g, "") || null,  // Remove pontos e traços
      phone:      data.phone || null,
      avatar_url: data.avatar_url || null,
      hired_at:   data.hired_at ? new Date(data.hired_at) : null,
    },
  });

  // Registra na auditoria
  await logEvent({
    action:    "EMPLOYEE_CREATED",
    module:    "USERS",
    entity:    "User",
    entity_id: user.id,
    new_data:  { name: user.name, email: user.email, role: user.role },
  });

  revalidatePath("/admin/funcionarios");
  return user;
}

// ── Editar Funcionário ────────────────────────────────────────
export async function updateEmployee(id: string, data: {
  name?:       string;
  email?:      string;
  role?:       "ADMIN" | "MANAGER" | "OPERATOR";
  cpf?:        string;
  phone?:      string;
  avatar_url?: string;
  hired_at?:   string;
}) {
  const before = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, role: true, cpf: true, phone: true },
  });

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name       && { name: data.name.trim() }),
      ...(data.email      && { email: data.email.trim().toLowerCase() }),
      ...(data.role       && { role: data.role }),
      ...(data.cpf        !== undefined && { cpf: data.cpf?.replace(/\D/g, "") || null }),
      ...(data.phone      !== undefined && { phone: data.phone || null }),
      ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url || null }),
      ...(data.hired_at   !== undefined && { hired_at: data.hired_at ? new Date(data.hired_at) : null }),
    },
  });

  await logEvent({
    action:    "EMPLOYEE_UPDATED",
    module:    "USERS",
    entity:    "User",
    entity_id: id,
    old_data:  before,
    new_data:  { name: updated.name, email: updated.email, role: updated.role },
  });

  revalidatePath("/admin/funcionarios");
  return updated;
}

// ── Ativar / Desativar Funcionário ────────────────────────────
// Não deleta — apenas bloqueia o acesso
export async function toggleEmployeeStatus(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { is_active: true, name: true } });
  if (!user) throw new Error("Funcionário não encontrado.");

  // Não permite desativar o próprio admin (proteção)
  const adminCount = await prisma.user.count({ where: { role: "ADMIN", is_active: true } });
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (target?.role === "ADMIN" && adminCount <= 1 && user.is_active) {
    throw new Error("Não é possível desativar o único administrador ativo.");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { is_active: !user.is_active },
  });

  await logEvent({
    action:    updated.is_active ? "EMPLOYEE_ACTIVATED" : "EMPLOYEE_DEACTIVATED",
    module:    "USERS",
    entity:    "User",
    entity_id: id,
    new_data:  { name: user.name, is_active: updated.is_active },
  });

  revalidatePath("/admin/funcionarios");
  return updated;
}

// ── Redefinir Senha ───────────────────────────────────────────
export async function resetPassword(id: string, newPassword: string) {
  if (newPassword.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { password: hashed } });

  await logEvent({
    action: "PASSWORD_RESET",
    module: "USERS",
    entity: "User",
    entity_id: id,
  });

  revalidatePath("/admin/funcionarios");
}

// ── Estatísticas por Funcionário ──────────────────────────────
// Para o ranking: quem vendeu mais, menos, médio, etc.
export async function getEmployeeStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },  // Exclui admins do ranking operacional
    select: {
      id: true, name: true, role: true, avatar_url: true, is_active: true,
      orders: {
        where: { status: "PAID", closed_at: { gte: startOfMonth } },
        select: { total_amount: true, discount: true, closed_at: true },
      },
    },
  });

  return users.map((u) => {
    const sales      = u.orders.length;
    const revenue    = u.orders.reduce((s, o) => s + Number(o.total_amount), 0);
    const discounts  = u.orders.reduce((s, o) => s + Number(o.discount), 0);
    const ticketMedio = sales > 0 ? revenue / sales : 0;
    return {
      id:          u.id,
      name:        u.name,
      role:        u.role,
      roleLabel:   ROLE_LABELS[u.role] || u.role,
      avatar_url:  u.avatar_url,
      is_active:   u.is_active,
      sales,
      revenue,
      discounts,
      ticketMedio,
    };
  }).sort((a, b) => b.revenue - a.revenue);  // Ordena por maior faturamento
}
