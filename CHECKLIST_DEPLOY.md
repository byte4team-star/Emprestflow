# ✅ CHECKLIST DE DEPLOY - Correção Timezone

## 📋 PRÉ-DEPLOY

- [ ] Li e entendi o problema (datas gravando 1 dia antes)
- [ ] Revisei a documentação em `INSTRUCOES_DEPLOY_COMPLETO.md`
- [ ] Tenho acesso ao Supabase (Dashboard ou CLI)
- [ ] Fiz backup dos dados importantes (opcional, mas recomendado)
- [ ] Tenho o arquivo `/supabase/functions/server/index.tsx` atualizado

---

## 🚀 DEPLOY - ESCOLHA UMA OPÇÃO

### Opção A: Via Supabase Dashboard

- [ ] **Passo 1**: Acessei https://supabase.com/dashboard
- [ ] **Passo 2**: Fiz login na conta
- [ ] **Passo 3**: Selecionei o projeto correto
- [ ] **Passo 4**: Naveguei para Edge Functions
- [ ] **Passo 5**: Cliquei na função "server"
- [ ] **Passo 6**: Cliquei em "Edit" ou "Update Function"
- [ ] **Passo 7**: Copiei TODO o conteúdo de `/supabase/functions/server/index.tsx`
- [ ] **Passo 8**: Colei no editor (substituindo o código antigo)
- [ ] **Passo 9**: Cliquei em "Save" ou "Deploy"
- [ ] **Passo 10**: Aguardei confirmação de deploy com sucesso

**OU**

### Opção B: Via Supabase CLI

- [ ] **Passo 1**: Verifiquei instalação: `supabase --version`
- [ ] **Passo 2**: Fiz login: `supabase login`
- [ ] **Passo 3**: Linkei projeto: `supabase link --project-ref SEU_PROJECT_ID`
- [ ] **Passo 4**: Executei deploy: `supabase functions deploy server --no-verify-jwt`
- [ ] **Passo 5**: Aguardei confirmação de sucesso

---

## 🔍 VERIFICAÇÃO PÓS-DEPLOY

### Verificação Básica

- [ ] **Logs**: Verifiquei logs da Edge Function
  - Dashboard: Edge Functions > server > Logs
  - CLI: `supabase functions logs server --tail`
  
- [ ] **Versão**: Confirmei que aparece `Server version: 2.2.0`
  
- [ ] **Sem Erros**: Não há erros críticos nos logs

### Teste 1: Criar Novo Contrato

- [ ] Fiz login no sistema como admin/operador
- [ ] Naveguei para: **Contratos** > **Novo Contrato**
- [ ] Preench os dados:
  - [ ] Cliente: selecionei um cliente qualquer
  - [ ] Valor: R$ 10.000,00
  - [ ] Parcelas: 10
  - [ ] **Primeiro Vencimento: 15/04/2026** ⬅️ DATA DE TESTE
  - [ ] Taxa de juros: 25%
- [ ] Cliquei em **Salvar**
- [ ] Contrato foi criado com sucesso
- [ ] Abri o contrato criado
- [ ] **VERIFICAÇÃO CRÍTICA**: 
  - [ ] ✅ A primeira parcela mostra **15/04/2026** (CORRETO)
  - [ ] ❌ A primeira parcela mostra **14/04/2026** (AINDA COM PROBLEMA)

**Resultado do Teste 1:**
```
[ ] ✅ PASSOU - Datas corretas!
[ ] ❌ FALHOU - Preciso revisar o deploy
```

### Teste 2: Editar Contrato

- [ ] Selecionei um contrato existente qualquer
- [ ] Cliquei em **Editar**
- [ ] Mudei o **Primeiro Vencimento** para: **20/04/2026**
- [ ] Cliquei em **Salvar**
- [ ] Contrato foi atualizado com sucesso
- [ ] Reabri o contrato
- [ ] **VERIFICAÇÃO CRÍTICA**: 
  - [ ] ✅ A primeira parcela mostra **20/04/2026** (CORRETO)
  - [ ] ❌ A primeira parcela mostra **19/04/2026** (AINDA COM PROBLEMA)

**Resultado do Teste 2:**
```
[ ] ✅ PASSOU - Datas corretas!
[ ] ❌ FALHOU - Preciso revisar o deploy
```

### Teste 3 (Opcional): Dados de Teste (Seed)

- [ ] Executei a rota de seed via API ou ferramenta
- [ ] Verifiquei os contratos criados
- [ ] As datas correspondem ao esperado:
  - [ ] Contrato 1: 01/03/2026
  - [ ] Contrato 2: 15/03/2026
  - [ ] Contrato 3: 10/03/2026
  - [ ] Contrato 4: 01/04/2026
  - [ ] Contrato 5: 20/03/2026

**Resultado do Teste 3:**
```
[ ] ✅ PASSOU - Datas corretas!
[ ] ❌ FALHOU - Preciso revisar o deploy
[ ] ⏭️ PULEI - Teste opcional
```

---

## 🎨 ATUALIZAÇÃO DO FRONTEND (OPCIONAL)

### Utilitários de Data

