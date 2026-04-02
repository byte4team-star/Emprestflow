import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function SupabaseDiagnostic() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Environment Variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      diagnostics.tests.env = {
        name: 'Variáveis de Ambiente',
        passed: !!supabaseUrl && !!supabaseAnonKey,
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Não configurada'
        }
      };

      // Test 2: Supabase Connection
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`
            }
          });
          
          diagnostics.tests.connection = {
            name: 'Conexão Supabase',
            passed: response.ok,
            details: {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok
            }
          };
        } catch (error: any) {
          diagnostics.tests.connection = {
            name: 'Conexão Supabase',
            passed: false,
            details: {
              error: error.message
            }
          };
        }
      }

      // Test 3: Auth Token
      const token = localStorage.getItem('auth_token');
      diagnostics.tests.auth = {
        name: 'Token de Autenticação',
        passed: !!token,
        details: {
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 30) + '...' : 'Nenhum token encontrado'
        }
      };

      // Test 4: API Endpoint
      try {
        const apiUrl = import.meta.env.VITE_API_URL || `${supabaseUrl}/functions/v1/make-server`;
        const healthResponse = await fetch(`${apiUrl}/health`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'X-User-Token': token
          } : {}
        });

        diagnostics.tests.api = {
          name: 'API Endpoint',
          passed: healthResponse.ok,
          details: {
            status: healthResponse.status,
            statusText: healthResponse.statusText,
            endpoint: apiUrl
          }
        };

        if (healthResponse.ok) {
          const data = await healthResponse.json();
          diagnostics.tests.api.details.response = data;
        }
      } catch (error: any) {
        diagnostics.tests.api = {
          name: 'API Endpoint',
          passed: false,
          details: {
            error: error.message
          }
        };
      }

      // Test 5: Local Storage
      diagnostics.tests.storage = {
        name: 'Armazenamento Local',
        passed: true,
        details: {
          hasToken: !!localStorage.getItem('auth_token'),
          hasUser: !!localStorage.getItem('user'),
          keys: Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('user'))
        }
      };

    } catch (error: any) {
      diagnostics.error = error.message;
    }

    setResults(diagnostics);
    setTesting(false);
  };

  const getStatusIcon = (passed: boolean) => {
    if (passed) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-blue-600" />
          Diagnóstico de Conexão Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              'Executar Diagnóstico'
            )}
          </Button>
        </div>

        {results && (
          <div className="space-y-3 mt-4">
            <div className="text-xs text-gray-500">
              Executado em: {new Date(results.timestamp).toLocaleString('pt-BR')}
            </div>

            {Object.entries(results.tests).map(([key, test]: [string, any]) => (
              <div 
                key={key}
                className={`p-3 rounded border ${
                  test.passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(test.passed)}
                  <span className="font-semibold">{test.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    test.passed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {test.passed ? 'PASSOU' : 'FALHOU'}
                  </span>
                </div>
                
                <div className="text-xs space-y-1 ml-7">
                  {Object.entries(test.details).map(([detailKey, detailValue]) => (
                    <div key={detailKey} className="flex gap-2">
                      <span className="text-gray-600 font-medium">{detailKey}:</span>
                      <span className="text-gray-800">
                        {typeof detailValue === 'object' 
                          ? JSON.stringify(detailValue) 
                          : String(detailValue)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {results.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 font-semibold">Erro Geral:</p>
                <p className="text-red-600 text-sm mt-1">{results.error}</p>
              </div>
            )}

            {/* Recommendations */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded mt-4">
              <p className="font-semibold text-amber-900 mb-2">📋 Recomendações:</p>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                {!results.tests.env?.passed && (
                  <li>Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente</li>
                )}
                {!results.tests.connection?.passed && (
                  <li>Verifique se o projeto Supabase está ativo e acessível</li>
                )}
                {!results.tests.auth?.passed && (
                  <li>Faça login novamente para obter um token válido</li>
                )}
                {!results.tests.api?.passed && (
                  <li>Verifique se a Edge Function está deployada corretamente</li>
                )}
                {results.tests.api?.details?.status === 403 && (
                  <li className="font-bold text-red-700">
                    ⚠️ ERRO 403: Verifique permissões do Supabase e chaves de API
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {!results && (
          <div className="text-center py-8 text-gray-500">
            <p>Clique em "Executar Diagnóstico" para testar a conexão</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
