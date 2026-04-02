# 🔧 GUIA DE RESOLUÇÃO - ERRO 403 NO DEPLOY DO SUPABASE

## ❌ Erro Atual
```
Error while deploying: XHR for "/api/integrations/supabase/.../deploy" failed with status 403
```

## 🎯 CAUSAS POSSÍVEIS E SOLUÇÕES

### 1️⃣ **VARIÁVEIS DE AMBIENTE NÃO CONFIGURADAS**

O Supabase precisa das seguintes variáveis configuradas:

#### ✅ **Passo 1: Acessar o Dashboard do Supabase**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **API**

#### ✅ **Passo 2: Copiar as Chaves**
Você precisará de:
- `SUPABASE_URL` (Project URL)
- `SUPABASE_ANON_KEY` (anon public)
- `SUPABASE_SERVICE_ROLE_KEY` (service_role - SECRET!)

#### ✅ **Passo 3: Configurar no Figma Make**
1. No Figma Make, clique em **Settings** (⚙️)
2. Vá em **Environment Variables**
3. Adicione cada variável:

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2️⃣ **PROBLEMA DE AUTENTICAÇÃO DO SUPABASE**

#### ✅ **Verificar Status do Projeto**
1. Acesse: https://supabase.com/dashboard
2. Verifique se o projeto está **ativo**
3. Verifique se o plano **Pro** está ativo
4. Vá em **Settings** → **General** → Status

#### ✅ **Regenerar API Keys (se necessário)**
Se as chaves expiraram ou foram revogadas:
1. Vá em **Settings** → **API**
2. Clique em **Regenerate** nas chaves
3. Atualize no Figma Make

---

### 3️⃣ **PERMISSÕES DA EDGE FUNCTION**

#### ✅ **Verificar Permissões do Projeto**
1. Vá em **Settings** → **Edge Functions**
2. Verifique se Edge Functions estão **habilitadas**
3. Verifique se você tem permissão de **deploy**

#### ✅ **Verificar Limites do Plano**
No Plano Pro, você deve ter:
- ✅ Edge Functions ilimitadas
- ✅ Deploy sem restrições
- ✅ Tamanho de função até 20MB

---

### 4️⃣ **PROBLEMAS DE REDE/CORS**

#### ✅ **Verificar Configuração CORS**
1. Vá em **Settings** → **API**
2. Em **CORS Configuration**, adicione:
   ```
   https://your-app.vercel.app
   http://localhost:5173
   ```

#### ✅ **Verificar Domain Allowlist**
1. Vá em **Settings** → **Authentication**
2. Em **Redirect URLs**, adicione:
   ```
   https://your-app.vercel.app/**
   http://localhost:5173/**
   ```

---

### 5️⃣ **CACHE DO SUPABASE**

#### ✅ **Limpar Cache e Redeployar**
1. No Supabase Dashboard:
   - Vá em **Edge Functions**
   - Delete a função `make-server` se existir
   - Aguarde 30 segundos
2. No Figma Make:
   - Faça deploy novamente

---

### 6️⃣ **VERIFICAR LOGS DO SUPABASE**

#### ✅ **Acessar Logs de Deploy**
1. Vá em **Edge Functions** → **make-server**
2. Clique em **Logs**
3. Procure por erros de:
   - `Authentication failed`
   - `Permission denied`
   - `Invalid credentials`

---

## 🚀 SOLUÇÃO RÁPIDA (PASSO A PASSO)

### **Método 1: Reconfigurar Conexão**

1. **No Figma Make:**
   ```
   Settings → Integrations → Supabase → Disconnect
   ```

2. **Aguarde 10 segundos**

3. **Reconectar:**
   ```
   Settings → Integrations → Supabase → Connect
   ```

4. **Fornecer credenciais novamente:**
   - Project URL
   - Anon Key
   - Service Role Key

5. **Tentar deploy novamente**

---

### **Método 2: Verificar Permissões do Usuário**

1. **No Supabase Dashboard:**
   ```
   Settings → Team → Verify your role
   ```

2. **Você deve ser:**
   - ✅ **Owner** ou **Admin**
   - ❌ Se for **Developer** ou **Read-only**, não pode fazer deploy

3. **Solicitar permissões ao Owner se necessário**

---

### **Método 3: Verificar Status do Projeto**

1. **Verificar se o projeto foi pausado:**
   ```
   Settings → General → Project Status
   ```

2. **Se pausado:**
   - Clique em **Restore Project**
   - Aguarde ativação
   - Tente deploy novamente

---

### **Método 4: Criar Nova Edge Function Manualmente**

1. **No Supabase Dashboard:**
   ```
   Edge Functions → New Function → make-server
   ```

2. **Deploy manual via CLI:**
   ```bash
   # Instalar Supabase CLI
   npm install -g supabase
   
   # Login
   supabase login
   
   # Link ao projeto
   supabase link --project-ref seu-projeto-id
   
   # Deploy da função
   supabase functions deploy make-server
   ```

---

## 🔍 CHECKLIST DE DIAGNÓSTICO

Execute estes passos na ordem:

- [ ] Variáveis de ambiente configuradas no Figma Make
- [ ] Projeto Supabase está ativo (não pausado)
- [ ] Plano Pro está ativo e pago
- [ ] Edge Functions habilitadas no projeto
- [ ] Você tem permissão de Owner/Admin
- [ ] API Keys são válidas (não expiradas)
- [ ] CORS configurado corretamente
- [ ] Cache do Supabase limpo
- [ ] Logs do Supabase verificados

---

## 📞 SUPORTE ADICIONAL

Se nenhuma solução acima funcionar:

### **1. Verificar Status do Supabase**
https://status.supabase.com/

### **2. Contatar Suporte do Supabase**
- Email: support@supabase.com
- Discord: https://discord.supabase.com

### **3. Verificar Documentação**
https://supabase.com/docs/guides/functions/deploy

---

## ⚡ SOLUÇÃO ALTERNATIVA (TEMPORÁRIA)

Se o deploy continuar falhando, você pode:

1. **Usar Supabase CLI localmente:**
   ```bash
   supabase functions serve
   ```

2. **Deploy via GitHub Actions:**
   - Configure CI/CD
   - Deploy automático a cada push

3. **Usar outro provider temporariamente:**
   - Vercel Edge Functions
   - Cloudflare Workers
   - AWS Lambda

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Siga o **Método 1** primeiro (mais rápido)
2. ✅ Se não funcionar, tente **Método 2**
3. ✅ Verifique o **Checklist de Diagnóstico**
4. ✅ Consulte os **Logs do Supabase**
5. ✅ Entre em contato com suporte se necessário

---

## 💡 DICA PRO

Configure um webhook de deploy no Supabase:
```
Settings → Webhooks → Add Webhook
Event: function.deployed
```

Isso vai notificar você sobre problemas de deploy em tempo real.

---

**Última atualização:** 23/03/2026  
**Status:** Aguardando resolução do erro 403
