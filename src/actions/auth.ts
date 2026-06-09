"use server";
// ============================================================
// auth.ts (autenticacao.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// Contém as funções de LOGIN e LOGOUT do sistema.
// Quando um usuário digita email e senha, este arquivo verifica
// se as credenciais estão corretas e cria uma "sessão" (cookie)
// no navegador para manter o usuário logado.
//
// ANALOGIA: É como um balcão de recepção de hotel:
// - login()      → faz o check-in e entrega a chave do quarto (cookie)
// - logout()     → faz o check-out e invalida a chave
// - getSession() → verifica quem está hospedado olhando a chave
//
// "use server" = instrução do Next.js que diz que estas funções
// rodam NO SERVIDOR (não no navegador do cliente). Isso é importante
// pois o servidor é mais seguro para verificar senhas.
//
// ONDE FICA: src/actions/auth.ts
// ============================================================

import { prisma } from "@/lib/prisma";
// prisma = o cliente do banco de dados (ver lib/prisma.ts)
// "@/" é um atalho para a pasta "src/" configurado no tsconfig.json

import { cookies } from "next/headers";
// cookies = função do Next.js para ler e escrever cookies
// Cookies são pequenos arquivos de texto que o servidor manda
// para o navegador, e o navegador manda de volta em cada requisição

import { redirect } from "next/navigation";
// redirect = função do Next.js para redirecionar o usuário para outra página

import * as bcrypt from "bcryptjs";
// bcryptjs = biblioteca para fazer hash de senhas
// Hash = transformar a senha "admin123" em algo como "$2b$10$xyz..."
// A ideia é que NUNCA guardamos a senha real no banco, só o hash!
// Mesmo que alguém roube o banco, não consegue saber a senha original

// ── Constantes de Configuração ───────────────────────────────

// Nome do cookie que armazena a sessão do usuário logado
// Este nome precisa ser igual ao usado em middleware.ts!
const SESSION_COOKIE = "pdv_session";

// Tempo de vida da sessão em segundos
// 60 segundos × 60 minutos × 24 horas × 7 dias = 1 semana
// Após 7 dias sem usar, o usuário precisa logar novamente
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

// ── Função de Login ──────────────────────────────────────────
// Recebe o email e a senha que o usuário digitou no formulário
// Retorna os dados do usuário se as credenciais estiverem corretas
// Lança um erro (throw) se algo estiver errado
export async function login(email: string, password: string) {

  // Busca o usuário no banco de dados pelo email
  // findUnique = encontra exatamente um registro (email é único no banco)
  // toLowerCase().trim() = converte para minúsculo e remove espaços extras
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  // Se o usuário não existir no banco OU estiver desativado, rejeita
  // !user = não existe | !user.is_active = conta desativada
  if (!user || !user.is_active) {
    // Sempre damos a mesma mensagem genérica por segurança
    // (não dizemos se é o email ou a senha que está errado)
    throw new Error("Email ou senha inválidos.");
  }

  // Compara a senha digitada com o hash guardado no banco
  // bcrypt.compare = "a senha digitada gera o mesmo hash que está salvo?"
  // Retorna true se for válida, false se não
  const valid = await bcrypt.compare(password, user.password);

  // Se a senha não bater, rejeita com a mesma mensagem genérica
  if (!valid) {
    throw new Error("Email ou senha inválidos.");
  }

  // ── Cria a sessão ──
  // Aqui chegamos apenas se email e senha estão corretos!
  // Guardamos os dados do usuário em um objeto JavaScript simples
  const sessionData = {
    userId: user.id,    // ID único do usuário no banco
    role: user.role,    // Perfil: ADMIN, MANAGER ou OPERATOR
    name: user.name,    // Nome para exibir na interface
  };

  // Acessa o gerenciador de cookies do Next.js
  const cookieStore = await cookies();

  // Cria o cookie de sessão no navegador do usuário
  cookieStore.set(
    SESSION_COOKIE,                  // Nome do cookie
    JSON.stringify(sessionData),     // Valor: converte objeto → texto JSON
    {
      httpOnly: true,    // Impede JavaScript do navegador de ler o cookie (segurança)
      secure: process.env.NODE_ENV === "production", // HTTPS obrigatório em produção
      maxAge: SESSION_MAX_AGE,       // Tempo de vida do cookie
      path: "/",                     // Cookie válido para todo o site
      sameSite: "lax",               // Proteção contra ataques CSRF
    }
  );

  // ── Registra login na auditoria (em background, sem bloquear) ──
  // Usamos .catch() para que erros aqui nunca bloqueiem o login
  prisma.userSession.create({
    data: { user_id: user.id },
  }).catch(() => {});

  prisma.auditLog.create({
    data: {
      user_id:  user.id,
      action:   "LOGIN",
      module:   "AUTH",
      entity:   "User",
      entity_id: user.id,
      new_data: { name: user.name, role: user.role },
    },
  }).catch(() => {});

  // Retorna os dados da sessão (o componente de login pode usar para feedback)
  return sessionData;
}

