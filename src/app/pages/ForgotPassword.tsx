import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Mail, Phone, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { apiCall } from '../lib/supabase';
import logo from 'figma:asset/6c9e654d548e97a4191a24d7f1bce9d77b7a1b25.png';

type RecoveryMethod = 'email' | 'phone' | null;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<RecoveryMethod>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setRecoveryCode('');
    setLoading(true);

    try {
      const response = await apiCall('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          method,
          email: method === 'email' ? email : undefined,
          phone: method === 'phone' ? phone : undefined,
        }),
      });

      if (response.success) {
        // Check if we got a dev code (when email server is not configured)
        if (response.devCode) {
          setRecoveryCode(response.devCode);
          setSuccess(
            method === 'email'
              ? '⚠️ Servidor de email não configurado. Use o código abaixo:'
              : '⚠️ Evolution API não configurada. Use o código abaixo:'
          );
        } else {
          setSuccess(
            method === 'email'
              ? '✅ Código de recuperação enviado para seu email! Verifique sua caixa de entrada.'
              : '✅ Código de recuperação enviado para seu WhatsApp! Verifique suas mensagens.'
          );
        }
        
        // Don't auto-redirect if we're showing the code
        if (!response.devCode) {
          setTimeout(() => {
            navigate('/reset-password', { 
              state: { 
                method, 
                email: method === 'email' ? email : undefined,
                phone: method === 'phone' ? phone : undefined 
              } 
            });
          }, 2000);
        }
      } else {
        setError(response.error || 'Erro ao enviar código de recuperação');
      }
    } catch (err) {
      console.error('Error sending recovery code:', err);
      setError('Erro ao enviar código de recuperação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!method) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-2 border-amber-400/50 shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex justify-center mb-4">
                <img src={logo} alt="ALEMÃO.CREFISA" className="h-20 w-20 object-contain rounded-full drop-shadow-lg" />
              </div>
              <CardTitle className="text-2xl md:text-3xl text-center font-bold text-gray-900">
                Recuperar Senha
              </CardTitle>
              <CardDescription className="text-center text-base">
                Escolha como deseja recuperar sua senha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setMethod('email')}
                variant="outline"
                className="w-full h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-500 transition-all"
              >
                <Mail className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold">Recuperar por Email</p>
                  <p className="text-xs text-gray-500">Enviaremos um código para seu email</p>
                </div>
              </Button>

              <Button
                onClick={() => setMethod('phone')}
                variant="outline"
                className="w-full h-20 flex-col gap-2 hover:bg-green-50 hover:border-green-500 transition-all"
              >
                <Phone className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold">Recuperar por Celular</p>
                  <p className="text-xs text-gray-500">Enviaremos um código via WhatsApp</p>
                </div>
              </Button>

              <div className="pt-4">
                <Link to="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-amber-400/50 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="ALEMÃO.CREFISA" className="h-20 w-20 object-contain rounded-full drop-shadow-lg" />
            </div>
            <CardTitle className="text-2xl md:text-3xl text-center font-bold text-gray-900">
              {method === 'email' ? 'Recuperar por Email' : 'Recuperar por Celular'}
            </CardTitle>
            <CardDescription className="text-center text-base">
              {method === 'email'
                ? 'Informe seu email cadastrado'
                : 'Informe seu número de celular cadastrado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendCode} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-900">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-900">{success}</AlertDescription>
                </Alert>
              )}

              {recoveryCode && (
                <Alert className="border-blue-200 bg-blue-50">
                  <div className="space-y-3">
                    <AlertDescription className="text-blue-900 font-semibold">
                      Seu código de recuperação:
                    </AlertDescription>
                    <div className="bg-white border-2 border-blue-300 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-900 tracking-widest">{recoveryCode}</p>
                    </div>
                    <AlertDescription className="text-sm text-blue-700">
                      ⏰ Este código expira em 15 minutos. Copie-o antes de continuar.
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Show input fields only if code hasn't been generated yet */}
              {!recoveryCode && (
                <>
                  {method === 'email' ? (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Número de Celular (WhatsApp)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10"
                          required
                          disabled={loading}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Digite o número com DDD, exemplo: (84) 99999-9999
                      </p>
                    </div>
                  )}
                </>
              )}

              {recoveryCode ? (
                <Button
                  type="button"
                  onClick={() => {
                    navigate('/reset-password', { 
                      state: { 
                        method, 
                        email: method === 'email' ? email : undefined,
                        phone: method === 'phone' ? phone : undefined 
                      } 
                    });
                  }}
                  className="w-full h-12"
                  style={{ backgroundColor: '#115740' }}
                >
                  <KeyRound className="mr-2 h-5 w-5" />
                  Continuar para Redefinir Senha
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={loading}
                  style={{ backgroundColor: '#115740' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando código...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-5 w-5" />
                      Enviar Código de Recuperação
                    </>
                  )}
                </Button>
              )}

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setMethod(null);
                    setRecoveryCode('');
                    setSuccess('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>

                <Link to="/login" className="block">
                  <Button variant="link" className="w-full">
                    Lembrou a senha? Fazer login
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}