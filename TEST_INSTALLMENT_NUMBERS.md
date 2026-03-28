# 🧪 TESTE: Verificar Números de Parcelas

## 🎯 Objetivo
Verificar se o campo `installment.number` existe nos contratos e está sendo enviado corretamente pela API.

---

## 📋 Passo a Passo para Testar

### **1. Abra o Console do Navegador**
- Pressione `F12` ou clique com botão direito → Inspecionar
- Vá na aba **Console**

### **2. Acesse a Página de Lembretes**
- Vá para: `/reminders`
- Aguarde carregar

### **3. Verifique os Logs**

Você deve ver logs como:

```javascript
[REMINDERS] Carregando lembretes...
[REMINDERS] Resposta da API: {...}
[REMINDERS] Resposta da API (JSON stringified): {
  "reminders": [
    {
      "id": "contract_123-2",
      "clientName": "João Silva",
      "installmentNumber": 2,           // ← TEM VALOR?
      "totalInstallments": 10,
      "... outros campos"
    }
  ]
}
[REMINDERS] Lembretes encontrados: 1
[REMINDERS] Lembrete 0: {
  "id": "contract_123-2",
  "clientName": "João Silva",
  "installmentNumber": 2,              // ← TEM VALOR?
  "totalInstallments": 10,
  "tipo_installmentNumber": "number",  // ← DEVE SER "number"
  "raw_object": {...}
}
```

---

## ✅ Cenário 1: installmentNumber TEM VALOR

Se você ver:
```javascript
installmentNumber: 2
tipo_installmentNumber: "number"
```

**✅ ESTÁ CORRETO!** O backend está enviando os dados corretamente.

**Próxima ação:** Verificar se está aparecendo na tela. Se não aparecer, o problema é no componente de renderização.

---

## ❌ Cenário 2: installmentNumber é `undefined`

Se você ver:
```javascript
installmentNumber: undefined
tipo_installmentNumber: "undefined"

⚠️ ENCONTRADO INSTALLMENT NUMBER UNDEFINED/NULL!
```

**❌ PROBLEMA NO BACKEND!** O campo `installment.number` não existe nos dados.

**Possíveis causas:**
1. Contratos criados com versão antiga do código (antes da correção)
2. Campo `number` não foi salvo no KV Store

**Solução:**
1. **Opção A (Recomendada):** Resetar dados de teste
   - Dashboard → Botão "🔄 Resetar Dados de Teste"
   - Isso criará novos contratos com estrutura correta

2. **Opção B:** Criar novo empréstimo manualmente
   - Use ⚡ Empréstimo Rápido
   - O novo contrato terá a estrutura correta

---

## ❌ Cenário 3: installmentNumber é `0`

Se você ver:
```javascript
installmentNumber: 0
tipo_installmentNumber: "number"
```

**❌ PROBLEMA NA CRIAÇÃO!** O número está zerado.

**Solução:** Verificar o código de criação de contratos (linha 1158 do backend):
```typescript
installmentsList.push({
  number: i + 1,  // ← Deve começar em 1
  ...
});
```

---

## 🔍 Verificação Adicional: Ver Estrutura do Contrato

### **No Console do Navegador:**

1. Vá para: `/contracts`
2. Clique em qualquer contrato
3. Abra o console e digite:

```javascript
// Isso mostrará a estrutura interna do contrato
// (Só funciona se o componente expor os dados)
```

OU:

1. Vá para: `/contracts/{contractId}` (substitua {contractId} pelo ID real)
2. Abra **Network Tab** (F12 → Network)
3. Recarregue a página
4. Procure pela requisição para `/contracts/{contractId}`
5. Clique nela → **Preview** ou **Response**
6. Expanda `contract.installmentsList[0]`
7. Verifique se tem o campo `number`:

```json
{
  "number": 1,              // ← DEVE EXISTIR
  "amount": 1200,
  "dueDate": "2026-03-15",
  "status": "pending",
  "paidAt": null,
  "paidAmount": null
}
```

---

## 🚨 Se NÃO Tiver o Campo `number`

### **Seus contratos foram criados ANTES da correção!**

**Soluções:**

### **1. Resetar Dados de Teste (Mais Rápido)**
```
1. Dashboard → Botão "🔄 Resetar Dados de Teste"
2. Confirmar
3. Aguardar criação dos novos dados
4. Testar novamente
```

### **2. Criar Novo Empréstimo**
```
1. Ir para ⚡ Empréstimo Rápido
2. Criar um novo empréstimo
3. Testar com esse empréstimo novo
```

### **3. Migração Manual (Avançado)**
Você precisaria criar um script de migração para adicionar o campo `number` aos installments existentes.

---

## 📊 Logs do Backend (Supabase)

Para ver os logs do backend:

1. Acesse: **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Selecione seu projeto
3. Vá em: **Edge Functions** → **make-server** → **Logs**
4. Procure por:

```
[REMINDERS] Installment data: {
  "contractId": "contract_xxxxx",
  "installment": {
    "number": 2,           // ← DEVE EXISTIR
    "amount": 1200,
    "dueDate": "2026-03-15"
  },
  "number": 2,
  "installmentNumber": undefined
}

[REMINDERS] Total reminders before sorting: 3
[REMINDERS] Reminder 0: {
  "id": "contract_123-2",
  "installmentNumber": 2,  // ← VERIFICAR VALOR
  "totalInstallments": 10,
  "typeof_installmentNumber": "number"
}
```

---

## 🎯 Resultado Esperado

**Na tela de Lembretes, você deve ver:**

```
Contrato #123 • Parcela 2/10
```

**NÃO deve ver:**
```
Contrato #123 • Parcela ?/?
Contrato #123 • Parcela 0/10
Contrato #123 • Parcela undefined/10
```

---

## 📞 Reporte Seu Resultado

Após testar, reporte o que você viu:

### **Opção 1: Funcionou ✅**
```
"Está aparecendo 'Parcela 2/10' corretamente!"
```

### **Opção 2: installmentNumber é undefined ❌**
```
"No console aparece: installmentNumber: undefined"
```
**→ Precisamos resetar os dados**

### **Opção 3: installmentNumber é 0 ❌**
```
"No console aparece: installmentNumber: 0"
```
**→ Há um bug na criação dos contratos**

### **Opção 4: Aparece ?/? na tela ❌**
```
"No console o valor está correto, mas na tela aparece ?/?"
```
**→ Problema na função getInstallmentDisplay**

---

**Data:** 28/03/2026  
**Status:** 🧪 Aguardando testes com logs detalhados
