import { useState } from 'react';
import { Upload, X, FileText, Video, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface FileUploadPreviewProps {
  id?: string;
  type: 'image' | 'video';
  onUpload: (file: File, preview: string) => void;
  onRemove: () => void;
  file?: File;
  preview?: string;
}

export default function FileUploadPreview({
  id,
  type,
  onUpload,
  onRemove,
  file,
  preview,
}: FileUploadPreviewProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    const fileSizeMB = selectedFile.size / 1024 / 1024;
    const maxSizeMB = type === 'video' ? 30 : 5; // 30MB para vídeos, 5MB para imagens

    // Validate file type
    if (type === 'image' && !selectedFile.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida', {
        description: `Arquivo selecionado: ${selectedFile.type || 'desconhecido'}`,
      });
      return;
    }
    if (type === 'video' && !selectedFile.type.startsWith('video/')) {
      toast.error('Por favor, selecione um vídeo válido', {
        description: `Arquivo selecionado: ${selectedFile.type || 'desconhecido'}`,
      });
      return;
    }

    // Validate file size (5MB for images, 30MB for videos)
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast.error('Arquivo muito grande!', {
        description: `O arquivo tem ${fileSizeMB.toFixed(2)} MB. Limite máximo: ${maxSizeMB} MB ${type === 'video' ? 'para vídeos' : 'para imagens'}. Comprima ou escolha outro arquivo.`,
      });
      return;
    }

    // Success feedback
    toast.success('Arquivo carregado!', {
      description: `${selectedFile.name} (${fileSizeMB.toFixed(2)} MB)`,
    });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      onUpload(selectedFile, previewUrl);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  return (
    <div className="space-y-2">
      {!file ? (
        <div>
          {/* Desktop/Drag and Drop */}
          <label
            htmlFor={id}
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {type === 'image' ? (
                <FileText className="w-10 h-10 mb-3 text-gray-400" />
              ) : (
                <Video className="w-10 h-10 mb-3 text-gray-400" />
              )}
              <p className="mb-2 text-sm text-gray-500 text-center px-2">
                <span className="font-semibold">Clique para selecionar</span> ou arraste aqui
              </p>
              <p className="text-xs text-gray-500 text-center px-2">
                {type === 'image' ? 'PNG, JPG até 5MB' : 'MP4, MOV até 30MB'}
              </p>
              <p className="text-xs text-red-500 font-semibold mt-1">
                ⚠️ Máximo {type === 'video' ? '30MB' : '5MB'}
              </p>
            </div>
            <input
              id={id}
              type="file"
              className="hidden"
              accept={type === 'image' ? 'image/*' : 'video/*'}
              onChange={handleFileChange}
            />
          </label>

          {/* Mobile Options - Only for Video */}
          {type === 'video' && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {/* Capture from Camera */}
              <label
                htmlFor={`${id}-camera`}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-300 rounded-lg cursor-pointer hover:bg-emerald-50 transition-all"
              >
                <Camera className="w-8 h-8 mb-2 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Gravar Vídeo</span>
                <span className="text-xs text-gray-500 mt-1">Usar câmera</span>
                <input
                  id={`${id}-camera`}
                  type="file"
                  className="hidden"
                  accept="video/*"
                  capture="environment"
                  onChange={handleFileChange}
                />
              </label>

              {/* Select from Gallery */}
              <label
                htmlFor={`${id}-gallery`}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-all"
              >
                <ImageIcon className="w-8 h-8 mb-2 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Galeria</span>
                <span className="text-xs text-gray-500 mt-1">Escolher vídeo</span>
                <input
                  id={`${id}-gallery`}
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-40 border-2 border-green-300 rounded-lg overflow-hidden bg-gray-900">
          {/* Preview */}
          {type === 'image' && preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : type === 'video' && preview ? (
            <video
              src={preview}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <FileText className="w-12 h-12" />
            </div>
          )}

          {/* Remove button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* File info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
            <p className="text-xs truncate">{file.name}</p>
            <p className="text-xs text-gray-300">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}