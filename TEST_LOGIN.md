# Teste de Login - Diagnóstico

## Problema Atual
O erro "Invalid JWT" indica que o Supabase não está conseguindo validar o token de autenticação.

## Passos para Resolver:

### 1. Verifique as Variáveis de Ambiente do Supabase Functions

Vá no Supabase Dashboard → Project Settings → Edge Functions e confirme que estas variáveis estão configuradas:

- `SUPABASE_URL` - URL do seu projeto
- `SUPABASE_ANON_KEY` - Chave pública (anon/public)
- `SUPABASE_SERVICE_ROLE_KEY` - Chave secreta (service_role)

### 2. Criar Usuário Manualmente via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** → **Users**
4. Clique em **"Add User"** → **"Create new user"**
5. Preencha:
   - **Email**: `teste@cobrancapro.com`
   - **Password**: `Teste@12345`
   - **Auto Confirm Email**: ✅ **ATIVE ISSO** (muito importante!)
   - **User Metadata**: Adicione:
     ```json
     {"name": "Usuário Teste"}
     ```
6. Clique em **"Create User"**

### 3. Teste de Login

Agora tente fazer login no sistema com:
- **Email**: `teste@cobrancapro.com`
- **Senha**: `Teste@12345`

### 4. Se ainda der erro

O problema pode ser que o **JWT Secret** do Supabase não está configurado corretamente nas Edge Functions.

**Solução**:
1. Vá em: **Supabase Dashboard** → **Project Settings** → **API**
2. Copie o **JWT Secret** (está na seção "JWT Settings")
3. Vá em: **Edge Functions** → **Manage** → seção "Environment variables"
4. Adicione (se não existir):
   - Nome: `SUPABASE_JWT_SECRET`
   - Valor: [cole o JWT Secret que você copiou]

### 5. Redeploy do Edge Function

Após configurar as variáveis, você precisa fazer redeploy:

```bash
# Se estiver usando Supabase CLI
supabase functions deploy make-server-bd42bc02

# Ou pelo Dashboard
# Vá em Edge Functions → seu function → clique em "Deploy"
```

### 6. Alternativa: Use apenas o Frontend

Se o problema persistir, o sistema está configurado com **fallback** - você consegue fazer login e usar o sistema mesmo se o backend falhar, pois ele usa os dados da sessão do Supabase Auth.

As funcionalidades que vão funcionar mesmo sem backend:
- ✅ Login/Logout
- ✅ Sessão do usuário
- ✅ Navegação entre páginas

As funcionalidades que precisam do backend:
- ❌ Listagem de clientes
- ❌ Listagem de contratos
- ❌ Dashboard com estatísticas
- ❌ Upload de documentos

## Credenciais de Teste

Após criar o usuário, use:
- **Email**: teste@cobrancapro.com
- **Senha**: Teste@12345
