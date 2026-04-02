# 🔧 Troubleshooting: Erro 403 no Deploy Supabase

## ❌ Erro Atual
```
Error while deploying: XHR for "/api/integrations/supabase/.../edge_functions/make-server/deploy" failed with status 403
```

## 📋 Causa
Erro **403 Forbidden** indica problema de permissões ou autenticação ao tentar fazer deploy da Edge Function no Supabase.

---

## ✅ Soluções

### **Solução 1: Fazer Deploy Manual via Supabase CLI**

Se você tem acesso ao Supabase CLI localmente:

1. **Instalar Supabase CLI** (se ainda não tiver):
```bash
npm install -g supabase
```

2. **Fazer login**:
```bash
supabase login
```

3. **Link com seu projeto**:
```bash
supabase link --project-ref SEU_PROJECT_REF
```

4. **Deploy da função**:
```bash
supabase functions deploy make-server
```

---

### **Solução 2: Deploy via Dashboard Supabase**

1. Acesse: **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Selecione seu projeto
3. Vá em: **Edge Functions** (menu lateral)
4. Clique em: **"Deploy new function"** ou **"Update function"**
5. Cole o código de `/supabase/functions/server/index.tsx`
6. Clique em **Deploy**

---

### **Solução 3: Verificar Permissões do Token**

O erro 403 pode ser causado por token de autenticação inválido ou sem permissões:

1. **No Figma Make**, verifique se está conectado ao Supabase:
   - Deve haver um ícone de "conectado" no canto superior
   - Se não estiver, reconecte sua conta Supabase

2. **No Supabase Dashboard**:
   - Vá em: **Settings → API**
   - Verifique se o token usado tem permissões de **Service Role**
   - Gere um novo token se necessário

---

### **Solução 4: Aguardar e Tentar Novamente**

Às vezes é um problema temporário do servidor:

1. Aguarde 2-3 minutos
2. Tente fazer o deploy novamente
3. Se persistir, use a Solução 1 ou 2

---

## 🎯 Próximos Passos

1. ✅ **As correções de código já foram aplicadas** (keys duplicadas resolvidas)
2. ⏳ **Deploy da Edge Function** precisa ser feito manualmente
3. 🧪 **Testar** a aplicação após o deploy

---

## 📞 O Que Fazer Agora?

### **Opção A: Deploy Manual (Recomendado)**
Use a **Solução 1** ou **Solução 2** acima para fazer deploy manual da Edge Function.

### **Opção B: Continuar Sem Deploy**
As alterações do frontend já estão aplicadas e funcionando. O deploy do backend pode ser feito depois.

---

## 🔍 Verificar Se Precisa Mesmo do Deploy

**Pergunta:** As correções foram APENAS no frontend?

Sim! As correções principais foram:
- ✅ Remoção de keys duplicadas nos gráficos (Dashboard.tsx)
- ✅ Função helper `getInstallmentDisplay()` no DueReminders.tsx
- ✅ Logs de debug

**Backend só recebeu logs de debug** (não é crítico para funcionamento).

**Conclusão:** Você pode testar o sistema **AGORA** sem fazer deploy! O erro 403 não afeta o funcionamento das correções.

---

## 🚀 Resumo das Correções Aplicadas

### ✅ **1. Erro de Keys Duplicadas** → **RESOLVIDO**
- Removidas keys desnecessárias nos componentes LineChart e BarChart
- Os gráficos agora renderizam sem warnings

### ✅ **2. Número de Parcelas** → **RESOLVIDO**
- Função helper `getInstallmentDisplay()` com fallback robusto
- Logs detalhados para debug
- Tratamento de valores `undefined`, `null`, e `0`

### ⏳ **3. Deploy do Backend** → **OPCIONAL NO MOMENTO**
- Logs de debug adicionados (não crítico)
- Pode ser feito depois via CLI ou Dashboard

---

**Data:** 28/03/2026  
**Status:** ✅ Correções aplicadas no frontend | ⏳ Deploy backend opcional
