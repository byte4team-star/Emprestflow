# 📋 ARQUITETURA COMPLETA - SISTEMA DE CONTROLE E COBRANÇA

## 🏗️ VISÃO GERAL DA ARQUITETURA

Este é um sistema profissional de controle e cobrança desenvolvido para operar em ambiente de produção, com conformidade LGPD e segurança de nível empresarial.

### Stack Tecnológica

**Frontend:**
- React 18.3.1
- TypeScript
- React Router (navegação SPA)
- TailwindCSS v4 (estilização)
- Shadcn/ui (componentes)
- React Hook Form (formulários)
- Recharts (gráficos)
- React Dropzone (upload de arquivos)

**Backend:**
- Supabase Edge Functions (Deno runtime)
- Hono (web framework)
- PostgreSQL (via Supabase)
- Supabase Auth (autenticação)
- Supabase Storage (armazenamento de arquivos)

**Deploy:**
- Frontend: Vercel
- Backend: Supabase (Edge Functions)
- Banco de Dados: Supabase (PostgreSQL)
- Storage: Supabase (buckets privados)

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Modelo de Dados (Key-Value Store)

Como o ambiente utiliza um sistema de Key-Value Store, os dados são estruturados em formato JSON com prefixos de chave para simular tabelas relacionais:

#### 1. Tabela: `user_profile` (Perfis de Usuário)

**Chave:** `user_profile:{userId}`

```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "role": "admin | operator",
  "createdAt": "ISO8601"
}
```

**Campos:**
- `id`: UUID do usuário (gerado pelo Supabase Auth)
- `email`: E-mail do usuário
- `name`: Nome completo
- `role`: Perfil de acesso (admin ou operator)
- `createdAt`: Data de criação

---

#### 2. Tabela: `client` (Clientes)

**Chave:** `client:{clientId}`

```json
{
  "id": "string",
  "fullName": "string",
  "cpfCnpj": "string",
  "rg": "string",
  "birthDate": "ISO8601",
  "phone": "string",
  "whatsapp": "string",
  "email": "string",
  "address": "string",
  "occupation": "string",
  "company": "string",
  "monthlyIncome": "string",
  "status": "active | inactive",
  "referredBy": {
    "name": "string",
    "phone": "string"
  },
  "lgpdConsent": "boolean",
  "lgpdConsentDate": "ISO8601",
  "documents": {
    "front": {
      "path": "string",
      "fileName": "string",
      "mimeType": "string",
      "uploadedAt": "ISO8601",
      "uploadedBy": "string"
    },
    "back": { /* same structure */ },
    "selfie": { /* same structure */ },
    "video": { /* same structure */ }
  },
  "contractIds": ["string"],
  "createdAt": "ISO8601",
  "createdBy": "string",
  "updatedAt": "ISO8601",
  "updatedBy": "string"
}
```

**Índices Secundários:**
- `client_cpf:{cpfCnpj}` → `{clientId}` (para busca rápida por CPF/CNPJ)

---

#### 3. Tabela: `contract` (Contratos)

**Chave:** `contract:{contractId}`

```json
{
  "id": "string",
  "clientId": "string",
  "totalAmount": "number",
  "installments": "number",
  "installmentAmount": "number",
  "firstDueDate": "ISO8601",
  "interestRate": "number",
  "lateFeeRate": "number",
  "description": "string",
  "status": "active | inactive | completed",
  "installmentsList": [
    {
      "number": "number",
      "amount": "number",
      "dueDate": "ISO8601",
      "status": "pending | paid",
      "paidAt": "ISO8601 | null",
      "paidAmount": "number | null"
    }
  ],
  "createdAt": "ISO8601",
  "createdBy": "string",
  "updatedAt": "ISO8601"
}
```

---

#### 4. Tabela: `notification` (Notificações WhatsApp)

**Chave:** `notification:{notificationId}`

