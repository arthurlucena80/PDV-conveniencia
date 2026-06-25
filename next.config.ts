# ============================================================
# next.config.ts — Configuração do Next.js (Configuração do Next.js)
#
# Este arquivo configura o comportamento do framework Next.js.
# A opção "standalone" é ESSENCIAL para o Docker:
# ela gera uma pasta ".next/standalone" com tudo que o app
# precisa para rodar, sem precisar do node_modules completo.
# ============================================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Modo standalone (autônomo) para produção com Docker ──
  // Gera uma versão compacta do app dentro de .next/standalone
  // que pode ser copiada para o container sem instalar todas as dependências
  output: "standalone",

  // ── Imagens externas permitidas ──
  // Se você usar imagens de outros sites (ex: via URL), adicione os domínios aqui
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Permite qualquer domínio HTTPS (para URLs de imagens de produtos)
      },
    ],
  },

  // Aumenta o limite de upload para suportar fotos maiores (base64)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
