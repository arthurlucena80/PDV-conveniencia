#!/bin/sh
# ============================================================
# docker-entrypoint.sh — Script de Inicialização do Container
# (Ponto de Entrada do Docker)
#
# Este script é executado TODA VEZ que o container inicia.
# Ele faz 3 coisas na ordem:
#   1. Espera o banco de dados estar pronto
#   2. Roda as migrações do banco (cria as tabelas)
#   3. Roda o seed (cria o usuário admin se não existir)
#   4. Inicia o servidor Next.js
#
# "set -e" faz o script parar imediatamente se algum comando falhar
# ============================================================

set -e

# ── Mensagem de boas-vindas ──
echo ""
echo "🚀 Iniciando PDV Conveniência..."
echo "================================"

# ── Aguarda o PostgreSQL estar disponível ──
# O banco de dados pode demorar alguns segundos para iniciar.
# Este loop tenta conectar até conseguir.
echo "⏳ Aguardando o banco de dados ficar pronto..."
until npx prisma db push --accept-data-loss 2>&1; do
  echo "   Banco ainda não está pronto. Tentando novamente em 3 segundos..."
  sleep 3
done

echo "✅ Banco de dados conectado!"

# ── Roda o seed para criar o usuário admin ──
# O seed só cria o admin se ele ainda não existir (está protegido internamente)
echo "🌱 Verificando dados iniciais (usuário admin, categorias)..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  // Cria admin se não existir
  const exists = await prisma.user.findUnique({ where: { email: 'admin@pdv.com' } });
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: { name: 'Administrador', email: 'admin@pdv.com', password: hash, role: 'ADMIN' }
    });
    console.log('✅ Admin criado: admin@pdv.com / admin123');
  }

  // Cria categorias padrão se não existirem
  const catCount = await prisma.category.count();
  if (catCount === 0) {
    await prisma.category.createMany({ data: [
      { name: 'Bebidas',       icon: '🍺', color: '#3B82F6' },
      { name: 'Refrigerantes', icon: '🥤', color: '#06B6D4' },
      { name: 'Snacks',        icon: '🍫', color: '#F59E0B' },
      { name: 'Cigarros',      icon: '🚬', color: '#6B7280' },
      { name: 'Limpeza',       icon: '🧹', color: '#22C55E' },
      { name: 'Outros',        icon: '📦', color: '#8B5CF6' },
    ]});
    console.log('✅ Categorias padrão criadas');
  }

  await prisma.\$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "✨ Sistema pronto!"
echo "   Acesse: http://localhost"
echo "   Login:  admin@pdv.com"
echo "   Senha:  admin123"
echo "================================"
echo ""

# ── Inicia o servidor Next.js ──
# "exec" substitui este processo pelo Node.js (boa prática em containers)
exec node server.js