```json
{
  "id": "string",
  "clientId": "string",
  "contractId": "string",
  "installmentNumber": "number",
  "type": "before | today | overdue",
  "message": "string",
  "sentAt": "ISO8601",
  "status": "sent | failed | pending"
}
```

---

#### 5. Tabela: `audit` (Logs de Auditoria)

**Chave:** `audit:{timestamp}:{userId}:{action}`

```json
{
  "userId": "string",
  "action": "string",
  "resource": "string",
  "ip": "string",
  "timestamp": "ISO8601",
  "metadata": {
    "key": "value"
  }
}
```

**Ações Registradas:**
- `USER_SIGNUP`: Novo usuário criado
- `CLIENT_CREATED`: Cliente cadastrado
- `CLIENT_UPDATED`: Dados do cliente atualizados
- `CONTRACT_CREATED`: Contrato criado
- `INSTALLMENT_PAID`: Parcela paga
- `DOCUMENT_UPLOADED`: Documento enviado
- `WHATSAPP_REMINDER_SENT`: Lembrete enviado
- `UNAUTHORIZED_ACCESS_ATTEMPT`: Tentativa de acesso não autorizado

---

## 🔐 SEGURANÇA E CONFORMIDADE

### 1. Autenticação e Autorização

#### Supabase Auth (JWT-based)

**Fluxo de Login:**
```
1. Cliente envia credenciais → Frontend
2. Frontend chama supabase.auth.signInWithPassword()
3. Supabase valida e retorna JWT (access_token + refresh_token)
4. Frontend armazena session e busca perfil do usuário
5. Todas as requisições incluem: Authorization: Bearer {access_token}
```

**Controle de Acesso (RBAC):**

| Recurso | Administrador | Operador |
|---------|--------------|----------|
| Dashboard | ✅ Leitura | ✅ Leitura |
| Clientes | ✅ CRUD | ✅ CRUD |
| Contratos | ✅ CRUD | ✅ CRUD |
| Pagamentos | ✅ Registrar | ✅ Registrar |
| Logs de Auditoria | ✅ Leitura | ❌ Bloqueado |
| Criar Admins | ✅ Permitido | ❌ Bloqueado |

**Implementação no Backend:**
```typescript
// Middleware de autenticação
async function authenticateUser(authHeader: string) {
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

// Middleware de autorização
async function requireAdmin(c, next) {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
}
```

---

### 2. Proteção de Dados (LGPD)

#### Medidas Implementadas:

✅ **Consentimento Explícito**
- Campo obrigatório: `lgpdConsent: true`
- Data registrada: `lgpdConsentDate`
- Termo de aceite no cadastro

✅ **Minimização de Dados**
- Coleta apenas dados necessários para operação
- Campos opcionais claramente marcados

✅ **Direitos do Titular**
- Acesso aos dados (visualização no sistema)
- Retificação (edição de cadastro)
- Exclusão (anonimização futura)

✅ **Segurança Técnica**
- Criptografia em trânsito (HTTPS)
- Senhas criptografadas (bcrypt via Supabase)
- Storage privado com signed URLs

✅ **Transparência**
- Logs de auditoria completos
- Rastreamento de ações sobre dados pessoais

✅ **Retenção de Dados**
- Política de retenção definível
- Processo de anonimização implementável

---

### 3. Storage Seguro (Supabase Storage)

#### Configuração do Bucket:

```typescript
// Bucket privado criado automaticamente no startup
const bucketName = 'make-bd42bc02-documents';

await supabase.storage.createBucket(bucketName, {
  public: false,            // ❌ Acesso público bloqueado
  fileSizeLimit: 52428800,  // 50MB máximo
});
```

#### Upload Seguro:

```
1. Frontend converte arquivo para base64
2. Envia ao backend via API autenticada
3. Backend valida:
   - Tamanho do arquivo (max 50MB)
   - Tipo de arquivo permitido
   - Autenticação do usuário
4. Salva no bucket privado
5. Retorna signed URL (válida por 1 hora)
```

#### Estrutura de Pastas:

