# 🔍 Diagnóstico do Backend - Passo a Passo

## ❌ Problema: Backend não funciona

Vamos identificar exatamente onde está o problema.

---

## 🧪 TESTE 1: Verificar se a Edge Function existe

Execute no terminal:

```bash
supabase functions list
```

**Resultado esperado:**
```
┌────────┬────────────────────┬─────────┬────────────┐
│ NAME   │ CREATED AT         │ VERSION │ STATUS     │
├────────┼────────────────────┼─────────┼────────────┤
│ server │ 2026-03-31 ...     │ 1       │ ACTIVE     │
└────────┴────────────────────┴─────────┴────────────┘
```

**❌ Se não aparecer "server":**
- A função não foi deployada
- Execute: `supabase functions deploy server`

---

## 🧪 TESTE 2: Verificar o PROJECT_ID

Você precisa saber seu PROJECT_ID correto.

**Como encontrar:**
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Settings → General → Reference ID

**Exemplo:** `abcdefghijklmnop`

**Confirme que está usando o mesmo PROJECT_ID no código:**
- Veja o arquivo: `/utils/supabase/info.ts`
- Verifique se o `projectId` está correto

---

## 🧪 TESTE 3: Testar Health Endpoint via cURL

**IMPORTANTE:** Substitua `YOUR_PROJECT_ID` e `YOUR_ANON_KEY` pelos valores reais!

```bash
curl -v https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Como encontrar YOUR_ANON_KEY:**
- Dashboard → Settings → API → Project API keys → `anon` `public`

### ✅ Sucesso - Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-31T...",
  "version": "2.4.0"
}
```

### ❌ Erro 404 - Função não encontrada:
```
< HTTP/2 404
{
  "error": "Function not found"
}
```
**Solução:** A função não foi deployada corretamente
```bash
supabase functions deploy server
```

### ❌ Erro de CORS:
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Solução:** Aguarde alguns minutos após o deploy

### ❌ Erro 500:
```json
{
  "error": "Internal server error"
}
```
**Solução:** Verifique os logs:
```bash
supabase functions logs server
```

---

## 🧪 TESTE 4: Verificar no navegador

1. Abra a aplicação
2. Pressione **F12** (abrir DevTools)
3. Vá para a aba **Console**
4. Tente fazer qualquer ação que use o backend (ex: alterar senha)

### O que procurar nos logs:

**✅ Sucesso:**
```
[API_CALL] Making request to: /users/me/password
[API_CALL] Full URL: https://xxx.supabase.co/functions/v1/make-server-bd42bc02/users/me/password
[API_CALL] Method: PATCH
```

**❌ Failed to fetch:**
```
[API_CALL] ❌ Fetch failed: TypeError: Failed to fetch
[API_CALL] This usually means:
[API_CALL] 1. Edge Function não foi deployada
```

---

## 🧪 TESTE 5: Verificar Variáveis de Ambiente

1. Vá para: Dashboard → Settings → Edge Functions → Environment Variables
2. Confirme que existe a variável:

| Nome | Valor |
|------|-------|
| `SERVICE_ROLE_KEY` | `eyJhbGci...` (começa com eyJ) |

**⚠️ Se não existir:**
- Clique em "Add New Variable"
- Nome: `SERVICE_ROLE_KEY`
- Valor: Copie de Settings → API → service_role (secret)

**Após adicionar:**
```bash
# Re-deploy para aplicar
supabase functions deploy server
```

---

## 🧪 TESTE 6: Verificar Logs da Função

Execute:
```bash
supabase functions logs server --follow
```

Deixe este comando rodando e tente usar a aplicação.

**O que procurar:**

**✅ Funcionando:**
```
[INIT] Supabase URL: https://xxx.supabase.co
[INIT] Has Service Key: true
[REQUEST] PATCH /users/me/password
[CHANGE_PASSWORD] User requesting password change: email@exemplo.com
```

**❌ SERVICE_ROLE_KEY ausente:**
```
[INIT] Has Service Key: false
Error: SERVICE_ROLE_KEY is not defined
```
**Solução:** Configurar SERVICE_ROLE_KEY no dashboard

---

## 📋 Checklist de Verificação Rápida

Execute estes comandos em sequência e me informe os resultados:

```bash
# 1. Verificar se está logado
supabase status

# 2. Listar funções deployadas
supabase functions list

# 3. Ver últimos logs
supabase functions logs server --limit 20

# 4. Testar health endpoint (substitua PROJECT_ID e ANON_KEY)
curl https://PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer ANON_KEY"
```

---

## 🚨 Problemas Comuns e Soluções

### 1. "supabase: command not found"
```bash
# Instalar Supabase CLI
npm install -g supabase
```

### 2. "Not logged in"
```bash
supabase login
```

### 3. "Project not linked"
```bash
supabase link --project-ref SEU_PROJECT_ID
```

### 4. "Function not found (404)"
```bash
supabase functions deploy server
```

### 5. "Failed to fetch" no navegador
- Edge Function não está deployada OU
- PROJECT_ID errado no código OU
- CORS bloqueado (aguarde 1-2 minutos)

---

## 📤 O que me enviar para eu ajudar:

Envie os resultados de:

1. **`supabase functions list`**
2. **`supabase functions logs server --limit 20`**
3. **Teste do cURL do health endpoint**
4. **Screenshot do erro no console do navegador (F12)**
5. **Confirme seu PROJECT_ID** (primeiros 4 caracteres são suficientes)

Com essas informações, consigo identificar exatamente o problema!
