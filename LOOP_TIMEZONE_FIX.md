# ✅ CORREÇÃO: Timezone nos Loops de Criação de Parcelas

## 🎯 Problema Identificado

Ao criar parcelas (installments) nos contratos, o código salvava a data como `YYYY-MM-DD` sem especificar horário. Isso causava problemas de timezone ao processar essas datas posteriormente.

**Antes:**
```typescript
const formattedDueDate = `2026-03-15`; // Sem horário
```

**Agora:**
```typescript
const formattedDueDate = `2026-03-15T12:00:00`; // Com horário fixo ao meio-dia
```

---

## 🔧 Correções Aplicadas

### **Arquivo:** `/supabase/functions/server/index.tsx`

#### **1. POST /contracts (Criar Contrato) - Linha ~1166**

**Antes:**
```typescript
const dueDate = new Date(Date.UTC(year, month + i, day));
const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}`;
```

**Depois:**
```typescript
const dueDate = new Date(Date.UTC(year, month + i, day, 12, 0, 0)); // ← Adicionado 12, 0, 0
const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}T12:00:00`; // ← Adicionado T12:00:00
```

**Impacto:** Todos os novos contratos criados terão parcelas com horário fixo.

---

#### **2. PUT /contracts/:id (Atualizar Contrato) - Linha ~1282**

**Antes:**
```typescript
const dueDate = new Date(Date.UTC(year, month + i, day));
const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}`;
```

**Depois:**
```typescript
const dueDate = new Date(Date.UTC(year, month + i, day, 12, 0, 0)); // ← Adicionado 12, 0, 0
const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}T12:00:00`; // ← Adicionado T12:00:00
```

**Impacto:** Contratos atualizados terão parcelas recalculadas com horário fixo.

---

#### **3. POST /quick-loan (Empréstimo Rápido) - Linha ~2387**

**Antes:**
```typescript
const dueDate = new Date(Date.UTC(year, month + i, day));
const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}`;
```

**Depois:**
```typescript
const dueDate = new Date(Date.UTC(year, month + i, day, 12, 0, 0)); // ← Adicionado 12, 0, 0
const formattedDueDate = `${dueDate.getUTCFullYear()}-${String(dueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dueDate.getUTCDate()).padStart(2, '0')}T12:00:00`; // ← Adicionado T12:00:00
```

**Impacto:** Empréstimos rápidos terão parcelas com horário fixo.

---

#### **4. POST /reset-test-data (Resetar Dados de Teste) - Linha ~2610**

**Antes:**
```typescript
const dueDate = new Date(startDate);
dueDate.setMonth(startDate.getMonth() + i - 1);
contract.installmentList.push({
  number: i,
  dueDate: dueDate.toISOString().split('T')[0], // ← Apenas YYYY-MM-DD
  ...
});
```

**Depois:**
```typescript
const dueDate = new Date(startDate);
dueDate.setMonth(startDate.getMonth() + i - 1);
dueDate.setHours(12, 0, 0, 0); // ← Força horário ao meio-dia
contract.installmentList.push({
  number: i,
  dueDate: dueDate.toISOString().split('T')[0] + 'T12:00:00', // ← Adiciona T12:00:00
  ...
});
```

**Impacto:** Dados de teste criados com horário fixo.

---

## 📊 Exemplo Prático

### **Criando contrato com 3 parcelas, primeira vence em 15/03/2026:**

**Antes da correção:**
```json
{
  "installmentsList": [
    { "number": 1, "dueDate": "2026-03-15", ... },
    { "number": 2, "dueDate": "2026-04-15", ... },
    { "number": 3, "dueDate": "2026-05-15", ... }
  ]
}
```

**Depois da correção:**
```json
{
  "installmentsList": [
    { "number": 1, "dueDate": "2026-03-15T12:00:00", ... },
    { "number": 2, "dueDate": "2026-04-15T12:00:00", ... },
    { "number": 3, "dueDate": "2026-05-15T12:00:00", ... }
  ]
}
```

---

## 🧪 Como Testar

### **Teste 1: Criar Novo Contrato**

1. Vá para `/contracts`
2. Clique em **"Novo Contrato"**
3. Preencha os dados:
   - Cliente: Qualquer cliente
   - Valor Total: R$ 10.000
   - Parcelas: 10
   - **Data da 1ª Parcela: 15/03/2026**
4. Salve o contrato
5. **Verifique no backend** (KV Store ou logs):
   ```json
   {
     "dueDate": "2026-03-15T12:00:00"  // ← DEVE ter T12:00:00
   }
   ```

---

### **Teste 2: Empréstimo Rápido**

1. Vá para `/quick-loan`
2. Preencha:
   - Cliente: Criar novo ou existente
   - Valor: R$ 5.000
   - Parcelas: 5
   - **Data da 1ª Parcela: 20/03/2026**
3. Finalize
4. **Verifique** se as parcelas têm `T12:00:00`

---

### **Teste 3: Resetar Dados de Teste**

1. Vá para `/` (Dashboard)
2. Clique em **"🔄 Resetar Dados de Teste"**
3. Confirme
4. **Verifique** se os contratos criados têm `T12:00:00`

---

### **Teste 4: Atualizar Contrato Existente**

1. Vá para `/contracts`
2. Clique em um contrato existente
3. Clique em **"Editar"**
4. Altere o valor ou número de parcelas
5. Salve
6. **Verifique** se as parcelas foram recalculadas com `T12:00:00`

---

## ✅ Benefícios da Correção

### **1. Consistência Total**
Todas as parcelas agora são criadas com o mesmo formato: `YYYY-MM-DDT12:00:00`

### **2. Sem Problemas de Timezone**
Ao usar `parseDateSafe()`, o horário meio-dia garante que o dia nunca retroceda.

**Exemplo:**
```typescript
// Antes (sem T12:00:00)
new Date('2026-03-15')
// → Em UTC-3: 2026-03-14T21:00:00 ❌ (retrocedeu)

