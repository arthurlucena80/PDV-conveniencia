import { getClients } from "@/actions/client";
import { FiadoClient } from "./client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FiadoPage() {
  const clients = await getClients();
  const debtors = clients.filter((c: any) => c.total_debt > 0);

  const totalTab = debtors.reduce((acc: number, c: any) => acc + c.total_debt, 0);
  const overdueCount = debtors.length;

  return (
    <FiadoClient
      debtors={debtors}
      summary={{ totalTab, overdueCount }}
    />
  );
}
