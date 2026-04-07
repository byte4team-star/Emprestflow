# 🔍 DEBUG: Investigação de Fotos e Vídeos Não Aparecendo

## 📋 Checklist de Investigação

Execute cada passo em ordem e anote os resultados:

---

## **PASSO 1: Verificar Logs do Frontend** ✅

### 1.1. Abra DevTools (F12) → Console

### 1.2. Acesse a página de detalhes de um cliente

```
/clients/<client_id>
```

### 1.3. Procure pelos seguintes logs:

```
🔍 [ClientDetails] Loading client: <client_id>
📦 [ClientDetails] API Response: {...}
👤 [ClientDetails] Client data: {...}
📄 [ClientDetails] Documents object: {...}
```

### 1.4. Para cada foto (foto1 a foto6), verifique:

```javascript
📷 [ClientDetails] foto1: {
  exists: true/false,        // ← Documento existe?
  type: "object"/"string",   // ← Formato (novo/legado)?
  isObject: true/false,      // ← É objeto?
  hasUrl: true/false,        // ← Tem URL?
  hasPath: true/false,       // ← Tem path?
  url: "https://...",        // ← URL completa
  fullDoc: {...}             // ← Documento completo
}
```

### 1.5. Para cada vídeo (video1, video2), verifique:

```javascript
🎥 [ClientDetails] video1: {
  exists: true/false,
  type: "object"/"string",
  hasUrl: true/false,
  url: "https://...",
  fullDoc: {...}
}
```

---

## **PASSO 2: Verificar Logs do Backend** ✅

### 2.1. Acesse os logs do Supabase

**Via Dashboard:**
```
https://supabase.com/dashboard/project/<PROJECT_ID>/functions/make-server/logs
```

**Via CLI:**
```bash
supabase functions logs make-server --follow
```

### 2.2. Procure pelos seguintes logs:

```
[CLIENT_GET] Loading client <client_id>, has documents: true
[CLIENT_GET] Generating signed URL for foto1, path: <path>
[CLIENT_GET] ✓ Signed URL generated for foto1
```

### 2.3. Verifique se há erros:

```
❌ [CLIENT_GET] File not found in storage: <path>
❌ [CLIENT_GET] Error generating signed URL for foto1: <error>
```

### 2.4. Veja o log final antes do retorno:

```
[CLIENT_GET] ✅ Returning client <client_id> with documents: ["foto1", "foto2", "video1"]
[CLIENT_GET] foto1 URL: https://...supabase.co/storage/v1/object/sign/make-bd42bc02-documents/...
[CLIENT_GET] foto2 URL: https://...supabase.co/storage/v1/object/sign/make-bd42bc02-documents/...
```

---

## **PASSO 3: Testar URL Manualmente** 🧪

### 3.1. Copie a URL de uma foto dos logs

Exemplo:
```
https://h6ns2b7kryo4rqu6.supabase.co/storage/v1/object/sign/make-bd42bc02-documents/client_abc123/foto1.jpg?token=eyJhbGc...
```

### 3.2. Cole no navegador e tente abrir

**✅ Se abrir a imagem:**
- Backend está funcionando
- Storage está OK
- Problema está no frontend (renderização)

**❌ Se NÃO abrir:**
- Veja a mensagem de erro
- Possíveis erros:
  - `404 Not Found` → Arquivo não existe no storage
  - `403 Forbidden` → Problema de permissão
  - `Invalid JWT` / `Token expired` → URL expirou (normal após 1h)
  - `SignatureDoesNotMatch` → Problema na geração da URL assinada

---

## **PASSO 4: Verificar Storage no Supabase** 📦

### 4.1. Acesse o Supabase Dashboard

```
https://supabase.com/dashboard/project/<PROJECT_ID>/storage/buckets/make-bd42bc02-documents
```

### 4.2. Navegue nas pastas

