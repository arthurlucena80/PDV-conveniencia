// ============================================================
// configuracoes/page.tsx — Página de Configurações do Admin
// (pagina-de-configuracoes.tsx)
//
// O QUE ESTE ARQUIVO FAZ:
// Exibe o formulário de configurações gerais da loja.
// O usuário pode editar nome, telefone, endereço, chave PIX,
// taxa de imposto e limite de alerta de estoque.
//
// COMO FUNCIONA:
// - É um Server Component (sem "use client") — busca dados no servidor
// - O formulário usa Server Actions para salvar sem precisar de API
// - Ao salvar, a página é revalidada automaticamente
//
// ONDE FICA: src/app/admin/configuracoes/page.tsx
// ============================================================

// Indica que esta página sempre busca dados frescos do banco
// (não usa cache estático)
export const dynamic = "force-dynamic";

import { getSettings, saveSettings } from "@/actions/settings";
// Importa as funções de buscar e salvar configurações

// ── Componente da Página de Configurações ────────────────────
export default async function ConfiguracoesPage() {
  // Busca as configurações atuais do banco de dados
  // (cria com valores padrão se não existirem)
  const settings = await getSettings();

  // ── Server Action para Salvar ──
  // Esta função roda NO SERVIDOR quando o formulário é enviado
  // "use server" dentro de uma função = server action inline
  async function handleSave(formData: FormData) {
    "use server";
    // FormData = objeto com todos os dados do formulário HTML
    // formData.get("campo") = pega o valor de um campo pelo nome

    // Chama a função de salvar com os dados do formulário
    await saveSettings({
      store_name:       (formData.get("store_name") as string) || undefined,
      store_phone:      (formData.get("store_phone") as string) || undefined,
      store_address:    (formData.get("store_address") as string) || undefined,
      pix_key:          (formData.get("pix_key") as string) || undefined,
      currency:         (formData.get("currency") as string) || "BRL",
      tax_rate:         parseFloat((formData.get("tax_rate") as string) || "0"),
      // parseFloat = converte texto "2.5" → número 2.5
      low_stock_alert:  parseInt((formData.get("low_stock_alert") as string) || "5"),
      // parseInt = converte texto "5" → número inteiro 5
    });
  }

  // ── Interface da Página ───────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Título da Página ── */}
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F0F4F0" }}>
          Configurações
        </h1>
        <p className="text-sm mt-1" style={{ color: "#4A7A52" }}>
          Configurações gerais do estabelecimento
        </p>
      </div>

      {/* ── Formulário de Configurações ── */}
      {/* action={handleSave} = ao submeter, chama nossa Server Action */}
      <form action={handleSave} className="space-y-6">

        {/* ── Seção: Dados da Loja ── */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
        >
          <h2 className="font-bold text-base" style={{ color: "#F0F4F0" }}>
            🏪 Dados da Loja
          </h2>

          {/* Campo: Nome da Loja */}
          <div className="space-y-2">
            <label htmlFor="store_name" className="block text-sm font-semibold" style={{ color: "#6B9B73" }}>
              Nome da Loja
            </label>
            <input
              id="store_name"
              name="store_name"
              type="text"
              defaultValue={settings.store_name}
              placeholder="Ex: Conveniência do João"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "#162119",
                border: "1px solid #1E2E21",
                color: "#F0F4F0",
              }}
            />
          </div>

          {/* Campo: Telefone */}
          <div className="space-y-2">
            <label htmlFor="store_phone" className="block text-sm font-semibold" style={{ color: "#6B9B73" }}>
              Telefone / WhatsApp
            </label>
            <input
              id="store_phone"
              name="store_phone"
              type="tel"
              defaultValue={settings.store_phone || ""}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "#162119",
                border: "1px solid #1E2E21",
                color: "#F0F4F0",
              }}
            />
          </div>

          {/* Campo: Endereço */}
          <div className="space-y-2">
            <label htmlFor="store_address" className="block text-sm font-semibold" style={{ color: "#6B9B73" }}>
              Endereço
            </label>
            <input
              id="store_address"
              name="store_address"
              type="text"
              defaultValue={settings.store_address || ""}
              placeholder="Rua Exemplo, 123 — Bairro — Cidade/UF"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "#162119",
                border: "1px solid #1E2E21",
                color: "#F0F4F0",
              }}
            />
          </div>
        </div>

        {/* ── Seção: Pagamentos ── */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
        >
          <h2 className="font-bold text-base" style={{ color: "#F0F4F0" }}>
            💸 Pagamentos
          </h2>

          {/* Campo: Chave PIX */}
          <div className="space-y-2">
            <label htmlFor="pix_key" className="block text-sm font-semibold" style={{ color: "#6B9B73" }}>
              Chave PIX
            </label>
            <input
              id="pix_key"
              name="pix_key"
              type="text"
              defaultValue={settings.pix_key || ""}
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "#162119",
                border: "1px solid #1E2E21",
                color: "#F0F4F0",
              }}
            />
            <p className="text-xs" style={{ color: "#4A7A52" }}>
              Usado para exibir nas informações de pagamento via PIX
            </p>
          </div>

          {/* Campo: Moeda */}
          <div className="space-y-2">
            <label htmlFor="currency" className="block text-sm font-semibold" style={{ color: "#6B9B73" }}>
              Moeda
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue={settings.currency}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "#162119",
                border: "1px solid #1E2E21",
                color: "#F0F4F0",
              }}
            >
              <option value="BRL">🇧🇷 Real Brasileiro (R$)</option>
              <option value="USD">🇺🇸 Dólar Americano ($)</option>
              <option value="EUR">🇪🇺 Euro (€)</option>
            </select>
          </div>

          {/* Campo: Taxa de Imposto */}
          <div className="space-y-2">
            <label htmlFor="tax_rate" className="block text-sm font-semibold" style={{ color: "#6B9B73" }}>
              Taxa de Imposto (%)
            </label>
            <input
              id="tax_rate"
              name="tax_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={settings.tax_rate}
              placeholder="0.00"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "#162119",
                border: "1px solid #1E2E21",
                color: "#F0F4F0",
              }}
            />
            <p className="text-xs" style={{ color: "#4A7A52" }}>
              Taxa aplicada sobre o total das vendas (0 = sem imposto)
            </p>
          </div>
        </div>

        {/* ── Seção: Estoque ── */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
        >
          <h2 className="font-bold text-base" style={{ color: "#F0F4F0" }}>
            📦 Alertas de Estoque
          </h2>

          {/* Campo: Limite Mínimo */}
          <div className="space-y-2">
            <label htmlFor="low_stock_alert" className="block text-sm font-semibold" style={{ color: "#6B9B73" }}>
              Quantidade Mínima para Alerta
            </label>
            <input
              id="low_stock_alert"
              name="low_stock_alert"
              type="number"
              min="0"
              defaultValue={settings.low_stock_alert}
              placeholder="5"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "#162119",
                border: "1px solid #1E2E21",
                color: "#F0F4F0",
              }}
            />
            <p className="text-xs" style={{ color: "#4A7A52" }}>
              Produtos com estoque abaixo deste valor serão sinalizados como críticos
            </p>
          </div>
        </div>

        {/* ── Botão Salvar ── */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #00805A, #006045)",
              color: "white",
            }}
          >
            💾 Salvar Configurações
          </button>
        </div>
      </form>

      {/* ── Seção de Informações do Sistema ── */}
      <div
        className="rounded-2xl p-6 space-y-3"
        style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
      >
        <h2 className="font-bold text-base" style={{ color: "#F0F4F0" }}>
          ℹ️ Informações do Sistema
        </h2>
        <div className="space-y-2 text-sm" style={{ color: "#6B9B73" }}>
          <div className="flex justify-between">
            <span>Versão do Sistema</span>
            <span className="font-bold" style={{ color: "#F0F4F0" }}>PDV v2.0</span>
          </div>
          <div className="flex justify-between">
            <span>Framework</span>
            <span className="font-bold" style={{ color: "#F0F4F0" }}>Next.js 15</span>
          </div>
          <div className="flex justify-between">
            <span>Banco de Dados</span>
            <span className="font-bold" style={{ color: "#F0F4F0" }}>PostgreSQL (Neon)</span>
          </div>
          <div className="flex justify-between">
            <span>ORM</span>
            <span className="font-bold" style={{ color: "#F0F4F0" }}>Prisma</span>
          </div>
        </div>
      </div>

    </div>
  );
}
