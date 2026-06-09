"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { BarChart3, Users, Package, TrendingUp } from "lucide-react";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const COLORS = ["#00805A", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl px-4 py-3 shadow-xl"
        style={{ background: "#0F1510", border: "1px solid #1A2B1D", color: "#F0F4F0" }}
      >
        <p className="font-bold text-sm mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" && p.value > 100 ? BRL(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

type Props = {
  monthlySales: { month: string; total: number; count: number }[];
  salesByCategory: { category: string; total: number; count: number }[];
  clientRanking: { id: string; name: string; total_purchases: number; order_count: number; ticket_medio: number }[];
  productsReport: { id: string; name: string; price: number; total_sold: number; total_revenue: number; total_profit: number }[];
  year: number;
};

function Section({ title, icon: Icon, accent, children }: any) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2B1D" }}>
      <div
        className="px-6 py-5 flex items-center gap-3"
        style={{ background: "#111A14", borderBottom: "1px solid #1A2B1D" }}
      >
        <div className="p-2.5 rounded-xl" style={{ background: `${accent}20`, color: accent }}>
          <Icon size={18} />
        </div>
        <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
          {title}
        </h2>
      </div>
      <div className="p-6" style={{ background: "#0A0D0A" }}>
        {children}
      </div>
    </div>
  );
}

export function RelatoriosClient({ monthlySales, salesByCategory, clientRanking, productsReport, year }: Props) {
  // Normalize monthly sales to all 12 months
  const fullMonthly = MONTH_NAMES.map((m, i) => {
    const monthKey = `${year}-${String(i + 1).padStart(2, "0")}`;
    const found = monthlySales.find((s) => s.month === monthKey);
    return { month: m, total: found?.total || 0, count: found?.count || 0 };
  });

  const totalRevenue = monthlySales.reduce((acc, m) => acc + m.total, 0);
  const totalSales = monthlySales.reduce((acc, m) => acc + m.count, 0);
  const bestMonth = fullMonthly.reduce((best, m) => (m.total > best.total ? m : best), fullMonthly[0]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>
          Relatórios
        </h1>
        <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
          Análise completa do desempenho do negócio — {year}
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: `Faturamento ${year}`, value: BRL(totalRevenue), color: "#00805A" },
          { label: `Total de Vendas`, value: `${totalSales} vendas`, color: "#F59E0B" },
          { label: `Melhor Mês`, value: bestMonth.month, color: "#3B82F6", sub: BRL(bestMonth.total) },
        ].map(({ label, value, color, sub }) => (
          <div
            key={label}
            className="rounded-2xl p-5"
            style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
          >
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#4A7A52" }}>
              {label}
            </p>
            <p className="text-2xl font-black" style={{ color }}>
              {value}
            </p>
            {sub && <p className="text-xs mt-0.5" style={{ color: "#4A7A52" }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <Section title={`Faturamento Mensal — ${year}`} icon={BarChart3} accent="#00805A">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={fullMonthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2B1D" />
            <XAxis dataKey="month" tick={{ fill: "#4A7A52", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              tick={{ fill: "#4A7A52", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="total"
              name="Faturamento"
              stroke="#00805A"
              strokeWidth={2.5}
              dot={{ fill: "#00805A", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "#F59E0B" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      {/* Sales by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Vendas por Categoria" icon={BarChart3} accent="#F59E0B">
          {salesByCategory.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "#2D4D33" }}>Nenhum dado disponível.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={salesByCategory}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  paddingAngle={3}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#4A7A52" }}
                >
                  {salesByCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => BRL(Number(v))} contentStyle={{ background: "#0F1510", border: "1px solid #1A2B1D", borderRadius: "12px", color: "#F0F4F0" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Products Report */}
        <Section title="Ranking de Produtos" icon={Package} accent="#3B82F6">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {productsReport.slice(0, 10).map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                style={{ background: "#111A14" }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm w-5" style={{ color: "#4A7A52" }}>
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#F0F4F0" }}>
                      {p.name}
                    </p>
                    <p className="text-xs" style={{ color: "#4A7A52" }}>
                      {p.total_sold} un. vendidas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm" style={{ color: "#F0F4F0" }}>
                    {BRL(p.total_revenue)}
                  </p>
                  <p className="text-xs" style={{ color: p.total_profit > 0 ? "#22C55E" : "#EF4444" }}>
                    Lucro: {BRL(p.total_profit)}
                  </p>
                </div>
              </div>
            ))}
            {productsReport.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "#2D4D33" }}>Nenhum produto vendido ainda.</p>
            )}
          </div>
        </Section>
      </div>

      {/* Client Ranking */}
      <Section title="Ranking de Clientes" icon={Users} accent="#8B5CF6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #1A2B1D" }}>
                {["#", "Cliente", "Total Comprado", "Nº Pedidos", "Ticket Médio"].map((h) => (
                  <th
                    key={h}
                    className="pb-3 text-left font-black text-xs uppercase tracking-widest"
                    style={{ color: "#4A7A52" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientRanking.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm" style={{ color: "#2D4D33" }}>
                    Nenhum dado disponível.
                  </td>
                </tr>
              )}
              {clientRanking.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #1A2B1D" }}>
                  <td className="py-3 font-black" style={{ color: i < 3 ? "#F59E0B" : "#4A7A52" }}>
                    {i + 1}
                  </td>
                  <td className="py-3 font-bold" style={{ color: "#F0F4F0" }}>
                    {c.name}
                  </td>
                  <td className="py-3 font-black" style={{ color: "#00805A" }}>
                    {BRL(c.total_purchases)}
                  </td>
                  <td className="py-3" style={{ color: "#F0F4F0" }}>
                    {c.order_count}
                  </td>
                  <td className="py-3" style={{ color: "#6B9B73" }}>
                    {BRL(c.ticket_medio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
