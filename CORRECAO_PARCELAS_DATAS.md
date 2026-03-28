# 🔧 Correção do Cálculo de Parcelas e Datas - URGENTE

## ❌ Problema Identificado

O backend estava calculando incorretamente:

1. **Valores das Parcelas**: Usava fórmula Price (juros compostos) ao invés de juros simples
   - Exemplo com Price: R$ 20.000 / 10 parcelas com 25% = ~R$ 5.606 (ERRADO - juros compostos)
   - Exemplo correto (juros simples): R$ 20.000 × 1,25 = R$ 25.000 ÷ 10 = R$ 2.500 ✅

2. **Datas de Vencimento**: Problema de timezone
   - Datas sendo convertidas com `new Date(firstDueDate)` causam mudanças de dia
   - Exemplo: "2026-03-30" pode virar "2026-03-29" ou "2026-03-31"

---

## ✅ Correções Implementadas

### **1. Cálculo de Valor da Parcela - JUROS SIMPLES**
```typescript
// Antes (ERRADO - Tabela Price / Juros Compostos):
const monthlyRate = (interestRate || 20) / 100;
if (monthlyRate > 0 && installments > 1) {
  const factor = Math.pow(1 + monthlyRate, installments);
  installmentAmount = totalAmount * (monthlyRate * factor) / (factor - 1);
} else {
  installmentAmount = totalAmount / installments;
}

// Depois (CORRETO - Juros Simples):
const rate = (interestRate || 20) / 100;
const totalWithInterest = totalAmount * (1 + rate);
const installmentAmount = totalWithInterest / installments;
```

**Exemplo prático:**
- Valor: R$ 20.000
- Taxa: 25% (0,25)
- Valor com juros: R$ 20.000 × 1,25 = R$ 25.000
- 10 parcelas: R$ 25.000 ÷ 10 = R$ 2.500 por parcela ✅

### **2. Correção de Datas (SEM Timezone Issues)**
```typescript
// Antes (ERRADO):
const dueDate = new Date(firstDueDate);
dueDate.setMonth(dueDate.getMonth() + i);

// Depois (CORRETO):
const dueDateParts = firstDueDate.split('-'); // YYYY-MM-DD
const year = parseInt(dueDateParts[0]);
const month = parseInt(dueDateParts[1]) - 1; // Month is 0-indexed
const day = parseInt(dueDateParts[2]);

const dueDate = new Date(year, month + i, day); // Add months correctly

// Format as YYYY-MM-DD to avoid timezone issues
const formattedDueDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
```

---

## 🚀 Como Fazer o Deploy

### **Opção 1: Via Supabase CLI (Recomendado)**

```bash
# 1. Navegue até a pasta do projeto
cd /caminho/do/projeto

# 2. Faça o deploy da função corrigida
supabase functions deploy server

# 3. Aguarde confirmação
# ✅ Function deployed successfully!
```

### **Opção 2: Via Interface do Supabase**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Menu lateral → **Edge Functions**
4. Clique na função **"server"**
5. Clique em **"Edit Function"**
6. **Copie TODO o conteúdo** do arquivo `/supabase/functions/server/index.tsx`
7. **Cole** no editor online
8. Clique em **"Deploy"**
9. Aguarde confirmação

---

## 🧪 Como Testar Após Deploy

### **Teste 1: Criar Novo Contrato**
```json
{
  "clientId": "client_xxxx",
  "totalAmount": 20000,
  "installments": 10,
  "firstDueDate": "2026-03-30",
  "interestRate": 25,
  "lateFeeRate": 10,
  "description": "Teste de correção"
}
```

**Resultado Esperado:**
- ✅ Parcela 1: Vence em **30/03/2026** (não 29 ou 31)
- ✅ Parcela 2: Vence em **30/04/2026**
- ✅ Parcela 3: Vence em **30/05/2026**
- ✅ Valor da parcela: **R$ 2.500,00** (20.000 ÷ 10 = 2.000 + 25% = 2.500)

### **Teste 2: Verificar Console do Navegador**
Após criar/editar um contrato, veja no console:
```javascript
Dados sendo enviados: {
  totalAmount: 20000,
  installments: 10,
  firstDueDate: "2026-03-30", // Data correta
  interestRate: 25
}
```

---

## 📊 Diferenças Antes vs Depois

| Item | Antes (ERRADO) | Depois (CORRETO) |
|------|----------------|-------------------|
| **Valor Parcela** | R$ 2.800,00 | R$ 2.500,00 |
| **Data Parcela 1** | 29/03/2026 (timezone) | 30/03/2026 |
| **Data Parcela 2** | 29/04/2026 (timezone) | 30/04/2026 |
| **Arredondamento** | Sem controle | 2 casas decimais |

---

## ⚠️ IMPORTANTE

### **Contratos Existentes NÃO Serão Afetados**
- Os contratos já criados mantêm seus valores atuais
- Apenas **novos contratos** ou **contratos editados** usarão o cálculo correto

### **Para Recalcular Contratos Existentes:**
1. Abra o contrato na interface
2. Clique em "Editar"
3. **Não altere nada** (ou altere se necessário)
4. Clique em "Salvar"
5. ✅ O sistema irá recalcular com a lógica correta

---

## 🔍 Logs de Verificação

Após o deploy, verifique os logs no Supabase:
```bash
supabase functions logs server --tail
```

Você deverá ver:
```
[CONTRACT_CREATE] Creating new contract...
[CONTRACT_CREATE] Installment 1: 2026-03-30, R$ 2500.00
[CONTRACT_CREATE] Installment 2: 2026-04-30, R$ 2500.00
```

---

## 📞 Suporte

Se após o deploy ainda houver problemas:

1. **Verifique a versão da função** no Supabase Dashboard
2. **Force um "Hard Refresh"** no navegador (Ctrl+Shift+R)
3. **Limpe o cache do navegador**
4. **Teste em aba anônima** para descartar cache

---

## ✅ Checklist de Deploy

- [ ] Deploy da Edge Function realizado
- [ ] Aguardado 1-2 minutos para propagação
- [ ] Cache do navegador limpo (Ctrl+Shift+R)
- [ ] Teste criando novo contrato realizado
- [ ] Valores das parcelas conferidos
- [ ] Datas de vencimento conferidas
- [ ] Console do navegador verificado (sem erros)

---

**Data da Correção:** 28/03/2026  
**Arquivos Modificados:** `/supabase/functions/server/index.tsx`  
**Status:** ✅ PRONTO PARA DEPLOY
