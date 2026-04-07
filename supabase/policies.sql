-- ============================================
-- SCRIPT DE CONFIGURAÇÃO DE POLÍTICAS RLS
-- Sistema de Controle e Cobrança
-- ============================================
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Clique em RUN (F5)
-- ============================================

-- ============================================
-- PASSO 1: HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 2: REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- ============================================

-- Remover políticas da tabela users
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Remover políticas da tabela clients
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

-- Remover políticas da tabela contracts
DROP POLICY IF EXISTS "contracts_select_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_insert_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_update_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_delete_policy" ON contracts;

-- Remover políticas da tabela installments
DROP POLICY IF EXISTS "installments_select_policy" ON installments;
DROP POLICY IF EXISTS "installments_insert_policy" ON installments;
DROP POLICY IF EXISTS "installments_update_policy" ON installments;
DROP POLICY IF EXISTS "installments_delete_policy" ON installments;

-- Remover políticas da tabela payments
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;
DROP POLICY IF EXISTS "payments_delete_policy" ON payments;

-- Remover políticas da tabela audit_logs
DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;

-- ============================================
-- PASSO 3: CRIAR POLÍTICAS PARA TABELA: users
-- ============================================

-- SELECT: Usuários veem próprio perfil, admins/operadores veem todos
CREATE POLICY "users_select_policy" ON users
FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'operator')
  )
);

-- INSERT: Apenas admins podem criar novos usuários
CREATE POLICY "users_insert_policy" ON users
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- UPDATE: Usuários atualizam próprio perfil, admins atualizam todos
CREATE POLICY "users_update_policy" ON users
FOR UPDATE TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

-- DELETE: Apenas admins podem deletar usuários
CREATE POLICY "users_delete_policy" ON users
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- PASSO 4: CRIAR POLÍTICAS PARA TABELA: clients
-- ============================================

-- SELECT: Clientes veem próprios dados, operadores veem todos
CREATE POLICY "clients_select_policy" ON clients
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'operator')
  )
);

-- INSERT: Cliente pode inserir próprios dados, operadores podem inserir qualquer
CREATE POLICY "clients_insert_policy" ON clients
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'operator')
  )
);

-- UPDATE: Cliente atualiza próprios dados, operadores atualizam todos
CREATE POLICY "clients_update_policy" ON clients
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'operator')
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'operator')
  )
);

-- DELETE: Apenas admins podem deletar clientes
CREATE POLICY "clients_delete_policy" ON clients
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- PASSO 5: CRIAR POLÍTICAS PARA TABELA: contracts
-- ============================================

-- SELECT: Cliente vê seus contratos, operadores veem todos
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
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'operator')
  )
);

-- INSERT: Apenas operadores podem criar contratos
CREATE POLICY "contracts_insert_policy" ON contracts
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'operator')
  )
);

-- UPDATE: Apenas operadores podem atualizar contratos
CREATE POLICY "contracts_update_policy" ON contracts
FOR UPDATE TO authenticated
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

-- DELETE: Apenas admins podem deletar contratos
CREATE POLICY "contracts_delete_policy" ON contracts
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- PASSO 6: CRIAR POLÍTICAS PARA TABELA: installments
-- ============================================

-- SELECT: Cliente vê suas parcelas, operadores veem todas
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
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'operator')
  )
);

-- INSERT: Apenas operadores podem criar parcelas
CREATE POLICY "installments_insert_policy" ON installments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'operator')
  )
);

-- UPDATE: Apenas operadores podem atualizar parcelas
CREATE POLICY "installments_update_policy" ON installments
FOR UPDATE TO authenticated
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

-- DELETE: Apenas admins podem deletar parcelas
CREATE POLICY "installments_delete_policy" ON installments
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- PASSO 7: CRIAR POLÍTICAS PARA TABELA: payments
-- ============================================

-- SELECT: Cliente vê seus pagamentos, operadores veem todos
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
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'operator')
  )
);

-- INSERT: Apenas operadores podem registrar pagamentos
CREATE POLICY "payments_insert_policy" ON payments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'operator')
  )
);

-- UPDATE: Apenas operadores podem atualizar pagamentos
CREATE POLICY "payments_update_policy" ON payments
FOR UPDATE TO authenticated
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

-- DELETE: Apenas admins podem deletar pagamentos
CREATE POLICY "payments_delete_policy" ON payments
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- PASSO 8: CRIAR POLÍTICAS PARA TABELA: audit_logs
-- ============================================

-- SELECT: Apenas admins podem visualizar logs de auditoria
CREATE POLICY "audit_logs_select_policy" ON audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- INSERT: Permitir inserção automática (usado por triggers)
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se RLS está habilitado em todas as tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'clients', 'contracts', 'installments', 'payments', 'audit_logs')
ORDER BY tablename;

-- Listar todas as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- ✅ SCRIPT CONCLUÍDO COM SUCESSO!
-- ============================================
-- Próximos passos:
-- 1. Configure as políticas dos buckets de Storage manualmente
-- 2. Teste o sistema completo
-- 3. Verifique os logs de erro no frontend
-- ============================================
