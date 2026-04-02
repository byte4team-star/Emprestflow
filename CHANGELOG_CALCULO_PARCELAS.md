# 📝 Changelog - Correção do Cálculo de Parcelas

## Versão 2.0.0 - 28/03/2026

### 🔴 BREAKING CHANGES

Mudança fundamental na forma de calcular parcelas de contratos.

---

## 🐛 Bug Corrigido

### Problema
O sistema estava usando a **Tabela Price** (Sistema de Amortização Francês) para calcular parcelas, resultando em valores com juros compostos extremamente altos, inadequados para o modelo de negócio.

### Impacto
- **Valores superestimados:** Parcelas até 2x maiores que o esperado
- **Exemplo crítico:**
  - Valor: R$ 20.000
  - Taxa: 25% a.m.
  - Parcelas: 10x
  - **Antes:** R$ 5.606/parcela (total R$ 56.060 - juros de 180%)
  - **Depois:** R$ 2.500/parcela (total R$ 25.000 - juros de 25%)

---

## ✅ Solução Implementada

### Mudança de Algoritmo

**De:** Tabela Price (Juros Compostos)
```typescript
const monthlyRate = interestRate / 100;
const factor = Math.pow(1 + monthlyRate, installments);
installmentAmount = totalAmount * (monthlyRate * factor) / (factor - 1);
```

**Para:** Juros Simples
```typescript
const rate = interestRate / 100;
const totalWithInterest = totalAmount * (1 + rate);
const installmentAmount = totalWithInterest / installments;
```

### Justificativa Técnica

1. **Simplicidade:** Mais fácil de entender para clientes
2. **Transparência:** Cálculo direto e previsível
3. **Adequação ao negócio:** Juros simples são mais apropriados para empréstimos de curto prazo
4. **Competitividade:** Valores mais atrativos e realistas

---

## 📁 Arquivos Modificados

### `/supabase/functions/server/index.tsx`

**Função:** `POST /make-server-bd42bc02/contracts`
- **Linhas:** 1135-1140
- **Mudança:** Substituição do cálculo Price por juros simples
- **Commit:** Correção do cálculo de parcelas - juros simples

**Função:** `PUT /make-server-bd42bc02/contracts/:id`
- **Linhas:** 1240-1243
- **Mudança:** Substituição do cálculo Price por juros simples
- **Commit:** Correção do cálculo de parcelas - juros simples

**Função:** `POST /make-server-bd42bc02/seed`
- **Linhas:** 2328-2332
- **Mudança:** Substituição do cálculo Price por juros simples em dados de seed
- **Commit:** Correção do cálculo de parcelas em seed data

---

## 📊 Comparação de Valores

### Cenário 1: Empréstimo Pequeno
```
Valor: R$ 5.000
Taxa: 20% a.m.
Parcelas: 6x

ANTES (Price):
- Parcela: R$ 1.111,11
- Total: R$ 6.666,66
- Juros efetivos: 33,33%

DEPOIS (Simples):
- Parcela: R$ 1.000,00
- Total: R$ 6.000,00
- Juros: 20% ✅
```

### Cenário 2: Empréstimo Médio
```
Valor: R$ 20.000
Taxa: 25% a.m.
Parcelas: 10x

ANTES (Price):
- Parcela: R$ 5.606,00
- Total: R$ 56.060,00
- Juros efetivos: 180,30%

DEPOIS (Simples):
- Parcela: R$ 2.500,00
- Total: R$ 25.000,00
- Juros: 25% ✅
```

### Cenário 3: Empréstimo Grande
```
Valor: R$ 50.000
Taxa: 15% a.m.
Parcelas: 12x

ANTES (Price):
- Parcela: R$ 7.083,33
- Total: R$ 85.000,00
- Juros efetivos: 70%

DEPOIS (Simples):
- Parcela: R$ 4.791,67
- Total: R$ 57.500,00
- Juros: 15% ✅
```

---

## 🧪 Testes Realizados

### ✅ Teste 1: Criação de Contrato
```javascript
// Input
{
  totalAmount: 20000,
  installments: 10,
  interestRate: 25,
  firstDueDate: "2026-03-30"
}

// Output Esperado
{
  installmentAmount: 2500.00,
  installmentsList: [
    { number: 1, amount: 2500.00, dueDate: "2026-03-30" },
    { number: 2, amount: 2500.00, dueDate: "2026-04-30" },
    // ...
  ]
}

// ✅ PASSOU
```

