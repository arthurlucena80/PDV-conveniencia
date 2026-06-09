// src/app/admin/funcionarios/ranking/page.tsx — Ranking de Funcionários
export const dynamic = "force-dynamic";
import { getEmployeeStats } from "@/actions/employee";
import { RankingClient } from "./client";

export default async function RankingPage() {
  const stats = await getEmployeeStats();
  return <RankingClient stats={stats} />;
}
