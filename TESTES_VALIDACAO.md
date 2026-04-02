# 🧪 TESTES DE VALIDAÇÃO - Checklist Completo

## 📋 OBJETIVO

Validar que todas as correções foram aplicadas corretamente após o deploy da Edge Function.

---

## ✅ CHECKLIST DE TESTES

### 1️⃣ TESTE DE DEPLOY

#### 1.1 Health Check - Versão da Edge Function

**Comando:**
```bash
curl https://nbelraenszprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/health
```

**Resultado esperado:**
```json
{
  "status": "healthy",
  "version": "2.2.0",
  "timestamp": "2026-03-28T..."
}
```

**Status:** [ ]  
**Observações:** _________________________________________

---

#### 1.2 Verificar Arquivos no Dashboard

1. Acesse: https://supabase.com/dashboard/project/nbelraenszprsskjnvpc/functions
2. Clique em `make-server-bd42bc02`
3. Verifique se existem os 5 arquivos:
   - [ ] index.tsx
   - [ ] billing_routes.tsx
   - [ ] client_portal_routes.tsx
   - [ ] health.tsx
   - [ ] kv_store.tsx

**Status:** [ ]  
**Observações:** _________________________________________

---

### 2️⃣ TESTE DE AUTENTICAÇÃO

#### 2.1 Login com Usuário Admin

**Endpoint:**
```
POST https://nbelraenszprsskjnvpc.supabase.co/auth/v1/token?grant_type=password
```

**Headers:**
```
Content-Type: application/json
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "email": "admin@empresa.com",
  "password": "Admin@123456"
}
```

