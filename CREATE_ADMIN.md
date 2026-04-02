# Criar Usuário Admin

Para criar um usuário admin inicial no sistema, siga estes passos:

## Opção 1: Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "Authentication" > "Users"
4. Clique em "Add User"
5. Preencha:
   - Email: `admin@cobrancapro.com`
   - Password: `Admin@123456`
   - Auto Confirm Email: ✅ Marque como ON
   - Metadata: Adicione `{"name": "Administrador"}`
6. Clique em "Create User"

## Opção 2: Via SQL Editor

1. Acesse: Supabase Dashboard > SQL Editor
2. Execute este SQL:

```sql
-- Criar usuário admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@cobrancapro.com',
  crypt('Admin@123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrador"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

## Depois de criar o usuário:

1. Faça login no sistema com: 
   - Email: `admin@cobrancapro.com`
   - Senha: `Admin@123456`

2. O sistema criará automaticamente o perfil do usuário com role "operator" 

3. Se precisar dar permissões de admin, faça signup direto pelo sistema com qualquer e-mail

## Credenciais de Teste:

- **Email**: admin@cobrancapro.com
- **Senha**: Admin@123456
