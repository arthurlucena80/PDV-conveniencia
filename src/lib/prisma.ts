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
const globalForPrisma = globalThis as unknown as { prisma: any };

const basePrisma = new PrismaClient();

// Criamos o cliente estendido com os observers (gatilhos) para a Automação do ClientLog
export const prisma = globalForPrisma.prisma || basePrisma.$extends({
  query: {
    order: {
      async update({ args, query }) {
        const result = await query(args);
        
        // Se a ordem foi fechada e pertence a um cliente, gera log de consumo
        if (result && result.client_id && (args.data.status === "PAID" || args.data.status === "UNPAID")) {
          const items = await basePrisma.orderItem.findMany({
            where: { order_id: result.id },
            include: { product: true }
          });
          
          if (items.length > 0) {
            const desc = items.map(i => `${i.quantity}x ${i.product.name}`).join(", ");
            await basePrisma.clientLog.create({
              data: {
                client_id: result.client_id,
                type: "CONSUMPTION",
                description: `Consumiu: ${desc}`,
                amount: result.total_amount
              }
            });
          }
        }
        return result;
      }
    },
    debtPayment: {
      async create({ args, query }) {
        const result = await query(args);
        // Ao registrar um pagamento, gera log de pagamento
        if (result && result.client_id) {
          await basePrisma.clientLog.create({
            data: {
              client_id: result.client_id,
              type: "PAYMENT",
              description: result.notes ? `Pagamento: ${result.notes}` : "Pagamento de Fiado",
              amount: result.amount
            }
          });
        }
        return result;
      }
    },
    client: {
      async update({ args, query }) {
        const result = await query(args);
        
        // Evitar log infinito quando atualizamos a dívida (total_debt) via pagamento ou consumo
        const dataKeys = Object.keys(args.data);
        const isInternalUpdate = dataKeys.length === 1 && dataKeys.includes("total_debt");
        
        if (result && !isInternalUpdate) {
          await basePrisma.clientLog.create({
            data: {
              client_id: result.id,
              type: "UPDATE",
              description: "Perfil ou dados cadastrais atualizados",
              amount: null
            }
          });
        }
        return result;
      }
    }
  }
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
