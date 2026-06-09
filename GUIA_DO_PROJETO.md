# 📂 Guia Completo de Arquivos — PDV Conveniência

> **Para quem é este guia?**
> Para quem está aprendendo programação e quer entender onde cada arquivo fica, o que ele faz, e onde editar quando precisar mudar algo no sistema.

---

## 🗺️ Mapa Geral da Pasta do Projeto

```
PDV-CONVENIENCIA/                    ← Pasta raiz do projeto
│
├── 📄 Dockerfile                    ← Receita para criar o container Docker
├── 📄 docker-compose.yml            ← Liga todos os containers (app + banco + nginx)
├── 📄 docker-entrypoint.sh          ← Script que roda ao iniciar o Docker
├── 📄 nginx.conf                    ← Configuração do servidor web Nginx
├── 📄 .env                          ← ⚠️ Senhas e URLs (NÃO enviar ao Git!)
├── 📄 .env.docker                   ← Variáveis de ambiente para Docker
├── 📄 next.config.ts                ← Configurações do framework Next.js
├── 📄 package.json                  ← Lista de pacotes/dependências do projeto
├── 📄 tsconfig.json                 ← Configurações do TypeScript
│
├── 📁 prisma/                       ← Banco de dados
│   ├── schema.prisma                ← Estrutura das tabelas do banco ⭐ MAIS IMPORTANTE
│   └── seed.ts                      ← Script para criar dados iniciais (admin, categorias)
│
├── 📁 src/                          ← Código-fonte principal do sistema
│   ├── middleware.ts                 ← Segurança: protege rotas que precisam de login
│   │
│   ├── 📁 actions/                  ← "Ações" do servidor (lógica de negócio)
│   │   ├── auth.ts                  ← Login, logout, verificar sessão
│   │   ├── product.ts               ← CRUD de produtos
│   │   ├── client.ts                ← CRUD de clientes + pagamento de fiado
│   │   ├── order.ts                 ← Abrir/fechar comandas, adicionar itens
│   │   ├── category.ts              ← CRUD de categorias
│   │   ├── inventory.ts             ← Movimentações de estoque
│   │   ├── settings.ts              ← Leitura e salvamento das configurações da loja
│   │   └── dashboard.ts             ← Dados para o painel admin (KPIs, gráficos)
│   │
│   ├── 📁 app/                      ← Páginas do sistema (Next.js App Router)
│   │   ├── globals.css              ← Estilos CSS globais, cores, animações
│   │   ├── layout.tsx               ← Layout raiz (envolve TODAS as páginas)
│   │   ├── page.tsx                 ← Página principal: PDV (http://localhost/)
│   │   ├── pos-client.tsx           ← Componente do PDV com toda a lógica
│   │   │
│   │   ├── 📁 login/                ← Tela de login
│   │   │   └── page.tsx             ← Formulário de login
│   │   │
│   │   └── 📁 admin/                ← Painel administrativo (protegido por login)
│   │       ├── layout.tsx           ← Sidebar + header do admin
│   │       ├── page.tsx             ← Dashboard principal (/admin)
│   │       ├── dashboard-client.tsx ← Gráficos e KPIs do dashboard
│   │       ├── 📁 produtos/         ← Gestão de produtos (/admin/produtos)
│   │       ├── 📁 categorias/       ← Gestão de categorias
│   │       ├── 📁 clientes/         ← Gestão de clientes
│   │       ├── 📁 estoque/          ← Controle de estoque
│   │       ├── 📁 fiado/            ← Gestão de fiado/devedores
│   │       ├── 📁 relatorios/       ← Relatórios e gráficos
│   │       └── 📁 configuracoes/    ← Configurações da loja
│   │
│   ├── 📁 components/               ← Componentes reutilizáveis da interface
│   │   ├── CheckoutDrawer.tsx       ← Gaveta de pagamento (desconto, troco, fiado)
│   │   ├── checkout-bar.tsx         ← Barra inferior com total e botão "Cobrar"
│   │   ├── product-card.tsx         ← Card de produto no PDV
│   │   ├── DebtHistoryModal.tsx     ← Modal de histórico de fiado
│   │   ├── ProductFormModal.tsx     ← Modal de cadastro/edição de produto
│   │   └── 📁 ui/                   ← Componentes de UI genéricos (botões, inputs, etc.)
│   │
│   ├── 📁 hooks/                    ← React Hooks customizados (reutilização de lógica)
│   └── 📁 lib/                      ← Utilitários e configurações
│       ├── prisma.ts                ← Cria e exporta o cliente do banco de dados
│       └── utils.ts                 ← Funções utilitárias (ex: combinar classes CSS)
│
└── 📁 public/                       ← Arquivos estáticos (imagens, ícones)
```

---

## 📋 Guia Rápido: "Onde editar quando quiser mudar..."

