# 🔍 DEBUG: Vídeo Não Está Salvando

## O Que Foi Implementado

Adicionei logs detalhados em **TODO O FLUXO** de upload e recuperação de vídeos para identificar exatamente onde o problema está ocorrendo.

## Logs Implementados

### 1. Frontend - MediaGalleryUploader.tsx
- `[UPLOAD_FILE]` - Logs detalhados do processo de upload do arquivo
- `[LOAD_MEDIA]` - Logs detalhados do carregamento de documentos

### 2. Backend - /supabase/functions/server/index.tsx

#### Endpoint POST `/clients/:id/documents`
- `[UPLOAD] ===== START =====` - Início do upload
- `[UPLOAD] Client ID: ...` - ID do cliente
- `[UPLOAD] Document Type: ...` - Tipo do documento (video1, video2, foto1, etc.)
- `[UPLOAD] File: ...` - Nome do arquivo
- `[UPLOAD] File size: ...` - Tamanho do arquivo
- `[UPLOAD] ✅ Upload successful to storage` - Arquivo enviado para Supabase Storage com sucesso
- `[UPLOAD] Document metadata: ...` - Metadados salvos
- `[UPLOAD] ✅ Client data saved to KV store` - Dados salvos no banco KV
- `[UPLOAD] 🔍 Verification - ...` - **VERIFICAÇÃO IMEDIATA** se o vídeo foi salvo corretamente
- `[UPLOAD] ✅ COMPLETE` - Upload completo

#### Endpoint GET `/clients/:id/documents/:type`
- `[DOCUMENT_URL] ===== GET URL FOR ...` - Início da busca do documento
- `[DOCUMENT_URL] All document keys: ...` - **TODOS** os documentos salvos para o cliente
- `[DOCUMENT_URL] Document found: ...` - Se o documento foi encontrado
- `[DOCUMENT_URL] Document path: ...` - Caminho do arquivo no storage
- `[DOCUMENT_URL] ✅ Signed URL created successfully` - URL criada com sucesso

## Como Testar e Diagnosticar

### Passo 1: Abrir o Console do Navegador
1. Pressione `F12` no navegador
2. Vá para a aba "Console"
3. Limpe o console (`Ctrl+L` ou botão 🚫)

### Passo 2: Fazer Upload do Vídeo
1. Vá para a página de edição do cliente
2. Selecione um vídeo para upload
3. **OBSERVE O CONSOLE** enquanto o upload acontece

### Passo 3: Analisar os Logs

Você deve ver esta sequência:

```
[UPLOAD_FILE] ===== START =====
[UPLOAD_FILE] Key: video1
[UPLOAD_FILE] File name: meu-video.mp4
[UPLOAD_FILE] File type: video/mp4
[UPLOAD_FILE] File size: 12.34MB
[UPLOAD_FILE] FormData created, sending to server...
```

Depois, do servidor:
```
[UPLOAD] ===== START =====
[UPLOAD] Client ID: client_abc123
[UPLOAD] Document Type: video1
[UPLOAD] File: meu-video.mp4
[UPLOAD] File size: 12.34MB for video1
[UPLOAD] Reading file buffer...
[UPLOAD] Buffer ready, size: 12345678
[UPLOAD] Uploading to storage: client_abc123/video1/meu-video.mp4
[UPLOAD] ✅ Upload successful to storage
[UPLOAD] Saving metadata for video1...
[UPLOAD] Document metadata: { path: "...", fileName: "...", ... }
[UPLOAD] ✅ Client data saved to KV store
[UPLOAD] 🔍 Verification - video1 in KV: true
[UPLOAD] 🔍 Verification - video1 path: client_abc123/video1/meu-video.mp4
[UPLOAD] ✅ COMPLETE - video1 uploaded and saved
```

E do frontend:
```
[UPLOAD_FILE] ✅ Server response: { success: true, url: "...", document: {...} }
[UPLOAD_FILE] Reloading media...
[LOAD_MEDIA] Loading media for client client_abc123, type: video
[LOAD_MEDIA] All documents: ["video1", "foto1", "foto2", ...]
[LOAD_MEDIA] Found video1: { path: "...", fileName: "...", ... }
[LOAD_MEDIA] Media items found: ["video1"]
[LOAD_MEDIA] Loading URL for video1...
[DOCUMENT_URL] ===== GET URL FOR video1 =====
[DOCUMENT_URL] Client ID: client_abc123
[DOCUMENT_URL] All document keys: ["video1", "foto1", "foto2", ...]
[DOCUMENT_URL] Document found: true
[DOCUMENT_URL] Document path: client_abc123/video1/meu-video.mp4
[DOCUMENT_URL] Creating signed URL for path: client_abc123/video1/meu-video.mp4
[DOCUMENT_URL] ✅ Signed URL created successfully
[LOAD_MEDIA] ✅ URL loaded for video1
[LOAD_MEDIA] Preview URLs loaded: ["video1"]
[UPLOAD_FILE] ✅ COMPLETE
```