Estrutura esperada:
```
make-bd42bc02-documents/
  ├── client_abc123/
  │   ├── foto1.jpg
  │   ├── foto2.jpg
  │   ├── foto3.jpg
  │   ├── foto4.jpg
  │   ├── video1.mp4
  │   └── ...
  ├── client_xyz456/
  │   └── ...
```

### 4.3. Verifique se os arquivos existem

**✅ Se arquivos existem:**
- Anote os nomes exatos (case-sensitive!)
- Anote a estrutura de pastas

**❌ Se arquivos NÃO existem:**
- **CAUSA RAIZ ENCONTRADA:** Arquivos nunca foram enviados
- Solução: fazer upload dos documentos

### 4.4. Verifique os nomes dos arquivos

Compare com o que está no banco de dados (KV Store):
- Nome no storage: `foto1.jpg`
- Nome no banco: `foto1.jpg` ou `foto1.jpeg` ou `Foto1.jpg`?

⚠️ **IMPORTANTE:** Nomes devem ser **exatamente iguais** (case-sensitive)

---

## **PASSO 5: Verificar Banco de Dados (KV Store)** 💾

### 5.1. Via Supabase SQL Editor

```sql
SELECT * FROM kv_store_bd42bc02 
WHERE key LIKE 'client:%' 
LIMIT 10;
```

### 5.2. Procure por um cliente específico

```sql
SELECT * FROM kv_store_bd42bc02 
WHERE key = 'client:<client_id>';
```

### 5.3. Copie o valor da coluna `value` e cole em um JSON formatter

```json
{
  "id": "client_abc123",
  "fullName": "João Silva",
  "documents": {
    "foto1": {
      "path": "client_abc123/foto1.jpg",
      "fileName": "foto1.jpg",
      "mimeType": "image/jpeg",
      "size": 123456,
      "uploadedAt": "2026-04-01T10:00:00Z"
    },
    "video1": {
      "path": "client_abc123/video1.mp4",
      "fileName": "video1.mp4",
      "mimeType": "video/mp4",
      "size": 5000000,
      "uploadedAt": "2026-04-01T10:05:00Z"
    }
  }
}
```

### 5.4. Verifique:

- [ ] `documents` existe?
- [ ] `foto1`, `foto2`, etc. existem?
- [ ] Cada documento tem `path`?
- [ ] O `path` está correto? (ex: `client_abc123/foto1.jpg`)

---

## **PASSO 6: Verificar Frontend (Renderização)** 🎨

### 6.1. Inspecione o HTML

Abra DevTools → Elements → Procure por:

```html
<!-- Fotos -->
<a href="https://...supabase.co/storage/..." target="_blank">Ver foto</a>

<!-- Vídeos -->
<a href="https://...supabase.co/storage/..." target="_blank">🎬 Ver vídeo</a>
```

### 6.2. Verifique se os links existem

**✅ Se links existem:**
- Clique no link e veja se abre

**❌ Se links NÃO existem:**
- Veja a lógica de renderização no código
- Verifique se `hasDocument` é `true`
- Verifique se `documentUrl` está definida

### 6.3. Verifique o estado do React

No console do DevTools, execute:

```javascript
// Pegar o estado do cliente no React
const clientState = document.querySelector('[data-client-id]');
console.log('Client state:', clientState);
```

---

## **DIAGNÓSTICO: Principais Causas** 🩺

### **Causa 1: Arquivos não existem no Storage** ❌

**Sintomas:**
- Backend loga: `File not found in storage`
- Storage Dashboard está vazio
- URLs retornam 404

**Solução:**
1. Fazer upload dos documentos
2. Usar formulário de cadastro/edição de cliente
3. Verificar limites: 5MB/foto, 10MB/vídeo

---

### **Causa 2: Path incorreto no banco de dados** ❌

**Sintomas:**
- Arquivo existe no storage com nome `foto1.jpg`
- Banco tem `path: "foto1.JPG"` (case diferente)
- Backend loga: `File not found in storage`