- [ ] Revisei o arquivo `/src/app/utils/dateUtils.ts`
- [ ] Entendi as funções disponíveis
- [ ] Decidi atualizar o frontend:
  - [ ] ✅ SIM - Vou atualizar
  - [ ] ⏭️ NÃO - Deixarei para depois

### Se escolheu SIM:

- [ ] Atualizei `/src/app/pages/ContractDetails.tsx`
  - [ ] Importei `formatDateBR` e `isDateOverdue`
  - [ ] Substituí função `formatDate`
  - [ ] Substituí função `isOverdue`
  
- [ ] Atualizei `/src/app/pages/Contracts.tsx`
  - [ ] Importei `formatDateBR`
  - [ ] Substituí função `formatDate`
  
- [ ] Atualizei outros arquivos (opcional):
  - [ ] `/src/app/pages/ClientPortal.tsx`
  - [ ] `/src/app/pages/ClientPortalDashboard.tsx`
  - [ ] `/src/app/pages/Clients.tsx`
  - [ ] `/src/app/pages/ClientDetails.tsx`

- [ ] Testei localmente: `npm run dev`
- [ ] Verifiquei que as datas são exibidas corretamente
- [ ] Fiz commit e push das alterações
- [ ] Deploy do frontend (se aplicável)

---

## 📝 CONTRATOS ANTIGOS

### Decisão sobre Contratos Criados Antes da Correção

Escolha UMA opção:

- [ ] **Opção 1: Corrigir Manualmente**
  - [ ] Listei todos os contratos com datas incorretas
  - [ ] Para cada contrato:
    - [ ] Abri o contrato
    - [ ] Editei
    - [ ] Ajustei o primeiro vencimento (adicionando 1 dia)
    - [ ] Salvei
    - [ ] Verifiquei que as parcelas foram recalculadas
  - [ ] Documentei contratos corrigidos

- [ ] **Opção 2: Deixar Como Está**
  - [ ] Verifiquei que os contratos antigos têm datas acordadas com clientes
  - [ ] Confirmei que não há reclamações
  - [ ] Decidi manter as datas atuais
  - [ ] Documentei esta decisão

- [ ] **Opção 3: Aguardar Feedback**
  - [ ] Decidi aguardar edições naturais dos contratos
  - [ ] Quando usuários editarem, as datas serão recalculadas automaticamente
  - [ ] Monitorarei contratos editados

**Opção Escolhida:**
```
[ ] Opção 1 - Correção Manual
[ ] Opção 2 - Manter Como Está
[ ] Opção 3 - Aguardar Edições
```

---

## 📊 DOCUMENTAÇÃO

- [ ] Documentei o deploy realizado:
  - [ ] Data/hora: _______________
  - [ ] Método usado: Dashboard / CLI
  - [ ] Resultado dos testes: PASSOU / FALHOU
  - [ ] Problemas encontrados: _______________
  
- [ ] Notifiquei a equipe sobre a correção
- [ ] Arquivei backups (se foram feitos)
- [ ] Atualizei documentação interna (se aplicável)

---

## 🎯 RESULTADO FINAL

### Status do Deploy

```
[ ] ✅ SUCESSO COMPLETO
    - Deploy realizado
    - Todos os testes passaram
    - Datas corretas nos contratos novos

[ ] ⚠️ SUCESSO PARCIAL
    - Deploy realizado
    - Alguns testes falharam
    - Preciso revisar: _______________

[ ] ❌ FALHOU
    - Deploy não funcionou
    - Preciso de suporte
    - Problema: _______________
```

### Próximos Passos

- [ ] **Se SUCESSO**: Monitorar sistema por 24-48h
- [ ] **Se PARCIAL**: Revisar problemas e corrigir
- [ ] **Se FALHOU**: Contactar suporte com detalhes do erro

---

## 📞 SUPORTE E TROUBLESHOOTING

### Se algo deu errado:

1. **Revisei os logs:**
   ```
   [ ] Verifiquei logs da Edge Function
   [ ] Identifiquei mensagens de erro
   [ ] Anotei o erro: _______________
   ```

2. **Tentei novamente:**
   ```
   [ ] Fiz um novo deploy
   [ ] Limpei cache do navegador
   [ ] Testei com dados diferentes
   ```

3. **Procurei ajuda:**
   ```
   [ ] Consultei INSTRUCOES_DEPLOY_COMPLETO.md
   [ ] Revisei seção de "Problemas e Soluções"
   [ ] Documentei o problema para contato
   ```

---

## ✅ CONCLUSÃO

**Data de conclusão:** _______________

**Assinatura/Responsável:** _______________

**Observações finais:**
```
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

---

## 📎 ANEXOS E REFERÊNCIAS

- 📄 Documentação completa: `INSTRUCOES_DEPLOY_COMPLETO.md`
- 📄 Resumo executivo: `RESUMO_CORRECAO.txt`
- 📄 Detalhes técnicos: `CORRECAO_TIMEZONE_DEPLOY.md`
- 🧪 Teste visual: `test-timezone-fix.html`
- 🧪 Teste console: `test-date-correction.js`
- 📊 Versão: **2.2.0**
- 📅 Data da correção: **28/03/2026**

---

**Dica:** Imprima este checklist e marque cada item conforme avança! ✏️
