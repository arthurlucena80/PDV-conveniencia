// ============================================================
// prisma.ts (cliente-do-banco.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Cria e exporta UMA ÚNICA INSTÂNCIA do cliente do Prisma
// para todo o sistema usar. É a "porta de entrada" para o banco.
//
// POR QUE UM ÚNICO CLIENTE?
// O Prisma abre conexões com o banco de dados. Se criássemos
// um novo cliente em cada arquivo (new PrismaClient()), abriríamos
// centenas de conexões e o banco travaria!
//
// SOLUÇÃO: Singleton Pattern (padrão de instância única)
// - Em PRODUÇÃO: cria uma instância e usa para sempre
// - Em DESENVOLVIMENTO: salva na variável global para sobreviver
//   ao "hot reload" (quando o Next.js reinicia ao salvar código)
//
// ONDE FICA: src/lib/prisma.ts
// ============================================================

import { PrismaClient } from "@prisma/client";
// PrismaClient = a classe principal do Prisma
// "@prisma/client" é gerado automaticamente pelo "npx prisma generate"

// ── Singleton: Instância única do Prisma ─────────────────────
// globalThis = objeto global do Node.js (persiste entre reloads)
// "as unknown as { prisma: PrismaClient }" = TypeScript casting
// (dizemos ao TypeScript que globalThis tem uma propriedade "prisma")
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Lógica de singleton:
// - Se já existe uma instância em globalForPrisma.prisma, usa ela
// - Se não existe, cria uma nova (new PrismaClient())
// O operador "||" = "ou": usa o primeiro se ele existir, senão usa o segundo
export const prisma = globalForPrisma.prisma || new PrismaClient();
// "export const" = exporta para que outros arquivos usem:
// import { prisma } from "@/lib/prisma"

// ── Salva na variável global (apenas em desenvolvimento) ──────
// Em produção (NODE_ENV === "production"), não precisamos disso
// pois o servidor não fica reiniciando a cada mudança no código.
// Em desenvolvimento, o Next.js reinicia o servidor ao salvar arquivos,
// então precisamos guardar a instância para não criar uma nova a cada vez.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
// process.env.NODE_ENV = variável de ambiente que diz se é "development" ou "production"
