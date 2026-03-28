# 🚀 Deploy da Edge Function - Lembretes

## ❌ Problema Atual
```
GET https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/reminders/due-installments
404 (Not Found)
```

A Edge Function `make-server-bd42bc02` **NÃO existe** no Supabase.

---

## ✅ Solução: Deploy via Dashboard do Supabase

### **Passo 1: Acessar o Dashboard**
1. Acesse: https://supabase.com/dashboard/project/nbelraenzoprsskjnvpc/functions
2. Faça login se necessário
3. Clique em **"Edge Functions"** no menu lateral

### **Passo 2: Verificar se a função já existe**
- Procure por `make-server-bd42bc02` na lista
- Se existir: clique nela e vá para **Passo 4**
- Se NÃO existir: continue para **Passo 3**

### **Passo 3: Criar a Edge Function**
1. Clique em **"Create Function"** ou **"New Edge Function"**
2. No campo **"Name"**, digite: `make-server-bd42bc02` (exatamente assim!)
3. Clique em **"Create"**

### **Passo 4: Deploy do Código**

#### **Opção A: Deploy via Dashboard (Interface Web)**
1. Na página da função, encontre a seção de **código/editor**
2. **IMPORTANTE**: O código está em 3 arquivos:
   - `/supabase/functions/server/index.tsx` (arquivo principal - 3009 linhas)
   - `/supabase/functions/server/kv_store.tsx` (storage)
   - `/supabase/functions/server/client_portal_routes.tsx` (rotas do portal)
   - `/supabase/functions/server/billing_routes.tsx` (rotas de cobrança)

3. No Dashboard, você pode precisar:
   - Criar uma estrutura de pastas: `server/`
   - Fazer upload de cada arquivo

#### **Opção B: Deploy via CLI do Supabase (RECOMENDADO)**

Esta é a forma mais profissional e confiável:

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Login no Supabase
supabase login

# 3. Link com seu projeto
supabase link --project-ref nbelraenzoprsskjnvpc

# 4. Deploy da Edge Function
supabase functions deploy make-server-bd42bc02 --no-verify-jwt
```

### **Passo 5: Configurar Variáveis de Ambiente**

No Dashboard do Supabase, vá em **Settings** → **Edge Functions** → **Environment Variables** e adicione:

```bash
# OBRIGATÓRIAS (já devem estar configuradas)
SUPABASE_URL=https://nbelraenzoprsskjnvpc.supabase.co
SUPABASE_ANON_KEY=(sua anon key)
SUPABASE_SERVICE_ROLE_KEY=(sua service role key)

# OPCIONAIS (para WhatsApp/Evolution API)
EVOLUTION_API_URL=(sua URL da Evolution API)
EVOLUTION_API_KEY=(sua key da Evolution API)
EVOLUTION_INSTANCE_NAME=emprestflow
```

### **Passo 6: Testar**
Após o deploy:
1. Volte para o sistema EmpréstFlow
2. Acesse a aba **"Lembretes"**
3. Clique em **"🔄 Atualizar"**
4. Deve carregar sem erro 404!

---

## 🔧 Troubleshooting

### Se continuar dando 404:
1. Verifique o nome EXATO da função: `make-server-bd42bc02`
2. Confirme que a função está **"deployed"** (não apenas criada)
3. Aguarde 1-2 minutos para propagar

### Se der erro 403 durante deploy:
1. Verifique se você é **Owner** ou **Admin** do projeto
2. Confirme que o plano Pro está ativo e sem pendências
3. Tente fazer logout/login no Dashboard

### Se der erro de código:
1. Verifique se TODOS os 4 arquivos foram enviados
2. Verifique se os imports entre arquivos estão corretos
3. Veja os logs da Edge Function no Dashboard

---

## 📋 Estrutura de Arquivos Necessária

```
supabase/functions/server/
├── index.tsx                     # Arquivo principal (3009 linhas)
├── kv_store.tsx                  # Sistema de storage
├── client_portal_routes.tsx      # Rotas do portal do cliente
└── billing_routes.tsx            # Rotas de cobrança automática
```

---

## ⚡ Atalho Rápido

Se você tiver o Supabase CLI instalado, rode direto:

```bash
cd /caminho/do/projeto
supabase functions deploy make-server-bd42bc02 --project-ref nbelraenzoprsskjnvpc --no-verify-jwt
```

---

## 📞 Suporte

Se mesmo após o deploy continuar dando erro, verifique:
1. **Logs da Edge Function** no Dashboard
2. **Browser DevTools** (Console) para ver o erro completo
3. **Teste manual** com curl:

```bash
curl -X GET "https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZWxyYWVuem9wcnNza2pudnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDczNzcsImV4cCI6MjA4NzM4MzM3N30.xVpRFnJHnNzRZ_CMeH02rVey895P0ST78E1hi8G7HNM"
```

Deve retornar: `{"status":"ok","version":"2.1.1"}`
