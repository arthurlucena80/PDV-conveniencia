"use server";
import { prisma } from "@/lib/prisma";

export async function getClientLogs(clientId: string) {
  const logs = await prisma.clientLog.findMany({
    where: { client_id: clientId },
    orderBy: { created_at: "desc" }
  });

  return logs.map((log: any) => ({
    ...log,
    amount: log.amount ? Number(log.amount) : null,
  }));
}