## Possíveis Problemas e Soluções

### ❌ Problema 1: Upload para Storage falha
**Sintoma:**
```
[UPLOAD] ❌ Storage error: ...
```

**Causa:** Problema com o Supabase Storage (bucket não existe, permissões incorretas, etc.)

**Solução:** Verificar se o bucket `make-bd42bc02-documents` existe no Supabase Dashboard

---

### ❌ Problema 2: Documento não está no KV após salvar
**Sintoma:**
```
[UPLOAD] ⚠️ WARNING: video1 NOT FOUND in KV after save!
```

**Causa:** Falha ao salvar no KV Store (problema de rede, erro de serialização, etc.)

**Solução:** Verificar logs do Supabase Edge Function para erros relacionados ao KV

---

### ❌ Problema 3: Documento não é encontrado ao recarregar
**Sintoma:**
```
[LOAD_MEDIA] All documents: ["foto1", "foto2"]  // video1 está faltando!
```

**Causa:** O documento foi salvo mas não está sendo retornado pela API

**Solução:** 
1. Verificar se o endpoint GET `/clients/:id` está retornando todos os documentos
2. Verificar se há algum filtro que está excluindo vídeos

---

### ❌ Problema 4: Arquivo no Storage foi deletado
**Sintoma:**
```
[DOCUMENT_URL] ❌ Error creating signed URL: Object not found
[DOCUMENT_URL] 🧹 Cleaning up invalid document reference
```

**Causa:** O arquivo foi deletado do Supabase Storage mas a referência ainda está no banco

**Solução:** Sistema já faz auto-limpeza. Fazer novo upload do vídeo.

---

### ❌ Problema 5: Vídeo está salvando como foto
**Sintoma:**
```
[UPLOAD] Document Type: foto1  // deveria ser video1!
```

**Causa:** Bug no frontend ao determinar o tipo de documento

**Solução:** Verificar o código do MediaGalleryUploader.tsx na função `handleFileSelect`

---

## Próximos Passos

1. **Faça o upload de um vídeo**
2. **Copie TODOS os logs do console** (desde `[UPLOAD_FILE] ===== START =====` até `[UPLOAD_FILE] ✅ COMPLETE`)
3. **Cole os logs aqui** para análise detalhada
4. **Recarregue a página** e copie os logs de `[LOAD_MEDIA]`

## Informações Técnicas

### Estrutura de Dados do Cliente
```json
{
  "id": "client_abc123",
  "fullName": "João Silva",
  "documents": {
    "profilePhoto": {
      "path": "client_abc123/profilePhoto/foto.jpg",
      "fileName": "foto.jpg",
      "mimeType": "image/jpeg",
      "uploadedAt": "2026-04-02T...",
      "uploadedBy": "user_xyz"
    },
    "foto1": { ... },
    "foto2": { ... },
    "foto3": { ... },
    "foto4": { ... },
    "foto5": { ... },  // Opcional
    "foto6": { ... },  // Opcional
    "video1": {
      "path": "client_abc123/video1/video.mp4",
      "fileName": "video.mp4",
      "mimeType": "video/mp4",
      "uploadedAt": "2026-04-02T...",
      "uploadedBy": "user_xyz"
    },
    "video2": { ... }  // Opcional
  }
}
```

### Fluxo de Upload
1. **Frontend:** Usuário seleciona arquivo
2. **Frontend:** Valida tamanho (35MB max)
3. **Frontend:** Cria FormData com `file` e `documentType`
4. **Frontend:** Envia POST para `/clients/:id/documents`
5. **Backend:** Recebe FormData
6. **Backend:** Valida arquivo e tipo
7. **Backend:** Faz upload para Supabase Storage
8. **Backend:** Salva metadados no KV Store
9. **Backend:** Verifica se salvou corretamente
10. **Backend:** Retorna URL assinada
11. **Frontend:** Recarrega lista de documentos
12. **Frontend:** Busca URL assinada para cada documento
13. **Frontend:** Exibe preview do vídeo

---

## 🚨 IMPORTANTE

Se você ver `[UPLOAD] ✅ COMPLETE` mas depois não ver o vídeo na lista, o problema está na **etapa de recarregamento** (passo 11-13 do fluxo).

Nesse caso, os logs de `[LOAD_MEDIA]` e `[DOCUMENT_URL]` serão cruciais para identificar o problema.
