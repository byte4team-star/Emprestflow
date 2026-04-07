# ✅ Checklist de Implementação - Políticas de Segurança

## 🎯 Objetivo
Configurar todas as políticas RLS (Row Level Security) e Storage Policies para que o sistema funcione corretamente em produção.

---

## 📋 FASE 1: Preparação (5 minutos)

- [ ] Abrir o Supabase Dashboard
- [ ] Fazer backup do banco de dados (Settings → Database → Backup)
- [ ] Abrir o SQL Editor (no menu lateral)
- [ ] Ter os arquivos prontos:
  - `/supabase/policies.sql` ✓
  - `/STORAGE_POLICIES_GUIDE.md` ✓
  - `/SUPABASE_POLICIES_SETUP.md` ✓

---

## 📋 FASE 2: Políticas das Tabelas (10 minutos)

### Passo 1: Executar Script SQL

- [ ] 1. Ir em **SQL Editor** no Supabase Dashboard
- [ ] 2. Clicar em **New Query**
- [ ] 3. Copiar TODO o conteúdo de `/supabase/policies.sql`
- [ ] 4. Colar no editor
- [ ] 5. Clicar em **RUN** (ou F5)
- [ ] 6. Verificar se aparece "Success" ✅

### Passo 2: Verificar Criação das Políticas

- [ ] 7. Rolar até o final do resultado
- [ ] 8. Verificar se aparecem as tabelas:
  ```
  users          | rls_enabled: true
  clients        | rls_enabled: true
  contracts      | rls_enabled: true
  installments   | rls_enabled: true
  payments       | rls_enabled: true
  audit_logs     | rls_enabled: true
  ```
- [ ] 9. Verificar se aparecem as políticas criadas (cerca de 25 políticas)

---

## 📋 FASE 3: Criar Buckets de Storage (5 minutos)

### Verificar se os buckets existem:

- [ ] 1. Ir em **Storage** no menu lateral
- [ ] 2. Verificar se existe o bucket `client-documents`
- [ ] 3. Verificar se existe o bucket `profile-photos`

### Se NÃO existirem, criar:

#### Criar bucket: client-documents
- [ ] 4. Clicar em **New bucket**
- [ ] 5. Nome: `client-documents`
- [ ] 6. Selecionar: **Private** (não Public)
- [ ] 7. Clicar em **Create bucket**

#### Criar bucket: profile-photos
- [ ] 8. Clicar em **New bucket**
- [ ] 9. Nome: `profile-photos`
- [ ] 10. Selecionar: **Private** (não Public)
- [ ] 11. Clicar em **Create bucket**

---

## 📋 FASE 4: Políticas do Bucket `client-documents` (15 minutos)

### Acessar o bucket:
- [ ] 1. Ir em **Storage** → **client-documents**
- [ ] 2. Clicar na aba **Policies** (no topo)

### Política 1: INSERT (Upload)
- [ ] 3. Clicar em **New Policy**
- [ ] 4. Escolher **For full customization**
- [ ] 5. Preencher:
  - **Policy name:** `Clientes podem fazer upload dos próprios documentos`
  - **Policy command:** `INSERT`
  - **Target roles:** `authenticated` ✓
- [ ] 6. Colar no campo **Policy definition:**
  ```sql
  (auth.uid() IS NOT NULL)
  AND (bucket_id = 'client-documents')
  AND ((storage.foldername(name))[1] = auth.uid()::text)
  ```
- [ ] 7. Clicar em **Review** → **Save policy**

### Política 2: SELECT (Visualizar)
- [ ] 8. Clicar em **New Policy**
- [ ] 9. Escolher **For full customization**
- [ ] 10. Preencher:
  - **Policy name:** `Clientes veem seus docs, operadores veem todos`
  - **Policy command:** `SELECT`
  - **Target roles:** `authenticated` ✓
- [ ] 11. Colar no campo **Policy definition:**
  ```sql
  (auth.uid() IS NOT NULL)
  AND (
    ((storage.foldername(name))[1] = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  )
  ```
- [ ] 12. Clicar em **Review** → **Save policy**

### Política 3: DELETE (Deletar)
- [ ] 13. Clicar em **New Policy**
- [ ] 14. Escolher **For full customization**
- [ ] 15. Preencher:
  - **Policy name:** `Apenas admins podem deletar documentos`
  - **Policy command:** `DELETE`
  - **Target roles:** `authenticated` ✓
- [ ] 16. Colar no campo **Policy definition:**
  ```sql
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  ```
- [ ] 17. Clicar em **Review** → **Save policy**

---

## 📋 FASE 5: Políticas do Bucket `profile-photos` (15 minutos)

### Acessar o bucket:
- [ ] 1. Ir em **Storage** → **profile-photos**
- [ ] 2. Clicar na aba **Policies** (no topo)

### Política 1: INSERT (Upload)
- [ ] 3. Clicar em **New Policy**
- [ ] 4. Escolher **For full customization**
- [ ] 5. Preencher:
  - **Policy name:** `Clientes podem fazer upload da própria foto`
  - **Policy command:** `INSERT`
  - **Target roles:** `authenticated` ✓
- [ ] 6. Colar no campo **Policy definition:**
  ```sql
  (auth.uid() IS NOT NULL)
  AND (bucket_id = 'profile-photos')
  AND ((storage.foldername(name))[1] = auth.uid()::text)
  ```
- [ ] 7. Clicar em **Review** → **Save policy**

