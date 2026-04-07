# 🔧 Solução: Erro 403 no Deploy da Edge Function

## ❌ Erro Atual

```
Error while deploying: XHR for "/api/integrations/supabase/.../edge_functions/make-server/deploy" failed with status 403
```

## 🔍 Causa

O erro 403 (Forbidden) significa que você **não tem permissão** para fazer deploy da Edge Function via Figma Make. Isso pode acontecer por:

1. **Token expirado** no Figma Make
2. **Permissões insuficientes** no projeto Supabase
3. **Limite do plano** (Edge Functions requerem plano Pro ou superior)
4. **Sessão inválida** entre Figma Make e Supabase

---

## ✅ Soluções (em ordem de prioridade)

### **Solução 1: Deploy via Supabase CLI (RECOMENDADO)**

Esta é a forma mais confiável e segura de fazer deploy.

#### Passo 1: Instale o Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Ou via npm (todas as plataformas)
npm install -g supabase
```

#### Passo 2: Faça login no Supabase

```bash
supabase login
```

Isso abrirá seu navegador para autenticação. Siga as instruções.

#### Passo 3: Vincule seu projeto

```bash
# Encontre o PROJECT_ID no Supabase Dashboard → Settings → General
supabase link --project-ref <PROJECT_ID>
```

#### Passo 4: Deploy da Edge Function

```bash
# Certifique-se de estar na raiz do projeto (onde está /supabase)
supabase functions deploy make-server

# Se houver erros, use --debug para mais detalhes
supabase functions deploy make-server --debug
```

#### Passo 5: Verifique o deploy

```bash
# Teste a function
curl https://<PROJECT_ID>.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer <ANON_KEY>"
```

---

### **Solução 2: Deploy via Supabase Dashboard**

Se não puder usar a CLI, faça deploy manualmente pelo dashboard:

#### Passo 1: Acesse o Supabase Dashboard

```
https://supabase.com/dashboard/project/<PROJECT_ID>/functions
```

#### Passo 2: Navegue até Edge Functions

- Clique em **"Functions"** no menu lateral
- Encontre a function `make-server`

#### Passo 3: Deploy manual

- Clique em **"Deploy new version"**
- Selecione o arquivo `/supabase/functions/server/index.tsx`
- Clique em **"Deploy"**

**⚠️ IMPORTANTE:** O dashboard pode não suportar Edge Functions complexas com múltiplos arquivos. A CLI é preferível.

---

### **Solução 3: Reconectar Figma Make ao Supabase**

Se você realmente precisa fazer deploy via Figma Make:

#### Passo 1: Desconecte a integração

No Figma Make:
1. Vá em **Integrações** ou **Connections**
2. Encontre a conexão com Supabase
3. Clique em **"Disconnect"** ou **"Remove"**

#### Passo 2: Reconecte com permissões corretas

1. Vá em **Integrações** → **Supabase**
2. Clique em **"Connect"**
3. Faça login no Supabase
4. **Conceda TODAS as permissões solicitadas**
5. Selecione o projeto correto

#### Passo 3: Tente o deploy novamente

---

### **Solução 4: Verifique o plano do Supabase**

Edge Functions requerem **plano Pro ou superior**:

1. Acesse: https://supabase.com/dashboard/project/<PROJECT_ID>/settings/billing
2. Verifique seu plano atual
3. Se estiver no **Free Plan**, atualize para **Pro** ($25/mês)

**Benefícios do Pro Plan:**
- ✅ Edge Functions ilimitadas
- ✅ 8GB de database
- ✅ 100GB de bandwidth
- ✅ Backups automáticos
- ✅ Suporte prioritário

---

## 🧪 Testando o Deploy

Depois de fazer deploy com sucesso, teste:

### Teste 1: Health Check

```bash
curl https://<PROJECT_ID>.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer <ANON_KEY>"
```

**Resposta esperada:**
```json
{"status":"ok","message":"Make Server is running"}
```

### Teste 2: Autenticação

```bash
curl https://<PROJECT_ID>.supabase.co/functions/v1/make-server-bd42bc02/dashboard/stats \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "X-User-Token: <USER_JWT_TOKEN>"
```

**Resposta esperada:** JSON com estatísticas do dashboard

### Teste 3: Via aplicação

1. Faça login no sistema
2. Acesse o Dashboard
3. Verifique se os dados carregam sem erros 401/403
4. Abra DevTools (F12) → Console
5. Veja se não há erros de rede

---

## 🔐 Variáveis de Ambiente

Certifique-se de que a Edge Function tenha acesso às variáveis corretas:

### Via CLI:

```bash
# Definir variável
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>

# Listar variáveis
supabase secrets list

# Verificar se foi definida
supabase secrets get SUPABASE_SERVICE_ROLE_KEY
```

### Via Dashboard:

1. Acesse: https://supabase.com/dashboard/project/<PROJECT_ID>/functions/make-server
2. Clique em **"Settings"**
3. Adicione as variáveis:
   - `SUPABASE_SERVICE_ROLE_KEY`: encontre em Settings → API

---

## 📊 Logs da Edge Function

Para ver logs e diagnosticar problemas:

### Via Dashboard:

```
https://supabase.com/dashboard/project/<PROJECT_ID>/functions/make-server/logs
```

### Via CLI:

```bash
# Ver logs em tempo real
supabase functions logs make-server --follow

# Ver últimos 100 logs
supabase functions logs make-server --limit 100
```

---

## 🆘 Se Nada Funcionar

### 1. Verifique a estrutura de arquivos

```
/supabase/
  /functions/
    /server/
      index.tsx       ← Arquivo principal
    /make-server/     ← Deve EXISTIR e apontar para /server/
      index.ts        ← Pode ser um redirect
```

### 2. Verifique o deno.json

```json
{
  "imports": {
    "hono": "jsr:@hono/hono@^4.6",
    "@supabase/supabase-js": "jsr:@supabase/supabase-js@^2"
  }
}
```

### 3. Recreie a Edge Function do zero

```bash
# Deletar function existente (CUIDADO!)
supabase functions delete make-server

# Criar nova
supabase functions new make-server

# Copiar código do /supabase/functions/server/index.tsx para a nova
# Fazer deploy
supabase functions deploy make-server
```

---

## ✅ Checklist Final

- [ ] Supabase CLI instalado e configurado
- [ ] Projeto vinculado com `supabase link`
- [ ] Edge Function deployada com sucesso
- [ ] Health check retorna `{"status":"ok"}`
- [ ] Variáveis de ambiente configuradas
- [ ] Logs não mostram erros críticos
- [ ] Aplicação frontend consegue acessar a API
- [ ] Autenticação JWT funcionando
- [ ] Documentos de mídia carregando

---

## 🎯 Resumo da Solução Mais Rápida

```bash
# 1. Instalar CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Vincular projeto (substitua PROJECT_ID)
supabase link --project-ref <PROJECT_ID>

# 4. Deploy
supabase functions deploy make-server

# 5. Testar
curl https://<PROJECT_ID>.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer <ANON_KEY>"

# 6. ✅ SUCESSO!
```

---

## 📞 Suporte Adicional

Se precisar de ajuda:

1. **Logs do Supabase:** https://supabase.com/dashboard/project/<PROJECT_ID>/logs
2. **Discord do Supabase:** https://discord.supabase.com
3. **Documentação:** https://supabase.com/docs/guides/functions

---

**🎉 Após seguir este guia, seu deploy deve funcionar!**
