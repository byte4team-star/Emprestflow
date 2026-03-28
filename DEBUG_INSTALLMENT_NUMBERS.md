# 🔍 DEBUG: Números de Parcelas nos Lembretes

## ✅ Correções Aplicadas

### 1. **Backend** (`/supabase/functions/server/index.tsx`)
- ✅ Corrigido linha 1789: `installmentNumber: installment.number` 
- ✅ Corrigido linha 1963: `installmentNumber: installment.number`
- ✅ Adicionado log de debug para ver estrutura do installment

### 2. **Frontend DueReminders** (`/src/app/pages/DueReminders.tsx`)
- ✅ Adicionado função helper `getInstallmentDisplay()` com fallback robusto
- ✅ Adicionado logs detalhados para debug
- ✅ Tratamento para casos onde o número é `undefined`, `null`, ou `0`

### 3. **Frontend Dashboard** (`/src/app/pages/Dashboard.tsx`)
- ✅ Removido o `+ 1` incorreto
- ✅ Exibe diretamente: `{reminder.installmentNumber}/{reminder.totalInstallments}`

---

## 🧪 Como Testar

### **Passo 1: Verificar Logs no Console do Navegador**

Abra a página de Lembretes e veja os logs:

```javascript
// Deve aparecer no console:
[REMINDERS] Carregando lembretes...
[REMINDERS] Resposta da API: {...}
[REMINDERS] Lembretes encontrados: X
[REMINDERS] Lembrete 0: {
  id: "...",
  clientName: "...",
  installmentNumber: 2,           // ← DEVE TER UM NÚMERO AQUI
  totalInstallments: 10,
  tipo_installmentNumber: "number" // ← DEVE SER "number"
}

[INSTALLMENT_DISPLAY] {
  id: "...",
  installmentNumber: 2,            // ← VERIFICAR SE TEM VALOR
  totalInstallments: 10,
  type_number: "number",           // ← DEVE SER "number"
  type_total: "number"
}
```

### **Passo 2: Verificar Logs do Backend (Supabase Logs)**

1. Acesse: **Supabase Dashboard → Edge Functions → Logs**
2. Procure por:

```
[REMINDERS] Installment data: {
  contractId: "contract_xxxxx",
  installment: {
    number: 2,                // ← DEVE EXISTIR
    amount: 1200,
    dueDate: "2026-03-15",
    status: "pending"
  },
  number: 2,                  // ← VALOR DO CAMPO
  installmentNumber: undefined // ← DEVE SER undefined (campo não existe)
}
```

---

## 🐛 Possíveis Problemas e Soluções

### **Problema 1: `installmentNumber` retorna `undefined`**

**Causa:** O contrato foi criado ANTES da correção e não tem o campo `number` nos installments.

**Solução:** Recriar os dados de teste:
1. No Dashboard, clique em **"🔄 Resetar Dados de Teste"**
2. Isso criará novos contratos com a estrutura correta

---

### **Problema 2: `installmentNumber` retorna `0`**

**Causa:** O campo `number` existe mas está como `0` (bug na criação).

**Solução:** Verificar o código de criação de contratos (linhas 1157-1164 do backend):

```typescript
installmentsList.push({
  number: i + 1,  // ← Deve começar em 1, não em 0
  amount: parseFloat(installmentAmount.toFixed(2)),
  dueDate: formattedDueDate,
  status: 'pending',
  paidAt: null,
  paidAmount: null,
});
```

---

### **Problema 3: `tipo_installmentNumber` retorna `"string"` em vez de `"number"`**

**Causa:** O backend está enviando como string.

**Solução:** Forçar conversão no backend (linha 1789):

```typescript
installmentNumber: Number(installment.number) || 0,
```

---

### **Problema 4: Exibe `?/?` na tela**

**Causa:** Tanto `installmentNumber` quanto `totalInstallments` são `0` ou `undefined`.

**Ação:** 
1. Verificar logs do console
2. Verificar se o contrato tem `installments` definido
3. Verificar se o `installmentsList` não está vazio

---

## 📋 Checklist de Verificação

- [ ] Console do navegador mostra `installmentNumber` com valor numérico válido
- [ ] Console do navegador mostra `tipo_installmentNumber: "number"`
- [ ] Logs do Supabase mostram `installment.number` com valor válido
- [ ] Página de Lembretes exibe "Parcela 2/10" corretamente
- [ ] Dashboard exibe "Parcela 2/10" corretamente
- [ ] WhatsApp templates substituem `{parcela}` corretamente

---

## 🔧 Se Ainda Não Funcionar

### **Verificar estrutura do contrato no banco:**

1. Vá para: **Dashboard → Ver Contratos**
2. Clique em um contrato
3. Abra o console do navegador
4. Verifique a estrutura:

```javascript
contract.installmentsList[0]
// Deve mostrar:
{
  number: 1,              // ← DEVE EXISTIR
  amount: 1200,
  dueDate: "2026-03-15",
  status: "pending",
  paidAt: null,
  paidAmount: null
}
```

### **Se o campo `number` NÃO existir:**

O contrato foi criado com versão antiga do código. **Solução:**
1. Resetar dados de teste no Dashboard
2. OU criar um novo contrato manualmente
3. OU rodar script de migração para adicionar o campo `number` aos contratos existentes

---

## 🚀 Próximos Passos

1. **Deploy da Edge Function** atualizada para o Supabase
2. **Testar** a página de Lembretes
3. **Verificar logs** no console e no Supabase
4. **Reportar** os resultados encontrados

---

## 📞 Como Reportar Problemas

Ao reportar, inclua:
1. **Screenshot** da página de Lembretes
2. **Logs do console** do navegador (F12)
3. **Logs do Supabase** (Edge Functions → Logs)
4. **Estrutura do contrato** (via console: `console.log(contract)`)

---

**Última atualização:** 28/03/2026
**Status:** ✅ Correções aplicadas, aguardando deploy e testes
