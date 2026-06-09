"use server";
// ============================================================
// settings.ts (configuracoes.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Gerencia as CONFIGURAÇÕES GERAIS da loja armazenadas no banco.
// Existe apenas UM registro de configurações (id = "default").
//
// OPERAÇÕES:
//   - getSettings()    → Busca as configurações atuais
//   - saveSettings()   → Salva/atualiza as configurações
//
// ONDE FICA: src/actions/settings.ts
// ============================================================

import { prisma } from "@/lib/prisma";
// prisma = cliente do banco de dados

import { revalidatePath } from "next/cache";
// revalidatePath = limpa o cache para a página atualizar

// Tipo TypeScript que descreve os campos de configuração
// Todos opcionais pois o usuário pode salvar partes
export type SettingsData = {
  store_name?: string;     // Nome da loja
  store_phone?: string;    // Telefone da loja
  store_address?: string;  // Endereço da loja
  pix_key?: string;        // Chave PIX para recebimentos
  currency?: string;       // Moeda (padrão: BRL)
  tax_rate?: number;       // Taxa de imposto em %
  low_stock_alert?: number; // Limite mínimo para alerta de estoque
};

// ── Buscar Configurações ──────────────────────────────────────
// Sempre retorna um objeto de configurações.
// Se não existir nenhum registro, cria um com valores padrão (upsert).
export async function getSettings() {
  // upsert = "update or insert":
  // - Se o registro com id "default" existir → retorna ele
  // - Se não existir → cria com os valores de "create"
  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    update: {},             // Nenhuma atualização (só queremos buscar)
    create: {               // Valores padrão se não existir
      id: "default",
      store_name: "Minha Conveniência",
      currency: "BRL",
      tax_rate: 0,
      low_stock_alert: 5,
    },
  });

  // Converte o Decimal (tax_rate) para número simples
  return {
    ...settings,
    tax_rate: Number(settings.tax_rate),
  };
}

// ── Salvar Configurações ──────────────────────────────────────
// Atualiza (ou cria) o único registro de configurações
export async function saveSettings(data: SettingsData) {
  await prisma.settings.upsert({
    where: { id: "default" },
    // "update" = o que atualizar se já existir
    update: {
      store_name: data.store_name,
      store_phone: data.store_phone || null,
      store_address: data.store_address || null,
      pix_key: data.pix_key || null,
      currency: data.currency || "BRL",
      tax_rate: data.tax_rate ?? 0,
      low_stock_alert: data.low_stock_alert ?? 5,
    },
    // "create" = o que criar se não existir (com o id "default")
    create: {
      id: "default",
      store_name: data.store_name || "Minha Conveniência",
      store_phone: data.store_phone || null,
      store_address: data.store_address || null,
      pix_key: data.pix_key || null,
      currency: data.currency || "BRL",
      tax_rate: data.tax_rate ?? 0,
      low_stock_alert: data.low_stock_alert ?? 5,
    },
  });

  // Atualiza o cache das páginas
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin");
}
