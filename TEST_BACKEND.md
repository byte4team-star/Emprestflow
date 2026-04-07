# 🧪 Como Testar se o Backend Está Funcionando

Agora que você configurou a `SERVICE_ROLE_KEY`, vamos testar se tudo está funcionando corretamente.

---

## ✅ Teste 1: Verificar Health Endpoint

Abra o terminal e execute (substitua `YOUR_PROJECT_ID` e `YOUR_ANON_KEY`):

```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Como encontrar esses valores:**
- `YOUR_PROJECT_ID`: Settings → General → Reference ID
- `YOUR_ANON_KEY`: Settings → API → anon public

**Resposta esperada (sucesso):**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-31T...",
  "version": "2.4.0"
}
```

**Se der erro 404:**
- A Edge Function não foi deployada
- Execute: `supabase functions deploy server`

---

## ✅ Teste 2: Testar Alteração de Senha

1. **Faça login** na aplicação com suas credenciais
2. Vá em **"🔑 Alterar Senha"** no menu lateral
3. Abra o **Console do Navegador** (F12 → Console)
4. Preencha o formulário:
   - **Senha Atual**: sua senha atual
   - **Nova Senha**: uma senha nova (mínimo 6 caracteres)
   - **Confirmar Senha**: repita a senha nova
5. Clique em **"Alterar Senha"**

### 📊 O que observar no Console:

**✅ Sucesso - Logs esperados:**
```
[API_CALL] Making request to: /users/me/password
[API_CALL] Full URL: https://xxx.supabase.co/functions/v1/make-server-bd42bc02/users/me/password
[API_CALL] Method: PATCH
[ChangePassword] Attempting to change password...
[ChangePassword] Password changed successfully
```

**❌ Erro - O que NÃO deve aparecer:**
```
[API_CALL] ❌ Fetch failed: TypeError: Failed to fetch
[API_CALL] This usually means:
[API_CALL] 1. Edge Function não foi deployada
```

Se aparecer este erro, significa que:
- A função não foi deployada corretamente
- Execute novamente: `supabase functions deploy server`

---

## ✅ Teste 3: Verificar Logs da Edge Function

Execute no terminal:

```bash
supabase functions logs server --follow
```

Este comando mostra os logs em tempo real. Quando você tentar alterar a senha, deverá ver:

```
[CHANGE_PASSWORD] User requesting password change: seu-email@exemplo.com
[CHANGE_PASSWORD] Current password verified successfully
[CHANGE_PASSWORD] ✅ Password updated successfully for user: seu-email@exemplo.com
```

**Se aparecer erro nos logs:**
- Erro de `SERVICE_ROLE_KEY`: A variável não foi configurada corretamente
- Erro de "Invalid login credentials": Senha atual incorreta

---

## 🔍 Diagnóstico de Problemas

### Problema 1: "Failed to fetch"
**Sintoma**: Mensagem de erro "Falha na conexão" ou "Failed to fetch"

**Solução:**
```bash
# 1. Verifique se a função foi deployada
supabase functions list

# 2. Se não aparecer "server" na lista, faça o deploy
supabase functions deploy server

# 3. Aguarde alguns segundos e teste novamente
```

---

### Problema 2: "Senha atual incorreta"
**Sintoma**: Erro "Invalid login credentials" ao tentar alterar senha

**Possíveis causas:**
1. Você digitou a senha atual errada
2. A `SERVICE_ROLE_KEY` não foi configurada

**Solução:**
- Verifique se digitou a senha atual corretamente
- Confirme que a `SERVICE_ROLE_KEY` está configurada em:
  - Dashboard → Settings → Edge Functions → Environment Variables

---

### Problema 3: "Erro 500" do servidor
**Sintoma**: Erro HTTP 500 ao alterar senha

**Solução:**
```bash
# Veja os logs para identificar o erro
supabase functions logs server

# Comum: SERVICE_ROLE_KEY não configurada
# Você verá: "SERVICE_ROLE_KEY is not defined"
```

Se esse for o erro, adicione a variável no dashboard.

---

## 📝 Comandos Úteis

```bash
# Ver status do projeto
supabase status

# Ver todas as funções deployadas
supabase functions list

# Fazer deploy da função
supabase functions deploy server

# Ver logs em tempo real
supabase functions logs server --follow

# Ver logs antigos (últimas 100 linhas)
supabase functions logs server --limit 100
```

---

## ✅ Tudo Funcionando?

Se você chegou até aqui e:
- ✅ O health endpoint retorna "healthy"
- ✅ Conseguiu alterar a senha sem erros
- ✅ Os logs mostram sucesso

**Parabéns! 🎉 Seu backend está 100% funcional!**

Agora você pode:
- Alterar senha de qualquer usuário
- Resetar senha de usuários (como admin)
- Gerenciar usuários pela interface

---

## 📞 Ainda com Problemas?

Se ainda estiver com erro, compartilhe:
1. A mensagem de erro completa
2. Os logs do console (F12)
3. Os logs da Edge Function (`supabase functions logs server`)

Isso ajudará a identificar o problema específico.
