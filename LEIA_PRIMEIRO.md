# 🔴 ATENÇÃO - LEIA PRIMEIRO!

## ⚠️ PROBLEMA CRÍTICO CORRIGIDO

O sistema estava calculando **valores TOTALMENTE ERRADOS** nas parcelas dos contratos.

### 📊 Exemplo do Problema:

**Contrato teste:**
- Valor emprestado: R$ 20.000,00
- Taxa de juros: 25%
- Parcelas: 10x

**❌ ANTES (ERRADO):**
- Parcela: ~R$ 5.606,00
- Total a pagar: ~R$ 56.060,00
- **Juros de 180%!!! 😱**

**✅ AGORA (CORRETO):**
- Parcela: R$ 2.500,00
- Total a pagar: R$ 25.000,00
- Juros de 25% (como esperado) ✅

---

## 🎯 O QUE FOI CORRIGIDO

Mudamos o cálculo de **Tabela Price** (juros compostos) para **juros simples**.

### Cálculo Antigo (ERRADO):
```
Sistema usava fórmula Price (banco comercial)
Juros sobre juros → valores absurdos
```

### Cálculo Novo (CORRETO):
```
Valor com juros = Valor × (1 + Taxa)
Parcela = (Valor com juros) ÷ Número de parcelas

Exemplo:
R$ 20.000 × 1,25 = R$ 25.000
R$ 25.000 ÷ 10 = R$ 2.500/parcela
```

---

## 🚨 AÇÃO OBRIGATÓRIA - VOCÊ PRECISA FAZER DEPLOY!

### ⚠️ O código foi corrigido, mas você DEVE fazer deploy manual!

**Por quê?**
- O Figma Make **NÃO TEM PERMISSÃO** para fazer deploy de Edge Functions
- Você receberá **erro 403** se tentar fazer deploy automático
- É necessário deploy **manual via Supabase Dashboard ou CLI**

---

## 🚀 FAÇA O DEPLOY AGORA - 5 MINUTOS

### 📱 Método Mais Fácil: Supabase Dashboard

1. **Abra:** https://supabase.com/dashboard
2. **Entre** no seu projeto de cobrança
3. **Vá em:** Edge Functions → `make-server-bd42bc02` (ou `server`)
4. **Clique:** "Edit Function"
5. **Copie** TODO o conteúdo de: `/supabase/functions/server/index.tsx`
6. **Cole** no editor online (substituindo tudo)
7. **Clique:** "Deploy"
8. **Aguarde** 1-2 minutos

### 💻 Alternativa: Supabase CLI

```bash
cd /caminho/do/projeto
supabase functions deploy server
```

---

## ✅ TESTE APÓS O DEPLOY

1. **Limpe o cache do navegador:**
   - Ctrl + Shift + R (Windows/Linux)
   - Cmd + Shift + R (macOS)

2. **Crie um contrato teste:**
   - Valor: R$ 20.000
   - Parcelas: 10
   - Taxa: 25%

3. **VERIFIQUE:**
   - ✅ Parcela = R$ 2.500 → **Deploy funcionou!**
   - ❌ Parcela = R$ 5.606 → **Deploy não funcionou, tente novamente**

---

## 📚 DOCUMENTAÇÃO DETALHADA

- **`/RESUMO_CORRECAO.md`** → Resumo executivo
- **`/DEPLOY_MANUAL_PASSO_A_PASSO.md`** → Guia visual completo
- **`/CORRECAO_CALCULO_JUROS.md`** → Detalhes técnicos

---

## ⏱️ TEMPO TOTAL ESTIMADO

- Deploy: **5 minutos**
- Teste: **2 minutos**
- **Total: 7 minutos** ⏱️

---

## 🆘 PROBLEMAS?

### "Ainda mostra valor errado"
- Limpe o cache: Ctrl + Shift + R
- Teste em aba anônima
- Aguarde 2-3 minutos após deploy

### "Erro 403"
- Normal! Use o Supabase Dashboard
- NÃO tente fazer deploy via Figma Make

### "Não encontro a função"
- Procure por: `make-server-bd42bc02` ou `server`
- Verifique se está no projeto correto

---

## 🎯 CHECKLIST RÁPIDO

- [ ] Li este documento
- [ ] Abri o Supabase Dashboard
- [ ] Copiei o código de `/supabase/functions/server/index.tsx`
- [ ] Colei no editor online
- [ ] Cliquei em "Deploy"
- [ ] Aguardei 2 minutos
- [ ] Limpei o cache (Ctrl+Shift+R)
- [ ] Testei com contrato de R$ 20k/10x/25%
- [ ] Valor da parcela = R$ 2.500 ✅

---

## ✅ TUDO PRONTO?

Se o teste passou (parcela = R$ 2.500), **parabéns!** 🎉

O sistema agora está calculando corretamente.

---

**📅 Data:** 28/03/2026  
**🔴 Prioridade:** URGENTE - Deploy obrigatório  
**⏱️ Tempo:** 7 minutos  
**✅ Status:** Código corrigido - Aguardando seu deploy
