# 🕐 CORREÇÃO: Problemas de Fuso Horário (Timezone)

## 🐛 Problema Identificado

Quando criamos uma data usando `new Date('2024-03-15')`, o JavaScript interpreta como **meia-noite UTC** e converte para o fuso horário local. Em **UTC-3** (Brasil), isso causa um **retrocesso de 1 dia**:

```javascript
// ❌ ERRADO: Retrocede 1 dia
new Date('2024-03-15')
// → 2024-03-14T21:00:00 (UTC-3)

// ✅ CORRETO: Mantém o dia
new Date('2024-03-15T12:00:00')
// → 2024-03-15T12:00:00 (UTC-3)
```

---

## ✅ Solução Implementada

### **Backend (Edge Functions)**

Criadas **funções helper** para processar datas de forma segura:

#### **1. `parseDateSafe(dateString)`**
Força o horário para **12:00:00** (meio-dia) para evitar retrocesso de dia.

```typescript
function parseDateSafe(dateString: string): Date {
  const dateOnly = dateString.split('T')[0]; // YYYY-MM-DD
  return new Date(`${dateOnly}T12:00:00`); // Força noon
}
```

#### **2. `formatDateBR(dateString)`**
Formata data como **DD/MM/YYYY** sem usar `toLocaleDateString()`.

```typescript
function formatDateBR(dateString: string): string {
  const dateOnly = dateString.split('T')[0]; // YYYY-MM-DD
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
}
```

---

### **Frontend (React Components)**

Criado arquivo utilitário: **`/src/app/lib/date-utils.ts`**

Funções disponíveis:
- ✅ `parseDateSafe(dateString)` - Parse seguro
- ✅ `formatDateBR(dateString)` - Formato DD/MM/YYYY
- ✅ `formatDateTimeBR(dateString)` - Formato DD/MM/YYYY HH:mm
- ✅ `getMonthNameShort(dateString)` - Mês curto (Jan, Fev...)
- ✅ `getMonthNameFull(dateString)` - Mês completo (Janeiro, Fevereiro...)
- ✅ `daysBetween(from, to)` - Diferença de dias
- ✅ `isPast(dateString)` - Verifica se está no passado
- ✅ `isToday(dateString)` - Verifica se é hoje

---

## 📝 Arquivos Corrigidos

### **Backend**

#### **`/supabase/functions/server/index.tsx`**
- ✅ Linhas 45-66: Funções helper adicionadas
- ✅ Linha 1579: `formatDateBR()` em mensagem WhatsApp
- ✅ Linha 1583: `formatDateBR()` em mensagem WhatsApp
- ✅ Linha 1771: `parseDateSafe()` em reminders/due-installments
- ✅ Linha 1897: `parseDateSafe()` em dashboard stats
- ✅ Linha 1906: `parseDateSafe()` em dashboard stats
- ✅ Linha 1946: `parseDateSafe()` em monthly data
- ✅ Linha 1952: `parseDateSafe()` em monthly data
- ✅ Linha 1981: `parseDateSafe()` em dashboard reminders

#### **`/supabase/functions/server/billing_routes.tsx`**
- ✅ Linhas 9-30: Funções helper adicionadas
- ✅ Linha 544: `parseDateSafe()` em /billing/process
- ✅ Linha 575: `formatDateBR()` em template de mensagem
- ✅ Linha 727: `parseDateSafe()` em /billing/upcoming
- ✅ Linha 817: `parseDateSafe()` em cálculo de dias

---

## 🎯 Onde as Funções São Usadas

### **1. Mensagens WhatsApp** 
Variável `{vencimento}` agora formata como **DD/MM/YYYY**:
```
Antes: "05/03/2024" (pode estar errado)
Agora: "15/03/2024" (correto)
```

### **2. Cálculo de Dias Até Vencimento**
```typescript
const dueDate = parseDateSafe(installment.dueDate);
dueDate.setHours(0, 0, 0, 0);
const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
```

### **3. Estatísticas Dashboard**
```typescript
const instDate = parseDateSafe(inst.dueDate);
const instMonthKey = `${instDate.getFullYear()}-${String(instDate.getMonth() + 1).padStart(2, '0')}`;
```