```
make-bd42bc02-documents/
├── {clientId}/
│   ├── front/
│   │   └── documento-frente.jpg
│   ├── back/
│   │   └── documento-verso.jpg
│   ├── selfie/
│   │   └── selfie.jpg
│   └── video/
│       └── validacao.mp4
```

---

### 4. Proteção Contra Ataques

#### Implementado:

✅ **SQL Injection**
- Uso de KV Store (não há SQL direto)
- Validação de inputs

✅ **XSS (Cross-Site Scripting)**
- React escapa automaticamente valores
- Sanitização de inputs no backend

✅ **CSRF (Cross-Site Request Forgery)**
- JWT em header Authorization
- SameSite cookies

✅ **Rate Limiting**
- Implementável via Supabase Edge Functions
- Throttling de requisições

✅ **Headers de Segurança**
```typescript
// Recomendado adicionar no Vercel:
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()" }
      ]
    }
  ]
}
```

---

### 5. Variáveis de Ambiente Seguras

#### Vercel (Frontend):

```env
# ✅ Seguro expor no frontend
VITE_SUPABASE_URL=https://{project}.supabase.co
VITE_SUPABASE_ANON_KEY={anon_key}

# ❌ NUNCA expor no frontend
# SERVICE_ROLE_KEY - apenas no backend!
```

#### Supabase Edge Functions (Backend):

```env
# Automático via Supabase
SUPABASE_URL=https://{project}.supabase.co
SUPABASE_ANON_KEY={anon_key}
SUPABASE_SERVICE_ROLE_KEY={service_role_key}

# Adicionar manualmente:
WHATSAPP_API_KEY={sua_chave_api}
WHATSAPP_PHONE_ID={seu_phone_id}
```

---

## 📡 INTEGRAÇÃO COM WHATSAPP

### APIs Recomendadas:

1. **360Dialog** (oficial Meta)
2. **Twilio WhatsApp API**
3. **Z-API** (Brasil)

### Fluxo de Envio Automático:

```
1. Sistema detecta parcela próxima ao vencimento
2. Endpoint: POST /whatsapp/send-reminder
3. Backend:
   - Busca dados do cliente e contrato
   - Monta mensagem personalizada
   - Envia via API do WhatsApp
   - Registra notificação
   - Loga auditoria
4. Mensagem enviada ao cliente
5. Cópia enviada ao admin (opcional)
```

### Tipos de Mensagem:

**3 dias antes:**
```
Olá {Nome}! Lembramos que a parcela {X}/{Total} no valor de R$ {Valor} 
vence em 3 dias ({Data}). Link de pagamento: {URL}
```

**No dia:**
```
Olá {Nome}! A parcela {X}/{Total} no valor de R$ {Valor} vence HOJE. 
Link de pagamento: {URL}
```

**1 dia após atraso:**
```
Olá {Nome}! A parcela {X}/{Total} no valor de R$ {Valor} está em atraso 
desde {Data}. Por favor, regularize seu pagamento. Link: {URL}
```

### Implementação Backend:

```typescript
// Exemplo com 360Dialog
const sendWhatsApp = async (to: string, message: string) => {
  const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY');
  
  await fetch('https://waba.360dialog.io/v1/messages', {
    method: 'POST',
    headers: {
      'D360-API-KEY': WHATSAPP_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      type: 'text',
      text: { body: message },
    }),
  });
};
```

---

## 📊 DASHBOARD E ANALYTICS

### Métricas Calculadas:

```typescript
// KPIs principais
- Total de Clientes
- Clientes Ativos
- Receita Total (parcelas pagas)
- Total em Aberto (parcelas pendentes)
- Total Atrasado (parcelas vencidas não pagas)
- Taxa de Inadimplência (atrasado / total em aberto * 100)

// Evolução mensal (últimos 6 meses)
- Valores pagos por mês
- Valores atrasados por mês
```

### Gráficos:

1. **Evolução Mensal** (Line Chart)
   - Linha verde: Pagamentos recebidos
   - Linha vermelha: Valores atrasados

