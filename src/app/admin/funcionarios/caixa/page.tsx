// src/app/admin/funcionarios/caixa/page.tsx — Controle de Caixa
export const dynamic = "force-dynamic";
import { getCashSummary, getCashHistory } from "@/actions/cashregister";
import { getEmployees } from "@/actions/employee";
import { CaixaClient } from "./client";

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ user_id?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const [summary, history, employees] = await Promise.all([
    getCashSummary(),
    getCashHistory({ user_id: sp.user_id, from: sp.from, to: sp.to }),
    getEmployees(),
  ]);

  return <CaixaClient summary={summary} history={history} employees={employees} filters={sp} />;
}
