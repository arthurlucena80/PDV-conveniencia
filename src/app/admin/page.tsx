import { getDashboardStats } from "@/actions/dashboard";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  return <DashboardClient stats={stats} />;
}