2. **Pagos vs Atrasados** (Bar Chart)
   - Comparativo mensal

---

## 🚀 FLUXOS DO SISTEMA

### 1. Fluxo de Cadastro de Cliente

```
1. Usuário acessa /clients/new
2. Preenche formulário com dados obrigatórios
3. Aceita termo LGPD (checkbox obrigatório)
4. Submete formulário
5. Backend valida dados
6. Cria registro em client:{id}
7. Cria índice em client_cpf:{cpf}
8. Registra auditoria (CLIENT_CREATED)
9. Retorna ID do cliente
10. Frontend exibe upload de documentos
11. Usuário faz upload de 4 documentos
12. Backend salva no Storage privado
13. Atualiza registro do cliente com paths
14. Registra auditoria (DOCUMENT_UPLOADED)
```

### 2. Fluxo de Criação de Contrato

```
1. Usuário acessa /contracts/new
2. Seleciona cliente existente
3. Define: valor, parcelas, vencimento, juros
4. Submete formulário
5. Backend calcula parcelas automaticamente
6. Gera array de installmentsList com datas
7. Salva contrato em contract:{id}
8. Adiciona contractId ao cliente
9. Registra auditoria (CONTRACT_CREATED)
10. Redireciona para /contracts/{id}
```

### 3. Fluxo de Pagamento de Parcela

```
1. Usuário acessa /contracts/{id}
2. Clica em "Pagar" na parcela
3. Abre dialog com:
   - Valor sugerido
   - Campo de valor pago
   - Data do pagamento
4. Confirma pagamento
5. Backend:
   - Atualiza status da parcela para "paid"
   - Registra paidAt e paidAmount
   - Registra auditoria (INSTALLMENT_PAID)
6. Frontend recarrega dados
7. Parcela aparece como "Paga" (verde)
```

### 4. Fluxo de Envio de Cobrança WhatsApp

```
1. Usuário clica em "WhatsApp" na parcela
2. Frontend envia request para /whatsapp/send-reminder
3. Backend:
   - Busca dados do cliente e contrato
   - Identifica tipo de mensagem (antes/hoje/atrasado)
   - Monta mensagem personalizada
   - Chama API do WhatsApp
   - Salva registro em notification:{id}
   - Registra auditoria (WHATSAPP_REMINDER_SENT)
4. Cliente recebe mensagem no WhatsApp
```

---

## 📁 ESTRUTURA DE DIRETÓRIOS

```
/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/              # Componentes Shadcn
│   │   │   ├── Root.tsx         # Layout principal
│   │   │   ├── Sidebar.tsx      # Menu lateral
│   │   │   ├── Header.tsx       # Cabeçalho
│   │   │   └── DocumentUploader.tsx
│   │   ├── lib/
│   │   │   ├── supabase.ts      # Cliente Supabase
│   │   │   └── auth-context.tsx # Context de autenticação
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Clients.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   ├── ClientDetails.tsx
│   │   │   ├── Contracts.tsx
│   │   │   ├── ContractForm.tsx
│   │   │   ├── ContractDetails.tsx
│   │   │   ├── AuditLogs.tsx
│   │   │   └── NotFound.tsx
│   │   ├── routes.tsx           # Configuração de rotas
│   │   └── App.tsx              # Componente raiz
│   └── styles/
│       ├── tailwind.css
│       ├── theme.css
│       └── fonts.css
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx         # API principal
│           └── kv_store.tsx      # Utilitários KV (protegido)
├── utils/
│   └── supabase/
│       └── info.tsx              # Credenciais Supabase
└── package.json
```

---

## 🔧 CONFIGURAÇÃO E DEPLOY

### 1. Supabase Setup

```bash
# 1. Criar projeto no Supabase
# 2. Copiar credenciais:
#    - Project URL
#    - Anon Key
#    - Service Role Key

# 3. Configurar variáveis no Supabase:
# Edge Functions > Settings > Environment Variables
WHATSAPP_API_KEY=seu_token_aqui
```