**Resultado esperado:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "...",
    "email": "admin@empresa.com"
  }
}
```

**Status:** [ ]  
**Token obtido:** _________________________________________  
**Observações:** _________________________________________

---

### 3️⃣ TESTE DE TIMEZONE (CRÍTICO)

#### 3.1 Criar Contrato com Data Específica

**Endpoint:**
```
POST https://nbelraenszprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/contracts
```

**Headers:**
```
Authorization: Bearer [SEU_TOKEN]
X-User-Token: [SEU_TOKEN]
Content-Type: application/json
```

**Body:**
```json
{
  "clientId": "client_test_timezone",
  "client": {
    "id": "client_test_timezone",
    "fullName": "Teste Timezone",
    "cpfCnpj": "000.000.000-00",
    "phone": "(11) 99999-9999",
    "whatsapp": "(11) 99999-9999",
    "email": "teste@timezone.com",
    "address": "Rua Teste",
    "status": "active"
  },
  "loanAmount": 1000,
  "installmentsCount": 4,
  "monthlyInterestRate": 10,
  "firstDueDate": "2026-04-15"
}
```

**Validação das Datas:**

| Parcela | Data Esperada | Data Obtida | Status |
|---------|---------------|-------------|--------|
| 1       | 2026-04-15    | ___________ | [ ]    |
| 2       | 2026-05-15    | ___________ | [ ]    |
| 3       | 2026-06-15    | ___________ | [ ]    |
| 4       | 2026-07-15    | ___________ | [ ]    |

**✅ TESTE PASSOU SE:** Todas as datas são dia 15 (não 14!)

**Status:** [ ]  
**Observações:** _________________________________________

---

#### 3.2 Testar com Data em Início de Mês

**Body:**
```json
{
  "clientId": "client_test_inicio_mes",
  "client": { ... },
  "loanAmount": 1000,
  "installmentsCount": 3,
  "monthlyInterestRate": 10,
  "firstDueDate": "2026-05-01"
}
```

**Validação:**

| Parcela | Data Esperada | Data Obtida | Status |
|---------|---------------|-------------|--------|
| 1       | 2026-05-01    | ___________ | [ ]    |
| 2       | 2026-06-01    | ___________ | [ ]    |
| 3       | 2026-07-01    | ___________ | [ ]    |

**Status:** [ ]  
**Observações:** _________________________________________

---

#### 3.3 Testar com Data em Fim de Mês

**Body:**
```json
{
  "clientId": "client_test_fim_mes",
  "client": { ... },
  "loanAmount": 1000,
  "installmentsCount": 3,
  "monthlyInterestRate": 10,
  "firstDueDate": "2026-05-31"
}
```

**Validação:**

| Parcela | Data Esperada | Data Obtida | Status |
|---------|---------------|-------------|--------|
| 1       | 2026-05-31    | ___________ | [ ]    |
| 2       | 2026-06-30    | ___________ | [ ]    |
| 3       | 2026-07-31    | ___________ | [ ]    |

**Status:** [ ]  
**Observações:** _________________________________________

---

### 4️⃣ TESTE DE CÁLCULO DE JUROS (CRÍTICO)

#### 4.1 Empréstimo com Juros Simples

**Cenário 1:** R$ 1.000 - 4 parcelas - 10% ao mês

**Cálculo esperado:**
```
Total = 1000 × (1 + 0,10 × 4) = 1000 × 1,4 = R$ 1.400,00
Parcela = 1400 ÷ 4 = R$ 350,00
```

**Criar contrato:**
```json
{
  "clientId": "client_test_juros_1",
  "client": { ... },
  "loanAmount": 1000,
  "installmentsCount": 4,
  "monthlyInterestRate": 10,
  "firstDueDate": "2026-04-15"
}
```

**Validação:**

| Item | Valor Esperado | Valor Obtido | Status |
|------|----------------|--------------|--------|
| Total | R$ 1.400,00 | __________ | [ ] |
| Parcela | R$ 350,00 | __________ | [ ] |

**Status:** [ ]  
**Observações:** _________________________________________

---

#### 4.2 Empréstimo com Valores Diferentes

**Cenário 2:** R$ 5.000 - 6 parcelas - 8% ao mês

**Cálculo esperado:**
```
Total = 5000 × (1 + 0,08 × 6) = 5000 × 1,48 = R$ 7.400,00
Parcela = 7400 ÷ 6 = R$ 1.233,33
```

**Validação:**

| Item | Valor Esperado | Valor Obtido | Status |
|------|----------------|--------------|--------|
| Total | R$ 7.400,00 | __________ | [ ] |
| Parcela | R$ 1.233,33 | __________ | [ ] |

**Status:** [ ]  
**Observações:** _________________________________________

---

#### 4.3 Empréstimo sem Juros

**Cenário 3:** R$ 2.000 - 5 parcelas - 0% ao mês

**Cálculo esperado:**
```
Total = 2000 × (1 + 0 × 5) = 2000 × 1 = R$ 2.000,00
Parcela = 2000 ÷ 5 = R$ 400,00
```

**Validação:**

| Item | Valor Esperado | Valor Obtido | Status |
|------|----------------|--------------|--------|
| Total | R$ 2.000,00 | __________ | [ ] |
| Parcela | R$ 400,00 | __________ | [ ] |

**Status:** [ ]  
**Observações:** _________________________________________

---

### 5️⃣ TESTE DE SEED DATA

#### 5.1 Criar Seed Data

**Endpoint:**
```
POST https://nbelraenszprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/seed-data
```

**Headers:**
```
Authorization: Bearer [SEU_TOKEN]
X-User-Token: [SEU_TOKEN]
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Seed data created successfully",
  "data": {
    "clients": 3,
    "contracts": 3,
    "transactions": 6
  }
}
```

**Status:** [ ]  
**Clientes criados:** __________  
**Contratos criados:** __________  
**Transações criadas:** __________  
**Observações:** _________________________________________

---

#### 5.2 Validar Seed Data - Verificar Datas

**Verificar se os contratos seed têm datas corretas:**

1. Acesse o Dashboard
2. Vá em Contratos
3. Abra cada contrato e verifique as datas de vencimento

**Contrato 1 - João Silva:**

| Parcela | Data Esperada | Data Real | Status |
|---------|---------------|-----------|--------|
| 1       | Hoje + 1 mês  | _________ | [ ]    |
| 2       | Hoje + 2 mês  | _________ | [ ]    |
| ...     | ...           | _________ | [ ]    |

**Status:** [ ]  
**Observações:** _________________________________________

---

### 6️⃣ TESTE DE PORTAL DO CLIENTE

#### 6.1 Login de Cliente

**Endpoint:**
```
POST https://nbelraenszprsskjnvpc.supabase.co/auth/v1/token?grant_type=password
```

**Body:**
```json
{
  "email": "joao.silva@email.com",
  "password": "Cliente@123"
}
```

**Status:** [ ]  
**Observações:** _________________________________________

---

#### 6.2 Consultar Contratos do Cliente

**Endpoint:**
```
GET https://nbelraenszprsskjnvpc.supabase.co/functions/v1/make-server-bd42bc02/client-portal/contracts
```

**Headers:**
```
Authorization: Bearer [TOKEN_DO_CLIENTE]
X-User-Token: [TOKEN_DO_CLIENTE]
```

**Validar:**
- [ ] Retorna apenas contratos do cliente logado
- [ ] Datas de vencimento corretas
- [ ] Valores de parcelas corretos

**Status:** [ ]  
**Observações:** _________________________________________

---

### 7️⃣ TESTE DE INTEGRAÇÃO

#### 7.1 Fluxo Completo: Criar Cliente → Criar Contrato → Consultar

**Passo 1: Criar Cliente**
```json
POST /make-server-bd42bc02/clients
{
  "fullName": "Maria Santos",
  "cpfCnpj": "123.456.789-00",
  "phone": "(11) 98888-8888",
  "whatsapp": "(11) 98888-8888",
  "email": "maria@teste.com",
  "address": "Rua Teste, 456"
}
```

**Cliente criado:** [ ]  
**ID do cliente:** _________________________________________

**Passo 2: Criar Contrato**
```json
POST /make-server-bd42bc02/contracts
{
  "clientId": "[ID_DO_CLIENTE]",
  "loanAmount": 3000,
  "installmentsCount": 5,
  "monthlyInterestRate": 12,
  "firstDueDate": "2026-05-10"
}
```

**Contrato criado:** [ ]  
**ID do contrato:** _________________________________________  
**Todas as datas corretas:** [ ]  
**Cálculo correto:** [ ]

**Passo 3: Consultar Contrato**
```
GET /make-server-bd42bc02/contracts/[ID_DO_CONTRATO]
```

**Dados retornados corretamente:** [ ]

**Status do teste completo:** [ ]  
**Observações:** _________________________________________

---

## 📊 RESUMO DOS TESTES

### Resultados

| Categoria | Testes | Passou | Falhou | Pendente |
|-----------|--------|--------|--------|----------|
| Deploy | 2 | __ | __ | __ |
| Autenticação | 1 | __ | __ | __ |
| Timezone | 3 | __ | __ | __ |
| Cálculo Juros | 3 | __ | __ | __ |
| Seed Data | 2 | __ | __ | __ |
| Portal Cliente | 2 | __ | __ | __ |
| Integração | 1 | __ | __ | __ |
| **TOTAL** | **14** | **__** | **__** | **__** |

---

## ✅ CRITÉRIOS DE APROVAÇÃO

Para considerar o deploy bem-sucedido:

- [ ] **100%** dos testes de Timezone passaram
- [ ] **100%** dos testes de Cálculo de Juros passaram
- [ ] **Health Check** retorna versão 2.2.0
- [ ] **Seed Data** cria dados com valores corretos
- [ ] **Mínimo 90%** de todos os testes passaram

---

## 🐛 PROBLEMAS ENCONTRADOS

### Problema 1
**Teste:** _________________________________________  
**Erro:** _________________________________________  
**Solução aplicada:** _________________________________________  
**Status:** [ ] Resolvido [ ] Pendente

### Problema 2
**Teste:** _________________________________________  
**Erro:** _________________________________________  
**Solução aplicada:** _________________________________________  
**Status:** [ ] Resolvido [ ] Pendente

### Problema 3
**Teste:** _________________________________________  
**Erro:** _________________________________________  
**Solução aplicada:** _________________________________________  
**Status:** [ ] Resolvido [ ] Pendente

---

## 📝 NOTAS FINAIS

**Data dos testes:** _________________________________________  
**Testado por:** _________________________________________  
**Ambiente:** [ ] Produção [ ] Desenvolvimento  
**Versão da Edge Function:** _________________________________________

**Aprovado para produção?** [ ] Sim [ ] Não

**Assinatura:** _________________________________________

---

**Última atualização:** 28/03/2026  
**Versão do documento:** 1.0
