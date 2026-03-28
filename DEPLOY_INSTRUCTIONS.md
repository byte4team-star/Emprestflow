# 🚀 INSTRUÇÕES COMPLETAS: Deploy da Edge Function

## ⚠️ PROBLEMA ATUAL
```
❌ 404 (Not Found)
GET https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/reminders/due-installments
```

**Causa:** A Edge Function `make-server-bd42bc02` não existe no Supabase.

**Solução:** Fazer deploy da Edge Function usando uma das opções abaixo.

---

## 🎯 OPÇÃO 1: Deploy via CLI do Supabase (RECOMENDADO)

### **Por que usar o CLI?**
✅ Mais confiável e profissional  
✅ Faz upload automático de todos os arquivos  
✅ Funciona mesmo quando o Dashboard tem problemas  
✅ Recomendado para projetos em produção

### **Passo 1: Instalar o Supabase CLI**

**Windows (PowerShell como Administrador):**
```powershell
npm install -g supabase
```

**macOS/Linux:**
```bash
npm install -g supabase
```

**Verificar instalação:**
```bash
supabase --version
```

### **Passo 2: Login no Supabase**
```bash
supabase login
```

Isso abrirá o navegador para você fazer login. Autorize o acesso.

### **Passo 3: Navegar até a pasta do projeto**
```bash
cd /caminho/completo/do/seu/projeto
```

**Exemplo:**
```bash
# Windows
cd C:\Users\SeuUsuario\Documents\emprestflow

# macOS/Linux
cd ~/Documents/emprestflow
```

### **Passo 4: Fazer o Deploy**

**Opção A - Deploy Simples (se já estiver linkado):**
```bash
supabase functions deploy make-server-bd42bc02 --no-verify-jwt
```

**Opção B - Deploy com Link ao Projeto:**
```bash
supabase link --project-ref nbelraenzoprsskjnvpc
supabase functions deploy make-server-bd42bc02 --no-verify-jwt
```

### **Passo 5: Aguardar o Deploy**
Você verá algo assim:
```
Deploying function make-server-bd42bc02...
✔ Function deployed successfully
URL: https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02
```

### **Passo 6: Testar**
```bash
curl -X GET "https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZWxyYWVuem9wcnNza2pudnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDczNzcsImV4cCI6MjA4NzM4MzM3N30.xVpRFnJHnNzRZ_CMeH02rVey895P0ST78E1hi8G7HNM"
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-25T...",
  "version": "2.1.0",
  "service": "emprestflow-api"
}
```

✅ **Pronto!** Agora volte ao sistema e teste a aba de Lembretes!

---

## 🎯 OPÇÃO 2: Deploy via Dashboard do Supabase

### **Quando usar?**
- Se você não conseguir instalar o CLI
- Se preferir interface gráfica
- Para testes rápidos

### **Passo 1: Acessar o Dashboard**
1. Acesse: https://supabase.com/dashboard/project/nbelraenzoprsskjnvpc
2. Clique em **"Edge Functions"** no menu lateral esquerdo
3. Verifique se já existe `make-server-bd42bc02`

### **Passo 2: Criar a Edge Function (se não existir)**
1. Clique em **"Create a new function"**
2. Nome: `make-server-bd42bc02` (exatamente assim!)
3. Clique em **"Create Function"**

### **Passo 3: Fazer Upload do Código**

⚠️ **ATENÇÃO:** O Dashboard pode ter limitações para múltiplos arquivos.

**Arquivos necessários:**
```
supabase/functions/
└── server/
    ├── index.tsx                     (arquivo principal - ~3000 linhas)
    ├── kv_store.tsx                  (sistema de storage)
    ├── client_portal_routes.tsx      (rotas do portal)
    ├── billing_routes.tsx            (rotas de cobrança)
    └── health.tsx                    (health checks)
```

**Como fazer:**
1. No editor do Dashboard, crie a estrutura de pastas
2. Copie o conteúdo de cada arquivo
3. Cole no editor correspondente
4. Clique em **"Deploy"**

⚠️ **Se der erro ou ficar confuso, use a OPÇÃO 1 (CLI)!**

---

## 🎯 OPÇÃO 3: Deploy via Figma Make (Automático)

### **Status Atual**
❌ Dando erro 403 (Forbidden) ao tentar fazer deploy automático.

