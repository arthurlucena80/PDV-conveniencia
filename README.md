# PDV Conveniência 🏪

Sistema web completo para controle de vendas, clientes, fiado, estoque e relatórios gerenciais para conveniências, bares, distribuidoras e pequenos mercados.

## 🚀 Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| ORM | Prisma 6 + PostgreSQL 16 |
| Auth | Cookies httpOnly (JWT-like) |
| Container | Docker + Docker Compose |
| Proxy | Nginx |

---

## 📦 Módulos

- **Dashboard** — KPIs, gráficos de vendas, ranking de clientes
- **PDV** — Tela de caixa com seleção de clientes e produtos
- **Produtos** — CRUD completo com estoque e categorias
- **Clientes** — Cadastro e histórico de compras
- **Fiado** — Controle de crédito e pagamentos parciais
- **Estoque** — Movimentações de entrada, saída e ajuste
- **Relatórios** — Análises de vendas, lucro e categorias
- **Funcionários** — Gestão de usuários e permissões
- **Auditoria** — Log completo de ações do sistema
- **Configurações** — Dados da loja, PIX, alertas

---

## 🐳 Docker — Formas de Usar

### Produção completa (recomendado)
```bash
# Sobe banco + app + nginx na porta 80
docker compose up --build -d

# Ver logs
docker compose logs -f

# Parar
docker compose down
```

### Desenvolvimento com Docker
```bash
# Sobe tudo no modo dev (hot reload + pgAdmin)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Acesse: http://localhost:3000 (app)
# Acesse: http://localhost:5050 (pgAdmin — admin@pdv.local / admin)
```

### Só o banco (e app local)
```bash
# Ideal para desenvolvimento: banco no Docker, código local
docker compose -f docker/docker-compose.db.yml up -d

# Depois rode o Next.js localmente
npm run dev

# pgAdmin disponível em http://localhost:5050
```

### Serviços isolados
```bash
# Apenas o PostgreSQL
docker compose -f docker/docker-compose.db.yml up -d

# Apenas o Next.js (banco externo)
docker compose -f docker/docker-compose.app.yml up --build -d

# Apenas o Nginx
docker compose -f docker/docker-compose.nginx.yml up -d
```

---

## ⚙️ Variáveis de Ambiente

```bash
# 1. Copie o template
cp .env.example .env

# 2. Edite com seus dados
notepad .env   # Windows
nano .env      # Linux/Mac
```

Variáveis obrigatórias:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão com o PostgreSQL |
| `AUTH_SECRET` | Chave secreta para sessões (min. 32 chars) |

Gere uma `AUTH_SECRET` segura:
```bash
openssl rand -base64 32
```

---

## 🛠️ Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone https://github.com/arthurlucena80/PDV-conveniencia.git
cd PDV-conveniencia

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL

# 3. Suba o banco de dados
docker compose -f docker/docker-compose.db.yml up -d

# 4. Instale as dependências
npm install

# 5. Sincronize o banco
npx prisma db push

# 6. (Opcional) Rode o seed com dados de exemplo
npx prisma db seed

# 7. Inicie o servidor de desenvolvimento
npm run dev

# Acesse: http://localhost:3000
```

---

## 🌿 Branches

| Branch | Descrição |
|--------|-----------|
| `main` | Código estável de produção |
| `develop` | Integração de features |
| `feature/*` | Novas funcionalidades |
| `hotfix/*` | Correções urgentes em produção |

---

## 📁 Estrutura de Arquivos Docker

```
├── Dockerfile                    # Multi-stage build do Next.js
├── docker-compose.yml            # Produção: db + app + nginx
├── docker-compose.dev.yml        # Dev: hot reload + pgAdmin
├── docker/
│   ├── docker-compose.db.yml     # Só o PostgreSQL
│   ├── docker-compose.app.yml    # Só o Next.js
│   └── docker-compose.nginx.yml  # Só o Nginx
├── nginx.conf                    # Configuração do proxy reverso
└── docker-entrypoint.sh          # Script de inicialização (migrações)
```

---

## 📄 Licença

MIT — Livre para uso pessoal e comercial.