**Solução:**
1. Corrigir path no banco de dados
2. Garantir case-sensitivity correto
3. Re-upload do arquivo

---

### **Causa 3: URLs assinadas expiraram** ⏰

**Sintomas:**
- Backend gera URL corretamente
- Frontend recebe URL
- Ao clicar, retorna erro `Token expired` ou `InvalidJWT`

**Solução:**
1. Clicar em "Atualizar Documentos"
2. URLs são regeneradas automaticamente
3. Válidas por 1 hora

---

### **Causa 4: Storage Bucket não existe** 🪣

**Sintomas:**
- Backend retorna erro ao gerar signed URL
- Storage Dashboard não mostra bucket `make-bd42bc02-documents`

**Solução:**
```typescript
// No backend, criar bucket se não existir:
const { data: buckets } = await supabaseAdmin.storage.listBuckets();
const bucketExists = buckets?.some(b => b.name === 'make-bd42bc02-documents');

if (!bucketExists) {
  await supabaseAdmin.storage.createBucket('make-bd42bc02-documents', {
    public: false,
    fileSizeLimit: 10485760 // 10MB
  });
}
```

---

### **Causa 5: Frontend não atualiza após fetch** 🔄

**Sintomas:**
- Backend retorna dados corretos
- Console mostra URLs corretas
- Interface não mostra links "Ver foto"

**Solução:**
```typescript
// Verificar se setState foi chamado:
setClient(data.client); // ← Isso deve atualizar o estado

// Verificar se render usa o estado atualizado:
const document = client.documents?.[type]; // ← Deve ter os dados
```

---

### **Causa 6: Políticas de Storage bloqueando acesso** 🔒

**Sintomas:**
- URLs retornam 403 Forbidden
- Mesmo com signed URL

**Solução:**
```sql
-- No Supabase SQL Editor:
-- Criar política para service_role ler todos os arquivos
CREATE POLICY "Service role can read all documents"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'make-bd42bc02-documents');
```

---

## **RESUMO DO DEBUG** 📊

Preencha conforme você investiga:

```
✅/❌ Frontend recebe dados da API?
✅/❌ Documents object existe?
✅/❌ Fotos/vídeos têm URLs?
✅/❌ URLs abrem no navegador?
✅/❌ Arquivos existem no Storage?
✅/❌ Paths no banco estão corretos?
✅/❌ Bucket existe?
✅/❌ Políticas de Storage OK?
```

---

## **PRÓXIMA AÇÃO** 🎯

Após executar todos os passos acima, você terá:

1. **Logs do frontend** com estrutura de dados
2. **Logs do backend** com geração de URLs
3. **Teste manual de URLs**
4. **Verificação do Storage**
5. **Verificação do banco de dados**

**Me envie:**
- ✅ Quais passos passaram
- ❌ Qual passo falhou (com logs/screenshots)
- 📋 Resultado do teste manual de URL
- 🪣 Screenshot do Storage (se possível)

Com essas informações, poderei identificar a **causa exata** e fornecer a **correção direta**! 🚀

---

## **TESTES RÁPIDOS** ⚡

Se quiser testar rapidamente:

### Teste 1: Health Check da API
```bash
curl https://<PROJECT_ID>.supabase.co/functions/v1/make-server-bd42bc02/health \
  -H "Authorization: Bearer <ANON_KEY>"
```

### Teste 2: Buscar cliente específico
```bash
curl https://<PROJECT_ID>.supabase.co/functions/v1/make-server-bd42bc02/clients/<CLIENT_ID> \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "X-User-Token: <USER_JWT>"
```

### Teste 3: Listar buckets do Storage
```bash
curl https://<PROJECT_ID>.supabase.co/storage/v1/bucket \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

### Teste 4: Listar arquivos em um bucket
```bash
curl "https://<PROJECT_ID>.supabase.co/storage/v1/object/list/make-bd42bc02-documents/<CLIENT_ID>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```
