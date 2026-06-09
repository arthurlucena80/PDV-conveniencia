"use client";
// src/app/admin/funcionarios/ranking/client.tsx — Ranking de Vendas por Funcionário

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Trophy, TrendingUp, ShoppingCart, Tag, Medal } from "lucide-react";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type EmployeeStat = {
  id: string; name: string; role: string; roleLabel: string;
  avatar_url: string | null; is_active: boolean;
  sales: number; revenue: number; discounts: number; ticketMedio: number;
};

const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#CD7C2F"];
const MEDAL_ICONS  = ["🥇", "🥈", "🥉"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl px-4 py-3 text-sm shadow-xl"
        style={{ background: "#0F1510", border: "1px solid #1A2B1D", color: "#F0F4F0" }}>
        <p className="font-bold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{BRL(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function RankingClient({ stats }: { stats: EmployeeStat[] }) {
  const maxRevenue = stats[0]?.revenue || 1;

  // Summary KPIs
  const totalRevenue = stats.reduce((s, e) => s + e.revenue, 0);
  const totalSales   = stats.reduce((s, e) => s + e.sales, 0);
  const totalDiscount= stats.reduce((s, e) => s + e.discounts, 0);
  const avgTicket    = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl" style={{ background: "#F59E0B20" }}>
          <Trophy size={22} style={{ color: "#F59E0B" }} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>Ranking do Mês</h1>
          <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>Desempenho por operador no mês atual</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Faturamento Total", value: BRL(totalRevenue), color: "#00805A", icon: TrendingUp },
          { label: "Total de Vendas",   value: totalSales,         color: "#3B82F6", icon: ShoppingCart },
          { label: "Ticket Médio",      value: BRL(avgTicket),    color: "#F59E0B", icon: TrendingUp },
          { label: "Total Descontos",   value: BRL(totalDiscount), color: "#EF4444", icon: Tag },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
            <div className="p-2.5 rounded-xl" style={{ background: `${color}20`, color }}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-black" style={{ color: "#F0F4F0" }}>{value}</p>
              <p className="text-xs" style={{ color: "#4A7A52" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top 3 Podium */}
      {stats.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[stats[1], stats[0], stats[2]].map((emp, idx) => {
            const pos  = [1, 0, 2][idx]; // Ouro no centro
            const isGold = pos === 0;
            return (
              <div key={emp.id}
                className={`rounded-2xl p-6 text-center flex flex-col items-center gap-3 ${isGold ? "ring-2" : ""}`}
                style={{
                  background: "#111A14",
                  border: `1px solid ${MEDAL_COLORS[pos]}40`,
                  ringColor: MEDAL_COLORS[0],
                  marginTop: isGold ? "0px" : "16px",
                }}>
                <div className="text-3xl">{MEDAL_ICONS[pos]}</div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
                  style={{ background: `${MEDAL_COLORS[pos]}20`, color: MEDAL_COLORS[pos] }}>
                  {emp.avatar_url
                    ? <img src={emp.avatar_url} alt={emp.name} className="w-full h-full rounded-2xl object-cover" />
                    : emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-sm" style={{ color: "#F0F4F0" }}>{emp.name}</p>
                  <p className="text-xs" style={{ color: "#4A7A52" }}>{emp.roleLabel}</p>
                </div>
                <div className="w-full pt-2" style={{ borderTop: "1px solid #1A2B1D" }}>
                  <p className="text-lg font-black" style={{ color: MEDAL_COLORS[pos] }}>{BRL(emp.revenue)}</p>
                  <p className="text-xs" style={{ color: "#4A7A52" }}>{emp.sales} vendas</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bar Chart */}
      {stats.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
          <h2 className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: "#4A7A52" }}>
            Faturamento por Operador
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2B1D" />
              <XAxis dataKey="name" tick={{ fill: "#4A7A52", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}
                tick={{ fill: "#4A7A52", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#00805A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full Ranking Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#111A14", border: "1px solid #1A2B1D" }}>
        <div className="px-5 py-3 grid grid-cols-12 text-xs font-black uppercase tracking-widest"
          style={{ color: "#2D4D33", borderBottom: "1px solid #1A2B1D", background: "#0A0D0A" }}>
          <div className="col-span-1">#</div>
          <div className="col-span-3">Funcionário</div>
          <div className="col-span-2">Cargo</div>
          <div className="col-span-2">Receita</div>
          <div className="col-span-1">Vendas</div>
          <div className="col-span-2">Ticket Médio</div>
          <div className="col-span-1">Descontos</div>
        </div>
        {stats.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: "#2D4D33" }}>
            Nenhuma venda registrada por funcionário neste mês.
          </p>
        )}
        {stats.map((emp, i) => (
          <div key={emp.id} className="px-5 py-4 grid grid-cols-12 items-center text-sm"
            style={{ borderBottom: i < stats.length-1 ? "1px solid #0F1510" : "none" }}>
            {/* Posição */}
            <div className="col-span-1">
              {i < 3
                ? <span className="text-lg">{MEDAL_ICONS[i]}</span>
                : <span className="font-bold text-sm" style={{ color: "#2D4D33" }}>#{i+1}</span>}
            </div>
            {/* Nome + barra de progresso */}
            <div className="col-span-3 space-y-1">
              <p className="font-bold text-sm truncate" style={{ color: "#F0F4F0" }}>{emp.name}</p>
              <div className="h-1 rounded-full" style={{ background: "#1A2B1D" }}>
                <div className="h-1 rounded-full"
                  style={{
                    width: `${Math.round((emp.revenue / maxRevenue) * 100)}%`,
                    background: "linear-gradient(90deg, #00805A, #F59E0B)",
                  }} />
              </div>
            </div>
            <div className="col-span-2 text-xs" style={{ color: "#4A7A52" }}>{emp.roleLabel}</div>
            <div className="col-span-2 font-black" style={{ color: "#00805A" }}>{BRL(emp.revenue)}</div>
            <div className="col-span-1 font-bold" style={{ color: "#F0F4F0" }}>{emp.sales}</div>
            <div className="col-span-2" style={{ color: "#F59E0B" }}>{BRL(emp.ticketMedio)}</div>
            <div className="col-span-1 text-xs" style={{ color: "#EF4444" }}>{BRL(emp.discounts)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