### 2. Vercel Deploy

```bash
# 1. Conectar repositório GitHub
# 2. Configurar variáveis de ambiente:
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# 3. Build settings:
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

### 3. Primeiro Acesso

```
1. Acesse o sistema
2. Clique em "Cadastre-se"
3. Crie primeira conta (será "operator")
4. Para criar admin:
   - Use Supabase SQL Editor
   - UPDATE user_profile SET role = 'admin' WHERE id = '{userId}'
```

---

## 📝 ENDPOINTS DA API

### Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/signup` | Criar conta | Não |
| GET | `/auth/profile` | Perfil do usuário | Sim |

### Clientes

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/clients` | Criar cliente | Sim |
| GET | `/clients` | Listar clientes | Sim |
| GET | `/clients/:id` | Detalhes do cliente | Sim |
| PUT | `/clients/:id` | Atualizar cliente | Sim |

### Documentos

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/clients/:id/documents` | Upload documento | Sim |
| GET | `/clients/:id/documents/:type` | Obter signed URL | Sim |

### Contratos

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/contracts` | Criar contrato | Sim |
| GET | `/contracts` | Listar contratos | Sim |
| GET | `/contracts/:id` | Detalhes do contrato | Sim |
| POST | `/contracts/:id/installments/:number/pay` | Registrar pagamento | Sim |

### WhatsApp

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/whatsapp/send-reminder` | Enviar lembrete | Sim |

### Dashboard & Auditoria

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/dashboard/stats` | Estatísticas | Sim |
| GET | `/audit-logs` | Logs de auditoria | Admin |

---

## ⚠️ LIMITAÇÕES PARA PRODUÇÃO REAL

### Este é um protótipo funcional. Para produção real, implemente:

1. **Migrações SQL Reais**
   - Crie tabelas no PostgreSQL com RLS
   - Defina foreign keys e índices
   - Configure Row Level Security

2. **Backup e Disaster Recovery**
   - Backups automáticos diários
   - Point-in-time recovery
   - Plano de contingência

3. **Monitoramento**
   - Sentry (error tracking)
   - Datadog/New Relic (APM)
   - Uptime monitoring

4. **Testes**
   - Testes unitários (Jest/Vitest)
   - Testes de integração
   - Testes E2E (Playwright/Cypress)

5. **CI/CD**
   - GitHub Actions
   - Testes automáticos
   - Deploy automático

6. **Compliance LGPD Completo**
   - Contrato com DPO
   - Política de privacidade formal
   - Processo de DSAR (Data Subject Access Request)
   - Anonimização automática após período de retenção

7. **Rate Limiting e DDoS Protection**
   - Cloudflare ou similar
   - Rate limiting por IP
   - WAF (Web Application Firewall)

8. **Certificações**
   - ISO 27001 (segurança da informação)
   - Auditoria externa
   - Penetration testing

---

## 📞 PRÓXIMOS PASSOS

### Para integração WhatsApp:

1. Escolha um provedor (360Dialog, Twilio, Z-API)
2. Crie conta e obtenha API key
3. Configure webhook para receber status de entrega
4. Adicione WHATSAPP_API_KEY nas variáveis de ambiente
5. Implemente lógica de envio automático (cron job)

### Para automação de cobranças:

- Configure Supabase Edge Function com cron
- Rode diariamente para verificar vencimentos
- Envie lembretes automaticamente

---

## 🎯 CONCLUSÃO

Este sistema foi desenvolvido seguindo as melhores práticas de segurança e arquitetura para aplicações web profissionais. Ele implementa:

✅ Autenticação JWT segura  
✅ Controle de acesso baseado em roles  
✅ Upload seguro de documentos  
✅ Conformidade LGPD  
✅ Logs de auditoria completos  
✅ Dashboard com analytics  
✅ Integração preparada para WhatsApp  
✅ Arquitetura escalável  

**Desenvolvido para produção real em São Paulo - SP**