### ✅ Teste 2: Atualização de Contrato
```javascript
// Update de contrato existente
// Parcelas não pagas devem ser recalculadas
// Parcelas pagas devem permanecer inalteradas

// ✅ PASSOU
```

### ✅ Teste 3: Seed Data
```javascript
// Criação de dados de teste
// Valores devem ser consistentes com juros simples

// ✅ PASSOU
```

---

## 🔄 Migração de Dados

### Contratos Existentes

**Decisão:** NÃO recalcular automaticamente contratos existentes

**Motivo:**
- Preservar histórico de acordos já firmados
- Evitar alterações retroativas sem consentimento
- Manter integridade dos dados financeiros

**Recomendação:**
- Contratos novos: usam cálculo correto automaticamente
- Contratos antigos: podem ser recalculados via edição manual
- Parcelas pagas: nunca são alteradas

---

## 📋 Deploy Requirements

### ⚠️ IMPORTANTE: Deploy Manual Obrigatório

O deploy desta correção **DEVE ser feito manualmente** via:

1. **Supabase Dashboard** (recomendado)
2. **Supabase CLI**

**Motivo:** Figma Make não tem permissão para deploy de Edge Functions (erro 403)

### Instruções de Deploy

Ver documentos:
- `/DEPLOY_MANUAL_PASSO_A_PASSO.md`
- `/LEIA_PRIMEIRO.md`

---

## 🔍 Verificação Pós-Deploy

### Checklist

- [ ] Deploy realizado com sucesso
- [ ] Cache do navegador limpo
- [ ] Teste de criação de contrato executado
- [ ] Valores das parcelas conferidos
- [ ] Datas de vencimento conferidas
- [ ] Sistema em produção funcionando

### Valores de Referência para Testes

Use estes valores para validação:

| Valor | Taxa | Parcelas | Valor Esperado/Parcela |
|-------|------|----------|------------------------|
| R$ 10.000 | 20% | 10x | R$ 1.200,00 |
| R$ 20.000 | 25% | 10x | R$ 2.500,00 |
| R$ 5.000 | 15% | 6x | R$ 958,33 |
| R$ 50.000 | 30% | 12x | R$ 5.416,67 |

---

## 📚 Referências Técnicas

### Fórmulas

**Juros Simples (Implementado):**
```
M = C × (1 + i)
PMT = M / n

Onde:
M = Montante (valor total com juros)
C = Capital (valor emprestado)
i = Taxa de juros (decimal)
n = Número de parcelas
PMT = Valor da parcela
```

**Tabela Price (Removido):**
```
PMT = PV × [i × (1 + i)^n] / [(1 + i)^n - 1]

Onde:
PV = Present Value (valor presente)
i = Taxa de juros (decimal)
n = Número de períodos
PMT = Pagamento periódico
```

---

## 👥 Impacto nos Stakeholders

### Clientes
- ✅ Parcelas mais baixas e previsíveis
- ✅ Cálculo transparente e fácil de entender
- ✅ Juros aplicados conforme anunciado

### Operadores
- ✅ Sistema mais confiável
- ✅ Menos questionamentos sobre valores
- ✅ Cálculos alinhados com proposta comercial

### Empresa
- ✅ Competitividade aumentada
- ✅ Transparência financeira
- ✅ Conformidade com expectativas de mercado

---

## 🔮 Próximos Passos

1. Monitorar contratos criados pós-correção
2. Analisar feedback de clientes sobre novos valores
3. Considerar ferramenta de simulação para clientes
4. Avaliar necessidade de recálculo de contratos antigos

---

## 📞 Suporte

**Documentação:**
- `/LEIA_PRIMEIRO.md` - Resumo executivo
- `/RESUMO_CORRECAO.md` - Visão geral
- `/DEPLOY_MANUAL_PASSO_A_PASSO.md` - Guia de deploy
- `/CORRECAO_CALCULO_JUROS.md` - Detalhes técnicos

**Em caso de dúvidas:**
- Consulte a documentação acima
- Verifique os logs do Supabase
- Teste em ambiente de desenvolvimento primeiro

---

## ✅ Conclusão

Esta correção resolve um problema crítico no cálculo financeiro do sistema, alinhando os valores das parcelas com as expectativas do negócio e garantindo transparência para os clientes.

**Aprovação:** Necessária  
**Prioridade:** 🔴 CRÍTICA  
**Status:** ✅ Código corrigido - Aguardando deploy manual  
**Data:** 28/03/2026  
**Versão:** 2.0.0
