# 🔧 Correção URGENTE - Cálculo de Juros das Parcelas

## 📋 Resumo do Problema

**O sistema estava salvando valores ERRADOS nas parcelas:**

- ❌ **Antes:** Usava fórmula **Tabela Price** (juros compostos)
- ✅ **Agora:** Usa **juros simples** aplicados ao valor total

### Exemplo Prático

**Contrato:**
- Valor: R$ 20.000,00
- Parcelas: 10x
- Taxa de juros: 25% ao mês

**Cálculo ERRADO (Tabela Price):**
- Parcela ≈ R$ 5.606,00 ❌

**Cálculo CORRETO (Juros Simples):**
- Valor com juros: R$ 20.000 × 1,25 = R$ 25.000
- Parcela: R$ 25.000 ÷ 10 = **R$ 2.500,00** ✅

---

## 🎯 O Que Foi Corrigido

### 1. **Criação de Contratos (POST /contracts)**

```typescript
// ANTES (ERRADO):
const monthlyRate = (interestRate || 20) / 100;
if (monthlyRate > 0 && installments > 1) {
  const factor = Math.pow(1 + monthlyRate, installments);
  installmentAmount = totalAmount * (monthlyRate * factor) / (factor - 1);
} else {
  installmentAmount = totalAmount / installments;
}

// DEPOIS (CORRETO):
const rate = (interestRate || 20) / 100;
const totalWithInterest = totalAmount * (1 + rate);
const installmentAmount = totalWithInterest / installments;
```

### 2. **Atualização de Contratos (PUT /contracts/:id)**

```typescript
// ANTES (ERRADO):
const monthlyRate = contract.interestRate / 100;
if (monthlyRate > 0 && contract.installments > 1) {
  const factor = Math.pow(1 + monthlyRate, contract.installments);
  contract.installmentAmount = contract.totalAmount * (monthlyRate * factor) / (factor - 1);
} else {
  contract.installmentAmount = contract.totalAmount / contract.installments;
}

// DEPOIS (CORRETO):
const rate = contract.interestRate / 100;
const totalWithInterest = contract.totalAmount * (1 + rate);
contract.installmentAmount = totalWithInterest / contract.installments;
```

### 3. **Arredondamento Correto**

Garantido que o valor é sempre arredondado para 2 casas decimais:
```typescript
installmentAmount: parseFloat(installmentAmount.toFixed(2))
```

---

## 🚀 Como Fazer o Deploy da Correção

### ⚠️ IMPORTANTE: Deploy Manual Necessário

O Figma Make **NÃO consegue fazer deploy** de Edge Functions devido ao erro 403.  
Você precisa fazer o deploy **manualmente** via Supabase Dashboard ou CLI.

---

### 📱 **Opção 1: Via Supabase Dashboard (RECOMENDADO)**

1. **Acesse o Supabase Dashboard:**
   - URL: https://supabase.com/dashboard
   - Faça login com sua conta

2. **Selecione o projeto:**
   - Projeto: `emprestflow26` ou seu projeto de cobrança

3. **Navegue até Edge Functions:**
   - Menu lateral → **Edge Functions**
   - Procure pela função **`make-server-bd42bc02`** ou **`server`**

4. **Abra o editor:**
   - Clique na função
   - Clique em **"Edit Function"** ou **"Deploy"**

5. **Copie o código corrigido:**
   - Abra o arquivo local: `/supabase/functions/server/index.tsx`
   - Selecione **TODO o conteúdo** (Ctrl+A)
   - Copie (Ctrl+C)

6. **Cole no editor do Supabase:**
   - Cole o código no editor online (Ctrl+V)
   - Clique em **"Deploy"** ou **"Save & Deploy"**

7. **Aguarde a confirmação:**
   - ✅ "Function deployed successfully!"
   - Aguarde 1-2 minutos para propagação

---

### 💻 **Opção 2: Via Supabase CLI**

**Pré-requisitos:**
- Supabase CLI instalado
- Autenticado no Supabase

**Comandos:**

```bash
# 1. Navegue até a pasta do projeto
cd /caminho/do/seu/projeto

# 2. Certifique-se que está autenticado
supabase login

# 3. Faça o deploy da função
supabase functions deploy server

# 4. Aguarde confirmação
# ✅ Deployed Function server version x.x.x
```

**Instalação do Supabase CLI (se necessário):**

```bash
# Windows (via npm):
npm install -g supabase

# macOS/Linux:
brew install supabase/tap/supabase

# Ou via npm:
npm install -g supabase
```

---

## 🧪 Como Testar Após o Deploy

### ✅ **Teste 1: Criar Novo Contrato**

1. Acesse o sistema: `/contracts/new`

2. Preencha os dados:
   - Cliente: Qualquer cliente
   - **Valor Total:** R$ 20.000,00
   - **Parcelas:** 10
   - **Taxa de Juros:** 25%
   - Primeiro Vencimento: Qualquer data

3. Clique em **"Criar Contrato"**

4. **Verifique o resultado:**
   - ✅ Valor da parcela: **R$ 2.500,00**
   - ✅ Total do contrato: R$ 25.000,00 (10 × R$ 2.500)

