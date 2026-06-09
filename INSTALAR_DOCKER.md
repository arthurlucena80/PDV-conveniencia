# 🐳 Como Instalar e Rodar o PDV via Docker

## Passo 1: Instalar o Docker Desktop

1. Acesse: **https://www.docker.com/products/docker-desktop/**
2. Clique em **"Download for Windows"**
3. Execute o instalador baixado (`Docker Desktop Installer.exe`)
4. Siga os passos do instalador (pode precisar reiniciar o PC)
5. Após instalar, abra o **Docker Desktop** pelo menu Iniciar
6. Aguarde até o ícone da baleia 🐳 aparecer na barra de tarefas

## Passo 2: Verificar se funcionou

Abra o **PowerShell** (tecla Windows + X → Terminal) e digite:
```
docker --version
```
Deve aparecer algo como: `Docker version 27.x.x`

## Passo 3: Subir o Sistema PDV

Na pasta do projeto (`C:\Users\arthu\Desktop\PDV-CONVENIENCIA`), execute:

```powershell
# Sobe TODOS os serviços: banco + app + nginx
docker compose up --build -d
```

Aguarde cerca de **3 a 5 minutos** para:
- Baixar as imagens necessárias (só na primeira vez)
- Compilar o código Next.js
- Subir o banco e criar as tabelas

## Passo 4: Acessar o Sistema

Abra o navegador e acesse: **http://localhost**

### Credenciais de Login:
| Campo | Valor |
|-------|-------|
| 🌐 Endereço | http://localhost |
| 📧 Email | `admin@pdv.com` |
| 🔑 Senha | `admin123` |

---

## Comandos Úteis

```powershell
# Ver todos os containers rodando
docker compose ps

# Ver logs em tempo real (Ctrl+C para sair)
docker compose logs -f

# Ver apenas logs do app Next.js
docker compose logs -f app

# Parar o sistema (dados são mantidos)
docker compose down

# ⚠️ Parar E APAGAR todos os dados
docker compose down -v

# Reiniciar apenas o app (sem recompilar)
docker compose restart app

# Recompilar e subir após mudanças no código
docker compose up --build -d
```

## Solução de Problemas

### "Port 80 already in use" (Porta 80 em uso)
Algum outro programa está usando a porta 80. Abra o Gerenciador de Tarefas e procure por IIS, Apache, ou outro servidor web. Como alternativa, mude a porta no `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Acesse via http://localhost:8080
```

### "Container failed to start" (Container não iniciou)
Execute para ver o erro detalhado:
```powershell
docker compose logs app
```

### Banco de dados perdeu os dados
Os dados ficam salvos no volume Docker `postgres_data`. Só são apagados com `docker compose down -v`.