### **4. Rotas de Billing**
- `/billing/process` - Processa envios automáticos
- `/billing/upcoming` - Lista contratos próximos do vencimento

---

## 🧪 Como Testar

### **Teste 1: Verificar Data na Mensagem WhatsApp**

1. Vá para **Lembretes** (`/reminders`)
2. Clique em **"Enviar WhatsApp"** em algum lembrete
3. Verifique se a data está no formato **DD/MM/YYYY**
4. Verifique se o **dia está correto** (não retrocedeu)

**Exemplo esperado:**
```
Olá João! 👋

Lembramos que a parcela 2/10 no valor de R$ 1.200,00 
vence em 3 dias (15/03/2026).    ← DEVE SER DD/MM/YYYY

📝 Contrato: contract_123

Por favor, fique atento ao vencimento!
```

---

### **Teste 2: Verificar Cálculo de Dias**

1. Crie um contrato com vencimento **amanhã**
2. Vá para **Lembretes**
3. Verifique se mostra: **"Faltam 1 dias"**
4. Verifique se o **status** é **"Próximo"** ou **"Vence Hoje"**

---

### **Teste 3: Verificar Dashboard**

1. Vá para **Dashboard** (`/`)
2. Verifique se os gráficos de **Evolução Mensal** estão corretos
3. Verifique se os **Lembretes Recentes** mostram datas corretas

---

## 🚨 Casos de Teste Importantes

### **Cenário 1: Contrato criado com vencimento 15/03/2026**
```
✅ DEVE aparecer como: 15/03/2026
❌ NÃO deve aparecer como: 14/03/2026
```

### **Cenário 2: Parcela vencendo hoje**
```
✅ DEVE calcular: daysUntilDue = 0
✅ DEVE mostrar status: "Vence Hoje"
❌ NÃO deve mostrar: "1 dia de atraso"
```

### **Cenário 3: Parcela vencida há 3 dias**
```
✅ DEVE calcular: daysUntilDue = -3
✅ DEVE mostrar: "3 dias de atraso"
❌ NÃO deve mostrar: "2 dias de atraso"
```

---

## 📊 Impacto das Correções

### **Afetado:**
- ✅ Mensagens WhatsApp (variável `{vencimento}`)
- ✅ Cálculo de dias até vencimento
- ✅ Filtros de lembretes (próximo, hoje, atrasado)
- ✅ Estatísticas do dashboard
- ✅ Gráficos mensais
- ✅ Rotas de billing automático

### **Não Afetado:**
- ✅ Criação de contratos (já estava usando UTC correto)
- ✅ Salvamento de datas no KV Store
- ✅ Pagamento de parcelas

---

## 🔄 Deploy Necessário

Para aplicar as correções, você precisa fazer **deploy** das Edge Functions:

### **Opção 1: Via Supabase CLI**
```bash
supabase functions deploy make-server
```

### **Opção 2: Via Dashboard Supabase**
1. Acesse o **Supabase Dashboard**
2. Vá em **Edge Functions**
3. Selecione **make-server**
4. Clique em **Deploy**

---

## 📚 Documentação Adicional

### **Para desenvolvedores:**

Sempre que precisar processar datas de vencimento:

```typescript
// ❌ EVITE
const dueDate = new Date(installment.dueDate);

// ✅ USE
import { parseDateSafe, formatDateBR } from './date-utils';
const dueDate = parseDateSafe(installment.dueDate);
```

Sempre que precisar exibir datas para o usuário:

```typescript
// ❌ EVITE
new Date(dateString).toLocaleDateString('pt-BR')

// ✅ USE
formatDateBR(dateString)
```

---

## ✅ Checklist de Validação

Após o deploy, verifique:

- [ ] Mensagens WhatsApp mostram data no formato DD/MM/YYYY
- [ ] Data do vencimento está **correta** (não retrocedeu 1 dia)
- [ ] Cálculo de "dias até vencimento" está correto
- [ ] Status dos lembretes (Próximo/Hoje/Atrasado) está correto
- [ ] Dashboard mostra estatísticas corretas
- [ ] Gráficos mensais estão corretos
- [ ] Billing automático processa nas datas certas

---

**Data da Correção:** 28/03/2026  
**Versão:** 2.3.0  
**Status:** ✅ Implementado, aguardando deploy
