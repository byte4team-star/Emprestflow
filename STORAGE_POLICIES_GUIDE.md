# 🗂️ Guia Rápido: Configurar Políticas de Storage

## ⚠️ IMPORTANTE
Os buckets de Storage no Supabase precisam de políticas separadas. Estas **NÃO** podem ser criadas via SQL - você precisa usar a interface do Dashboard.

---

## 📦 BUCKET 1: `client-documents`

### Passo a Passo:

1. **Acesse o Supabase Dashboard** → **Storage** → **client-documents**
2. Clique na aba **Policies** (no topo)
3. Crie as 3 políticas abaixo:

---

### ✅ Política 1: UPLOAD de Documentos

**Nome da Política:** `Clientes podem fazer upload dos próprios documentos`

**Operação:** `INSERT`

**Target roles:** `authenticated`

**Policy definition (SQL):**
```sql
(auth.uid() IS NOT NULL)
AND (bucket_id = 'client-documents')
AND ((storage.foldername(name))[1] = auth.uid()::text)
```

**Explicação:** Permite que clientes façam upload apenas em pastas com seu próprio user ID.

---

### ✅ Política 2: VISUALIZAR Documentos

**Nome da Política:** `Clientes veem seus docs, operadores veem todos`

**Operação:** `SELECT`

**Target roles:** `authenticated`

**Policy definition (SQL):**
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

**Explicação:** 
- Clientes veem apenas seus próprios documentos
- Admins e operadores veem todos os documentos

---

### ✅ Política 3: DELETAR Documentos

**Nome da Política:** `Apenas admins podem deletar documentos`

**Operação:** `DELETE`

**Target roles:** `authenticated`

**Policy definition (SQL):**
```sql
EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = auth.uid()
  AND users.role = 'admin'
)
```

**Explicação:** Somente administradores podem deletar documentos.

---

## 📸 BUCKET 2: `profile-photos`

### Passo a Passo:

1. **Acesse o Supabase Dashboard** → **Storage** → **profile-photos**
2. Clique na aba **Policies** (no topo)
3. Crie as 3 políticas abaixo:

---

### ✅ Política 1: UPLOAD de Fotos de Perfil

**Nome da Política:** `Clientes podem fazer upload da própria foto`

**Operação:** `INSERT`

**Target roles:** `authenticated`

**Policy definition (SQL):**
```sql
(auth.uid() IS NOT NULL)
AND (bucket_id = 'profile-photos')
AND ((storage.foldername(name))[1] = auth.uid()::text)
```

---

### ✅ Política 2: VISUALIZAR Fotos de Perfil

**Nome da Política:** `Todos autenticados podem ver fotos de perfil`

**Operação:** `SELECT`

**Target roles:** `authenticated`

**Policy definition (SQL):**
```sql
(auth.uid() IS NOT NULL)
```

**Explicação:** Fotos de perfil são visíveis para qualquer usuário autenticado no sistema.

---

### ✅ Política 3: ATUALIZAR Foto de Perfil

**Nome da Política:** `Clientes podem atualizar própria foto`

**Operação:** `UPDATE`

**Target roles:** `authenticated`

**Policy definition (SQL):**
```sql
(auth.uid() IS NOT NULL)
AND ((storage.foldername(name))[1] = auth.uid()::text)
```

---

### ✅ Política 4: DELETAR Foto de Perfil

**Nome da Política:** `Clientes podem deletar própria foto, admins deletam todas`

**Operação:** `DELETE`

**Target roles:** `authenticated`

**Policy definition (SQL):**
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

---

## 🎬 Tutorial em Vídeo (Passo a Passo)

### Como criar uma política de Storage:

1. **Dashboard → Storage → [nome-do-bucket]**
2. **Clique na aba "Policies"**
3. **Clique no botão "New Policy"**
4. **Preencha os campos:**
   - **Policy name:** Cole o nome da política
   - **Policy command:** Escolha a operação (SELECT, INSERT, UPDATE, DELETE)
   - **Target roles:** Selecione `authenticated`
   - **Policy definition:** Cole o código SQL
5. **Clique em "Review"**
6. **Clique em "Save policy"**
7. **Repita para cada política**

---

