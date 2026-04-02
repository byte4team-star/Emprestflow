import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  LogIn,
  Shield,
  Key,
  Database
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function AuthDebug() {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // 1. Check auth session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        results.push({
          name: 'Sessão de Autenticação',
          status: 'error',
          message: 'Nenhuma sessão ativa encontrada',
          details: sessionError?.message || 'Usuário não está logado'
        });
      } else {
        results.push({
          name: 'Sessão de Autenticação',
          status: 'success',
          message: 'Sessão ativa encontrada',
          details: `Token válido até: ${new Date(sessionData.session.expires_at! * 1000).toLocaleString('pt-BR')}`
        });
      }

      // 2. Check user data
      if (user) {
        results.push({
          name: 'Dados do Usuário',
          status: 'success',
          message: `Usuário: ${user.name} (${user.role})`,
          details: `Email: ${user.email} | ID: ${user.id.substring(0, 8)}...`
        });
      } else {
        results.push({
          name: 'Dados do Usuário',
          status: 'warning',
          message: 'Nenhum usuário carregado',
          details: 'Auth context não retornou dados do usuário'
        });
      }

      // 3. Check localStorage
      const localStorageKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('supabase')) {
          localStorageKeys.push(key);
        }
      }
      if (localStorageKeys.length > 0) {
        results.push({
          name: 'LocalStorage',
          status: 'success',
          message: `${localStorageKeys.length} chaves do Supabase encontradas`,
          details: localStorageKeys.join(', ')
        });
      } else {
        results.push({
          name: 'LocalStorage',
          status: 'warning',
          message: 'Nenhuma chave do Supabase no localStorage',
          details: 'Isso pode indicar que a sessão foi limpa'
        });
      }

      // 4. Test backend health
      try {
        const healthResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02/health`
        );
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          results.push({
            name: 'Backend (Health Check)',
            status: 'success',
            message: 'Backend respondendo normalmente',
            details: `Status: ${healthData.status} | Timestamp: ${healthData.timestamp}`
          });
        } else {
          results.push({
            name: 'Backend (Health Check)',
            status: 'error',
            message: `Backend retornou erro: ${healthResponse.status}`,
            details: `Verifique se a Edge Function está implantada corretamente`
          });
        }
      } catch (error: any) {
        results.push({
          name: 'Backend (Health Check)',
          status: 'error',
          message: 'Falha ao conectar com o backend',
          details: error.message
        });
      }

      // 5. Test authenticated endpoint
      if (sessionData?.session?.access_token) {
        try {
          const testResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02/dashboard/stats`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'X-User-Token': sessionData.session.access_token,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (testResponse.ok) {
            results.push({
              name: 'Endpoint Autenticado',
              status: 'success',
              message: 'API respondeu com sucesso',
              details: 'Token de autenticação é válido e aceito pelo backend'
            });
          } else {
            const errorData = await testResponse.json().catch(() => ({}));
            results.push({
              name: 'Endpoint Autenticado',
              status: 'error',
              message: `API retornou erro: ${testResponse.status}`,
              details: JSON.stringify(errorData)
            });
          }
        } catch (error: any) {
          results.push({
            name: 'Endpoint Autenticado',
            status: 'error',
            message: 'Falha ao chamar API autenticada',
            details: error.message
          });
        }
      } else {
        results.push({
          name: 'Endpoint Autenticado',
          status: 'warning',
          message: 'Não foi possível testar (sem token)',
          details: 'Faça login para testar endpoints autenticados'
        });
      }

      // 6. Check Project ID and Keys
      results.push({
        name: 'Configuração do Projeto',
        status: 'success',
        message: 'Configurações carregadas',
        details: `Project ID: ${projectId} | Anon Key: ${publicAnonKey.substring(0, 20)}...`
      });

    } catch (error: any) {
      results.push({
        name: 'Diagnóstico Geral',
        status: 'error',
        message: 'Erro ao executar diagnósticos',
        details: error.message
      });
    }

    setDiagnostics(results);
    setRunning(false);
  };

  const handleClearSession = () => {
    if (confirm('Tem certeza que deseja limpar a sessão? Você será deslogado.')) {
      localStorage.clear();
      sessionStorage.clear();
      supabase.auth.signOut();
      toast.success('Sessão limpa com sucesso! Redirecionando...');
      setTimeout(() => navigate('/login'), 1000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">✓ OK</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">✗ Erro</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800">⚠ Atenção</Badge>;
      default:
        return null;
    }
  };

  const hasErrors = diagnostics.some(d => d.status === 'error');
  const hasWarnings = diagnostics.some(d => d.status === 'warning');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                  Diagnóstico de Autenticação
                </CardTitle>
                <CardDescription className="mt-2">
                  Verifique o estado da autenticação e conectividade com o backend
                </CardDescription>
              </div>
              <Button
                onClick={runDiagnostics}
                disabled={running}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
                {running ? 'Testando...' : 'Executar Testes'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Status Summary */}
        {diagnostics.length > 0 && (
          <Alert className={hasErrors ? 'border-red-200 bg-red-50' : hasWarnings ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}>
            <AlertDescription>
              <div className="flex items-center gap-2">
                {hasErrors ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-900">
                      Problemas detectados! Veja os detalhes abaixo.
                    </span>
                  </>
                ) : hasWarnings ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold text-amber-900">
                      Sistema operacional com avisos. Revise os itens marcados.
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">
                      Todos os testes passaram! Sistema funcionando normalmente.
                    </span>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostic Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnostics.map((diagnostic, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-white"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(diagnostic.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {diagnostic.name}
                      </h4>
                      {getStatusBadge(diagnostic.status)}
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      {diagnostic.message}
                    </p>
                    {showDetails && diagnostic.details && (
                      <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                        {diagnostic.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {diagnostics.length > 0 && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes Técnicos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current User Info */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                Informações do Usuário Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome:</label>
                  <p className="text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">E-mail:</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Role:</label>
                  <p className="text-gray-900 capitalize">{user.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User ID:</label>
                  <p className="text-gray-900 font-mono text-xs">{user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate('/login')}
                variant="default"
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Ir para Login
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                Ir para Dashboard
              </Button>
              
              <Button
                onClick={handleClearSession}
                variant="destructive"
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Limpar Sessão
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Alert>
          <AlertDescription>
            <p className="font-semibold mb-2">💡 Dicas:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Se houver erros 401: Faça login novamente</li>
              <li>Se houver problemas persistentes: Limpe a sessão e faça login</li>
              <li>Verifique o console do navegador (F12) para logs detalhados</li>
              <li>Se o backend estiver offline, contate o administrador do sistema</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