### **Por que não funciona?**
- Pode haver problema de autenticação temporário
- Pode haver alguma limitação após resolver o problema de pagamento
- O Figma Make pode precisar reconectar ao Supabase

### **Como tentar:**
1. No Figma Make, tente forçar um novo deploy
2. Se continuar dando 403, use **OPÇÃO 1** ou **OPÇÃO 2**

---

## 📋 CHECKLIST APÓS O DEPLOY

### ✅ **1. Verificar Deploy no Dashboard**
1. Acesse: https://supabase.com/dashboard/project/nbelraenzoprsskjnvpc/functions
2. Confirme que `make-server-bd42bc02` aparece na lista
3. Status deve ser: **"Deployed"** ✅

### ✅ **2. Testar Health Endpoint**
```bash
curl "https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health"
```

Deve retornar: `{"status":"ok",...}`

### ✅ **3. Testar Lembretes no Sistema**
1. Abra o sistema EmpréstFlow
2. Faça login
3. Vá para **"Lembretes"**
4. Clique em **"🔄 Atualizar"**
5. Não deve mais dar erro 404!

### ✅ **4. Verificar Logs (se houver erro)**
1. No Dashboard do Supabase, vá em **Edge Functions**
2. Clique em `make-server-bd42bc02`
3. Vá na aba **"Logs"**
4. Veja se há erros em tempo real

---

## 🔧 TROUBLESHOOTING

### **Erro: "supabase: command not found"**
O CLI não foi instalado corretamente.

**Solução:**
```bash
# Verificar Node.js instalado
node --version
npm --version

# Reinstalar Supabase CLI
npm install -g supabase

# Verificar
supabase --version
```

### **Erro: "Project not found" ou "Invalid project ref"**
Você precisa linkar o projeto.

**Solução:**
```bash
supabase link --project-ref nbelraenzoprsskjnvpc
```

### **Erro: "Permission denied" ou 403**
Você não tem permissões adequadas no projeto.

**Solução:**
1. Confirme que você é **Owner** ou **Admin** do projeto no Supabase
2. Verifique no Dashboard: **Settings** → **Team**
3. Se não for Owner, peça ao Owner para fazer o deploy

### **Erro: "Function already exists"**
A função já existe, você só precisa atualizar.

**Solução:**
```bash
supabase functions deploy make-server-bd42bc02 --no-verify-jwt
```

### **Deploy funcionou, mas sistema ainda dá 404**
A Edge Function pode demorar alguns segundos para propagar.

**Solução:**
1. Aguarde 1-2 minutos
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Tente novamente
4. Verifique os logs no Dashboard

### **Deploy funcionou, mas dá erro 500**
Há um erro no código ou falta configurar variáveis de ambiente.

**Solução:**
1. No Dashboard, vá em **Settings** → **Edge Functions** → **Environment Variables**
2. Confirme que estas variáveis existem:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Veja os logs para identificar o erro específico

---

## 🚨 AJUDA RÁPIDA

### **Se tiver qualquer dúvida:**
1. Tente a **OPÇÃO 1 (CLI)** primeiro - é a mais confiável
2. Se der erro, copie a mensagem de erro completa
3. Verifique os logs no Dashboard do Supabase
4. Confirme que o plano Pro está ativo e sem pendências

### **Contatos de Suporte:**
- **Supabase Support:** https://supabase.com/support
- **Documentação:** https://supabase.com/docs/guides/functions

---

## ✅ PRÓXIMOS PASSOS APÓS DEPLOY BEM-SUCEDIDO

1. ✅ Testar todos os módulos do sistema
2. ✅ Verificar se os lembretes estão funcionando
3. ✅ Configurar monitoramento de erros
4. ✅ Configurar backup automático dos dados
5. ✅ Documentar o processo de deploy para a equipe

---

## 📌 COMANDOS ÚTEIS

```bash
# Ver status das Edge Functions
supabase functions list

# Ver logs em tempo real
supabase functions logs make-server-bd42bc02

# Deletar uma função (cuidado!)
supabase functions delete make-server-bd42bc02

# Re-deploy após mudanças
supabase functions deploy make-server-bd42bc02 --no-verify-jwt
```

---

**Última atualização:** 25/03/2026  
**Versão do Sistema:** 2.1.1  
**Status:** Pronto para deploy ✅
