# 🚀 Deploy Rápido - Correção de Gerenciamento de Usuários

## ⚡ Passos Rápidos (5 minutos)

### 1️⃣ Verificar Service Role Key

```bash
# Acesse o dashboard do Supabase
https://supabase.com/dashboard/project/SEU_PROJECT_ID/settings/api

# Copie a "service_role key" (não a anon key!)
# Deve começar com: eyJhbGc...
```

### 2️⃣ Configurar Secret na Edge Function

```bash
# Via Dashboard:
https://supabase.com/dashboard/project/SEU_PROJECT_ID/functions/make-server-bd42bc02

# 1. Clique em "Secrets"
# 2. Adicione:
#    Nome: SUPABASE_SERVICE_ROLE_KEY
#    Valor: [cole a service_role key copiada]
# 3. Clique em "Save"
```

### 3️⃣ Deploy da Edge Function

**Opção A - Via CLI (Recomendado)**
```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
npx supabase login

# Deploy
npx supabase functions deploy make-server-bd42bc02 \
  --project-ref SEU_PROJECT_ID
```

**Opção B - Via Dashboard**
```bash
# 1. Acesse:
https://supabase.com/dashboard/project/SEU_PROJECT_ID/functions/make-server-bd42bc02

# 2. Clique em "Deploy new version"
# 3. Cole todo o conteúdo de /supabase/functions/server/index.tsx
# 4. Clique em "Deploy"
```

### 4️⃣ Testar

```bash
# Abra o frontend
# Login como admin: admin@empresa.com / Admin@123456
# Vá em "Usuários"
# Você deve ver a lista de usuários!
```

## ✅ Checklist Rápido

- [ ] Service Role Key copiada do Supabase
- [ ] Secret configurada na Edge Function
- [ ] Edge Function deployada
- [ ] Frontend testado (lista usuários OK)
- [ ] Criar usuário testado (botão "Adicionar Usuário" OK)

## 🆘 Problemas Comuns

### "Erro 404" ao listar usuários
```bash
# Edge function não deployada
# Solução: Refazer passo 3
```

### "Erro 500" ao listar usuários
```bash
# Service Role Key não configurada ou inválida
# Solução: 
# 1. Verificar secret no dashboard
# 2. Copiar novamente a service_role key correta
# 3. Redeployar a edge function
```

### "Lista vazia" de usuários
```bash
# Verificar logs da edge function:
https://supabase.com/dashboard/project/SEU_PROJECT_ID/functions/make-server-bd42bc02/logs

# Procurar por:
# - "[USERS] Fetching all users..."
# - "[USERS] Found X users"
```

## 📞 Onde Encontrar Ajuda

- Logs detalhados: [USERS_BACKEND_FIX_SUMMARY.md](./USERS_BACKEND_FIX_SUMMARY.md)
- Instruções completas: [DEPLOY_USERS_FIX.md](./DEPLOY_USERS_FIX.md)
- Troubleshooting: Seção "Troubleshooting" em DEPLOY_USERS_FIX.md

---

**Tempo Estimado**: 5-10 minutos  
**Dificuldade**: ⭐⭐☆☆☆ (Fácil)  
**Última Atualização**: 28/03/2026
