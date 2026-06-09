// src/app/admin/funcionarios/page.tsx — Cadastro de Funcionários
export const dynamic = "force-dynamic";
import { getEmployees } from "@/actions/employee";
import { FuncionariosClient } from "./client";

export default async function FuncionariosPage() {
  const employees = await getEmployees();
  return <FuncionariosClient employees={employees} />;
}
