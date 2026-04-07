import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function ClientPortalLogin() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[CLIENT_PORTAL_LOGIN] Attempting login for:', formData.email);
      await signIn(formData.email, formData.password);
      
      console.log('[CLIENT_PORTAL_LOGIN] Login successful, navigating to portal');
      // The AuthContext will handle role verification
      // Navigate to the client portal
      navigate('/client-portal');
    } catch (err: any) {
      console.error('[CLIENT_PORTAL_LOGIN] Login failed');
      console.error('[CLIENT_PORTAL_LOGIN] Error details:', err);
      console.error('[CLIENT_PORTAL_LOGIN] Error message:', err.message);
      console.error('[CLIENT_PORTAL_LOGIN] Error code:', err.code);
      
      let errorMessage = err.message || 'Erro ao fazer login';
      
      // Provide better error messages
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos. Verifique seus dados e tente novamente.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
      } else if (err.message?.includes('Too many requests')) {
        errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-amber-400/50 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="ALEMÃO.CREFISA" 
              className="h-20 w-20 object-contain rounded-full drop-shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl md:text-3xl text-gray-900">Portal do Cliente</CardTitle>
          <CardDescription className="text-base">
            Acesse sua área exclusiva para visualizar seus dados e contratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700" 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">Não tem uma conta? </span>
                <Link to="/client-portal/signup" className="text-emerald-600 hover:underline font-medium">
                  Cadastre-se
                </Link>
              </div>
              
              <div className="pt-4 border-t">
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                  Área Administrativa →
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}