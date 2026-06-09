// src/app/admin/funcionarios/auditoria/page.tsx — Auditoria Completa
export const dynamic = "force-dynamic";
import { getAuditLogs } from "@/actions/audit";
import { getEmployees } from "@/actions/employee";
import { AuditoriaClient } from "./client";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ user_id?: string; module?: string; from?: string; to?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const [audits, employees] = await Promise.all([
    getAuditLogs({
      user_id: sp.user_id,
      module:  sp.module,
      from:    sp.from,
      to:      sp.to,
      page:    sp.page ? Number(sp.page) : 1,
    }),
    getEmployees(),
  ]);

  return <AuditoriaClient audits={audits} employees={employees} filters={sp} />;
}