// Agora (com T12:00:00)
new Date('2026-03-15T12:00:00')
// → Em UTC-3: 2026-03-15T12:00:00 ✅ (manteve o dia)
```

### **3. Funciona com Funções Helper**
As funções `parseDateSafe()` e `formatDateBR()` agora processam corretamente:

```typescript
const dueDate = parseDateSafe('2026-03-15T12:00:00');
// → Date object correto, sem retrocesso

const formatted = formatDateBR('2026-03-15T12:00:00');
// → "15/03/2026" ✅
```

---

## 🚨 Atenção: Dados Antigos

### **Contratos criados ANTES desta correção:**
- ❌ Ainda têm datas no formato `YYYY-MM-DD` (sem horário)
- ❌ Podem apresentar problemas de timezone ao processar

### **Solução:**
1. **Resetar dados de teste** (recomendado para desenvolvimento)
2. **Criar novos contratos** (em produção)
3. **Migração manual** (script para converter datas antigas)

---

## 📋 Checklist de Validação

Após deploy, verifique:

- [ ] Novos contratos salvam `dueDate: "YYYY-MM-DDT12:00:00"`
- [ ] Empréstimos rápidos salvam com `T12:00:00`
- [ ] Reset de dados cria parcelas com `T12:00:00`
- [ ] Atualização de contratos recalcula com `T12:00:00`
- [ ] Mensagens WhatsApp mostram data correta (DD/MM/YYYY)
- [ ] Cálculo de "dias até vencimento" está correto
- [ ] Lembretes mostram status correto (Próximo/Hoje/Atrasado)

---

## 🔄 Deploy Necessário

Para aplicar as correções:

```bash
supabase functions deploy make-server
```

Ou via Dashboard:
1. Supabase Dashboard → Edge Functions
2. Selecionar **make-server**
3. Clicar em **Deploy**

---

## 📚 Arquivos Relacionados

### **Modificados:**
- ✅ `/supabase/functions/server/index.tsx` (4 loops corrigidos)

### **Criados:**
- ✅ `/LOOP_TIMEZONE_FIX.md` (esta documentação)
- ✅ `/TIMEZONE_FIX.md` (documentação geral)
- ✅ `/TIMEZONE_SUMMARY.md` (resumo executivo)
- ✅ `/src/app/lib/date-utils.ts` (funções helper frontend)

---

**Data da Correção:** 28/03/2026  
**Versão:** 2.3.0  
**Status:** ✅ Implementado  
**Prioridade:** 🔴 CRÍTICA
