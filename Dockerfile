# ============================================================
# Dockerfile — Receita de Construção do Container (Docker)
#
# O que é um Dockerfile?
# É como uma "receita de bolo" que diz ao Docker como montar
# o ambiente do seu aplicativo. Cada linha é um passo.
#
# Usamos "multi-stage build" (construção em múltiplas etapas):
# Etapa 1 (deps):    Instala as dependências
# Etapa 2 (builder): Compila o código TypeScript → JavaScript
# Etapa 3 (runner):  Cria a imagem FINAL, leve e segura
#
# Por que 3 etapas? Para a imagem final ser pequena!
# A etapa de build precisa de MUITO espaço. A imagem final
# só precisa do resultado compilado.
# ============================================================


# ─────────────────────────────────────────────
# ETAPA BASE: Define a versão do Node.js
# node:20-alpine = Node 20 no Alpine Linux (Linux bem pequeno)
# ─────────────────────────────────────────────
FROM node:20-alpine AS base


# ─────────────────────────────────────────────
# ETAPA 1: INSTALAÇÃO DAS DEPENDÊNCIAS (deps)
# ─────────────────────────────────────────────
FROM base AS deps

# Instala uma biblioteca de compatibilidade necessária no Alpine Linux
# libc6-compat: biblioteca C padrão que alguns pacotes npm precisam
RUN apk add --no-cache libc6-compat

# Define a pasta de trabalho dentro do container
# É como fazer "cd /app" — tudo vai acontecer nesta pasta
WORKDIR /app

# Copia SOMENTE os arquivos de configuração de dependências primeiro
# (package.json e package-lock.json)
# Fazemos isso ANTES de copiar o código para aproveitar o cache do Docker:
# Se o código mudar mas os pacotes não, o Docker pula esta etapa!
COPY package.json package-lock.json* ./

# Instala TODAS as dependências do projeto (incluindo as de desenvolvimento)
# O flag --frozen-lockfile garante que seja instalado exatamente o que está no lockfile
RUN npm ci


# ─────────────────────────────────────────────
# ETAPA 2: COMPILAÇÃO (builder)
# ─────────────────────────────────────────────
FROM base AS builder

# Pasta de trabalho (mesma da etapa anterior)
WORKDIR /app

# Copia as dependências instaladas na etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia TODO o código do projeto para dentro do container
COPY . .

# Gera o Prisma Client — código TypeScript que permite acessar o banco
# Precisa ser feito ANTES do build do Next.js
RUN npx prisma generate

# Compila o Next.js para produção
# Gera a pasta .next/standalone com tudo que precisamos
RUN npm run build


# ─────────────────────────────────────────────
# ETAPA 3: IMAGEM FINAL DE PRODUÇÃO (runner)
# Esta é a imagem que vai rodar no servidor!
# ─────────────────────────────────────────────
FROM base AS runner

# Pasta de trabalho
WORKDIR /app

# Define o ambiente como "produção"
# Isso faz o Next.js usar configurações otimizadas
ENV NODE_ENV=production

# Porta em que o Next.js vai escutar
ENV PORT=3000

# Diz ao Next.js para aceitar conexões de qualquer endereço IP
# Necessário dentro do Docker para o Nginx conseguir se conectar
ENV HOSTNAME="0.0.0.0"

# ── Segurança: cria um usuário sem privilégios de root ──
# Rodar como root dentro do container é perigoso
# nextjs = nome do usuário | nodejs = grupo
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia a pasta "public" (imagens estáticas, ícones, etc.)
COPY --from=builder /app/public ./public

# Copia os arquivos compilados do Next.js (modo standalone)
# --chown=nextjs:nodejs = define o dono como o usuário que criamos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia o schema do Prisma (necessário para rodar migrações)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copia o script de inicialização (roda migrações e seed)
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Copia o seed do banco de dados
COPY --from=builder /app/prisma/seed.ts ./prisma/seed.ts

# Dá permissão de execução ao script de inicialização
RUN chmod +x ./docker-entrypoint.sh

# Troca para o usuário sem privilégios (mais seguro)
USER nextjs

# Informa ao Docker que o container usa a porta 3000
# (apenas documentação — o docker-compose ainda precisa mapear a porta)
EXPOSE 3000

# Comando que roda quando o container inicia
# Chama nosso script de inicialização que faz migrações e depois sobe o app
CMD ["sh", "./docker-entrypoint.sh"]
