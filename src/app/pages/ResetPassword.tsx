import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { KeyRound, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { apiCall } from '../lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { method, email, phone } = location.state || {};

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!method || (!email && !phone)) {
      navigate('/forgot-password');
    }
  }, [method, email, phone, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos');
      return;
    }

    if (newPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('A senha deve conter letras maiúsculas, minúsculas e números');
      return;
    }

    setLoading(true);

    try {
      const response = await apiCall('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          method,
          email: method === 'email' ? email : undefined,
          phone: method === 'phone' ? phone : undefined,
          code,
          newPassword,
        }),
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.error || 'Erro ao redefinir senha');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Erro ao redefinir senha. Verifique o código e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-2 border-green-400/50 shadow-2xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Senha Redefinida!</h3>
                  <p className="text-gray-600 mt-2">
                    Sua senha foi alterada com sucesso.
                  </p>
                  <p className="text-sm text-gray-500 mt-4">
                    Redirecionando para o login...
                  </p>
                </div>
                <Link to="/login">
                  <Button className="w-full" style={{ backgroundColor: '#115740' }}>
                    Ir para Login
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
              <img src="/logo.png" alt="ALEMÃO.CREFISA" className="h-20 w-20 object-contain rounded-full drop-shadow-lg" />
            </div>
            <CardTitle className="text-2xl md:text-3xl text-center font-bold text-gray-900">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-center text-base">
              Digite o código enviado e sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-900">{error}</AlertDescription>
                </Alert>
              )}

              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-900">
                  {method === 'email' 
                    ? `Código enviado para: ${email}`
                    : `Código enviado via WhatsApp para: ${phone}`
                  }
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificação</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Digite o código de 6 dígitos que você recebeu
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Requisitos da senha:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                    ✓ Mínimo de 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                    ✓ Pelo menos uma letra maiúscula
                  </li>
                  <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                    ✓ Pelo menos uma letra minúscula
                  </li>
                  <li className={/\d/.test(newPassword) ? 'text-green-600' : ''}>
                    ✓ Pelo menos um número
                  </li>
                  <li className={newPassword === confirmPassword && newPassword ? 'text-green-600' : ''}>
                    ✓ As senhas devem coincidir
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={loading}
                style={{ backgroundColor: '#115740' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Redefinindo senha...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Redefinir Senha
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <Link to="/forgot-password" className="block">
                  <Button type="button" variant="ghost" className="w-full" disabled={loading}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>

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