import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface MediaDebugProps {
  client: any;
}

export function MediaDebug({ client }: MediaDebugProps) {
  const [expanded, setExpanded] = useState(false);
  const [testingUrls, setTestingUrls] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  if (!client) return null;

  const testUrl = async (type: string, url: string) => {
    setTestingUrls(prev => ({ ...prev, [type]: 'pending' }));
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      setTestingUrls(prev => ({ 
        ...prev, 
        [type]: response.ok ? 'success' : 'error' 
      }));
    } catch (error) {
      setTestingUrls(prev => ({ ...prev, [type]: 'error' }));
    }
  };

  const documents = client.documents || {};
  const allDocTypes = ['foto1', 'foto2', 'foto3', 'foto4', 'foto5', 'foto6', 'video1', 'video2'];

  return (
    <Card className="border-purple-300 bg-purple-50">
      

      {expanded && (
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-white rounded-lg border border-purple-200">
            <div>
              <p className="text-xs text-gray-600">Total Documentos</p>
              <p className="text-lg font-bold text-purple-900">
                {Object.keys(documents).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Com URL</p>
              <p className="text-lg font-bold text-green-600">
                {Object.values(documents).filter((doc: any) => {
                  const url = typeof doc === 'object' ? doc?.url : doc;
                  return !!url;
                }).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Sem URL</p>
              <p className="text-lg font-bold text-red-600">
                {Object.values(documents).filter((doc: any) => {
                  const url = typeof doc === 'object' ? doc?.url : doc;
                  return !url;
                }).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Faltando</p>
              <p className="text-lg font-bold text-gray-600">
                {allDocTypes.filter(type => !documents[type]).length}
              </p>
            </div>
          </div>

          {/* Document Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-purple-900 uppercase">
              Detalhes por Documento
            </h4>

            {allDocTypes.map(type => {
              const doc = documents[type];
              const isObject = doc && typeof doc === 'object';
              const isString = doc && typeof doc === 'string';
              const hasDoc = !!doc;
              const url = isObject ? (doc.url || doc.path) : doc;
              const testStatus = testingUrls[type];

              return (
                <div
                  key={type}
                  className={`p-3 rounded-lg border ${
                    hasDoc && url
                      ? 'border-green-300 bg-green-50'
                      : hasDoc
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Document Name */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {type.startsWith('foto') ? '📷' : '🎥'} {type.toUpperCase()}
                        </span>
                        
                        {/* Status Icon */}
                        {hasDoc && url ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : hasDoc ? (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>

                      {/* Document Info */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Tipo:</span>
                          <code className="px-1 py-0.5 bg-white rounded border border-gray-300">
                            {hasDoc ? (isObject ? 'object' : 'string') : 'null'}
                          </code>
                        </div>

                        {isObject && (
                          <>
                            {doc.fileName && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Arquivo:</span>
                                <span className="font-mono text-gray-900 truncate">
                                  {doc.fileName}
                                </span>
                              </div>
                            )}
                            {doc.path && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Path:</span>
                                <code className="px-1 py-0.5 bg-white rounded border border-gray-300 text-[10px] truncate block">
                                  {doc.path}
                                </code>
                              </div>
                            )}
                            {doc.size && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Tamanho:</span>
                                <span className="text-gray-900">
                                  {(doc.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            )}
                            {doc.error && (
                              <div className="flex items-center gap-2 text-red-600">
                                <span className="font-semibold">Erro:</span>
                                <span>{doc.error}</span>
                              </div>
                            )}
                          </>
                        )}

                        {url && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">URL:</span>
                            <code className="px-1 py-0.5 bg-white rounded border border-gray-300 text-[9px] truncate block max-w-xs">
                              {url.substring(0, 80)}...
                            </code>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {url && (
                      <div className="flex flex-col gap-1">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Abrir
                        </a>
                        
                        <button
                          onClick={() => testUrl(type, url)}
                          disabled={testStatus === 'pending'}
                          className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                            testStatus === 'pending'
                              ? 'bg-gray-300 text-gray-600 cursor-wait'
                              : testStatus === 'success'
                              ? 'bg-green-600 text-white'
                              : testStatus === 'error'
                              ? 'bg-red-600 text-white'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {testStatus === 'pending'
                            ? 'Testando...'
                            : testStatus === 'success'
                            ? '✓ OK'
                            : testStatus === 'error'
                            ? '✗ Erro'
                            : 'Testar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Raw JSON */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-purple-900 hover:text-purple-700 uppercase">
              🔧 Ver JSON Completo
            </summary>
            <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(documents, null, 2)}
            </pre>
          </details>

          {/* Instructions */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>💡 Como usar:</strong>
            </p>
            <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4 list-disc">
              <li>Clique em <strong>"Abrir"</strong> para testar a URL no navegador</li>
              <li>Clique em <strong>"Testar"</strong> para verificar se a URL está acessível</li>
              <li>Verde = documento com URL válida</li>
              <li>Amarelo = documento existe mas sem URL</li>
              <li>Cinza = documento não existe</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
