# 🔐 Configurar Service Role Key no Supabase Dashboard

## 📋 Passo a Passo - Configuração da Variável de Ambiente

### ⚠️ IMPORTANTE
A Edge Function já está configurada para usar `SUPABASE_SERVICE_ROLE_KEY`, mas você precisa adicionar essa variável de ambiente no Supabase Dashboard.

---

## 🚀 PASSO 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **nbelraenzoprsskjnvpc**

---

## 🚀 PASSO 2: Ir para Edge Functions

1. No menu lateral esquerdo, clique em **Edge Functions**
2. Você verá sua função: `make-server-bd42bc02`

---

## 🚀 PASSO 3: Configurar Variáveis de Ambiente

### Opção A: Via Interface (Recomendado)

1. Clique na aba **Settings** (configurações) da Edge Function
2. Role até a seção **Environment Variables**
3. Clique em **Add Variable** ou **New Secret**
4. Preencha:

```
Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZWxyYWVuem9wcnNza2pudnBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzE4MjA2NCwiZXhwIjoyMDQ4NzU4MDY0fQ.sb_secret_eaRVOowDLKPZlKsMzxkn1Q_YPJc-msp
```

5. Clique em **Save** ou **Add**

### Opção B: Via CLI (Alternativo)

Se você tiver o Supabase CLI instalado:

```bash
# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref nbelraenzoprsskjnvpc

# Configurar secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZWxyYWVuem9wcnNza2pudnBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzE4MjA2NCwiZXhwIjoyMDQ4NzU4MDY0fQ.sb_secret_eaRVOowDLKPZlKsMzxkn1Q_YPJc-msp"
```

---

## 🚀 PASSO 4: Verificar Outras Variáveis de Ambiente

Certifique-se de que as seguintes variáveis também estão configuradas:

### Variáveis Obrigatórias:

```bash
# Já configurado automaticamente pelo Supabase:
SUPABASE_URL=https://nbelraenzoprsskjnvpc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZWxyYWVuem9wcnNza2pudnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDczNzcsImV4cCI6MjA4NzM4MzM3N30.xVpRFnJHnNzRZ_CMeH02rVey895P0ST78E1hi8G7HNM

# Você precisa adicionar manualmente:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZWxyYWVuem9wcnNza2pudnBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzE4MjA2NCwiZXhwIjoyMDQ4NzU4MDY0fQ.sb_secret_eaRVOowDLKPZlKsMzxkn1Q_YPJc-msp
```

### Variáveis Opcionais (Para WhatsApp - Evolution API):

```bash
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-api
EVOLUTION_INSTANCE_NAME=emprestflow
```

**Nota:** Se você não configurar as variáveis do Evolution API, o sistema funcionará normalmente, mas os lembretes de WhatsApp não serão enviados.

---

## 🚀 PASSO 5: Fazer Deploy da Edge Function

Após configurar a variável de ambiente, você precisa fazer deploy novamente:

### Via CLI:

```bash
# Navegar até a pasta do projeto
cd seu-projeto

# Fazer deploy da Edge Function
supabase functions deploy server --project-ref nbelraenzoprsskjnvpc
```

### Via Dashboard:

1. Vá em **Edge Functions** → **make-server-bd42bc02**
2. Clique em **Deploy** ou **Redeploy**
3. Aguarde conclusão do deploy

---

## ✅ PASSO 6: Testar a Configuração

### Teste 1: Health Check

```bash
curl https://nbelraenzoprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health
```

**Esperado:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-29T...",
  "version": "2.3.0",
  "supabase": {
    "connected": true,
    "hasServiceKey": true,
    "hasAnonKey": true
  },
  "evolutionApi": {
    "configured": false
  }
}
```

### Teste 2: Verificar Logs

1. Vá em **Edge Functions** → **make-server-bd42bc02** → **Logs**
2. Procure por:

```
[INIT] Has Service Key: true
```

Se aparecer `false`, a variável não foi configurada corretamente.

---

## 🔧 Troubleshooting

### Erro: "SUPABASE_SERVICE_ROLE_KEY is not defined"

**Causa:** Variável de ambiente não foi configurada

**Solução:**
1. Volte ao **PASSO 3** e configure a variável
2. Faça redeploy da Edge Function (**PASSO 5**)

### Erro: "Invalid JWT"

**Causa:** Service Role Key incorreta

**Solução:**
1. Verifique se copiou a key completa (sem espaços)
2. Confirme que a key termina com `.sb_secret_eaRVOowDLKPZlKsMzxkn1Q_YPJc-msp`
3. Salve e faça redeploy

### Erro: "Permission denied"

**Causa:** A Service Role Key pode ter expirado ou está incorreta

**Solução:**
1. Vá em **Settings** → **API** no Supabase Dashboard
2. Copie a **service_role** key novamente
3. Atualize a variável de ambiente
4. Faça redeploy

---

## 📊 Resumo das Variáveis de Ambiente

| Variável | Status | Uso | Obrigatória |
|----------|--------|-----|-------------|
| `SUPABASE_URL` | ✅ Auto | URL do projeto | Sim |
| `SUPABASE_ANON_KEY` | ✅ Auto | Requests públicos | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Manual | Operações admin | **SIM** |
| `EVOLUTION_API_URL` | ⚠️ Manual | WhatsApp | Não |
| `EVOLUTION_API_KEY` | ⚠️ Manual | WhatsApp | Não |
| `EVOLUTION_INSTANCE_NAME` | ⚠️ Manual | WhatsApp | Não |

---

## 🎯 Próximos Passos

Após configurar a Service Role Key:

1. ✅ Configure as Políticas de Segurança (RLS)
   - Siga o guia: `/SUPABASE_POLICIES_SETUP.md`

2. ✅ Teste o cadastro de clientes
   - Acesse: `/client-portal/first-access`
   - Complete o formulário
   - Verifique se o upload funciona

3. ✅ Configure WhatsApp (Opcional)
   - Siga o guia: `/WHATSAPP_SETUP.md`

---

## 📚 Documentação de Referência

- [Supabase Edge Functions - Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [Service Role Key - Best Practices](https://supabase.com/docs/guides/api/api-keys)
- [Supabase CLI - Secrets Management](https://supabase.com/docs/reference/cli/usage#supabase-secrets-set)

---

✅ **Status Final:** Service Role Key configurada no código. Agora configure no Supabase Dashboard!

⏱️ **Tempo estimado:** 5-10 minutos
