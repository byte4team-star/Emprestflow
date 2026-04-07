# 🔍 Investigação Completa: Fotos e Vídeos Não Aparecem

## ✅ Implementações Realizadas

### 1. **Logs Detalhados no Frontend** 📱
**Arquivo:** `/src/app/pages/ClientDetails.tsx`

**O que foi adicionado:**
```javascript
console.log('🔍 [ClientDetails] Loading client:', id);
console.log('📦 [ClientDetails] API Response:', data);
console.log('📄 [ClientDetails] Documents object:', data.client.documents);

// Para cada foto e vídeo:
console.log(`📷 [ClientDetails] foto1:`, {
  exists: !!doc,
  type: typeof doc,
  hasUrl: doc?.url,
  hasPath: doc?.path,
  url: doc?.url || doc?.path || doc
});
```

**Como usar:**
1. Abra DevTools (F12) → Console
2. Acesse página de detalhes de um cliente
3. Veja todos os logs detalhados

---

### 2. **Logs Detalhados no Backend** 🖥️
**Arquivo:** `/supabase/functions/server/index.tsx`

**O que foi adicionado:**
```javascript
console.log(`[CLIENT_GET] Loading client ${clientId}`);
console.log(`[CLIENT_GET] Generating signed URL for foto1, path:`, doc.path);
console.log(`[CLIENT_GET] ✓ Signed URL generated for foto1`);
console.log(`[CLIENT_GET] File not found in storage:`, doc.path); // Se erro
console.log(`[CLIENT_GET] ✅ Returning client with documents:`, [...]); 
console.log(`[CLIENT_GET] foto1 URL:`, url.substring(0, 100) + '...');
```

**Como usar:**
1. Acesse Supabase Dashboard → Functions → make-server → Logs
2. OU via CLI: `supabase functions logs make-server --follow`
3. Veja todos os logs do backend

---

### 3. **Componente Visual de Debug** 🎨
**Arquivo:** `/src/app/components/MediaDebug.tsx`

**Recursos:**
- ✅ Card roxo expansível "🔍 Debug de Mídia"
- ✅ Resumo visual: Total documentos, Com URL, Sem URL, Faltando
- ✅ Detalhes por documento com status colorido
- ✅ Botão "Abrir" para testar URL no navegador
- ✅ Botão "Testar" para verificar se URL é acessível
- ✅ Visualização do JSON completo dos documents

**Como usar:**
1. Acesse qualquer página de detalhes de cliente
2. Veja o card roxo "🔍 Debug de Mídia"
3. Clique em "Mostrar Detalhes"
4. Use botões "Abrir" e "Testar" para cada documento

---

### 4. **Guia de Troubleshooting Completo** 📋
**Arquivo:** `/DEBUG_MEDIA_ISSUE.md`

**Conteúdo:**
- Checklist de 6 passos para investigação
- Como verificar logs do frontend
- Como verificar logs do backend
- Como testar URLs manualmente
- Como verificar Storage no Supabase
- Como verificar banco de dados (KV Store)
- Como verificar renderização no frontend
- 6 causas principais identificadas com soluções

---

## 🎯 Como Usar Esta Investigação

### **Passo 1: Verificar Visualmente**
1. Acesse qualquer cliente: `/clients/<client_id>`
2. Veja o card roxo "🔍 Debug de Mídia"
3. Clique em "Mostrar Detalhes"

**Você verá:**
- Quantos documentos têm URL
- Quantos NÃO têm URL
- Detalhes de cada foto/vídeo
- Botões para testar cada URL

---

### **Passo 2: Verificar Logs do Console**
1. Abra DevTools (F12) → Console
2. Recarregue a página do cliente
3. Procure por:
   ```
   🔍 [ClientDetails] Loading client: ...
   📷 [ClientDetails] foto1: { exists: true, hasUrl: true, url: "..." }
   🎥 [ClientDetails] video1: { exists: false, ... }
   ```

**Interpretação:**
- ✅ `exists: true, hasUrl: true` = Documento OK
- ⚠️ `exists: true, hasUrl: false` = Documento existe mas sem URL (problema!)
- ❌ `exists: false` = Documento não foi enviado

---

### **Passo 3: Verificar Logs do Backend**
1. Acesse: https://supabase.com/dashboard/project/<PROJECT_ID>/functions/make-server/logs
2. OU via CLI: `supabase functions logs make-server --follow`
3. Procure por:
   ```
   [CLIENT_GET] Loading client client_abc123
   [CLIENT_GET] Generating signed URL for foto1
   [CLIENT_GET] ✓ Signed URL generated for foto1
   [CLIENT_GET] foto1 URL: https://...supabase.co/storage/...
   ```

**Se houver erro:**
```
[CLIENT_GET] File not found in storage: client_abc123/foto1.jpg
```
→ **CAUSA RAIZ:** Arquivo não existe no Storage!

---

### **Passo 4: Testar URL Manualmente**
1. No componente de Debug, clique em "Abrir" ao lado de uma foto
2. OU copie a URL dos logs e cole no navegador

**Possíveis resultados:**
- ✅ Imagem/vídeo abre → Backend está OK, problema é no frontend
- ❌ 404 Not Found → Arquivo não existe no Storage
- ❌ 403 Forbidden → Problema de permissão
- ❌ Token expired → URL assinada expirou (esperado após 1h)

---

### **Passo 5: Verificar Storage**
1. Acesse: https://supabase.com/dashboard/project/<PROJECT_ID>/storage/buckets/make-bd42bc02-documents
2. Navegue pelas pastas: `client_abc123/`
3. Veja se os arquivos existem:
   - `foto1.jpg`
   - `foto2.jpg`
   - `video1.mp4`
   - etc.

