import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiCall } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { KeyRound, Eye, EyeOff, CheckCircle, AlertTriangle, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePassword() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!currentPassword) {
      toast.error('Por favor, informe sua senha atual');
      return false;
    }

    if (!newPassword) {
      toast.error('Por favor, informe a nova senha');
      return false;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return false;
    }

    if (newPassword === currentPassword) {
      toast.error('A nova senha deve ser diferente da senha atual');
      return false;
    }

    if (!confirmPassword) {
      toast.error('Por favor, confirme a nova senha');
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      console.log('[ChangePassword] Attempting to change password...');

      await apiCall('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      console.log('[ChangePassword] Password changed successfully');

      toast.success(
        <div>
          <p className="font-semibold">✅ Senha alterada com sucesso!</p>
          <p className="text-xs mt-1">Sua senha foi atualizada. Use a nova senha no próximo login.</p>
        </div>,
        { duration: 5000 }
      );

      // Limpar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      console.error('Error changing password:', error);

      // Provide more specific error messages
      let errorMessage = error.message || 'Erro desconhecido';
      let helpText = '';
      let deployInstructions = false;

      if (error.message?.includes('Sessão expirada')) {
        errorMessage = 'Sua sessão expirou';
        helpText = 'Você será redirecionado para o login';
      } else if (error.message?.includes('Senha atual incorreta')) {
        errorMessage = 'Senha atual incorreta';
        helpText = 'Verifique se digitou sua senha atual corretamente';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        errorMessage = '🔧 Backend não está respondendo';
        helpText = 'A Edge Function do Supabase precisa ser deployada';
        deployInstructions = true;
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Não autorizado';
        helpText = 'Faça login novamente';
      }

      toast.error(
        <div>
          <p className="font-semibold">❌ {errorMessage}</p>
          <p className="text-xs mt-1">{helpText || errorMessage}</p>
          {deployInstructions && (
            <div className="mt-2 text-xs bg-gray-100 p-2 rounded border border-gray-300">
              <p className="font-semibold mb-1">📋 Solução:</p>
              <p>1. Execute: <code className="bg-white px-1 py-0.5 rounded">supabase functions deploy server</code></p>
              <p className="mt-1">2. Configure a variável <code className="bg-white px-1 py-0.5 rounded">SERVICE_ROLE_KEY</code></p>
            </div>
          )}
        </div>,
        { duration: 12000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Fraca', color: 'text-red-600' };
    if (strength <= 3) return { strength, label: 'Média', color: 'text-amber-600' };
    return { strength, label: 'Forte', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <KeyRound className="h-6 w-6 md:h-8 md:w-8" style={{ color: '#115740' }} />
          Alterar Senha
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          Mantenha sua conta segura alterando sua senha regularmente
        </p>
      </div>

      {/* User Info */}
      <Alert className="mb-4 border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Usuário logado:</strong> {user?.name} ({user?.email})
        </AlertDescription>
      </Alert>

      {/* Deploy Status */}
      <Alert className="mb-6 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900">
          <div className="space-y-2">
            <p className="font-semibold">✅ Backend Configurado</p>
            <p className="text-sm">A Edge Function está deployada e a SERVICE_ROLE_KEY foi configurada. Você já pode alterar sua senha.</p>
            <p className="text-xs mt-2 text-green-700">
              💡 Se houver algum erro, verifique os logs no console do navegador (F12)
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança da Conta</CardTitle>
          <CardDescription>
            Altere sua senha de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                Senha Atual *
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Nova Senha</h3>

              {/* New Password */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="newPassword">
                  Nova Senha *
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && (
                  <p className={`text-xs ${passwordStrength.color}`}>
                    Força da senha: <strong>{passwordStrength.label}</strong>
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Nova Senha *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite sua nova senha novamente"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <div className="flex items-center gap-1 text-xs">
                    {confirmPassword === newPassword ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">As senhas coincidem</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">As senhas não coincidem</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Security Tips */}
            <Alert className="border-amber-200 bg-amber-50">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 text-sm">
                <p className="font-semibold mb-2">💡 Dicas de segurança:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Use no mínimo 6 caracteres (recomendado 8 ou mais)</li>
                  <li>Combine letras maiúsculas e minúsculas</li>
                  <li>Inclua números e caracteres especiais (!@#$%&*)</li>
                  <li>Não use informações pessoais óbvias</li>
                  <li>Não reutilize senhas de outros sistemas</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}
                disabled={loading}
              >
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