| O que mudar | Arquivo para editar |
|-------------|---------------------|
| Adicionar campo novo ao produto | `prisma/schema.prisma` (model Product) → `npx prisma db push` |
| Mudar as cores do sistema | `src/app/globals.css` (seção `@theme inline`) |
| Adicionar item no menu lateral admin | `src/app/admin/layout.tsx` (array `navItems`) |
| Mudar a senha do admin | Rodar: `npx tsx prisma/seed.ts` após alterar o seed |
| Adicionar nova página admin | Criar pasta em `src/app/admin/nome-da-pagina/` |
| **Mudar o nome da loja** | `src/app/admin/configuracoes` → salvar pelo formulário |
| Configurar o PIX da loja | `src/app/admin/configuracoes` → campo Chave PIX |
| Configurar alerta de estoque baixo | `src/app/admin/configuracoes` → campo Quantidade Mínima |
| Adicionar forma de pagamento | `prisma/schema.prisma` (enum PaymentMethod) |
| Mudar tempo de sessão de login | `src/actions/auth.ts` (constante `SESSION_MAX_AGE`) |
| Mudar porta do Docker | `docker-compose.yml` (nginx ports) |
| Criar usuário admin adicional | `src/actions/auth.ts` → função `createAdminUser()` |

---

## 🏗️ Arquitetura do Sistema

```
NAVEGADOR DO USUÁRIO
        │
        ▼
   [ Nginx :80 ]          ← Porta 80 (padrão do navegador)
        │
        ▼
  [ Next.js :3000 ]       ← Servidor da aplicação
  ┌─────────────────┐
  │  src/app/       │     ← Páginas (o que o usuário VÊ)
  │  src/actions/   │     ← Lógica (o que acontece POR TRÁS)
  └─────────────────┘
        │
        ▼
  [ PostgreSQL :5432 ]    ← Banco de dados (onde os dados ficam)
```

---

## 🚀 Como Subir o Sistema

### Usando Docker (Recomendado para produção)
```bash
# 1. Certifique-se que o Docker Desktop está rodando
# 2. Na pasta do projeto, rode:
docker compose up --build -d

# "up" = sobe os containers
# "--build" = reconstrói a imagem (use sempre na primeira vez ou após mudanças)
# "-d" = roda em background (detached mode)

# 3. Aguarde ~2 minutos e acesse:
# http://localhost
# Login: admin@pdv.com
# Senha: admin123
```

### Para ver os logs (se algo não funcionar)
```bash
docker compose logs -f        # Ver todos os logs
docker compose logs -f app    # Ver apenas logs do Next.js
docker compose logs -f db     # Ver apenas logs do banco
```

### Para parar o sistema
```bash
docker compose down           # Para e remove os containers (dados ficam no volume)
docker compose down -v        # ⚠️ Para E APAGA OS DADOS do banco!
```

---

## 🔑 Credenciais

| Serviço | Endereço | Usuário | Senha |
|---------|----------|---------|-------|
| Sistema PDV | http://localhost | - | - |
| Login Admin | http://localhost/login | admin@pdv.com | admin123 |
| Banco PostgreSQL | localhost:5432 | pdv_usuario | pdv_senha_segura_2024 |
| Nome do banco | - | pdv_banco | - |

---

## 📚 Glossário para Iniciantes

| Termo em Inglês | Tradução | O que significa |
|-----------------|----------|-----------------|
| `component` | componente | Bloco de código reutilizável de interface |
| `action` | ação | Função que roda no servidor (acessa banco) |
| `middleware` | intermediário | Código que roda ANTES de cada requisição |
| `schema` | esquema | Estrutura/mapa do banco de dados |
| `model` | modelo | Representação de uma tabela do banco |
| `route` | rota | URL de uma página ou API |
| `hook` | gancho | Função especial do React para reutilizar lógica |
| `props` | propriedades | Dados passados de um componente pai para filho |
| `state` | estado | Dados que mudam e fazem a tela atualizar |
| `async/await` | assíncrono | Espera uma operação (como banco) terminar |
| `export` | exportar | Torna disponível para outros arquivos usarem |
| `import` | importar | Usa algo que foi exportado em outro arquivo |
| `interface` | interface | Contrato TypeScript que define a forma de um objeto |
| `enum` | enumeração | Lista de opções pré-definidas |
| `Decimal` | decimal | Tipo de número preciso para valores monetários |
| `UUID` | identificador único | ID gerado automaticamente (ex: "a1b2-c3d4-...") |
| `hash` | hash | Transformação irreversível de uma senha |
| `cookie` | cookie | Arquivo salvo no navegador para manter a sessão |
| `cache` | cache | Dados salvos temporariamente para carregar mais rápido |
| `CRUD` | CRUD | Create (criar), Read (ler), Update (editar), Delete (excluir) |