**Se arquivos não existem:**
→ **CAUSA RAIZ:** Documentos nunca foram enviados!

---

## 🩺 Diagnóstico Rápido

Use o componente de Debug para diagnóstico imediato:

### **Cenário 1: Card mostra "8 documentos, 8 com URL"** ✅
**Significado:** Tudo está OK no backend

**Próxima ação:**
1. Clique em "Abrir" em um documento
2. Se abrir → tudo funcionando!
3. Se não abrir → problema no navegador/CORS

---

### **Cenário 2: Card mostra "8 documentos, 0 com URL"** ❌
**Significado:** Documentos existem no banco mas sem URLs

**Causas possíveis:**
1. Arquivos não existem no Storage
2. Backend não está gerando signed URLs
3. Erro ao gerar signed URLs

**Próxima ação:**
1. Veja logs do backend
2. Verifique Storage no Supabase Dashboard
3. Clique em "Atualizar Documentos"

---

### **Cenário 3: Card mostra "0 documentos"** ❌
**Significado:** Cliente não tem documentos no banco

**Causa:** Documentos nunca foram enviados

**Solução:** Fazer upload dos documentos via formulário

---

### **Cenário 4: Card mostra "4 documentos, 4 com URL" mas botão "Testar" retorna erro** ⚠️
**Significado:** URLs foram geradas mas não são acessíveis

**Causas possíveis:**
1. URLs expiraram (> 1 hora)
2. Arquivos foram deletados do Storage
3. Políticas de Storage mudaram

**Solução:**
1. Clique em "Atualizar Documentos"
2. Teste novamente

---

## 📊 Principais Causas Identificadas

### **1. Arquivos não existem no Storage** (Mais comum)
**Sintomas:**
- Backend loga: `File not found in storage`
- Card de debug mostra documentos mas sem URLs
- Botão "Testar" retorna erro 404

**Solução:**
- Fazer upload dos documentos
- Verificar se cliente realmente enviou os arquivos

---

### **2. URLs assinadas expiraram**
**Sintomas:**
- Card mostra URLs
- Ao clicar em "Abrir", retorna "Token expired"
- Acontece após 1 hora

**Solução:**
- Clicar em "Atualizar Documentos"
- URLs são regeneradas automaticamente

---

### **3. Path incorreto no banco de dados**
**Sintomas:**
- Storage tem arquivo `foto1.jpg`
- Banco tem path `foto1.JPG` (case diferente)
- Backend loga: `File not found`

**Solução:**
- Corrigir path no banco de dados
- Garantir case-sensitivity correto

---

### **4. Storage Bucket não existe**
**Sintomas:**
- Backend retorna erro ao gerar URLs
- Storage Dashboard não mostra bucket

**Solução:**
```typescript
// Backend deve criar bucket se não existir
const { data: buckets } = await supabaseAdmin.storage.listBuckets();
if (!buckets?.some(b => b.name === 'make-bd42bc02-documents')) {
  await supabaseAdmin.storage.createBucket('make-bd42bc02-documents', {
    public: false
  });
}
```

---

### **5. Frontend não atualiza após fetch**
**Sintomas:**
- Logs mostram URLs corretas
- Card de debug mostra URLs corretas
- Interface não mostra links "Ver foto"

**Solução:**
- Verificar se `setClient(data.client)` é chamado
- Verificar se render usa o estado atualizado

---

### **6. Políticas de Storage bloqueando acesso**
**Sintomas:**
- URLs retornam 403 Forbidden
- Mesmo com signed URL válida

**Solução:**
```sql
-- No Supabase SQL Editor
CREATE POLICY "Service role can read all documents"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'make-bd42bc02-documents');
```

---

## 🚀 Próximos Passos

### **Agora você deve:**

1. **Acessar um cliente qualquer** no sistema
2. **Abrir o card de Debug** (roxo, expansível)
3. **Clicar em "Mostrar Detalhes"**
4. **Verificar:**
   - Quantos documentos têm URL?
   - Botão "Testar" funciona?
   - Botão "Abrir" funciona?
5. **Copiar os logs do console** (F12)
6. **Copiar os logs do backend** (Supabase Dashboard ou CLI)

### **Me envie:**
- ✅ Screenshot do card de Debug
- ✅ Logs do console (frontend)
- ✅ Logs do backend (Supabase)
- ✅ Resultado dos botões "Abrir" e "Testar"

Com essas informações, eu poderei identificar a **causa exata** e fornecer a **correção específica**!

---

## 📞 Resumo Ultra-Rápido

```
1. Acesse /clients/<qualquer_id>
2. Veja o card roxo "🔍 Debug de Mídia"
3. Clique em "Mostrar Detalhes"
4. Use botões "Abrir" e "Testar"
5. Me envie os resultados
6. Eu identifico a causa exata
7. Eu forneço a correção
```

**Simples assim!** 🎯

---

## ✨ Ferramentas Disponíveis

Você agora tem:
- ✅ Logs detalhados no console (frontend)
- ✅ Logs detalhados no Supabase (backend)
- ✅ Componente visual de debug interativo
- ✅ Botões para testar URLs individualmente
- ✅ Guia completo de troubleshooting
- ✅ Deploy fixes
- ✅ Auto-refresh de JWT
- ✅ Botão "Atualizar Documentos"

**Tudo pronto para investigação completa!** 🕵️‍♂️

---

**Agora faça os testes e me envie os resultados!** 🚀
