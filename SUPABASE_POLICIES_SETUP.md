# 🔐 Configuração de Políticas de Segurança - Supabase

## ⚠️ IMPORTANTE: Por que as Policies são necessárias?

No Supabase, quando você cria buckets ou tabelas em modo **"Privado"**, isso significa que **NINGUÉM** tem acesso - nem mesmo usuários autenticados. Você precisa criar **Policies (Políticas)** explícitas para definir quem pode fazer o quê.

---

## 📦 PARTE 1: Políticas para Storage Buckets

### 1.1. Bucket: `client-documents`

Este bucket armazena documentos enviados pelos clientes (RG, CNH, comprovantes, vídeos).

#### Acesse no Supabase:
1. Vá em **Storage** → **client-documents**
2. Clique em **Policies**
3. Clique em **New Policy**

#### Política 1: Permitir UPLOAD (INSERT) para clientes autenticados
```sql
-- Nome: "Clientes podem fazer upload dos próprios documentos"
-- Operação: INSERT
-- Target roles: authenticated

-- Policy SQL:
(auth.uid() IS NOT NULL)
AND (bucket_id = 'client-documents')
AND (storage.foldername(name))[1] = auth.uid()::text
```

**Explicação**: Permite que usuários autenticados façam upload APENAS em pastas com seu próprio UID.

#### Política 2: Permitir LEITURA (SELECT) para clientes e operadores
```sql
-- Nome: "Clientes veem seus documentos, operadores veem todos"
-- Operação: SELECT
-- Target roles: authenticated

-- Policy SQL:
(auth.uid() IS NOT NULL)
AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
)
```

**Explicação**: Clientes veem apenas seus próprios documentos. Admins e operadores veem tudo.

#### Política 3: Permitir DELETE apenas para admins
```sql
-- Nome: "Apenas admins podem deletar documentos"
-- Operação: DELETE
-- Target roles: authenticated

-- Policy SQL:
EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND users.role = 'admin'
)
```

---

### 1.2. Bucket: `profile-photos`

Este bucket armazena fotos de perfil dos clientes.

#### Política 1: Permitir UPLOAD (INSERT) para clientes
```sql
-- Nome: "Clientes podem fazer upload da própria foto"
-- Operação: INSERT
-- Target roles: authenticated

-- Policy SQL:
(auth.uid() IS NOT NULL)
AND (bucket_id = 'profile-photos')
AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Política 2: Permitir LEITURA (SELECT) para todos autenticados
```sql
-- Nome: "Usuários autenticados podem ver fotos de perfil"
-- Operação: SELECT
-- Target roles: authenticated

-- Policy SQL:
(auth.uid() IS NOT NULL)
```

**Explicação**: Fotos de perfil são visíveis para qualquer usuário autenticado no sistema.

#### Política 3: Permitir UPDATE para o próprio usuário
```sql
-- Nome: "Clientes podem atualizar própria foto"
-- Operação: UPDATE
-- Target roles: authenticated

-- Policy SQL:
(auth.uid() IS NOT NULL)
AND (storage.foldername(name))[1] = auth.uid()::text
```

---

## 🗄️ PARTE 2: Políticas para Tabelas do Banco de Dados

### 2.1. Tabela: `users`

#### Habilitar RLS (Row Level Security):
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

#### Política 1: SELECT - Usuários veem a si mesmos, operadores veem todos
```sql
CREATE POLICY "users_select_policy" ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'operator')
  )
);
```

#### Política 2: INSERT - Apenas admins criam usuários
```sql
CREATE POLICY "users_insert_policy" ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

#### Política 3: UPDATE - Usuários atualizam a si mesmos, admins atualizam todos
```sql
CREATE POLICY "users_update_policy" ON users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);
```

#### Política 4: DELETE - Apenas admins deletam usuários
```sql
CREATE POLICY "users_delete_policy" ON users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

---

### 2.2. Tabela: `clients`

#### Habilitar RLS:
```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
```

#### Política 1: SELECT - Clientes veem a si mesmos, operadores veem todos
```sql
CREATE POLICY "clients_select_policy" ON clients
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

#### Política 2: INSERT - Service role e o próprio cliente podem inserir
```sql
CREATE POLICY "clients_insert_policy" ON clients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

#### Política 3: UPDATE - Cliente atualiza seus dados, operadores atualizam todos
```sql
CREATE POLICY "clients_update_policy" ON clients
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