## ✅ Checklist de Verificação

Após configurar tudo, verifique:

### Bucket: client-documents
- [ ] Política INSERT criada ✓
- [ ] Política SELECT criada ✓
- [ ] Política DELETE criada ✓

### Bucket: profile-photos
- [ ] Política INSERT criada ✓
- [ ] Política SELECT criada ✓
- [ ] Política UPDATE criada ✓
- [ ] Política DELETE criada ✓

---

## 🧪 Como Testar

### Teste 1: Upload de Documento (Cliente)
1. Faça login como cliente
2. Vá para "Complete seu Cadastro"
3. Tente fazer upload de um documento
4. ✅ **Esperado:** Upload bem-sucedido sem erros

### Teste 2: Visualização de Documentos (Cliente)
1. Faça login como cliente
2. Acesse o portal do cliente
3. ✅ **Esperado:** Vê apenas seus próprios documentos

### Teste 3: Visualização de Documentos (Operador)
1. Faça login como operador
2. Acesse a lista de clientes
3. Clique em um cliente
4. ✅ **Esperado:** Vê todos os documentos do cliente

---

## 🚨 Problemas Comuns

### Erro: "new row violates row-level security policy for table"
**Causa:** As políticas das **TABELAS** não foram aplicadas.
**Solução:** Execute o script `/supabase/policies.sql` no SQL Editor.

### Erro: "storage/unauthorized" ou 403
**Causa:** As políticas dos **BUCKETS** não foram criadas.
**Solução:** Siga este guia e crie as políticas manualmente no Dashboard.

### Erro: "Bucket not found"
**Causa:** Os buckets não foram criados.
**Solução:** 
1. Vá em Storage
2. Clique em "New bucket"
3. Crie os buckets `client-documents` e `profile-photos`
4. Defina ambos como **Private** (não Public)

### Erro: "cannot read property 'foldername' of undefined"
**Causa:** Erro de sintaxe na política.
**Solução:** Copie e cole EXATAMENTE o SQL fornecido acima.

---

## 📊 Estrutura de Pastas no Storage

Os arquivos são organizados assim:

```
client-documents/
  └── {user_id}/
       ├── document_photo_1_{timestamp}.jpg
       ├── document_photo_2_{timestamp}.jpg
       ├── document_photo_3_{timestamp}.jpg
       ├── document_photo_4_{timestamp}.jpg
       ├── document_photo_5_{timestamp}.jpg
       ├── document_photo_6_{timestamp}.jpg
       ├── document_video_1_{timestamp}.mp4
       └── document_video_2_{timestamp}.mp4

profile-photos/
  └── {user_id}/
       └── profile_{timestamp}.jpg
```

**Nota:** `{user_id}` é o UUID do usuário no `auth.users`.

---

## 🔐 Segurança: Por que essas políticas?

1. **Isolamento de Dados:** Cada cliente vê apenas seus próprios arquivos
2. **Controle de Acesso:** Operadores têm acesso aos dados de todos os clientes para gestão
3. **Prevenção de Vazamento:** Impossível acessar documentos de outros usuários
4. **Auditoria:** Todos os acessos são registrados pelo Supabase
5. **LGPD Compliance:** Apenas pessoas autorizadas acessam dados pessoais

---

## 🎯 Próximos Passos

Após configurar as políticas:

1. ✅ Execute o script SQL das tabelas
2. ✅ Configure as políticas dos buckets manualmente
3. ✅ Teste o upload de documentos
4. ✅ Teste o acesso como cliente
5. ✅ Teste o acesso como operador
6. ✅ Faça o deploy da Edge Function atualizada

---

## 💡 Dica Pro

Para facilitar o desenvolvimento, você pode criar uma política temporária mais permissiva e depois restringi-la:

**Política de Desenvolvimento (REMOVA EM PRODUÇÃO):**
```sql
-- APENAS PARA TESTES - NÃO USE EM PRODUÇÃO
(auth.uid() IS NOT NULL)
```

Esta política permite que qualquer usuário autenticado acesse qualquer arquivo. **Lembre-se de removê-la antes de colocar em produção!**

---

✅ **Tudo pronto!** Suas políticas de Storage estão configuradas com segurança nível produção!
