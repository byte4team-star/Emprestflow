# 🔧 Como Resolver Erro 403 no Deploy da Edge Function

## ❌ Erro Encontrado
```
Error while deploying: XHR for "/api/integrations/supabase/.../edge_functions/make-server/deploy" failed with status 403
```

## 🔍 Causa do Problema
O erro **403 (Forbidden)** ocorre porque:
- ❌ O Figma Make **não tem permissão** para fazer deploy direto via interface
- ❌ A Edge Function precisa ser deployada via **Supabase CLI** ou **Dashboard do Supabase**
- ⚠️ Este é um **comportamento esperado** e não é um bug

---

## ✅ SOLUÇÃO 1: Via Supabase CLI (Recomendado)

### **Pré-requisitos:**
```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase
```

### **Passo a Passo:**
```bash
# 1. Navegue até a pasta do projeto
cd /caminho/do/seu/projeto

# 2. Faça login no Supabase (primeira vez)
supabase login

# 3. Linke o projeto (primeira vez)
supabase link --project-ref SEU_PROJECT_ID

# 4. Deploy da função corrigida
supabase functions deploy server

# 5. Aguarde confirmação
# ✅ Deployed Function server with version XXX
```

### **Encontrar seu Project ID:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **General**
4. Copie o **Reference ID**

---

## ✅ SOLUÇÃO 2: Via Dashboard do Supabase

### **Passo a Passo:**

1. **Acesse o Dashboard:**
   - URL: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione o Projeto:**
   - Clique no projeto correto

3. **Abra Edge Functions:**
   - Menu lateral → **Edge Functions**
   - Você verá a lista de funções

4. **Encontre a função "server":**
   - Clique na função **"server"** (ou **"make-server"**)

5. **Edite a Função:**
   - Clique em **"Edit Function"** ou **"Update"**

6. **Cole o Código Corrigido:**
   - Abra o arquivo `/supabase/functions/server/index.tsx` no seu projeto
   - **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
   - **Cole no editor** do Supabase Dashboard

7. **Deploy:**
   - Clique em **"Deploy"** ou **"Save"**
   - Aguarde a confirmação: ✅ "Function deployed successfully"

8. **Verifique:**
   - Vá em **Logs** para ver se está funcionando
   - Ou teste criando um contrato no sistema

---

## ✅ SOLUÇÃO 3: Via GitHub Actions (CI/CD)

Se você usa versionamento com GitHub:

### **Criar arquivo `.github/workflows/deploy.yml`:**
```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Deploy to Supabase
        run: supabase functions deploy server
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

### **Configurar Secrets no GitHub:**
1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Adicione:
   - `SUPABASE_ACCESS_TOKEN`: Token de acesso do Supabase
   - `SUPABASE_PROJECT_ID`: ID do seu projeto

---

## 🧪 Como Testar Após Deploy

### **1. Teste via Logs:**
```bash
# Acompanhe os logs em tempo real
supabase functions logs server --tail
```

### **2. Teste criando um Contrato:**
1. Acesse seu sistema
2. Vá em **Contratos** → **Novo Contrato**
3. Preencha:
   - Valor: R$ 20.000
   - Parcelas: 10
   - Data: 30/03/2026
   - Taxa: 25%
4. Clique em **Salvar**
5. Verifique se:
   - ✅ Parcelas: R$ 2.500,00 cada
   - ✅ Datas: 30/03, 30/04, 30/05... (sempre dia 30)

### **3. Teste via cURL:**
```bash
curl -X GET \
  https://SEU_PROJECT_REF.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-28T...",
  "version": "2.1.1"
}
```

---

## 📋 Checklist de Deploy

- [ ] Deploy realizado via CLI ou Dashboard
- [ ] Aguardado 1-2 minutos para propagação
- [ ] Logs verificados (sem erros)
- [ ] Cache do navegador limpo (Ctrl+Shift+R)
- [ ] Teste de criação de contrato realizado
- [ ] Valores e datas conferidos
- [ ] Sistema funcionando normalmente

---

## ⚠️ Erros Comuns

### **1. "Command not found: supabase"**
```bash
# Instale o CLI
npm install -g supabase

# Ou use npx
npx supabase functions deploy server
```

### **2. "Not logged in"**
```bash
supabase login
```

### **3. "Project not linked"**
```bash
supabase link --project-ref SEU_PROJECT_ID
```

### **4. "Permission denied"**
- Verifique se você é **Owner** ou **Admin** do projeto no Supabase
- Gere um novo **Access Token** em: https://supabase.com/dashboard/account/tokens

---

## 📞 Se Ainda Houver Problemas

### **Verifique:**
1. ✅ Você tem permissão de **Admin** no projeto Supabase?
2. ✅ O arquivo `/supabase/functions/server/index.tsx` existe?
3. ✅ O código não tem erros de sintaxe?

### **Alternativa de Emergência:**
Se **nada funcionar**, você pode:
1. Criar uma **nova Edge Function** no Dashboard do Supabase
2. Copiar o conteúdo de `/supabase/functions/server/index.tsx`
3. Atualizar o endpoint no frontend

---

## ✅ Status Atual

### **Correções Implementadas:**
- ✅ Frontend: Dados enviados corretamente
- ✅ Backend: Cálculo de parcelas corrigido
- ✅ Backend: Datas sem problema de timezone
- ✅ Frontend: Warnings de React corrigidos (duplicate keys)

### **Pendente:**
- ⏳ **Deploy da Edge Function** no Supabase (via CLI ou Dashboard)

---

**Data:** 28/03/2026  
**Arquivos Modificados:**
- `/supabase/functions/server/index.tsx` (correção backend)
- `/src/app/pages/Dashboard.tsx` (correção warnings React)
- `/src/app/pages/ContractForm.tsx` (conversão de dados)
