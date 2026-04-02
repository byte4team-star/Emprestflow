import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { apiCall } from '../lib/supabase';
import { toast } from 'sonner';
import { Upload, File, CheckCircle, AlertCircle, X, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface DocumentUploaderProps {
  clientId: string;
  documentType: 'front' | 'back' | 'selfie' | 'video';
  label: string;
  accept?: string;
  onUploadComplete?: () => void;
}

export default function DocumentUploader({
  clientId,
  documentType,
  label,
  accept = 'image/*',
  onUploadComplete,
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const maxSize = 52428800; // 50MB
  const isVideo = accept === 'video/*';

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Validate file size
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo: 50MB');
      return;
    }

    setUploading(true);
    setFileName(file.name);

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        try {
          await apiCall(`/clients/${clientId}/documents`, {
            method: 'POST',
            body: JSON.stringify({
              documentType,
              fileName: file.name,
              fileData: base64Data,
              mimeType: file.type,
            }),
          });

          setUploaded(true);
          toast.success(`${label} enviado com sucesso!`);
          console.log('[DOCUMENT_UPLOADER] Upload complete, calling onUploadComplete callback');
          if (onUploadComplete) {
            onUploadComplete();
          }
        } catch (error: any) {
          console.error('Upload error:', error);
          toast.error(error.message || 'Erro ao fazer upload');
          setUploaded(false);
          setPreviewUrl(null);
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Erro ao ler arquivo');
        setUploading(false);
        setPreviewUrl(null);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Erro ao processar arquivo');
      setUploading(false);
      setPreviewUrl(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept === 'video/*' ? { 'video/*': [] } : { 'image/*': [] },
    maxFiles: 1,
    maxSize,
  });

  const handleRemovePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploaded(false);
    setFileName(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      
      {/* Preview Section */}
      {previewUrl && (
        <div className="mb-3 relative rounded-lg overflow-hidden border-2 border-gray-200">
          {isVideo ? (
            <video
              src={previewUrl}
              controls
              className="w-full max-h-64 object-contain bg-black"
              preload="metadata"
            >
              Seu navegador não suporta vídeos.
            </video>
          ) : (
            <img
              src={previewUrl}
              alt={label}
              className="w-full max-h-64 object-contain bg-gray-100"
            />
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 left-2 flex gap-2">
            {uploading && (
              <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                Enviando...
              </div>
            )}
            {uploaded && !uploading && (
              <div className="bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                Enviado
              </div>
            )}
          </div>

          {/* Remove button */}
          {!uploading && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemovePreview}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* File name */}
          {fileName && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-3 py-2 text-xs truncate">
              <div className="flex items-center gap-2">
                {isVideo ? <VideoIcon className="h-3.5 w-3.5 flex-shrink-0" /> : <ImageIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                <span className="truncate">{fileName}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : uploaded
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Enviando arquivo...</p>
          </div>
        ) : uploaded ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <p className="text-sm text-green-600 font-medium">✅ Arquivo enviado com sucesso!</p>
            {fileName && <p className="text-xs text-gray-500 truncate max-w-full">{fileName}</p>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemovePreview}
            >
              Substituir arquivo
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {isVideo ? (
              <VideoIcon className="h-8 w-8 text-gray-400" />
            ) : (
              <Upload className="h-8 w-8 text-gray-400" />
            )}
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Solte o arquivo aqui'
                : 'Arraste um arquivo ou clique para selecionar'}
            </p>
            <p className="text-xs text-gray-500">
              {isVideo ? '🎥 Vídeo até 50MB (MP4, MOV, AVI)' : '📷 Foto até 50MB (JPG, PNG, JPEG)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}