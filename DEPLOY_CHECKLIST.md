# 📋 Checklist de Deploy - Supabase Edge Function

## ❌ Problema Atual
**Erro**: `Error changing password: TypeError: Failed to fetch`

Este erro indica que a Edge Function não está respondendo. Isso acontece quando:
1. A função não foi deployada
2. A função foi deployada mas as variáveis de ambiente não estão configuradas
3. Há um problema de CORS ou configuração

---

## ✅ Solução Passo a Passo

### 1. **Deploy da Edge Function**

Execute no terminal (na raiz do projeto):

```bash
# Login no Supabase (se ainda não fez)
supabase login

# Link com seu projeto
supabase link --project-ref SEU_PROJECT_ID

# Deploy da função
supabase functions deploy server
```

**Como encontrar seu PROJECT_ID:**
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto
- Vá em: Settings → General → Reference ID

---

### 2. **Configurar Variáveis de Ambiente**

⚠️ **CRÍTICO**: A função precisa da seguinte variável configurada no dashboard do Supabase:

#### Como configurar:
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings → Edge Functions → Environment Variables**
4. Clique em **"Add New Variable"**
5. Adicione:

| Variável | Valor | Onde encontrar |
|----------|-------|----------------|
| `SERVICE_ROLE_KEY` | `eyJhbGc...` | Settings → API → service_role (secret) |

**✅ Variáveis Automáticas (não precisa configurar)**:
- `SUPABASE_URL` - Injetada automaticamente pelo Supabase
- `SUPABASE_ANON_KEY` - Injetada automaticamente pelo Supabase
- Você não precisa adicionar essas duas manualmente!

**⚠️ MUITO IMPORTANTE**:
- `SERVICE_ROLE_KEY` é **OBRIGATÓRIA** para alteração de senha funcionar
- Nunca exponha a `SERVICE_ROLE_KEY` no frontend
- Use apenas no backend (Edge Functions)

---

### 3. **Verificar Deploy**

Após o deploy, verifique se está funcionando:

#### Teste via cURL:
```bash
# Substitua YOUR_PROJECT_ID pelo ID do seu projeto
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-31T..."
}
```

---

### 4. **Verificar no Console do Navegador**

Após o deploy, acesse a aplicação e abra o Console (F12):

**Logs esperados:**
```
[API_CALL] Making request to: /users/me/password
[API_CALL] Full URL: https://xxx.supabase.co/functions/v1/make-server-bd42bc02/users/me/password
[API_CALL] Method: PATCH
```

**Se aparecer erro "Failed to fetch":**
- Verifique se o deploy foi feito corretamente
- Verifique se as variáveis de ambiente estão configuradas
- Verifique se não há erro de CORS

---

### 5. **Logs da Edge Function**

Para ver logs em tempo real:

```bash
supabase functions logs server --follow
```

---

## 📝 Comandos Úteis

```bash
# Ver todas as funções deployadas
supabase functions list

# Ver status do projeto
supabase status

# Ver logs da função
supabase functions logs server

# Re-deploy (se precisar atualizar)
supabase functions deploy server --no-verify-jwt
```

---

## 🔍 Troubleshooting

### Problema: "Failed to fetch"
**Causa**: Edge Function não está respondendo
**Solução**: Fazer deploy da função (passo 1)

### Problema: "Invalid login credentials" ao mudar senha
**Causa**: `SERVICE_ROLE_KEY` não configurada
**Solução**: Configurar variável no dashboard (passo 2)

### Problema: Função deployada mas não funciona
**Causa**: Variáveis de ambiente não configuradas
**Solução**: Adicionar variáveis no dashboard (passo 2)

### Problema: CORS error
**Causa**: CORS não configurado na função
**Solução**: A função já tem CORS configurado, mas verifique se o deploy foi completo

---

## ✅ Checklist Final

- [ ] Deploy da Edge Function realizado (`supabase functions deploy server`)
- [ ] `SERVICE_ROLE_KEY` configurada no dashboard
- [ ] Teste via cURL funcionou (retorna "healthy")
- [ ] Console do navegador não mostra "Failed to fetch"
- [ ] Alteração de senha funciona sem erros

**Nota**: `SUPABASE_URL` e `SUPABASE_ANON_KEY` são injetadas automaticamente - você não precisa configurá-las!

---

## 📚 Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentação Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI Docs](https://supabase.com/docs/reference/cli/introduction)
