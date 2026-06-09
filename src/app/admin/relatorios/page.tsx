import { getMonthlySales, getSalesByCategory, getClientRanking, getProductsReport } from "@/actions/dashboard";
import { RelatoriosClient } from "./client";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const year = new Date().getFullYear();
  const [monthlySales, salesByCategory, clientRanking, productsReport] = await Promise.all([
    getMonthlySales(year),
    getSalesByCategory(),
    getClientRanking(),
    getProductsReport(),
  ]);

  return (
    <RelatoriosClient
      monthlySales={monthlySales}
      salesByCategory={salesByCategory}
      clientRanking={clientRanking}
      productsReport={productsReport}
      year={year}
    />
  );
}