// ── Função de Logout ─────────────────────────────────────────
// Remove o cookie de sessão e redireciona para a tela de login
export async function logout() {
  // Acessa o gerenciador de cookies
  const cookieStore = await cookies();

  // Antes de remover, pega a sessão para registrar o logout na auditoria
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      // Registra logout e fecha a sessão aberta (sem bloquear)
      prisma.auditLog.create({
        data: {
          user_id:  parsed.userId,
          action:   "LOGOUT",
          module:   "AUTH",
          entity:   "User",
          entity_id: parsed.userId,
        },
      }).catch(() => {});

      // Fecha a última sessão aberta deste usuário
      prisma.userSession.updateMany({
        where: { user_id: parsed.userId, logged_out: null },
        data:  { logged_out: new Date() },
      }).catch(() => {});
    } catch (_) {}
  }

  // Remove o cookie de sessão (o usuário fica deslogado)
  cookieStore.delete(SESSION_COOKIE);

  // Redireciona para a tela de login
  // redirect() não retorna nada — para a execução imediatamente
  redirect("/login");
}

// ── Função para Obter a Sessão Atual ─────────────────────────
// Verifica se existe um usuário logado e retorna seus dados
// Retorna null se ninguém estiver logado
export async function getSession() {
  // Acessa o gerenciador de cookies
  const cookieStore = await cookies();

  // Tenta ler o cookie de sessão
  const session = cookieStore.get(SESSION_COOKIE);

  // Se não existe cookie, não há usuário logado
  if (!session) return null;

  try {
    // Converte o texto JSON do cookie de volta para um objeto JavaScript
    // JSON.parse = oposto de JSON.stringify
    return JSON.parse(session.value) as {
      userId: string;  // ID do usuário
      role: string;    // Perfil (ADMIN, MANAGER, OPERATOR)
      name: string;    // Nome do usuário
    };
  } catch {
    // Se o cookie estiver corrompido/inválido, trata como deslogado
    return null;
  }
}

// ── Função para Criar Usuário Admin ──────────────────────────
// Usada para criar novos administradores pelo sistema
// (não é a criação pelo formulário público — é para uso interno)
export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  // Verifica se já existe um usuário com este email
  const existing = await prisma.user.findUnique({
    where: { email: data.email }
  });

  // Se já existe, lança um erro (não permite emails duplicados)
  if (existing) throw new Error("Email já cadastrado.");

  // Cria o hash da senha antes de salvar no banco
  // "10" é o "custo" do hash — quanto maior, mais seguro mas mais lento
  // 10 é o padrão recomendado (leva ~100ms para calcular)
  const hashed = await bcrypt.hash(data.password, 10);

  // Cria o usuário no banco de dados
  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase().trim(),  // Email sempre em minúsculo
      password: hashed,    // Salva o HASH, não a senha original!
      role: "ADMIN",       // Tipo de usuário: administrador
    },
  });
}
