// ============================================================
// seed.ts (dados-iniciais.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Popula o banco de dados com DADOS INICIAIS necessários para
// o sistema funcionar pela primeira vez.
//
// O QUE ELE CRIA:
//   1. Usuário administrador (admin@pdv.com / admin123)
//   2. Categorias padrão (Bebidas, Snacks, Cigarros, etc.)
//   3. Configurações padrão da loja
//
// QUANDO RODAR?
//   - Na primeira instalação do sistema
//   - Para restaurar dados iniciais apagados
//   - Automaticamente pelo docker-entrypoint.sh na inicialização
//
// COMO RODAR MANUALMENTE:
//   npx tsx prisma/seed.ts
//
// ⚠️ SEGURANÇA: Se o admin já existir, NÃO cria um novo.
// Só cria dados que ainda não existem (verificação antes de criar).
//
// ONDE FICA: prisma/seed.ts
// ============================================================

import { PrismaClient } from "@prisma/client";
// PrismaClient = cliente do banco de dados

import * as bcrypt from "bcryptjs";
// bcrypt = biblioteca de criptografia de senhas
// Nunca salvamos a senha "admin123" pura — sempre o hash!

// Cria uma instância do cliente do banco para este script
// (diferente de src/lib/prisma.ts pois scripts não usam o singleton)
const prisma = new PrismaClient();

// ── Função Principal ──────────────────────────────────────────
// "async" = pode usar "await" para esperar operações do banco
async function main() {
  console.log("🌱 Seeding database...");
  // console.log = imprime mensagem no terminal

  // ── 1. Cria o usuário Admin ──
  // Verifica primeiro se já existe para não duplicar
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@pdv.com" }
  });

  if (!existingAdmin) {
    // Só cria se NÃO existir ainda

    // Cria o hash da senha "admin123"
    // O "10" é o "custo" do hash — mais alto = mais seguro, mais lento
    const hashed = await bcrypt.hash("admin123", 10);

    // Cria o usuário no banco
    await prisma.user.create({
      data: {
        name: "Administrador",    // Nome exibido na interface
        email: "admin@pdv.com",   // Email de login
        password: hashed,          // Hash da senha (não a senha em texto puro!)
        role: "ADMIN",             // Perfil de administrador total
        is_active: true,           // Conta ativa
      },
    });
    console.log("✅ Admin user created: admin@pdv.com / admin123");
  } else {
    // Admin já existe — apenas informa
    console.log("ℹ️  Admin user already exists");
  }

  // ── 2. Cria as Categorias Padrão ──
  // count() = conta quantos registros existem na tabela
  const catCount = await prisma.category.count();

  if (catCount === 0) {
    // Só cria se a tabela estiver COMPLETAMENTE VAZIA
    // (se o usuário já criou suas próprias categorias, não sobrescreve)

    const defaultCategories = [
      // Cada objeto = uma categoria com nome, emoji e cor
      { name: "Bebidas",       icon: "🍺", color: "#3B82F6" }, // Azul
      { name: "Refrigerantes", icon: "🥤", color: "#06B6D4" }, // Ciano
      { name: "Snacks",        icon: "🍫", color: "#F59E0B" }, // Âmbar
      { name: "Cigarros",      icon: "🚬", color: "#6B7280" }, // Cinza
      { name: "Limpeza",       icon: "🧹", color: "#22C55E" }, // Verde claro
      { name: "Frios",         icon: "🧀", color: "#EAB308" }, // Amarelo
      { name: "Outros",        icon: "📦", color: "#8B5CF6" }, // Roxo
    ];

    // createMany = cria todos de uma vez (mais eficiente que criar um por um)
    await prisma.category.createMany({ data: defaultCategories });
    console.log("✅ Default categories created");
  }

  // ── 3. Cria as Configurações Padrão ──
  // Verifica se já existe o registro de configurações
  const settings = await prisma.settings.findUnique({
    where: { id: "default" }  // O único registro sempre tem id = "default"
  });

  if (!settings) {
    // Cria as configurações iniciais da loja
    await prisma.settings.create({
      data: {
        id: "default",                  // ID fixo — só pode haver um!
        store_name: "Minha Conveniência", // Nome padrão (alterável em /admin/configuracoes)
        low_stock_alert: 5,              // Alerta quando estoque < 5 unidades
        currency: "BRL",                 // Real brasileiro
      },
    });
    console.log("✅ Default settings created");
  }

  // Mensagem final com as credenciais de acesso
  console.log("\n✨ Seed complete!");
  console.log("   Admin login: admin@pdv.com / admin123");
}

// ── Executa a função principal ────────────────────────────────
main()
  .catch((e) => {
    // Se houver qualquer erro, imprime e encerra o processo com código de erro
    // process.exit(1) = encerra com erro (0 = sucesso, 1 = falha)
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    // Sempre fecha a conexão com o banco ao terminar (com ou sem erro)
    prisma.$disconnect();
  });