---

### 2.3. Tabela: `contracts`

#### Habilitar RLS:
```sql
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
```

#### Política 1: SELECT - Clientes veem seus contratos, operadores veem todos
```sql
CREATE POLICY "contracts_select_policy" ON contracts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = contracts.client_id
    AND clients.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

#### Política 2: INSERT - Apenas operadores criam contratos
```sql
CREATE POLICY "contracts_insert_policy" ON contracts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

#### Política 3: UPDATE - Apenas operadores atualizam contratos
```sql
CREATE POLICY "contracts_update_policy" ON contracts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

#### Política 4: DELETE - Apenas admins deletam contratos
```sql
CREATE POLICY "contracts_delete_policy" ON contracts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

---

### 2.4. Tabela: `installments`

#### Habilitar RLS:
```sql
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
```

#### Política 1: SELECT - Clientes veem suas parcelas, operadores veem todas
```sql
CREATE POLICY "installments_select_policy" ON installments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM contracts
    INNER JOIN clients ON clients.id = contracts.client_id
    WHERE contracts.id = installments.contract_id
    AND clients.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

#### Política 2: INSERT - Apenas operadores criam parcelas
```sql
CREATE POLICY "installments_insert_policy" ON installments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

#### Política 3: UPDATE - Apenas operadores atualizam parcelas
```sql
CREATE POLICY "installments_update_policy" ON installments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

---

### 2.5. Tabela: `payments`

#### Habilitar RLS:
```sql
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
```

#### Política 1: SELECT - Clientes veem seus pagamentos, operadores veem todos
```sql
CREATE POLICY "payments_select_policy" ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM installments
    INNER JOIN contracts ON contracts.id = installments.contract_id
    INNER JOIN clients ON clients.id = contracts.client_id
    WHERE installments.id = payments.installment_id
    AND clients.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

#### Política 2: INSERT - Apenas operadores registram pagamentos
```sql
CREATE POLICY "payments_insert_policy" ON payments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

#### Política 3: UPDATE - Apenas operadores atualizam pagamentos
```sql
CREATE POLICY "payments_update_policy" ON payments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'operator')
  )
);
```

---

### 2.6. Tabela: `audit_logs`

#### Habilitar RLS:
```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

#### Política 1: SELECT - Apenas admins veem logs de auditoria
```sql
CREATE POLICY "audit_logs_select_policy" ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

#### Política 2: INSERT - Service role insere automaticamente
```sql
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
```

**Explicação**: INSERT é permitido para todos autenticados porque é feito via triggers automáticos.

---

## 🚀 PARTE 3: Como Aplicar as Políticas

### Opção 1: Via Interface do Supabase (Recomendado para Storage)

#### Para Storage Buckets:
1. Acesse **Storage** no menu lateral
2. Clique no bucket desejado (`client-documents` ou `profile-photos`)
3. Clique na aba **Policies**
4. Clique em **New Policy**
5. Escolha o tipo de operação (SELECT, INSERT, UPDATE, DELETE)
6. Cole o SQL da política correspondente
7. Clique em **Review** e depois **Save Policy**

### Opção 2: Via SQL Editor (Recomendado para Tabelas)

1. Acesse **SQL Editor** no menu lateral do Supabase
2. Cole todo o script SQL de uma vez
3. Clique em **Run** (ou F5)

#### Script Completo para Copiar/Colar:

```sql
-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA: users
-- ============================================

-- SELECT: Ver próprio perfil ou todos (se admin/operator)
CREATE POLICY "users_select_policy" ON users
FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'operator')
  )
);

-- INSERT: Apenas admins criam usuários
CREATE POLICY "users_insert_policy" ON users
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- UPDATE: Atualizar próprio perfil ou todos (se admin)
CREATE POLICY "users_update_policy" ON users
FOR UPDATE TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- DELETE: Apenas admins deletam
CREATE POLICY "users_delete_policy" ON users
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- ============================================
-- POLÍTICAS PARA: clients
-- ============================================

-- SELECT: Ver próprios dados ou todos (se admin/operator)
CREATE POLICY "clients_select_policy" ON clients
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- INSERT: Cliente ou operador pode inserir
CREATE POLICY "clients_insert_policy" ON clients
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- UPDATE: Cliente atualiza seus dados, operador atualiza todos
CREATE POLICY "clients_update_policy" ON clients
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- ============================================
-- POLÍTICAS PARA: contracts
-- ============================================

