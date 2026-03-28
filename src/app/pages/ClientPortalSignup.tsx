import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { UserPlus, Eye, EyeOff, Shield } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';

interface SignupFormData {
  // Auth data
  email: string;
  password: string;
  confirmPassword: string;
  
  // Personal data
  fullName: string;
  cpfCnpj: string;
  rg: string;
  birthDate: string;
  phone: string;
  whatsapp: string;
  address: string;
  occupation: string;
  company: string;
  monthlyIncome: string;
  
  // LGPD consent
  lgpdConsent: boolean;
}

export default function ClientPortalSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: {
      lgpdConsent: false,
    },
  });

  const lgpdConsent = watch('lgpdConsent');
  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    setError('');

    // Validation
    if (!data.lgpdConsent) {
      setError('Você precisa aceitar os termos da LGPD para continuar');
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (data.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bd42bc02/client-portal/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          clientData: {
            fullName: data.fullName,
            cpfCnpj: data.cpfCnpj,
            rg: data.rg,
            birthDate: data.birthDate,
            phone: data.phone,
            whatsapp: data.whatsapp || data.phone,
            address: data.address,
            occupation: data.occupation,
            company: data.company,
            monthlyIncome: data.monthlyIncome,
            lgpdConsent: data.lgpdConsent,
          }
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao criar conta');
      }

      toast.success('Conta criada com sucesso! Faça login para continuar.');
      navigate('/client-portal/login');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCPFCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = Number(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Portal do Cliente - Cadastro</h1>
          <p className="text-gray-600 mt-2">
            Preencha todos os dados para criar sua conta
          </p>
        </div>

        {/* Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Importante:</strong> Preencha todos os campos obrigatórios (*). Após o cadastro, você não poderá editar essas informações.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados de Acesso */}
          <Card>
            <CardHeader>
              <CardTitle>Dados de Acesso</CardTitle>
              <CardDescription>Defina seu e-mail e senha para login</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">
                  E-mail <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'E-mail é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'E-mail inválido'
                    }
                  })}
                  placeholder="seu@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">
                  Senha <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: 'Senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'A senha deve ter no mínimo 6 caracteres'
                      }
                    })}
                    placeholder="Mínimo 6 caracteres"
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">
                  Confirmar Senha <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword', { required: 'Confirmação de senha é obrigatória' })}
                  placeholder="Digite a senha novamente"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Informações de identificação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">
                  Nome Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  {...register('fullName', { required: 'Nome completo é obrigatório' })}
                  placeholder="Digite seu nome completo"
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpfCnpj">
                    CPF/CNPJ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cpfCnpj"
                    {...register('cpfCnpj', { required: 'CPF/CNPJ é obrigatório' })}
                    placeholder="000.000.000-00"
                    onChange={(e) => {
                      const formatted = formatCPFCNPJ(e.target.value);
                      setValue('cpfCnpj', formatted);
                    }}
                    maxLength={18}
                    className={errors.cpfCnpj ? 'border-red-500' : ''}
                  />
                  {errors.cpfCnpj && (
                    <p className="text-sm text-red-500 mt-1">{errors.cpfCnpj.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="rg">
                    RG <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rg"
                    {...register('rg', { required: 'RG é obrigatório' })}
                    placeholder="00.000.000-0"
                    className={errors.rg ? 'border-red-500' : ''}
                  />
                  {errors.rg && (
                    <p className="text-sm text-red-500 mt-1">{errors.rg.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="birthDate">
                  Data de Nascimento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register('birthDate', { required: 'Data de nascimento é obrigatória' })}
                  className={errors.birthDate ? 'border-red-500' : ''}
                />
                {errors.birthDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.birthDate.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">
                    Telefone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone', { required: 'Telefone é obrigatório' })}
                    placeholder="(00) 00000-0000"
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setValue('phone', formatted);
                    }}
                    maxLength={15}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    {...register('whatsapp')}
                    placeholder="(00) 00000-0000"
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setValue('whatsapp', formatted);
                    }}
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe em branco para usar o mesmo número do telefone
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="address">
                  Endereço Completo <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  {...register('address', { required: 'Endereço é obrigatório' })}
                  placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                  rows={3}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dados Profissionais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
              <CardDescription>Informações sobre sua atividade profissional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occupation">
                    Profissão <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="occupation"
                    {...register('occupation', { required: 'Profissão é obrigatória' })}
                    placeholder="Ex: Engenheiro, Professor, Autônomo"
                    className={errors.occupation ? 'border-red-500' : ''}
                  />
                  {errors.occupation && (
                    <p className="text-sm text-red-500 mt-1">{errors.occupation.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="company">
                    Empresa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company"
                    {...register('company', { required: 'Empresa é obrigatória' })}
                    placeholder="Nome da empresa onde trabalha"
                    className={errors.company ? 'border-red-500' : ''}
                  />
                  {errors.company && (
                    <p className="text-sm text-red-500 mt-1">{errors.company.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="monthlyIncome">
                  Renda Mensal <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    id="monthlyIncome"
                    {...register('monthlyIncome', { required: 'Renda mensal é obrigatória' })}
                    placeholder="0,00"
                    className={`pl-10 ${errors.monthlyIncome ? 'border-red-500' : ''}`}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setValue('monthlyIncome', formatted);
                    }}
                  />
                </div>
                {errors.monthlyIncome && (
                  <p className="text-sm text-red-500 mt-1">{errors.monthlyIncome.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LGPD Consent */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Shield className="h-5 w-5" />
                Termo de Consentimento LGPD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-700 space-y-2 max-h-48 overflow-y-auto p-4 bg-white rounded border">
                <p className="font-semibold">
                  Lei Geral de Proteção de Dados Pessoais (LGPD)
                </p>
                <p>
                  Declaro que estou ciente e concordo com a coleta e processamento dos meus dados pessoais para fins de:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Cadastro e identificação no sistema</li>
                  <li>Gestão de contratos e cobranças</li>
                  <li>Comunicação via WhatsApp, e-mail e telefone</li>
                  <li>Cumprimento de obrigações legais e contratuais</li>
                  <li>Análise de crédito e verificação de dados</li>
                </ul>
                <p>
                  Estou ciente de que meus dados serão armazenados de forma segura e não serão compartilhados
                  com terceiros sem meu consentimento, exceto quando exigido por lei.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded border">
                <Checkbox
                  id="lgpdConsent"
                  checked={lgpdConsent}
                  onCheckedChange={(checked) => setValue('lgpdConsent', checked as boolean)}
                  className="mt-1"
                />
                <label
                  htmlFor="lgpdConsent"
                  className="text-sm font-medium leading-relaxed cursor-pointer"
                >
                  Li e aceito os termos da LGPD e autorizo o processamento dos meus dados pessoais
                  conforme descrito acima. <span className="text-red-500">*</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-900">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            <Button type="submit" size="lg" disabled={loading || !lgpdConsent} className="w-full">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Já tem uma conta? </span>
              <Link to="/client-portal/login" className="text-blue-600 hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-900 text-sm">
              ⚠️ <strong>Atenção:</strong> Após confirmar, você não poderá mais editar estes dados.
              Revise todas as informações antes de prosseguir.
            </AlertDescription>
          </Alert>
        </form>
      </div>
    </div>
  );
}
