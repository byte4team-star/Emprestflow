# 🧪 TESTE DE CONEXÃO SUPABASE

## 📋 CHECKLIST RÁPIDO

Execute estes testes para identificar o problema:

---

## 1️⃣ **TESTE DE VARIÁVEIS DE AMBIENTE**

### No terminal do Figma Make (Console):

```javascript
// Teste 1: Verificar se as variáveis estão definidas
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida');
```

**Resultado Esperado:**
```
SUPABASE_URL: https://seu-projeto.supabase.co
SUPABASE_ANON_KEY: ✅ Definida
```

---

## 2️⃣ **TESTE DE CONEXÃO HTTP**

### Usando cURL (Terminal):

```bash
# Teste básico de conexão
curl -X GET "https://seu-projeto.supabase.co/rest/v1/" \
  -H "apikey: SUA_ANON_KEY" \
  -H "Authorization: Bearer SUA_ANON_KEY"
```

**Resultado Esperado:**
- Status Code: `200 OK`
- Resposta com informações do projeto

---

## 3️⃣ **TESTE DE AUTENTICAÇÃO**

### No navegador (DevTools Console):

```javascript
// Teste de login
const response = await fetch('https://seu-projeto.supabase.co/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'SUA_ANON_KEY'
  },
  body: JSON.stringify({
    email: 'seu-email@example.com',
    password: 'sua-senha'
  })
});

console.log('Status:', response.status);
console.log('Response:', await response.json());
```

**Resultado Esperado:**
- Status: `200`
- Response com `access_token` e `refresh_token`

---

## 4️⃣ **TESTE DE EDGE FUNCTION**

### Via cURL:

```bash
# Teste health check
curl -X GET "https://seu-projeto.supabase.co/functions/v1/make-server/health"
```

**Resultado Esperado:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-23T...",
  "version": "2.1.1",
  "service": "emprestflow-api"
}
```

---

## 5️⃣ **DIAGNÓSTICO DE ERRO 403**

### Possíveis Causas:

#### ❌ **Causa 1: Variáveis não configuradas**
```
Solução: Configure no Figma Make Settings → Environment Variables
```

#### ❌ **Causa 2: API Key inválida**
```
Solução: Regenere as keys no Supabase Dashboard
```

#### ❌ **Causa 3: Projeto pausado**
```
Solução: Vá em Supabase Dashboard → Settings → Restore Project
```

#### ❌ **Causa 4: Permissões insuficientes**
```
Solução: Verifique se você é Owner/Admin do projeto
```

#### ❌ **Causa 5: Edge Functions desabilitadas**
```
Solução: Supabase Dashboard → Edge Functions → Enable
```

---

## 6️⃣ **VERIFICAÇÃO DE STATUS DO SUPABASE**

### Online:
```
https://status.supabase.com/
```

### Dashboard:
```
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Verifique o indicador verde no topo
```

---

## 7️⃣ **TESTE DE PERMISSÕES RLS**

### No Supabase SQL Editor:

```sql
-- Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Desabilitar RLS temporariamente (APENAS TESTE)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
```

⚠️ **ATENÇÃO:** Não deixe RLS desabilitado em produção!

---

## 8️⃣ **LOGS DE DEBUG**

### No Supabase Dashboard:

```
1. Vá em: Edge Functions → make-server
2. Clique em: Logs
3. Filtre por: "error" ou "403"
4. Procure por mensagens como:
   - "Permission denied"
   - "Invalid credentials"
   - "Authentication failed"
```

---

## 9️⃣ **TESTE MANUAL DE DEPLOY**

### Via Supabase CLI:

```bash
# 1. Instalar CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link ao projeto
supabase link --project-ref SEU_PROJECT_ID

# 4. Deploy
supabase functions deploy make-server --no-verify-jwt

# 5. Verificar
supabase functions list
```

---

## 🔟 **TESTE DE CORS**

### No navegador (DevTools):

```javascript
fetch('https://seu-projeto.supabase.co/functions/v1/make-server/health', {
  method: 'GET',
  headers: {
    'Origin': window.location.origin
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Se der erro CORS:**
```
Vá em: Supabase → Settings → API → CORS Configuration
Adicione: https://your-domain.com
```

---

## ✅ **SOLUÇÃO PASSO A PASSO**

Se **nenhum** dos testes acima funcionar:

### **1. Recriar Projeto Supabase**

```bash
1. Fazer backup dos dados
2. Criar novo projeto no Supabase
3. Configurar variáveis no Figma Make
4. Migrar dados
5. Testar deploy
```

### **2. Usar Supabase Local**

```bash
supabase init
supabase start
supabase functions serve
```

### **3. Migrar para outro provider**

Alternativas ao Supabase:
- ✅ Vercel Postgres
- ✅ PlanetScale
- ✅ Railway
- ✅ Neon

---

## 🆘 **SUPORTE DIRETO**

### Supabase Support:
- Email: support@supabase.com
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase/issues

### Figma Make Support:
- In-app chat
- Community forum

---

## 📊 **TABELA DE CÓDIGOS HTTP**

| Código | Significado | Solução |
|--------|-------------|---------|
| 200 | ✅ OK | Tudo funcionando |
| 401 | ❌ Unauthorized | Verificar API key |
| 403 | ❌ Forbidden | Verificar permissões |
| 404 | ❌ Not Found | Verificar URL/rota |
| 500 | ❌ Server Error | Verificar logs |

---

## 🎯 **PRÓXIMA AÇÃO RECOMENDADA**

1. ✅ Execute o **Teste 1** (Variáveis de Ambiente)
2. ✅ Se falhar, configure as variáveis
3. ✅ Execute o **Teste 4** (Edge Function)
4. ✅ Se retornar 403, execute o **Teste 9** (Deploy Manual)
5. ✅ Verifique os **Logs** (Teste 8)

---

**Última atualização:** 23/03/2026