### ✅ **Teste 2: Verificar no Console do Navegador**

1. Abra o **Console do Navegador** (F12 → Console)

2. Crie um contrato novo

3. Verifique a mensagem:
   ```javascript
   Dados sendo enviados: {
     totalAmount: 20000,
     installments: 10,
     interestRate: 25,
     firstDueDate: "2026-03-30"
   }
   ```

4. **Resultado esperado:**
   - Parcela calculada: R$ 2.500,00 ✅
   - Nenhum erro no console

### ✅ **Teste 3: Verificar Datas de Vencimento**

As datas devem manter **sempre o mesmo dia** do mês:

- Parcela 1: 30/03/2026 ✅
- Parcela 2: 30/04/2026 ✅
- Parcela 3: 30/05/2026 ✅
- Parcela 4: 30/06/2026 ✅
- ...e assim por diante

---

## 📊 Comparação: Antes vs Depois

| Item | Antes (ERRADO) | Depois (CORRETO) |
|------|----------------|------------------|
| **Fórmula** | Tabela Price (juros compostos) | Juros simples |
| **Exemplo 1** | R$ 20.000 × 10 × 25% = R$ 5.606/parcela | R$ 20.000 × 1,25 ÷ 10 = R$ 2.500/parcela |
| **Exemplo 2** | R$ 10.000 × 12 × 20% = R$ 1.333/parcela | R$ 10.000 × 1,20 ÷ 12 = R$ 1.000/parcela |
| **Total a pagar** | Muito maior (juros compostos) | Valor correto (juros simples) |

---

## ⚠️ Contratos Existentes

### **Contratos antigos NÃO são recalculados automaticamente**

- Os contratos já criados **mantêm** os valores antigos (errados)
- Apenas **novos contratos** usarão o cálculo correto

### **Como Recalcular Contratos Existentes:**

1. Abra o contrato na interface
2. Clique em **"Editar"**
3. Ajuste algum valor (ou mantenha igual)
4. Clique em **"Salvar"**
5. ✅ O sistema recalcula com a fórmula correta

---

## 🔍 Verificação de Logs (Opcional)

Se você tem acesso ao Supabase CLI, pode ver os logs em tempo real:

```bash
# Ver logs da função
supabase functions logs make-server-bd42bc02 --tail

# Ou, se o nome for diferente:
supabase functions logs server --tail
```

**O que você deve ver:**
```
[CONTRACT_CREATE] Creating new contract...
[CONTRACT_CREATE] Installment calculation: 20000 * 1.25 / 10 = 2500.00
[CONTRACT_CREATE] ✅ Contract created successfully
```

---

## 🆘 Solução de Problemas

### ❓ **"Deploy feito mas ainda mostra valor errado"**

1. **Limpe o cache do navegador:**
   - Pressione: **Ctrl + Shift + R** (Windows/Linux)
   - Ou: **Cmd + Shift + R** (macOS)

2. **Teste em aba anônima:**
   - Ctrl + Shift + N (Chrome)
   - Ctrl + Shift + P (Firefox)

3. **Aguarde 2-3 minutos:**
   - O deploy pode levar alguns minutos para propagar

### ❓ **"Como saber se o deploy funcionou?"**

1. Acesse o Supabase Dashboard
2. Edge Functions → sua função
3. Verifique a **data da última atualização**
4. Deve mostrar a data/hora de hoje

### ❓ **"Erro 403 ao tentar fazer deploy"**

- ✅ **Normal!** O Figma Make não tem permissão para fazer deploy
- Use o **Supabase Dashboard** (Opção 1) ou **Supabase CLI** (Opção 2)

---

## ✅ Checklist de Conclusão

Marque cada item após completar:

- [ ] Deploy da Edge Function realizado (via Dashboard ou CLI)
- [ ] Aguardado 2-3 minutos para propagação
- [ ] Cache do navegador limpo (Ctrl+Shift+R)
- [ ] Teste 1 realizado: Novo contrato criado
- [ ] Teste 2 realizado: Valor da parcela = R$ 2.500,00
- [ ] Teste 3 realizado: Datas mantêm o mesmo dia
- [ ] Console do navegador sem erros
- [ ] Contratos antigos (se necessário) recalculados via edição

---

## 📞 Suporte Adicional

Se ainda houver problemas após seguir todos os passos:

1. Verifique os **logs do navegador** (F12 → Console)
2. Verifique os **logs do Supabase** (Dashboard → Logs)
3. Confirme que o **deploy foi bem-sucedido** (Dashboard → Edge Functions)
4. Teste em **outro navegador** ou **dispositivo**

---

**Data da Correção:** 28/03/2026  
**Arquivos Modificados:** `/supabase/functions/server/index.tsx`  
**Status:** ✅ **CÓDIGO CORRIGIDO - AGUARDANDO DEPLOY MANUAL**

**⚠️ AÇÃO NECESSÁRIA:** Você precisa fazer o **deploy manual** via Supabase Dashboard ou CLI.