-- SELECT: Cliente vê seus contratos, operador vê todos
CREATE POLICY "contracts_select_policy" ON contracts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = contracts.client_id
    AND clients.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- INSERT: Apenas operadores criam contratos
CREATE POLICY "contracts_insert_policy" ON contracts
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- UPDATE: Apenas operadores atualizam contratos
CREATE POLICY "contracts_update_policy" ON contracts
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- DELETE: Apenas admins deletam contratos
CREATE POLICY "contracts_delete_policy" ON contracts
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- ============================================
-- POLÍTICAS PARA: installments
-- ============================================

-- SELECT: Cliente vê suas parcelas, operador vê todas
CREATE POLICY "installments_select_policy" ON installments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM contracts
    INNER JOIN clients ON clients.id = contracts.client_id
    WHERE contracts.id = installments.contract_id
    AND clients.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- INSERT: Apenas operadores criam parcelas
CREATE POLICY "installments_insert_policy" ON installments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- UPDATE: Apenas operadores atualizam parcelas
CREATE POLICY "installments_update_policy" ON installments
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- ============================================
-- POLÍTICAS PARA: payments
-- ============================================

-- SELECT: Cliente vê seus pagamentos, operador vê todos
CREATE POLICY "payments_select_policy" ON payments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM installments
    INNER JOIN contracts ON contracts.id = installments.contract_id
    INNER JOIN clients ON clients.id = contracts.client_id
    WHERE installments.id = payments.installment_id
    AND clients.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- INSERT: Apenas operadores registram pagamentos
CREATE POLICY "payments_insert_policy" ON payments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- UPDATE: Apenas operadores atualizam pagamentos
CREATE POLICY "payments_update_policy" ON payments
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role IN ('admin', 'operator')
  )
);

-- ============================================
-- POLÍTICAS PARA: audit_logs
-- ============================================

-- SELECT: Apenas admins veem logs
CREATE POLICY "audit_logs_select_policy" ON audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- INSERT: Permitir inserção automática via triggers
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);
```

---

## ✅ VERIFICAÇÃO FINAL

Após aplicar todas as políticas, teste:

### 1. Teste de Upload de Documentos (Cliente):
- Faça login como cliente
- Acesse a página de primeiro acesso
- Tente fazer upload de um documento
- ✅ Deve funcionar sem erros

### 2. Teste de Leitura de Dados (Cliente):
- Faça login como cliente
- Acesse o portal do cliente
- ✅ Deve ver apenas seus próprios dados

### 3. Teste de Gestão (Operador):
- Faça login como operador
- Acesse a página de clientes
- ✅ Deve ver todos os clientes

### 4. Teste de Administração (Admin):
- Faça login como admin
- Acesse todas as páginas
- ✅ Deve ter acesso total

---

## 🔧 TROUBLESHOOTING

### Erro: "new row violates row-level security policy"
**Solução**: Verifique se a política `WITH CHECK` está configurada corretamente para a operação INSERT/UPDATE.

### Erro: "permission denied for table X"
**Solução**: Certifique-se de que RLS está habilitado: `ALTER TABLE X ENABLE ROW LEVEL SECURITY;`

### Storage retorna erro 403
**Solução**: Verifique se as políticas do bucket foram criadas corretamente e se o bucket está em modo "Public" ou tem políticas configuradas.

---

## 📝 NOTAS IMPORTANTES

1. **Service Role Key**: As operações feitas pela Edge Function usando `SUPABASE_SERVICE_ROLE_KEY` IGNORAM todas as políticas RLS. Use-a apenas no backend!

2. **Anon Key**: As operações feitas com `SUPABASE_ANON_KEY` do frontend RESPEITAM todas as políticas RLS.

3. **Ordem de Aplicação**: Aplique primeiro as políticas de tabelas, depois as de storage.

4. **Teste Incremental**: Após aplicar cada política, teste a funcionalidade correspondente antes de continuar.

5. **Backup**: Antes de aplicar, faça backup do banco de dados no Supabase Dashboard.

---

🎉 **Pronto!** Seu sistema agora está com segurança nível produção configurada corretamente!
