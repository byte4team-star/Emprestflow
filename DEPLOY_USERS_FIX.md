# 🔧 Deploy da Correção de Gerenciamento de Usuários

## ✅ Correções Implementadas

### 1. **Correção do Bug de Autenticação**
- **Problema**: As rotas GET/POST/DELETE `/users` estavam tentando acessar `c.get('auth')` quando o middleware define `c.set('user', user)`
- **Solução**: Corrigido para usar `c.get('user')` em todas as rotas de gerenciamento de usuários

### 2. **Adição da Rota POST /users**
- **Nova funcionalidade**: Criação de usuários via API backend
- **Endpoint**: `POST /make-server-bd42bc02/users`
- **Autenticação**: Requer admin
- **Validações**:
  - Campos obrigatórios: email, password, name
  - Senha mínima: 6 caracteres
  - Verifica duplicação de e-mail
  - Auto-confirmação de e-mail
  - Cria perfil KV automaticamente
  - Se role='client', cria registro de cliente automaticamente

### 3. **Uso Correto da Service Role Key**
- Todas as rotas agora utilizam `supabaseAdmin` (que já estava configurado com `SUPABASE_SERVICE_ROLE_KEY`)
- Métodos Admin API utilizados:
  - `supabaseAdmin.auth.admin.listUsers()` - Listar todos os usuários
  - `supabaseAdmin.auth.admin.createUser()` - Criar usuário
  - `supabaseAdmin.auth.admin.deleteUser()` - Deletar usuário
  - `supabaseAdmin.auth.admin.updateUserById()` - Resetar senha

## 📋 Rotas de Gerenciamento de Usuários

### GET /make-server-bd42bc02/users
- Lista todos os usuários do sistema
- Retorna: id, email, name, role, createdAt, lastLogin
- Enriquece dados do Supabase Auth com perfis do KV store

### POST /make-server-bd42bc02/users
- Cria novo usuário
- Body: `{ email, password, name, role? }`
- Retorna: dados do usuário criado

### DELETE /make-server-bd42bc02/users/:userId
- Deleta usuário (soft delete para clientes, hard delete para admin/operator)
- Valida: não permite auto-exclusão
- Logs de auditoria completos

### POST /make-server-bd42bc02/users/:userId/reset-password
- Reseta senha do usuário
- Gera senha temporária segura
- Retorna: nova senha para o admin anotar

## 🚀 Como Fazer o Deploy

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Fazer login no Supabase
npx supabase login

# 2. Linkar o projeto
npx supabase link --project-ref SEU_PROJECT_ID

# 3. Deploy da edge function
npx supabase functions deploy make-server-bd42bc02

# 4. Verificar se deployou corretamente
npx supabase functions list
```

### Opção 2: Via Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/SEU_PROJECT_ID/functions
2. Clique em "Deploy new version" na função `make-server-bd42bc02`
3. Cole o conteúdo do arquivo `/supabase/functions/server/index.tsx`
4. Clique em "Deploy"

### Opção 3: Via Script de Deploy Existente

```bash
# Execute o script de deploy
./deploy-fix.sh

# OU no Windows
deploy-fix.bat
```

## 🔐 Variáveis de Ambiente Necessárias

Certifique-se de que estas variáveis estão configuradas no Supabase:

```bash
SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ CRÍTICO - Service Role Key
SUPABASE_ANON_KEY=eyJhbGc...
```

Para verificar/configurar:
1. Acesse: https://supabase.com/dashboard/project/SEU_PROJECT_ID/settings/api
2. Vá em "Edge Functions" → "Secrets"
3. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada

## ✅ Testando a Correção

### 1. Teste de Listagem de Usuários

```bash
curl -X GET \
  https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/users \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "admin@empresa.com",
      "name": "Administrador",
      "role": "admin",
      "createdAt": "2026-03-28T...",
      "lastLogin": "2026-03-28T..."
    }
  ]
}
```

### 2. Teste de Criação de Usuário

```bash
curl -X POST \
  https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/users \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@empresa.com",
    "password": "Senha123!",
    "name": "Usuário Teste",
    "role": "operator"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "teste@empresa.com",
    "name": "Usuário Teste",
    "role": "operator"
  }
}
```

### 3. Teste pelo Frontend

1. Faça login como admin (admin@empresa.com / Admin@123456)
2. Acesse a aba "Usuários"
3. Verifique se os usuários são listados corretamente
4. Clique em "Adicionar Usuário"
5. Preencha os dados e crie um novo usuário
6. Verifique se o usuário aparece na lista

## 🐛 Troubleshooting

### Erro 404 ao listar usuários
- **Causa**: Edge function não deployada ou URL incorreta
- **Solução**: Verificar deploy e URL em `/src/app/lib/supabase.ts`

### Erro 401 ao listar usuários
- **Causa**: Token de autenticação expirado ou inválido
- **Solução**: Fazer logout e login novamente

### Erro 403 ao listar usuários
- **Causa**: Usuário não é admin
- **Solução**: Verificar role do usuário no Supabase Auth

### Erro 500 ao listar usuários
- **Causa**: SUPABASE_SERVICE_ROLE_KEY não configurada ou inválida
- **Solução**: 
  1. Acesse Settings → API no dashboard do Supabase
  2. Copie a "service_role key" (não a anon key!)
  3. Configure em Edge Functions → Secrets

### Nenhum usuário retornado (lista vazia)
- **Causa**: Admin API não configurada corretamente
- **Solução**: Verificar logs da edge function no dashboard

## 📊 Logs e Monitoramento

Para visualizar logs da edge function:

```bash
# Via CLI
npx supabase functions logs make-server-bd42bc02

# Via Dashboard
https://supabase.com/dashboard/project/SEU_PROJECT_ID/functions/make-server-bd42bc02/logs
```

Procure por:
- `[USERS] Fetching all users...` - Início da listagem
- `[USERS] Found X users` - Sucesso
- `[CREATE_USER] User created successfully` - Criação bem-sucedida

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. ✅ Testar listagem de usuários no frontend
2. ✅ Testar criação de usuários
3. ✅ Testar reset de senha
4. ✅ Testar exclusão de usuários
5. ✅ Verificar logs de auditoria

## 📚 Documentação Relacionada

- [CREATE_ADMIN.md](./CREATE_ADMIN.md) - Criar usuário admin inicial
- [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) - Instruções gerais de deploy
- [GERENCIAMENTO_USUARIOS.md](./GERENCIAMENTO_USUARIOS.md) - Documentação do módulo de usuários
- [SEGURANCA.md](./SEGURANCA.md) - Configurações de segurança

## ⚠️ Importante

- **Service Role Key**: Nunca exponha a service role key no frontend!
- **Auditoria**: Todas as operações são logadas automaticamente
- **LGPD**: Exclusão de clientes realiza anonimização automática dos dados
- **Backup**: Sempre faça backup antes de deletar usuários

---

**Versão do Backend**: 2.3.0 (com correção de gerenciamento de usuários)  
**Data da Correção**: 28/03/2026  
**Autor**: Sistema ALEMÃO.CREFISA
