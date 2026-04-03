import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { apiCall } from '../lib/supabase';
import { toast } from 'sonner';
import { Trash2, Eye, Upload, Plus, X, Loader2 } from 'lucide-react';
import { VideoIcon } from 'lucide-react';

interface MediaItem {
  key: string; // foto1, foto2, video1, etc.
  path: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  url?: string;
}

interface MediaGalleryUploaderProps {
  clientId: string;
  mediaType: 'foto' | 'video'; // foto1-6 or video1-2
  label: string;
  maxCount: number; // 6 for fotos, 2 for videos
  requiredCount: number; // 4 for fotos, 1 for videos
  maxSizeMB: number; // 5MB for fotos, 30MB for videos
  onUpdate?: () => void;
}

export default function MediaGalleryUploader({
  clientId,
  mediaType,
  label,
  maxCount,
  requiredCount,
  maxSizeMB,
  onUpdate,
}: MediaGalleryUploaderProps) {
  const [media, setMedia] = useState<Record<string, MediaItem>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const accept = mediaType === 'foto' ? 'image/*' : 'video/*';
  const maxSize = maxSizeMB * 1024 * 1024;

  useEffect(() => {
    loadMedia();
  }, [clientId]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      console.log(`[LOAD_MEDIA] Loading media for client ${clientId}, type: ${mediaType}`);
      
      // 🔥 CACHE BUSTING: Force fresh data from server
      const timestamp = Date.now();
      const data = await apiCall(`/clients/${clientId}?_t=${timestamp}`);
      const docs = data.client?.documents || {};
      
      console.log(`[LOAD_MEDIA] All documents:`, Object.keys(docs));
      
      const mediaItems: Record<string, MediaItem> = {};
      for (let i = 1; i <= maxCount; i++) {
        const key = `${mediaType}${i}`;
        if (docs[key] && docs[key].path) {
          console.log(`[LOAD_MEDIA] Found ${key}:`, docs[key]);
          mediaItems[key] = docs[key];
        } else {
          console.log(`[LOAD_MEDIA] Missing or invalid ${key}`);
        }
      }
      
      console.log(`[LOAD_MEDIA] Media items found:`, Object.keys(mediaItems));
      
      // 🚨 MERGE STATE - DON'T REPLACE! Preserve existing items
      setMedia(prev => {
        const merged = { ...prev };
        // Add new items
        Object.entries(mediaItems).forEach(([key, item]) => {
          merged[key] = item;
        });
        // Remove items that no longer exist in backend
        Object.keys(merged).forEach(key => {
          if (key.startsWith(mediaType) && !mediaItems[key]) {
            delete merged[key];
          }
        });
        console.log(`[LOAD_MEDIA] 🔄 MERGE - prev:`, Object.keys(prev), '→ merged:', Object.keys(merged));
        return merged;
      });
      
      // Load preview URLs
      const urls: Record<string, string> = {};
      for (const [key, item] of Object.entries(mediaItems)) {
        try {
          console.log(`[LOAD_MEDIA] Loading URL for ${key}...`);
          const response = await apiCall(`/clients/${clientId}/documents/${key}?_t=${timestamp}`);
          if (response.url) {
            console.log(`[LOAD_MEDIA] ✅ URL loaded for ${key}: ${response.url.substring(0, 80)}...`);
            urls[key] = response.url;
          } else {
            console.warn(`[LOAD_MEDIA] ⚠️ No URL in response for ${key}`);
          }
        } catch (error) {
          console.error(`[LOAD_MEDIA] ❌ Error loading URL for ${key}:`, error);
        }
      }
      console.log(`[LOAD_MEDIA] Preview URLs loaded:`, Object.keys(urls));
      console.log(`[LOAD_MEDIA] 🔍 FINAL STATE - media keys:`, Object.keys(mediaItems));
      console.log(`[LOAD_MEDIA] 🔍 FINAL STATE - preview keys:`, Object.keys(urls));
      
      // 🔄 MERGE preview URLs too - don't replace
      setPreviewUrls(prev => ({ ...prev, ...urls }));
    } catch (error) {
      console.error('[LOAD_MEDIA] ❌ Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (35MB backend limit)
    const backendLimit = 35 * 1024 * 1024; // 35MB
    if (file.size > backendLimit) {
      toast.error(`Arquivo muito grande! Máximo: 35MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    // Validate file size against prop limit
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return;
    }

    // Find next available slot
    let nextKey: string | null = null;
    for (let i = 1; i <= maxCount; i++) {
      const key = `${mediaType}${i}`;
      if (!media[key]) {
        nextKey = key;
        break;
      }
    }

    if (!nextKey) {
      toast.error(`Máximo de ${maxCount} ${mediaType === 'foto' ? 'fotos' : 'vídeos'} atingido`);
      return;
    }

    await uploadFile(file, nextKey);
  };

  const uploadFile = async (file: File, key: string) => {
    setUploading(prev => ({ ...prev, [key]: true }));

    try {
      console.log(`[UPLOAD_FILE] ===== START =====`);
      console.log(`[UPLOAD_FILE] Key: ${key}`);
      console.log(`[UPLOAD_FILE] File name: ${file.name}`);
      console.log(`[UPLOAD_FILE] File type: ${file.type}`);
      console.log(`[UPLOAD_FILE] File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Create FormData (much more efficient than base64)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', key);
      
      console.log(`[UPLOAD_FILE] FormData created, sending to server...`);

      try {
        // Send FormData directly (no JSON conversion needed)
        const response = await apiCall(`/clients/${clientId}/documents`, {
          method: 'POST',
          body: formData,
          // Don't set Content-Type - browser will set it with boundary
          headers: undefined,
        });

        console.log(`[UPLOAD_FILE] ✅ Server response:`, response);
        toast.success(`${mediaType === 'foto' ? 'Foto' : 'Vídeo'} enviado com sucesso!`);
        
        // 🔥 WAIT for backend to persist data before reloading
        console.log(`[UPLOAD_FILE] ⏳ Waiting 500ms for backend to persist...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`[UPLOAD_FILE] Reloading media with retry...`);
        await loadMediaWithRetry(key);
        if (onUpdate) onUpdate();
        console.log(`[UPLOAD_FILE] ✅ COMPLETE`);
      } catch (error: any) {
        console.error('[UPLOAD_FILE] ❌ Upload error:', error);
        toast.error(error.message || 'Erro ao fazer upload');
      } finally {
        setUploading(prev => ({ ...prev, [key]: false }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao processar arquivo');
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };
  
  // 🔥 NEW: Load media with retry to verify uploaded document exists
  const loadMediaWithRetry = async (expectedKey?: string, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`[LOAD_RETRY] Attempt ${attempt}/${retries} ${expectedKey ? `(expecting ${expectedKey})` : ''}`);
      
      await loadMedia();
      
      // If we're expecting a specific key, verify it exists
      if (expectedKey) {
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check current state via a synchronous read (use ref or check after state updates)
        const timestamp = Date.now();
        const data = await apiCall(`/clients/${clientId}?_t=${timestamp}`);
        const docs = data.client?.documents || {};
        
        if (docs[expectedKey] && docs[expectedKey].path) {
          console.log(`[LOAD_RETRY] ✅ Found ${expectedKey} on attempt ${attempt}`);
          return; // Success!
        } else {
          console.warn(`[LOAD_RETRY] ⚠️ ${expectedKey} not found on attempt ${attempt}`);
          if (attempt < retries) {
            console.log(`[LOAD_RETRY] ⏳ Waiting 1s before retry...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else {
        return; // No specific key to verify
      }
    }
    
    if (expectedKey) {
      console.error(`[LOAD_RETRY] ❌ Failed to verify ${expectedKey} after ${retries} attempts`);
      toast.error('Arquivo enviado mas não aparece. Tente recarregar a página.');
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Tem certeza que deseja excluir este ${mediaType === 'foto' ? 'foto' : 'vídeo'}?`)) {
      return;
    }

    setDeleting(prev => ({ ...prev, [key]: true }));

    try {
      await apiCall(`/clients/${clientId}/documents/${key}`, {
        method: 'DELETE',
      });

      toast.success(`${mediaType === 'foto' ? 'Foto' : 'Vídeo'} excluído com sucesso!`);
      await loadMedia();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Erro ao excluir');
    } finally {
      setDeleting(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleView = (key: string) => {
    const url = previewUrls[key];
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('URL não disponível');
    }
  };

  const mediaCount = Object.keys(media).length;
  const canAddMore = mediaCount < maxCount;
  const meetsRequirement = mediaCount >= requiredCount;
  
  // 🔍 DEBUG: Log render state
  console.log(`[RENDER] MediaGalleryUploader for ${mediaType}`);
  console.log(`[RENDER] - mediaCount: ${mediaCount}`);
  console.log(`[RENDER] - media keys:`, Object.keys(media));
  console.log(`[RENDER] - previewUrls keys:`, Object.keys(previewUrls));
  Object.entries(media).forEach(([key, item]) => {
    console.log(`[RENDER] - ${key}: has previewUrl=${!!previewUrls[key]}, uploading=${!!uploading[key]}`);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{label}</h3>
          <p className="text-sm text-gray-600">
            {mediaCount}/{maxCount} • Mínimo: {requiredCount} {meetsRequirement && '✓'}
          </p>
        </div>
        {canAddMore && (
          <div>
            <input
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
              id={`file-input-${mediaType}-${clientId}`}
            />
            <label 
              htmlFor={`file-input-${mediaType}-${clientId}`}
              className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </label>
          </div>
        )}
      </div>

      {/* Media Grid */}
      {mediaCount > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(media).map(([key, item]) => {
            const isUploading = uploading[key];
            const isDeleting = deleting[key];
            const previewUrl = previewUrls[key];
            const isVideo = mediaType === 'video';

            return (
              <div
                key={key}
                className="relative group border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100 aspect-video"
              >
                {/* Preview */}
                {previewUrl && !isUploading ? (
                  <>
                    {isVideo ? (
                      <video
                        src={previewUrl}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt={key}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </>
                ) : !isUploading ? (
                  // ✨ FALLBACK: Show placeholder if no preview URL yet
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-center">
                      {isVideo ? (
                        <VideoIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      ) : (
                        <Upload className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      )}
                      <p className="text-xs text-gray-500">Carregando preview...</p>
                    </div>
                  </div>
                ) : null}

                {/* Loading overlay */}
                {(isUploading || isDeleting) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}

                {/* Actions overlay */}
                {!isUploading && !isDeleting && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleView(key)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(key)}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                )}

                {/* Badge */}
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                  {key}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-2">Nenhum {mediaType === 'foto' ? 'foto' : 'vídeo'} enviado</p>
          <div>
            <input
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
              id={`file-input-empty-${mediaType}-${clientId}`}
            />
            <label 
              htmlFor={`file-input-empty-${mediaType}-${clientId}`}
              className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Adicionar {mediaType === 'foto' ? 'Foto' : 'Vídeo'}
            </label>
          </div>
        </div>
      )}

      {/* Requirement warning */}
      {!meetsRequirement && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          <Upload className="h-4 w-4 flex-shrink-0" />
          <span>
            Você precisa enviar pelo menos <strong>{requiredCount} {mediaType === 'foto' ? 'fotos' : 'vídeos'}</strong> (faltam {requiredCount - mediaCount})
          </span>
        </div>
      )}
    </div>
  );
}