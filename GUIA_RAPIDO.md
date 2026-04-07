# 🚀 Guia Rápido - Correção do Erro de Cadastro

## ❌ Problema
O sistema retorna erro ao completar cadastro porque as políticas de segurança do Supabase não foram configuradas.

## ✅ Solução em 3 Passos

---

## 🔹 PASSO 1: Configurar Políticas das Tabelas (10 min)

### O que fazer:
1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor** (menu lateral)
3. Copie TODO o conteúdo do arquivo `/supabase/policies.sql`
4. Cole no editor
5. Clique em **RUN** (F5)
6. Aguarde aparecer "Success" ✅

### Resultado esperado:
```
✅ 26 políticas criadas
✅ RLS habilitado em 6 tabelas
```

---

## 🔹 PASSO 2: Configurar Políticas do Storage (20 min)

### Bucket: `client-documents` (Documentos dos Clientes)

**Acessar:** Storage → client-documents → Policies

**Criar 3 políticas:**

#### Política 1 - INSERT (Upload)
```
Nome: Clientes podem fazer upload dos próprios documentos
Operação: INSERT
Target: authenticated
SQL:
(auth.uid() IS NOT NULL)
AND (bucket_id = 'client-documents')
AND ((storage.foldername(name))[1] = auth.uid()::text)
```

#### Política 2 - SELECT (Visualizar)
```
Nome: Clientes veem seus docs, operadores veem todos
Operação: SELECT
Target: authenticated
SQL:
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

#### Política 3 - DELETE (Deletar)
```
Nome: Apenas admins podem deletar documentos
Operação: DELETE
Target: authenticated
SQL:
EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = auth.uid()
  AND users.role = 'admin'
)
```

---

### Bucket: `profile-photos` (Fotos de Perfil)

**Acessar:** Storage → profile-photos → Policies

**Criar 4 políticas:**

#### Política 1 - INSERT
```
Nome: Clientes podem fazer upload da própria foto
Operação: INSERT
Target: authenticated
SQL:
(auth.uid() IS NOT NULL)
AND (bucket_id = 'profile-photos')
AND ((storage.foldername(name))[1] = auth.uid()::text)
```

#### Política 2 - SELECT
```
Nome: Todos autenticados podem ver fotos de perfil
Operação: SELECT
Target: authenticated
SQL:
(auth.uid() IS NOT NULL)
```

#### Política 3 - UPDATE
```
Nome: Clientes podem atualizar própria foto
Operação: UPDATE
Target: authenticated
SQL:
(auth.uid() IS NOT NULL)
AND ((storage.foldername(name))[1] = auth.uid()::text)
```

#### Política 4 - DELETE
```
Nome: Clientes podem deletar própria foto, admins deletam todas
Operação: DELETE
Target: authenticated
SQL:
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

## 🔹 PASSO 3: Testar o Sistema (5 min)

### Teste de Upload:
1. Faça login como **cliente**
2. Acesse "Complete seu Cadastro"
3. Tente fazer upload de um documento
4. ✅ **Esperado:** Upload bem-sucedido

### Teste de Visualização:
1. Faça login como **operador**
2. Acesse "Clientes"
3. Veja a lista de clientes
4. ✅ **Esperado:** Lista visível

---

## 📊 Resumo do que será configurado:

```
┌─────────────────────────────────────────┐
│  TABELAS DO BANCO DE DADOS              │
├─────────────────────────────────────────┤
│  ✅ users         (4 políticas)         │
│  ✅ clients       (4 políticas)         │
│  ✅ contracts     (4 políticas)         │
│  ✅ installments  (4 políticas)         │
│  ✅ payments      (4 políticas)         │
│  ✅ audit_logs    (2 políticas)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  BUCKETS DE STORAGE                     │
├─────────────────────────────────────────┤
│  ✅ client-documents   (3 políticas)    │
│  ✅ profile-photos     (4 políticas)    │
└─────────────────────────────────────────┘

TOTAL: 33 POLÍTICAS DE SEGURANÇA
```

---

## 🎯 Arquivos de Referência

- **Script SQL completo:** `/supabase/policies.sql`
- **Guia detalhado Storage:** `/STORAGE_POLICIES_GUIDE.md`
- **Documentação completa:** `/SUPABASE_POLICIES_SETUP.md`
- **Checklist passo a passo:** `/IMPLEMENTACAO_CHECKLIST.md`

---

## ⚡ Atalhos Rápidos

### Para aplicar políticas de TABELAS:
```
Dashboard → SQL Editor → Colar script → RUN
```

### Para aplicar políticas de STORAGE:
```
Dashboard → Storage → [bucket] → Policies → New Policy
```

---

## 🔐 O que cada política faz?

### Tabelas:
- **SELECT:** Define quem pode VER dados
- **INSERT:** Define quem pode CRIAR registros
- **UPDATE:** Define quem pode ALTERAR registros
- **DELETE:** Define quem pode REMOVER registros

### Storage:
- **SELECT:** Define quem pode BAIXAR arquivos
- **INSERT:** Define quem pode FAZER UPLOAD
- **UPDATE:** Define quem pode SUBSTITUIR arquivos
- **DELETE:** Define quem pode REMOVER arquivos

---

## 🚨 Erros Comuns

### "new row violates row-level security policy"
**Causa:** Políticas das tabelas não foram aplicadas  
**Solução:** Execute o script `/supabase/policies.sql`

### "storage/unauthorized" ou erro 403
**Causa:** Políticas dos buckets não foram criadas  
**Solução:** Configure manualmente no Dashboard conforme este guia

### "Bucket not found"
**Causa:** Os buckets não existem  
**Solução:** Crie os buckets `client-documents` e `profile-photos` em Storage

---

## ⏱️ Tempo Estimado Total

- Passo 1 (Tabelas): **10 minutos**
- Passo 2 (Storage): **20 minutos**
- Passo 3 (Testes): **5 minutos**
- **TOTAL: ~35 minutos**

---

## ✅ Checklist Rápido

- [ ] Executei o script SQL das tabelas
- [ ] Criei 3 políticas para `client-documents`
- [ ] Criei 4 políticas para `profile-photos`
- [ ] Testei o upload de documentos
- [ ] Testei o acesso como operador
- [ ] Sistema funcionando sem erros! 🎉

---

## 🎓 Entendendo o Conceito

**RLS (Row Level Security)** = Controle de quem vê/altera cada linha da tabela

**Storage Policies** = Controle de quem faz upload/download de arquivos

**Por que preciso disso?**
- Segurança nível produção
- Compliance com LGPD
- Isolamento de dados entre clientes
- Controle de acesso granular

**Analogia:**
É como ter um prédio com apartamentos:
- Cada cliente só entra no seu próprio apartamento (RLS)
- Apenas o síndico (operador) tem chave master
- Apenas o dono (admin) pode alterar o prédio

---

## 📞 Precisa de Ajuda?

Consulte os arquivos detalhados:
- **Documentação completa:** `/SUPABASE_POLICIES_SETUP.md`
- **Checklist completo:** `/IMPLEMENTACAO_CHECKLIST.md`
- **Guia Storage:** `/STORAGE_POLICIES_GUIDE.md`

---

🚀 **Pronto para começar?** Siga o **PASSO 1** acima!