### Política 2: SELECT (Visualizar)
- [ ] 8. Clicar em **New Policy**
- [ ] 9. Escolher **For full customization**
- [ ] 10. Preencher:
  - **Policy name:** `Todos autenticados podem ver fotos de perfil`
  - **Policy command:** `SELECT`
  - **Target roles:** `authenticated` ✓
- [ ] 11. Colar no campo **Policy definition:**
  ```sql
  (auth.uid() IS NOT NULL)
  ```
- [ ] 12. Clicar em **Review** → **Save policy**

### Política 3: UPDATE (Atualizar)
- [ ] 13. Clicar em **New Policy**
- [ ] 14. Escolher **For full customization**
- [ ] 15. Preencher:
  - **Policy name:** `Clientes podem atualizar própria foto`
  - **Policy command:** `UPDATE`
  - **Target roles:** `authenticated` ✓
- [ ] 16. Colar no campo **Policy definition:**
  ```sql
  (auth.uid() IS NOT NULL)
  AND ((storage.foldername(name))[1] = auth.uid()::text)
  ```
- [ ] 17. Clicar em **Review** → **Save policy**

### Política 4: DELETE (Deletar)
- [ ] 18. Clicar em **New Policy**
- [ ] 19. Escolher **For full customization**
- [ ] 20. Preencher:
  - **Policy name:** `Clientes podem deletar própria foto, admins deletam todas`
  - **Policy command:** `DELETE`
  - **Target roles:** `authenticated` ✓
- [ ] 21. Colar no campo **Policy definition:**
  ```sql
  (auth.uid() IS NOT NULL)
  AND (
    ((storage.foldername(name))[1] = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  ```
- [ ] 22. Clicar em **Review** → **Save policy**

---

## 📋 FASE 6: Verificação e Testes (20 minutos)

### Verificação das Políticas:

#### Tabelas:
- [ ] 1. Ir em **Database** → **Policies**
- [ ] 2. Verificar se existem políticas para:
  - [ ] `users` (4 políticas)
  - [ ] `clients` (4 políticas)
  - [ ] `contracts` (4 políticas)
  - [ ] `installments` (4 políticas)
  - [ ] `payments` (4 políticas)
  - [ ] `audit_logs` (2 políticas)

#### Storage:
- [ ] 3. Ir em **Storage** → **client-documents** → **Policies**
- [ ] 4. Verificar 3 políticas (INSERT, SELECT, DELETE)
- [ ] 5. Ir em **Storage** → **profile-photos** → **Policies**
- [ ] 6. Verificar 4 políticas (INSERT, SELECT, UPDATE, DELETE)

### Testes Funcionais:

#### Teste 1: Login como Cliente
- [ ] 7. Fazer logout do sistema
- [ ] 8. Fazer login com um usuário de role `client`
- [ ] 9. Acessar "Complete seu Cadastro"
- [ ] 10. Tentar fazer upload de um documento
- [ ] 11. ✅ **Esperado:** Upload bem-sucedido

#### Teste 2: Login como Operador
- [ ] 12. Fazer logout
- [ ] 13. Fazer login com um usuário de role `operator`
- [ ] 14. Acessar a página de Clientes
- [ ] 15. ✅ **Esperado:** Ver lista de todos os clientes

#### Teste 3: Login como Admin
- [ ] 16. Fazer logout
- [ ] 17. Fazer login com um usuário de role `admin`
- [ ] 18. Acessar página de Usuários
- [ ] 19. Tentar criar um novo usuário
- [ ] 20. ✅ **Esperado:** Criação bem-sucedida

---

## 📋 FASE 7: Deploy da Edge Function (10 minutos)

- [ ] 1. Abrir o terminal no projeto
- [ ] 2. Navegar para a pasta `/supabase/functions/server`
- [ ] 3. Verificar se o arquivo `index.tsx` está atualizado
- [ ] 4. Executar o comando de deploy:
  ```bash
  supabase functions deploy server
  ```
- [ ] 5. Aguardar conclusão do deploy
- [ ] 6. Verificar se não há erros
- [ ] 7. Testar endpoint da API:
  ```bash
  curl https://SEU_PROJECT_ID.supabase.co/functions/v1/make-server-bd42bc02/health
  ```
- [ ] 8. ✅ **Esperado:** Resposta `{"status": "healthy"}`

---

## 🎯 RESUMO FINAL

### Total de Políticas Criadas:
- ✅ Tabelas: 26 políticas (6 tabelas)
- ✅ Storage Buckets: 7 políticas (2 buckets)
- **TOTAL: 33 políticas** 🎉

### Tempo Estimado Total:
- ⏱️ **Aproximadamente 80 minutos** (1h20min)

---

## 🚨 Troubleshooting

### Se algo der errado:

#### Erro ao executar SQL:
- Verificar se copiou o script completo
- Verificar se as tabelas existem no banco
- Verificar se não há políticas duplicadas

#### Erro no Storage:
- Verificar se o nome do bucket está correto
- Verificar se selecionou "Private" (não Public)
- Verificar se copiou o SQL completo da política

#### Erro no Upload de Arquivos:
- Abrir o Console do navegador (F12)
- Ver erro exato no console
- Verificar se políticas do Storage foram criadas
- Verificar se o usuário está autenticado

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs do Supabase:**
   - Dashboard → Logs → Functions
   - Dashboard → Logs → Storage

2. **Verificar console do navegador:**
   - F12 → Console
   - Procurar por erros em vermelho

3. **Re-executar scripts:**
   - Executar novamente `/supabase/policies.sql`
   - Verificar se as políticas foram criadas

---

✅ **Parabéns!** Seu sistema está configurado com segurança nível produção! 🚀
