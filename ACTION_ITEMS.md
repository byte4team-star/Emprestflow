# ✅ AÇÕES PENDENTES: Resolver Número de Parcelas

## 🎯 Problema Atual
Os números de parcelas **ainda não estão aparecendo** na página de Lembretes e Dashboard.

---

## 🔧 O Que Foi Feito Até Agora

### ✅ **Frontend**
1. Corrigido keys duplicadas nos gráficos (BarChart e LineChart)
2. Criada função helper `getInstallmentDisplay()` com fallback robusto
3. Adicionados logs detalhados no console para debug
4. Removido `+ 1` incorreto no Dashboard

### ✅ **Backend**
1. Corrigido acesso ao campo: `installmentNumber: installment.number`
2. Adicionados logs detalhados no Supabase
3. Código de criação de contratos já estava correto (`number: i + 1`)

---

## 🚨 AÇÃO NECESSÁRIA AGORA

### **Passo 1: Verificar Logs no Console** 🔍

1. Abra o navegador
2. Pressione **F12** (DevTools)
3. Vá na aba **Console**
4. Acesse a página: `/reminders`
5. **PROCURE** por estes logs:

```javascript
[REMINDERS] Resposta da API (JSON stringified): {...}
[REMINDERS] Lembrete 0: {
  installmentNumber: ???,        // ← QUAL VALOR APARECE AQUI?
  tipo_installmentNumber: ???    // ← QUAL TIPO APARECE AQUI?
}
```

### **Passo 2: Identificar o Cenário**

#### **Cenário A:** `installmentNumber: 2` (tem valor numérico)
✅ **BACKEND ESTÁ CORRETO!**  
→ Vá para **Solução A**

#### **Cenário B:** `installmentNumber: undefined`
❌ **CONTRATOS ANTIGOS SEM O CAMPO `number`**  
→ Vá para **Solução B**

#### **Cenário C:** `installmentNumber: 0`
❌ **BUG NA CRIAÇÃO**  
→ Vá para **Solução C**

---

## 💡 SOLUÇÕES

### **Solução A: Backend correto, mas não aparece na tela**

**Problema:** O `getInstallmentDisplay()` está retornando "?/?"

**Causa:** Possível problema de tipo (string vs number)

**Ação:**
```javascript
// Verificar se o problema é conversão de tipo
console.log('[DEBUG]', {
  raw: reminder.installmentNumber,
  converted: Number(reminder.installmentNumber),
  isZero: Number(reminder.installmentNumber) === 0
});
```

**Se `isZero: true`:** O problema é que `Number(undefined)` retorna `0`, então a condição `if (displayNumber === 0)` está pegando valores válidos também.

**Fix:** Mudar a validação para:
```typescript
if (!displayNumber || !displayTotal || displayNumber === 0 || displayTotal === 0) {
  return '?/?';
}
```

---

### **Solução B: Contratos criados antes da correção**

**Problema:** Os contratos existentes não têm o campo `number` nos installments.

**Ação:**

#### **Opção 1 (Mais Rápida): Resetar Dados de Teste**
1. Vá para `/`  (Dashboard)
2. Clique em **"🔄 Resetar Dados de Teste"**
3. Confirme
4. Aguarde criação dos novos dados
5. Teste novamente em `/reminders`

#### **Opção 2: Criar Novo Empréstimo**
1. Vá para `/quick-loan`
2. Crie um empréstimo novo
3. Teste com esse empréstimo

---

### **Solução C: Bug na criação de contratos**

**Problema:** O campo `number` está sendo criado como `0` em vez de `1, 2, 3...`

**Ação:** Verificar o código de criação (linha 1158 do backend):

```typescript
for (let i = 0; i < installments; i++) {
  installmentsList.push({
    number: i + 1,  // ← DEVE COMEÇAR EM 1
    ...
  });
}
```

Se o código estiver correto mas ainda assim criar com `0`, pode ser um problema de **cache** ou **deploy**.

**Fix:**
1. Fazer deploy da Edge Function novamente
2. Limpar cache do Supabase
3. Resetar dados de teste

---

## 📋 CHECKLIST DE DEBUG

Use este checklist para reportar o problema:

- [ ] Logs do console mostram `installmentNumber: ???` (qual valor?)
- [ ] Logs do console mostram `tipo_installmentNumber: ???` (qual tipo?)
- [ ] Se tem valor numérico, aparece na tela ou mostra `?/?`?
- [ ] Testei com dados NOVOS (criados após as correções)?
- [ ] Resetei os dados de teste no Dashboard?
- [ ] Verifiquei os logs do Supabase Edge Functions?

---

## 🎯 PRÓXIMO PASSO

**Por favor, execute o Passo 1** (verificar logs) e **reporte aqui:**

```
Logs encontrados:
- installmentNumber: [VALOR AQUI]
- tipo_installmentNumber: [TIPO AQUI]  
- Aparece na tela: [SIM/NÃO]
- Mostra: [valor exato que aparece, ex: "?/?" ou "2/10"]
```

Com essas informações, poderei identificar exatamente onde está o problema e dar a solução precisa!

---

## 📚 Documentos de Apoio

Criei 3 documentos para ajudar:

1. **`/DEBUG_INSTALLMENT_NUMBERS.md`** - Resumo das correções aplicadas
2. **`/TEST_INSTALLMENT_NUMBERS.md`** - Guia completo de testes passo a passo
3. **`/DEPLOY_TROUBLESHOOTING.md`** - Solução para erro 403 do Supabase
4. **`/ACTION_ITEMS.md`** - Este arquivo (próximas ações)

---

**Data:** 28/03/2026  
**Status:** ⏳ Aguardando verificação dos logs do console
**Prioridade:** 🔴 ALTA - Bloqueia funcionalidade crítica
