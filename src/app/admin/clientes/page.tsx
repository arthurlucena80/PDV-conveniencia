import { getClients } from "@/actions/client";
import { ClientesAdminClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clients = await getClients();
  return <ClientesAdminClient clients={clients} />;
}
