# 🔧 Troubleshooting - Exibição de Mídia (Fotos e Vídeos)

## ✅ Implementações Feitas

### 1. **Frontend - ClientDetails.tsx**
- ✅ Botão "Atualizar Documentos" para regenerar URLs
- ✅ Tratamento de erros JWT com mensagem clara
- ✅ Indicador visual de loading durante refresh
- ✅ Suporte para formatos legado (string) e novo (objeto com metadados)
- ✅ Animação no ícone de refresh

### 2. **Frontend - supabase.ts (apiCall)**
- ✅ **Auto-retry com refresh de sessão** quando JWT expira
- ✅ Detecção de erros: `JWT`, `exp claim`, `InvalidJWT`, status `401`
- ✅ Refresh automático da sessão usando `supabase.auth.refreshSession()`
- ✅ Retry da requisição após refresh bem-sucedido
- ✅ Redirecionamento para `/login?reason=session_expired` se falhar

### 3. **Backend - server/index.tsx**
- ✅ Verificação se arquivo existe no Storage antes de gerar URL
- ✅ Logging detalhado para debug
- ✅ URLs assinadas válidas por 1 hora
- ✅ Tratamento de erros com mensagens específicas
- ✅ Suporte para formatos legado e novo

---

## 🐛 Problemas Conhecidos e Soluções

### Problema 1: **Fotos não carregam (404 ou erro de rede)**

**Possíveis Causas:**
1. Arquivos não foram uploadados para o Supabase Storage
2. Bucket `make-bd42bc02-documents` não existe
3. Política de acesso (RLS) bloqueando o acesso

**Como Diagnosticar:**

1. **Abra o DevTools Console (F12)** e procure por logs:
   ```
   [CLIENT_GET] Generating signed URL for foto1, path: ...
   [CLIENT_GET] ✓ Signed URL generated for foto1
   ```

2. **Verifique o Supabase Dashboard:**
   - Vá em **Storage** → `make-bd42bc02-documents`
   - Veja se os arquivos estão lá
   - Verifique a estrutura de pastas: `<clientId>/foto1.jpg`, etc.

3. **Verifique as Políticas de Storage (RLS):**
   - No Supabase Dashboard → Storage → `make-bd42bc02-documents` → Policies
   - Deve ter uma política permitindo leitura com service_role (admin)

**Solução:**
```sql
-- Execute no Supabase SQL Editor:
-- Política para permitir admin service_role ler todos os arquivos
CREATE POLICY "Admin can read all documents"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'make-bd42bc02-documents');
```

---

### Problema 2: **Erro "InvalidJWT" ou "exp claim timestamp check failed"**

**Causa:** Token JWT expirou (sessão > 1 hora)

**Solução Implementada:**
- ✅ **Auto-refresh automático** no `apiCall()`
- ✅ Se falhar, redireciona para login

**Como Testar:**
1. Faça login
2. Espere 1 hora (ou force expiração editando localStorage)
3. Tente acessar um cliente
4. O sistema deve:
   - Detectar JWT expirado
   - Fazer refresh da sessão
   - Retentar a requisição
   - OU redirecionar para login se falhar

---

### Problema 3: **URLs expiram após 1 hora**

**Causa:** URLs assinadas do Supabase Storage expiram

**Solução Implementada:**
- ✅ Botão "Atualizar Documentos" na página ClientDetails
- ✅ URLs são regeneradas a cada requisição ao backend

**Como Usar:**
1. Acesse a página de detalhes do cliente
2. Se as mídias não carregarem, clique em **"Atualizar Documentos"**
3. Novas URLs serão geradas

---

### Problema 4: **Edge Function não deployada**

**Como Verificar:**
```bash
# No terminal, teste a Edge Function:
curl https://<PROJECT_ID>.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer <ANON_KEY>"
```

**Solução:**
```bash
# Deploy da Edge Function:
supabase functions deploy make-server

# Ou via Dashboard:
# Supabase → Edge Functions → make-server → Deploy
```

---

## 📋 Checklist de Diagnóstico

Use este checklist para diagnosticar problemas:

- [ ] **Edge Function deployada?**
  - Teste: `curl https://PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/health`

- [ ] **Storage Bucket existe?**
  - Supabase Dashboard → Storage → `make-bd42bc02-documents`

- [ ] **Arquivos estão no Storage?**
  - Verifique a pasta do cliente: `<clientId>/foto1.jpg`, etc.

- [ ] **Políticas de Storage configuradas?**
  - service_role deve poder ler todos os arquivos

- [ ] **Sessão JWT válida?**
  - Abra DevTools → Application → localStorage → `supabase.auth.token`
  - Verifique se o token não expirou

- [ ] **Console mostra erros?**
  - DevTools → Console (F12)
  - Procure por erros em vermelho

- [ ] **Network mostra 401/403/404?**
  - DevTools → Network → Filtre por "make-server"
  - Veja os status codes das requisições

---

## 🔍 Logs Importantes

### Logs do Frontend (DevTools Console):

```
[API_CALL] Making request to: /clients/client_abc123
[API_CALL] JWT expired or invalid, attempting to refresh session...
[API_CALL] Session refreshed successfully, retrying request...
```

### Logs do Backend (Supabase Logs):

```
[CLIENT_GET] Loading client client_abc123, has documents: true
[CLIENT_GET] Generating signed URL for foto1, path: client_abc123/foto1.jpg
[CLIENT_GET] ✓ Signed URL generated for foto1
```

### Logs de Erro (Storage não encontrado):

```
[CLIENT_GET] File not found in storage: client_abc123/foto1.jpg
```

---

## 🚀 Próximos Passos

1. **Deploy da Edge Function:**
   ```bash
   supabase functions deploy make-server
   ```

2. **Teste o sistema:**
   - Faça login
   - Acesse um cliente
   - Clique em "Ver foto" ou "Ver vídeo"
   - Se não carregar, clique em "Atualizar Documentos"

3. **Verifique os logs:**
   - Abra DevTools (F12)
   - Console: veja logs do frontend
   - Network: veja requisições e respostas
   - Supabase Dashboard → Logs: veja logs do backend

4. **Se ainda houver problemas:**
   - Copie os logs do Console
   - Verifique se os arquivos existem no Storage
   - Verifique as políticas de acesso

---

## 📞 Suporte

Se os problemas persistirem, forneça:

1. **Logs do Console** (DevTools → Console)
2. **Screenshot do Network** mostrando requisições falhando
3. **Screenshot do Supabase Storage** mostrando a estrutura de pastas
4. **Mensagem de erro exata** que aparece na tela

---

## ✨ Melhorias Implementadas

### Segurança
- ✅ Auto-refresh de sessão quando JWT expira
- ✅ Redirecionamento automático para login quando sessão inválida
- ✅ Validação de arquivos no Storage antes de gerar URLs

### UX
- ✅ Botão "Atualizar Documentos" visível
- ✅ Loading state com animação
- ✅ Mensagens de erro claras e amigáveis
- ✅ Indicadores visuais (verde = enviado, vermelho = obrigatório)

### Performance
- ✅ URLs assinadas geradas sob demanda
- ✅ Cache de sessão evita requisições desnecessárias
- ✅ Retry automático apenas em caso de JWT expirado

### Debug
- ✅ Logging detalhado em todos os pontos críticos
- ✅ Mensagens de erro específicas
- ✅ Verificação de existência de arquivos
