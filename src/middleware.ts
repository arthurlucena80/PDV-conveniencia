// ============================================================
// middleware.ts (protetor-de-rotas.ts)
//
// O QUE ESTE ARQUIVO FAZ:
// É o "segurança" do sistema. Toda vez que alguém tenta acessar
// uma página, este código é executado PRIMEIRO (antes da página
// carregar). Se a pessoa não estiver logada e tentar acessar o
// painel admin, ela é redirecionada para a tela de login.
//
// ANALOGIA: É como um segurança na porta de um clube. Antes de
// entrar, ele verifica se você tem a pulseira (cookie de sessão).
// Se não tiver, manda você para a fila de cadastro (login).
//
// ONDE FICA: src/middleware.ts
// O Next.js procura este arquivo automaticamente e o executa
// antes de qualquer requisição.
// ============================================================

import { NextResponse } from "next/server";
// NextResponse = objeto que controla o que acontece com a requisição
// Pode deixar passar, redirecionar, ou retornar um erro

import type { NextRequest } from "next/server";
// NextRequest = tipo TypeScript que descreve uma requisição HTTP chegando

// ── Configuração ─────────────────────────────────────────────
// Nome do cookie de sessão (deve ser igual ao usado em auth.ts)
// Cookie = pequeno arquivo salvo no navegador com informações da sessão
const SESSION_COOKIE = "pdv_session";

// Rotas que precisam de login para acessar
// Tudo que começa com "/admin" precisa de autenticação
const PROTECTED_PATHS = ["/admin"];

// ── Função Principal do Middleware ───────────────────────────
// Esta função é chamada AUTOMATICAMENTE pelo Next.js para cada requisição
// req = a requisição HTTP chegando (quem está tentando acessar o quê)
export function middleware(req: NextRequest) {

  // Pega o caminho da URL que o usuário está tentando acessar
  // Ex: se a URL é "http://localhost/admin/produtos", pathname = "/admin/produtos"
  const { pathname } = req.nextUrl;

  // Verifica se o caminho acessado é uma rota protegida
  // some() = verifica se PELO MENOS UM item da lista satisfaz a condição
  // startsWith() = verifica se o texto começa com o prefixo
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  // Se não é uma rota protegida, deixa passar sem verificar nada
  if (!isProtected) return NextResponse.next();

  // ── Verifica se existe cookie de sessão ──
  // O cookie é salvo no navegador quando o usuário faz login
  const session = req.cookies.get(SESSION_COOKIE);

  // Se não tem cookie (usuário não logado), redireciona para /login
  if (!session) {
    // Cria a URL de login
    const loginUrl = new URL("/login", req.url);

    // Adiciona o parâmetro "?from=/admin/..." para que após o login
    // o usuário seja redirecionado de volta para onde queria ir
    loginUrl.searchParams.set("from", pathname);

    // Executa o redirecionamento
    return NextResponse.redirect(loginUrl);
  }

  // ── Valida o conteúdo do cookie ──
  try {
    // Tenta ler e interpretar o JSON do cookie
    // JSON.parse = converte texto JSON em objeto JavaScript
    const parsed = JSON.parse(session.value);

    // Verifica se o cookie tem os campos obrigatórios
    if (!parsed.userId || !parsed.role) {
      // Cookie inválido ou corrompido → manda para login
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // ── Controle de permissões por perfil ──
    // OPERATOR (operador) só pode usar o PDV, não o painel admin
    if (parsed.role === "OPERATOR") {
      // Redireciona o operador para a tela principal do PDV
      return NextResponse.redirect(new URL("/", req.url));
    }

  } catch {
    // Se o JSON estiver inválido/corrompido, manda para login
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ── Tudo OK! ──
  // Se chegou até aqui, o usuário está logado e tem permissão
  // NextResponse.next() = deixa a requisição continuar normalmente
  return NextResponse.next();
}

// ── Configuração de quais rotas usar o middleware ──
// O Next.js usa este export "config" para saber ONDE aplicar o middleware
// Sem isso, o middleware rodaria em TODAS as requisições (inclusive imagens e CSS)
export const config = {
  // matcher = padrões de URL onde o middleware deve rodar
  // "/admin/:path*" = qualquer URL que comece com /admin e tenha qualquer coisa depois
  // Exemplos que combinam: /admin, /admin/produtos, /admin/clientes/123
  matcher: ["/admin/:path*"],
};
